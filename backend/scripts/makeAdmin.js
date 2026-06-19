const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Please provide an email address.');
    console.error('Usage: node makeAdmin.js <email>');
    process.exit(1);
  }

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    });
    console.log(`✅ Success! User ${user.email} is now an ADMIN.`);
  } catch (error) {
    if (error.code === 'P2025') {
      console.error(`❌ User with email ${email} not found.`);
    } else {
      console.error('❌ An error occurred:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
