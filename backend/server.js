require('dotenv').config();
const app = require('./src/app');
const { prisma } = require('./src/lib/prisma');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    app.listen(PORT, () => {
      console.log(`🌶️  SpiceWallah API running on port ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('\n👋 Server shutting down...');
  process.exit(0);
});

startServer();
