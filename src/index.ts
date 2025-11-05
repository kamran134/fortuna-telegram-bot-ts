/**
 * Main entry point for the Telegram bot
 */

import TelegramBot from 'node-telegram-bot-api';
import { botConfig } from './config/bot';
import { getPool } from './database/connection';
import { CommandHandler } from './bot/handlers/command.handler';
import { CallbackHandler } from './bot/handlers/callback.handler';
import { EventHandler } from './bot/handlers/event.handler';

// Initialize database connection
const pool = getPool();

// Create bot instance
const bot = new TelegramBot(botConfig.token, { polling: true });

// Initialize handlers
const commandHandler = new CommandHandler(pool, bot);
const callbackHandler = new CallbackHandler(pool, bot);
const eventHandler = new EventHandler(pool, bot);

// Register event listeners
bot.on('message', async (msg) => {
  try {
    // console.log('Message received:', msg);
    await commandHandler.handleMessage(msg);
  } catch (error) {
    console.error('Message handling error:', error);
  }
});

bot.on('callback_query', async (query) => {
  try {
    await callbackHandler.handleCallbackQuery(query);
  } catch (error) {
    console.error('Callback query handling error:', error);
  }
});

bot.on('new_chat_members', async (msg) => {
  try {
    await eventHandler.handleNewChatMembers(msg);
  } catch (error) {
    console.error('New chat members handling error:', error);
  }
});

bot.on('left_chat_member', async (msg) => {
  try {
    await eventHandler.handleLeftChatMember(msg);
  } catch (error) {
    console.error('Left chat member handling error:', error);
  }
});

console.log('✅ Fortuna Telegram Bot started successfully!');

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down bot...');
  await bot.stopPolling();
  await pool.end();
  process.exit(0);
});
