const crypto = require('crypto');
const { prisma } = require('../config/db');

function generateVerificationCode() {
  const bytes = crypto.randomBytes(3);
  return bytes.toString('hex').toUpperCase().slice(0, 6);
}

function generatePaymentReference(prefix) {
  const hex = crypto.randomBytes(8).toString('hex');
  return `${prefix}-${Date.now()}-${hex}`;
}

function calculateNights(checkIn, checkOut) {
  const diff = new Date(checkOut) - new Date(checkIn);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const VALID_TRANSITIONS = {
  PAYMENT_SUCCESSFUL: 'BOOKING_CONFIRMED',
  BOOKING_CONFIRMED: 'AWAITING_CHECKIN',
  AWAITING_CHECKIN: 'STUDENT_ARRIVED',
};

class PostUtmeBookingService {
  async createBooking(studentId, data) {
    const { propertyId, checkInDate, checkOutDate, numberOfGuests } = data;

    const property = await prisma.postUtmeProperty.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw { message: 'Property not found', statusCode: 404 };
    }

    if (property.status !== 'APPROVED') {
      throw { message: 'Property is not available for booking', statusCode: 400 };
    }

    if (property.availableRooms < 1) {
      throw { message: 'No available rooms for this property', statusCode: 400 };
    }

    const numberOfNights = calculateNights(checkInDate, checkOutDate);
    if (numberOfNights < 1) {
      throw { message: 'Check-out date must be after check-in date', statusCode: 400 };
    }

    const totalPrice = Number(property.pricePerNight) * numberOfNights;
    const serviceFee = Number((totalPrice * 0.05).toFixed(2));
    const totalPayable = Number((totalPrice + serviceFee).toFixed(2));
    const verificationCode = generateVerificationCode();

    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.postUtmeBooking.create({
        data: {
          studentId,
          propertyId,
          renterId: property.ownerId,
          checkInDate: new Date(checkInDate),
          checkOutDate: new Date(checkOutDate),
          numberOfGuests: Number(numberOfGuests),
          numberOfNights,
          totalPrice,
          serviceFee,
          totalPayable,
          verificationCode,
          status: 'PENDING_PAYMENT',
        },
      });

      const paymentRef = generatePaymentReference('PTME');

      const payment = await tx.postUtmePayment.create({
        data: {
          bookingId: newBooking.id,
          amount: totalPayable,
          currency: 'NGN',
          status: 'PENDING',
          reference: paymentRef,
          provider: 'MOCK',
        },
      });

      await tx.notification.create({
        data: {
          userId: property.ownerId,
          title: 'New booking request',
          message: `New booking request for ${property.title}`,
          type: 'BOOKING',
        },
      });

      return { ...newBooking, payment };
    });

    return prisma.postUtmeBooking.findUnique({
      where: { id: booking.id },
      include: {
        property: true,
      },
    });
  }

  async initializePayment(bookingId, studentId) {
    const booking = await prisma.postUtmeBooking.findUnique({
      where: { id: bookingId },
      include: {
        property: true,
        payment: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.studentId !== studentId) {
      throw new Error('Unauthorized');
    }

    if (booking.status !== 'PENDING_PAYMENT') {
      throw new Error('Booking is not pending payment');
    }

    const mockReference = generatePaymentReference('MOCK');

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.postUtmePayment.update({
        where: { bookingId },
        data: {
          status: 'COMPLETED',
          reference: mockReference,
          paidAt: new Date(),
        },
      });

      const updatedBooking = await tx.postUtmeBooking.update({
        where: { id: bookingId },
        data: { status: 'PAYMENT_SUCCESSFUL' },
      });

      const newAvailable = Math.max(0, booking.property.availableRooms - 1);
      await tx.postUtmeProperty.update({
        where: { id: booking.propertyId },
        data: { availableRooms: newAvailable },
      });

      await tx.notification.create({
        data: {
          userId: studentId,
          title: 'Payment confirmed',
          message: `Payment confirmed for ${booking.property.title}. Your booking code is ${booking.verificationCode}`,
          type: 'PAYMENT',
        },
      });

      await tx.notification.create({
        data: {
          userId: booking.renterId,
          title: 'Payment received',
          message: `Payment received for ${booking.property.title}. A student has booked your property.`,
          type: 'BOOKING',
        },
      });

      return { booking: updatedBooking, payment };
    });

    return result;
  }

  async processSuccessfulPayment(bookingId, reference) {
    const booking = await prisma.postUtmeBooking.findUnique({
      where: { id: bookingId },
      include: { property: true },
    });

    if (!booking || booking.status === 'PAYMENT_SUCCESSFUL') {
      return booking;
    }

    return prisma.$transaction(async (tx) => {
      await tx.postUtmePayment.updateMany({
        where: { bookingId },
        data: {
          status: 'COMPLETED',
          reference: reference || generatePaymentReference('PAYSTACK'),
          paidAt: new Date(),
        },
      });

      const updatedBooking = await tx.postUtmeBooking.update({
        where: { id: bookingId },
        data: { status: 'PAYMENT_SUCCESSFUL' },
      });

      const newAvailable = Math.max(0, booking.property.availableRooms - 1);
      await tx.postUtmeProperty.update({
        where: { id: booking.propertyId },
        data: { availableRooms: newAvailable },
      });

      await tx.notification.create({
        data: {
          userId: booking.studentId,
          title: 'Payment confirmed',
          message: `Payment confirmed for ${booking.property.title}. Your booking code is ${booking.verificationCode}`,
          type: 'PAYMENT',
        },
      });

      await tx.notification.create({
        data: {
          userId: booking.renterId,
          title: 'Payment received',
          message: `Payment received for ${booking.property.title}. A student has booked your property.`,
          type: 'BOOKING',
        },
      });

      return updatedBooking;
    });
  }


  async getStudentBookings(studentId, status) {
    const where = { studentId };
    if (status) {
      where.status = status;
    }

    const bookings = await prisma.postUtmeBooking.findMany({
      where,
      include: {
        property: {
          include: {
            images: { take: 1 },
          },
        },
        renter: {
          select: { id: true, fullName: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookings.map((b) => {
      if (
        ['COMPLETED', 'CHECKED_IN'].includes(b.status) &&
        b.renter
      ) {
        return {
          ...b,
          renter: {
            ...b.renter,
          },
        };
      }
      return b;
    });
  }

  async getRenterBookings(renterId, status) {
    const where = { renterId };
    if (status) {
      where.status = status;
    }

    const bookings = await prisma.postUtmeBooking.findMany({
      where,
      include: {
        property: {
          include: {
            images: { take: 1 },
          },
        },
        student: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            whatsapp: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookings.map((b) => {
      const checkedInStatuses = [
        'STUDENT_ARRIVED',
        'CHECKED_IN',
      ];
      if (!checkedInStatuses.includes(b.status) && b.student) {
        const { whatsapp, ...rest } = b.student;
        return { ...b, student: rest };
      }
      return b;
    });
  }

  async getBookingById(bookingId, userId) {
    const booking = await prisma.postUtmeBooking.findUnique({
      where: { id: bookingId },
      include: {
        property: {
          include: { images: true },
        },
        student: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            whatsapp: true,
            email: true,
          },
        },
        renter: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            whatsapp: true,
            email: true,
          },
        },
        payment: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.studentId !== userId && booking.renterId !== userId) {
      throw new Error('Unauthorized');
    }

    const isStudent = booking.studentId === userId;
    const isRenter = booking.renterId === userId;
    const paidStatuses = [
      'PAYMENT_SUCCESSFUL',
      'BOOKING_CONFIRMED',
      'AWAITING_CHECKIN',
      'STUDENT_ARRIVED',
      'CHECKED_IN',
    ];
    const checkedInStatuses = [
      'STUDENT_ARRIVED',
      'CHECKED_IN',
    ];

    let { student, renter, ...rest } = booking;

    if (isStudent) {
      if (!paidStatuses.includes(booking.status)) {
        renter = { id: renter.id, fullName: renter.fullName, avatar: renter.avatar };
      }
    }

    if (isRenter) {
      if (!checkedInStatuses.includes(booking.status)) {
        student = { id: student.id, fullName: student.fullName, avatar: student.avatar };
      }
    }

    return { ...rest, student, renter };
  }

  async confirmArrival(bookingId, renterId, code) {
    const booking = await prisma.postUtmeBooking.findUnique({
      where: { id: bookingId },
      include: { property: true },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.renterId !== renterId) {
      throw new Error('Unauthorized');
    }

    if (
      !['PAYMENT_SUCCESSFUL', 'BOOKING_CONFIRMED', 'AWAITING_CHECKIN', 'STUDENT_ARRIVED'].includes(booking.status)
    ) {
      throw new Error('Booking is not in a state that allows check-in confirmation');
    }

    if (booking.renterConfirmed) {
      throw new Error('Arrival already confirmed');
    }

    // Trim and uppercase both sides for safe comparison
    if ((booking.verificationCode || '').trim().toUpperCase() !== (code || '').trim().toUpperCase()) {
      throw new Error('Invalid verification code');
    }

    // Fetch renter's current wallet balance from user table
    const renterUser = await prisma.user.findUnique({
      where: { id: renterId },
      select: { walletBalance: true, pendingBalance: true },
    });

    if (!renterUser) {
      throw new Error('Renter account not found');
    }

    const newBalance = Number(renterUser.walletBalance) + Number(booking.totalPrice);

    const updatedBooking = await prisma.$transaction(async (tx) => {
      const updated = await tx.postUtmeBooking.update({
        where: { id: bookingId },
        data: {
          renterConfirmed: true,
          status: 'CHECKED_IN',
          checkedInAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: renterId },
        data: {
          walletBalance: newBalance,
          pendingBalance: 0,
        },
      });

      await tx.walletTransaction.create({
        data: {
          userId: renterId,
          type: 'BOOKING_PAYMENT',
          amount: Number(booking.totalPrice),
          balance: newBalance,
          description: `Booking payment for ${booking.property.title}`,
          reference: generatePaymentReference('WTX'),
          bookingId: booking.id,
        },
      });

      await tx.notification.create({
        data: {
          userId: booking.studentId,
          title: 'Booking confirmed',
          message: 'Booking confirmed! You are checked in.',
          type: 'BOOKING',
        },
      });

      await tx.notification.create({
        data: {
          userId: renterId,
          title: 'Guest confirmed',
          message: `Guest confirmed! Funds (₦${booking.totalPrice.toLocaleString()}) added to your wallet.`,
          type: 'BOOKING',
        },
      });

      return updated;
    });

    return prisma.postUtmeBooking.findUnique({
      where: { id: bookingId },
      include: { property: true },
    });
  }

  async cancelBooking(bookingId, studentId) {
    const booking = await prisma.postUtmeBooking.findUnique({
      where: { id: bookingId },
      include: { property: true, payment: true },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.studentId !== studentId) {
      throw new Error('Unauthorized');
    }

    const cancellableStatuses = [
      'PENDING_PAYMENT',
      'PAYMENT_SUCCESSFUL',
      'BOOKING_CONFIRMED',
    ];

    if (!cancellableStatuses.includes(booking.status)) {
      throw new Error('Booking cannot be cancelled in its current status');
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.postUtmeBooking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' },
      });

      if (booking.payment && booking.payment.status === 'COMPLETED') {
        await tx.postUtmePayment.update({
          where: { bookingId },
          data: { status: 'REFUNDED' },
        });

        const newAvailable = Math.min(booking.property.totalRooms, booking.property.availableRooms + 1);
        await tx.postUtmeProperty.update({
          where: { id: booking.propertyId },
          data: { availableRooms: newAvailable },
        });
      }

      await tx.notification.create({
        data: {
          userId: studentId,
          title: 'Booking cancelled',
          message: `Your booking for ${booking.property.title} has been cancelled.`,
          type: 'BOOKING',
        },
      });

      await tx.notification.create({
        data: {
          userId: booking.renterId,
          title: 'Booking cancelled',
          message: `The booking for ${booking.property.title} has been cancelled by the student.`,
          type: 'BOOKING',
        },
      });

      return updated;
    });

    return prisma.postUtmeBooking.findUnique({
      where: { id: bookingId },
      include: { property: true },
    });
  }

  async updateBookingStatus(bookingId, renterId, status) {
    const booking = await prisma.postUtmeBooking.findUnique({
      where: { id: bookingId },
      include: { property: true },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.renterId !== renterId) {
      throw new Error('Unauthorized');
    }

    const expectedCurrent = Object.keys(VALID_TRANSITIONS).find(
      (key) => VALID_TRANSITIONS[key] === status
    );

    if (!expectedCurrent) {
      throw new Error('Invalid target status');
    }

    if (booking.status !== expectedCurrent) {
      throw new Error(
        `Cannot transition from ${booking.status} to ${status}`
      );
    }

    const statusMessages = {
      BOOKING_CONFIRMED: 'Your booking has been confirmed by the property owner.',
      AWAITING_CHECKIN: 'The property owner is expecting your arrival.',
      STUDENT_ARRIVED: 'Arrival noted. Waiting for owner to verify your booking code.',
    };

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.postUtmeBooking.update({
        where: { id: bookingId },
        data: { status },
      });

      await tx.notification.create({
        data: {
          userId: booking.studentId,
          title: 'Booking status updated',
          message: statusMessages[status] || `Booking status updated to ${status}`,
          type: 'BOOKING',
        },
      });

      return result;
    });

    return prisma.postUtmeBooking.findUnique({
      where: { id: bookingId },
      include: { property: true },
    });
  }

  async restoreExpiredRooms() {
    const now = new Date();

    const expiredBookings = await prisma.postUtmeBooking.findMany({
      where: {
        status: { in: ['CHECKED_IN', 'STUDENT_ARRIVED', 'AWAITING_CHECKIN', 'BOOKING_CONFIRMED', 'PAYMENT_SUCCESSFUL'] },
        checkOutDate: { lt: now },
      },
      include: { property: { select: { id: true, totalRooms: true } } },
    });

    for (const booking of expiredBookings) {
      const property = booking.property;
      if (!property) continue;

      await prisma.$transaction(async (tx) => {
        await tx.postUtmeBooking.update({
          where: { id: booking.id },
          data: { status: 'COMPLETED' },
        });

        const currentProperty = await tx.postUtmeProperty.findUnique({
          where: { id: property.id },
          select: { totalRooms: true, availableRooms: true },
        });
        const restored = Math.min(currentProperty.totalRooms, currentProperty.availableRooms + 1);
        await tx.postUtmeProperty.update({
          where: { id: property.id },
          data: { availableRooms: restored },
        });
      });
    }

    return expiredBookings.length;
  }
}

module.exports = new PostUtmeBookingService();
