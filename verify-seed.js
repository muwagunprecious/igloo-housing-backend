const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
async function verify() {
  const uniCount = await p.university.count();
  const userCount = await p.user.count();
  console.log(" Verification Results:");
  console.log("  - Universities:", uniCount);
  console.log("  - Users:", userCount);
  await p.$disconnect();
}
verify();
