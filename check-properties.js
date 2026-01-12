const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
async function countProperties() {
  const count = await p.property.count();
  console.log("PROPERTY_COUNT:" + count);
  await p.$disconnect();
}
countProperties();
