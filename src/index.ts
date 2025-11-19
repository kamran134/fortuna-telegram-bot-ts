/**
 * Main entry point for the Telegram bot
 */

import TelegramBot from 'node-telegram-bot-api';
import { botConfig } from './config/bot';
import { getPool } from './database/connection';
import { CommandHandler } from './bot/handlers/command.handler';
import { CallbackHandler } from './bot/handlers/callback.handler';
import { EventHandler } from './bot/handlers/event.handler';
import { logger } from './utils/logger';
import { errorNotifier } from './utils/error-notifier';

// Initialize database connection
const pool = getPool();

// Create bot instance
const bot = new TelegramBot(botConfig.token, { polling: true });

// Initialize error notifier
errorNotifier.initialize(bot);

// Initialize handlers
const commandHandler = new CommandHandler(pool, bot);
const callbackHandler = new CallbackHandler(pool, bot);
const eventHandler = new EventHandler(pool, bot);

// Register event listeners
bot.on('message', async (msg) => {
  try {
    await commandHandler.handleMessage(msg);
  } catch (error) {
    logger.error('Message handling error', error, { chatId: msg.chat.id });
    await errorNotifier.notifyError(error as Error, `Message handler - Chat: ${msg.chat.id}`);
  }
});

bot.on('callback_query', async (query) => {
  try {
    await callbackHandler.handleCallbackQuery(query);
  } catch (error) {
    logger.error('Callback query handling error', error);
    await errorNotifier.notifyError(error as Error, `Callback handler - Data: ${query.data}`);
  }
});

bot.on('new_chat_members', async (msg) => {
  try {
    await eventHandler.handleNewChatMembers(msg);
  } catch (error) {
    logger.error('New chat members handling error', error, { chatId: msg.chat.id });
    await errorNotifier.notifyError(error as Error, `New members handler - Chat: ${msg.chat.id}`);
  }
});

bot.on('left_chat_member', async (msg) => {
  try {
    await eventHandler.handleLeftChatMember(msg);
  } catch (error) {
    logger.error('Left chat member handling error', error, { chatId: msg.chat.id });
    await errorNotifier.notifyError(error as Error, `Left member handler - Chat: ${msg.chat.id}`);
  }
});

logger.info('✅ Fortuna Telegram Bot started successfully!');

// Global error handlers
process.on('uncaughtException', async (error) => {
  logger.error('Uncaught Exception:', error);
  await errorNotifier.notifyError(error, '❗️ Uncaught Exception');
});

process.on('unhandledRejection', async (reason, _promise) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  logger.error('Unhandled Rejection:', error);
  await errorNotifier.notifyError(error, '❗️ Unhandled Promise Rejection');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down bot...');
  await bot.stopPolling();
  await pool.end();
  process.exit(0);
});
