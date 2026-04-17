import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './shared/prisma.js';

const PORT = env.PORT || 5000;

async function bootstrap() {
  try {
    // Validate database connection
    await prisma.$connect();
    console.log('✅ Connected to database successfully');

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});
