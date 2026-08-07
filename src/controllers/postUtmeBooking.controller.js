const postUtmeBookingService = require('../services/postUtmeBooking.service');
const Response = require('../utils/response');

class PostUtmeBookingController {
    // POST /api/post-utme/bookings
    async createBooking(req, res, next) {
        try {
            const { propertyId, checkInDate, checkOutDate, numberOfGuests } = req.body;
            const booking = await postUtmeBookingService.createBooking(req.user.id, {
                propertyId, checkInDate: new Date(checkInDate), checkOutDate: new Date(checkOutDate),
                numberOfGuests: parseInt(numberOfGuests) || 1
            });
            return Response.created(res, 'Booking created', booking);
        } catch (error) { next(error); }
    }

    // GET /api/post-utme/bookings/mine
    async getMyBookings(req, res, next) {
        try {
            const { status } = req.query;
            const bookings = await postUtmeBookingService.getStudentBookings(req.user.id, status);
            return Response.success(res, 'Bookings retrieved', bookings);
        } catch (error) { next(error); }
    }

    // GET /api/post-utme/bookings/:id
    async getBookingById(req, res, next) {
        try {
            const booking = await postUtmeBookingService.getBookingById(req.params.id, req.user.id);
            return Response.success(res, 'Booking retrieved', booking);
        } catch (error) { next(error); }
    }

    // POST /api/post-utme/bookings/:id/pay
    async initializePayment(req, res, next) {
        try {
            const result = await postUtmeBookingService.initializePayment(req.params.id, req.user.id);
            return Response.success(res, 'Payment successful', result);
        } catch (error) { next(error); }
    }

    // POST /api/post-utme/bookings/:id/verify
    async confirmArrival(req, res, next) {
        try {
            const { code } = req.body;
            const booking = await postUtmeBookingService.confirmArrival(req.params.id, req.user.id, code);
            return Response.success(res, 'Guest arrival confirmed. Funds released to wallet.', booking);
        } catch (error) { next(error); }
    }

    // POST /api/post-utme/bookings/:id/cancel
    async cancelBooking(req, res, next) {
        try {
            const booking = await postUtmeBookingService.cancelBooking(req.params.id, req.user.id);
            return Response.success(res, 'Booking cancelled', booking);
        } catch (error) { next(error); }
    }

    // GET /api/post-utme/bookings/renter/mine
    async getRenterBookings(req, res, next) {
        try {
            const { status } = req.query;
            const bookings = await postUtmeBookingService.getRenterBookings(req.user.id, status);
            return Response.success(res, 'Bookings retrieved', bookings);
        } catch (error) { next(error); }
    }

    // PUT /api/post-utme/bookings/:id/status
    async updateBookingStatus(req, res, next) {
        try {
            const { status } = req.body;
            const booking = await postUtmeBookingService.updateBookingStatus(req.params.id, req.user.id, status);
            return Response.success(res, 'Booking status updated', booking);
        } catch (error) { next(error); }
    }

    // POST /api/post-utme/bookings/webhook
    async handlePaystackWebhook(req, res, next) {
        try {
            const crypto = require('crypto');
            const secret = process.env.PAYSTACK_SECRET_KEY || '';
            const signature = req.headers['x-paystack-signature'];
            const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');

            if (hash === signature) {
                const event = req.body;
                if (event && event.event === 'charge.success') {
                    const { reference, metadata } = event.data;
                    const bookingId = metadata?.bookingId;
                    if (bookingId) {
                        await postUtmeBookingService.processSuccessfulPayment(bookingId, reference);
                    }
                }
                return res.status(200).send('Webhook Processed');
            }
            return res.status(400).send('Invalid Signature');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new PostUtmeBookingController();

