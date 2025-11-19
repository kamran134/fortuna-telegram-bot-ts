/**
 * Say Private command - send private message to user from admin
 */

import { BaseCommand } from './base.command';
import { CommandContext } from '../../types/command.types';
import { Messages } from '../../constants/messages';
import { logger } from '../../utils/logger';

export class SayPrivateCommand extends BaseCommand {
  readonly name = '/sayprivate';
  readonly description = 'Отправить личное сообщение пользователю';
  readonly creatorOnly = true;

  async execute(context: CommandContext): Promise<void> {
    if (!this.checkPermission(context)) {
      await this.sendPermissionDenied(context, Messages.CREATOR_ONLY);
      return;
    }

    const { bot, chatId, text } = context;

    // Parse: /sayprivate {userId} {message}
    const parts = text.split(' ').filter((p: string) => p);
    
    if (parts.length < 3) {
      await bot.sendMessage(
        chatId,
        '❌ Использование: /sayprivate {userId} {message}'
      );
      return;
    }

    const userId = parseInt(parts[1]);
    const message = parts.slice(2).join(' ');

    if (isNaN(userId)) {
      await bot.sendMessage(chatId, '❌ Invalid user ID');
      return;
    }

    try {
      await bot.sendMessage(userId, message);
      await bot.sendMessage(chatId, `✅ Сообщение отправлено пользователю ${userId}`);
    } catch (error) {
      logger.error('SAY PRIVATE ERROR:', error);
      await bot.sendMessage(chatId, '❌ Не удалось отправить сообщение');
    }
  }
}
