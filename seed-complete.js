const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

const universities = [
  { name: "University of Lagos", state: "Lagos" },
  { name: "Obafemi Awolowo University", state: "Osun" },
  { name: "University of Ibadan", state: "Oyo" },
  { name: "University of Nigeria, Nsukka", state: "Enugu" },
  { name: "Ahmadu Bello University", state: "Kaduna" },
  { name: "University of Benin", state: "Edo" },
  { name: "University of Ilorin", state: "Kwara" },
  { name: "Lagos State University", state: "Lagos" },
  { name: "Covenant University", state: "Ogun" },
  { name: "Babcock University", state: "Ogun" },
  { name: "Federal University of Technology, Akure", state: "Ondo" },
  { name: "Federal University of Technology, Minna", state: "Niger" },
  { name: "Federal University of Technology, Owerri", state: "Imo" },
  { name: "University of Port Harcourt", state: "Rivers" },
  { name: "Bayero University Kano", state: "Kano" },
  { name: "Nnamdi Azikiwe University", state: "Anambra" },
  { name: "University of Jos", state: "Plateau" },
  { name: "University of Abuja", state: "FCT" },
  { name: "Ekiti State University", state: "Ekiti" },
  { name: "Olabisi Onabanjo University", state: "Ogun" },
  { name: "Ladoke Akintola University of Technology", state: "Oyo" },
  { name: "Afe Babalola University", state: "Ekiti" },
  { name: "Pan-Atlantic University", state: "Lagos" },
  { name: "Landmark University", state: "Kwara" },
  { name: "Redeemers University", state: "Osun" },
  { name: "American University of Nigeria", state: "Adamawa" },
  { name: "Nile University of Nigeria", state: "FCT" },
  { name: "Baze University", state: "FCT" },
  { name: "Veritas University", state: "FCT" },
  { name: "Adekunle Ajasin University", state: "Ondo" }
];

async function seedAll() {
  console.log(" Seeding database...\n");
  let uniCount = 0;
  for (const uni of universities) {
    const existing = await prisma.university.findUnique({ where: { name: uni.name } });
    if (!existing) {
      await prisma.university.create({ data: uni });
      uniCount++;
    }
  }
  console.log(` Universities: ${uniCount} new\n`);
  
  const adminHash = await bcrypt.hash("Admin@123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@igloo.com" },
    update: {},
    create: { fullName: "System Administrator", email: "admin@igloo.com", password: adminHash, role: "ADMIN", isVerified: true }
  });
  console.log(" Admin:", admin.email);
  
  const studentHash = await bcrypt.hash("password123", 10);
  const student = await prisma.user.upsert({
    where: { email: "test@igloo.com" },
    update: {},
    create: { fullName: "Test Student", email: "test@igloo.com", password: studentHash, role: "STUDENT" }
  });
  console.log(" Student:", student.email);
  console.log("\n Seeding complete!");
}

seedAll().then(() => prisma.$disconnect()).catch(e => { console.error(e); process.exit(1); });
