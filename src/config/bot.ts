import dotenv from 'dotenv';
import { BotConfig } from '../types/common.types';

dotenv.config();

export const botConfig: BotConfig = {
  token: process.env.TELEGRAM_TOKEN || '',
  creatorIds: (process.env.CREATOR_IDS || '').split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id)),
};

if (!botConfig.token) {
  throw new Error('TELEGRAM_TOKEN is not defined in environment variables');
}
