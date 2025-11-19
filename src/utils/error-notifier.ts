/**
 * Error notifier - sends error notifications to bot creator
 */

import TelegramBot from 'node-telegram-bot-api';
import { botConfig } from '../config/bot';
import { logger } from './logger';

export class ErrorNotifier {
  private static instance: ErrorNotifier;
  private bot: TelegramBot | null = null;
  private errorQueue: Array<{ error: Error; context?: string }> = [];
  private isProcessing = false;

  private constructor() {}

  static getInstance(): ErrorNotifier {
    if (!ErrorNotifier.instance) {
      ErrorNotifier.instance = new ErrorNotifier();
    }
    return ErrorNotifier.instance;
  }

  /**
   * Initialize with bot instance
   */
  initialize(bot: TelegramBot): void {
    this.bot = bot;
    logger.info('Error notifier initialized');
  }

  /**
   * Notify creator about error
   */
  async notifyError(error: Error, context?: string): Promise<void> {
    if (!this.bot) {
      logger.warn('Error notifier not initialized, error not sent to creator');
      return;
    }

    this.errorQueue.push({ error, context });
    
    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  /**
   * Process error queue with rate limiting
   */
  private async processQueue(): Promise<void> {
    if (this.errorQueue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const { error, context } = this.errorQueue.shift()!;

    try {
      const message = this.formatErrorMessage(error, context);
      
      // Send to first creator ID (your ID)
      const creatorId = botConfig.creatorIds[0];
      if (creatorId) {
        await this.bot!.sendMessage(creatorId, message, { parse_mode: 'HTML' });
      }
    } catch (notificationError) {
      logger.error('Failed to send error notification:', notificationError);
    }

    // Rate limit: wait 1 second before next error
    setTimeout(() => this.processQueue(), 1000);
  }

  /**
   * Format error message for Telegram
   */
  private formatErrorMessage(error: Error, context?: string): string {
    const timestamp = new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Baku' });
    
    let message = `🚨 <b>Error Alert</b>\n\n`;
    message += `⏰ <b>Time:</b> ${timestamp}\n`;
    
    if (context) {
      message += `📍 <b>Context:</b> ${this.escapeHtml(context)}\n`;
    }
    
    message += `❌ <b>Error:</b> ${this.escapeHtml(error.message)}\n`;
    
    if (error.stack) {
      const stackLines = error.stack.split('\n').slice(0, 5).join('\n');
      message += `\n<b>Stack trace:</b>\n<code>${this.escapeHtml(stackLines)}</code>`;
    }

    // Limit message length
    if (message.length > 4000) {
      message = message.substring(0, 3900) + '\n\n... (truncated)';
    }

    return message;
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Global error handler
export const errorNotifier = ErrorNotifier.getInstance();

/**
 * Helper function to notify error with context
 */
export async function notifyError(error: Error, context?: string): Promise<void> {
  await errorNotifier.notifyError(error, context);
}
