/**
 * Bot Messenger Service - abstracts Telegram bot messaging logic
 * This allows services to send messages without depending on TelegramBot directly
 */

import TelegramBot, { SendMessageOptions } from 'node-telegram-bot-api';
import { logger } from '../utils/logger';

export class BotMessenger {
  constructor(private bot: TelegramBot) {}

  /**
   * Send a message with optional topic support
   */
  async sendMessage(
    chatId: number,
    text: string,
    options: SendMessageOptions = {},
    messageThreadId?: number
  ): Promise<TelegramBot.Message | null> {
    try {
      const sendOptions: SendMessageOptions = { ...options };
      
      // Only add thread_id if it's explicitly provided and not undefined/null
      // For regular groups without topics, messageThreadId will be undefined
      if (messageThreadId !== undefined && messageThreadId !== null) {
        sendOptions.message_thread_id = messageThreadId;
      }

      return await this.bot.sendMessage(chatId, text, sendOptions);
    } catch (error) {
      // If error is "message thread not found", retry without thread_id
      const errorMessage = (error as Error).message || '';
      if (errorMessage.includes('thread') || errorMessage.includes('topic')) {
        logger.warn('Topic/thread not found, retrying without thread_id', { chatId, messageThreadId });
        try {
          const retryOptions = { ...options };
          delete retryOptions.message_thread_id;
          return await this.bot.sendMessage(chatId, text, retryOptions);
        } catch (retryError) {
          logger.error('Failed to send message even without thread_id', retryError, { chatId });
          return null;
        }
      }
      
      logger.error('Failed to send message', error, { chatId, messageThreadId });
      return null;
    }
  }

  /**
   * Send message with HTML parsing
   */
  async sendHTMLMessage(
    chatId: number,
    text: string,
    messageThreadId?: number
  ): Promise<TelegramBot.Message | null> {
    return this.sendMessage(chatId, text, { parse_mode: 'HTML' }, messageThreadId);
  }

  /**
   * Send message with inline keyboard
   */
  async sendMessageWithKeyboard(
    chatId: number,
    text: string,
    keyboard: TelegramBot.InlineKeyboardMarkup,
    options: SendMessageOptions = {},
    messageThreadId?: number
  ): Promise<TelegramBot.Message | null> {
    return this.sendMessage(
      chatId,
      text,
      { ...options, reply_markup: keyboard },
      messageThreadId
    );
  }

  /**
   * Send message to private chat (user)
   */
  async sendPrivateMessage(
    userId: number,
    text: string,
    options: SendMessageOptions = {}
  ): Promise<boolean> {
    try {
      await this.bot.sendMessage(userId, text, options);
      return true;
    } catch (error) {
      logger.warn('Failed to send private message', { userId, error });
      return false;
    }
  }

  /**
   * Answer callback query
   */
  async answerCallback(queryId: string, text?: string, showAlert = false): Promise<boolean> {
    try {
      await this.bot.answerCallbackQuery(queryId, { text, show_alert: showAlert });
      return true;
    } catch (error) {
      logger.error('Failed to answer callback query', error, { queryId });
      return false;
    }
  }

  /**
   * Edit message text
   */
  async editMessageText(
    text: string,
    chatId: number,
    messageId: number
  ): Promise<boolean> {
    try {
      await this.bot.editMessageText(text, {
        chat_id: chatId,
        message_id: messageId,
      });
      return true;
    } catch {
      logger.warn('Failed to edit message', { chatId, messageId });
      return false;
    }
  }

  /**
   * Get bot instance (for operations that can't be abstracted)
   */
  getBot(): TelegramBot {
    return this.bot;
  }
}
