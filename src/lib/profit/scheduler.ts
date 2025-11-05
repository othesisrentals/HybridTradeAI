import { profitEngine } from './engine';
import { logger } from '@/lib/utils/logger';

/**
 * Profit distribution scheduler
 * In production, use a proper cron service like Vercel Cron or a separate worker
 */

export class ProfitScheduler {
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Start the scheduler (checks every hour if it's time to run)
   */
  start() {
    // Check every hour
    this.intervalId = setInterval(
      async () => {
        await this.checkAndRun();
      },
      60 * 60 * 1000
    ); // 1 hour

    logger.info('Profit scheduler started');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Profit scheduler stopped');
    }
  }

  /**
   * Check if it's time to run profit distribution
   * Runs every Sunday at 2 AM
   */
  private async checkAndRun() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const hour = now.getHours();

    // Run on Sunday (0) at 2 AM
    if (dayOfWeek === 0 && hour === 2) {
      logger.info('Time to run profit distribution');
      try {
        const result = await profitEngine.distributeWeeklyProfits();
        logger.info('Profit distribution completed', result);
      } catch (error) {
        logger.error('Profit distribution failed', error);
      }
    }
  }

  /**
   * Manually trigger profit distribution (for testing/admin)
   */
  async runNow() {
    logger.info('Manually triggering profit distribution');
    return await profitEngine.distributeWeeklyProfits();
  }
}

export const profitScheduler = new ProfitScheduler();

