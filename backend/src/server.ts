import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './shared/prisma.js';

const PORT = env.PORT || 5000;

let server: import('http').Server | undefined;

async function bootstrap() {
  try {
    // Validate database connection
    await prisma.$connect();
    console.log('✅ Connected to database successfully');

    server = app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });

    // `app.listen` reports bind failures (EADDRINUSE/EACCES) asynchronously on
    // the server's 'error' event — not by throwing inside this try block — so
    // handle it explicitly to run the same cleanup path.
    server.on('error', async (error) => {
      console.error('❌ Failed to start server:', error);
      await prisma.$disconnect();
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();

// Graceful shutdown — drain in-flight requests then disconnect Prisma.
// Railway (and most orchestrators) send SIGTERM on stop/redeploy; SIGINT is
// local Ctrl-C. Handle both.
async function shutdown(signal: string) {
  console.log(`Shutting down... (${signal})`);
  await new Promise<void>((resolve) => {
    if (!server) return resolve();
    server.close(() => resolve());
  });
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
process.on('SIGINT', () => { void shutdown('SIGINT'); });

// Last-resort safety nets so an unawaited rejection can't silently wedge the
// process; exit non-zero so Railway's restart policy brings it back cleanly.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});
