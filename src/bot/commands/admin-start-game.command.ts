/**
 * Admin Start Game command - create game from admin panel
 */

import { BaseCommand } from './base.command';
import { CommandContext } from '../../types/command.types';
import { Messages } from '../../constants/messages';
import { logger } from '../../utils/logger';

export class AdminStartGameCommand extends BaseCommand {
  readonly name = '/adminstartgame';
  readonly description = 'Создать игру из админки';
  readonly creatorOnly = true;

  async execute(context: CommandContext): Promise<void> {
    if (!this.checkPermission(context)) {
      await this.sendPermissionDenied(context, Messages.CREATOR_ONLY);
      return;
    }

    const { bot, chatId, text, gameService, pool } = context;

    // Parse: /adminstartgame {groupId} {date/start/end/limit/location/label}
    const parts = text.split(' ').filter((p: string) => p);
    
    if (parts.length < 3) {
      await bot.sendMessage(
        chatId,
        '❌ Использование: /adminstartgame {groupId} {date/start/end/limit/location/label}\n' +
        'Пример: /adminstartgame 1 2024-01-15/20:00/22:00/10/Спортзал/понедельник'
      );
      return;
    }

    const groupId = parseInt(parts[1]);
    const gameParams = parts[2].split('/');

    if (isNaN(groupId) || gameParams.length < 6) {
      await bot.sendMessage(chatId, '❌ Invalid parameters');
      return;
    }

    const [date, start, end, limit, location, label] = gameParams;

    try {
      // Get the group's chat_id
      const result = await pool.query<{ id: number; chat_id: number; admin_chat_id: number; group_name: string }>(
        'SELECT * FROM admin_groups WHERE admin_chat_id = $1 AND id = $2',
        [chatId, groupId]
      );
      const group = result.rows[0];

      if (!group) {
        await bot.sendMessage(chatId, '❌ Группа не найдена');
        return;
      }

      const groupChatId = group.chat_id;

      // Create game with CreateGameDto
      await gameService.createGame(groupChatId, { 
        chat_id: groupChatId,
        date, 
        start, 
        end, 
        users_limit: parseInt(limit),
        location,
        label
      });

      await bot.sendMessage(
        chatId,
        `✅ Игра создана в группе "${group.group_name}"\n` +
        `📅 ${date} (${label})\n` +
        `⏰ ${start} — ${end}\n` +
        `📍 ${location}\n` +
        `👥 Лимит: ${limit} игроков`
      );
    } catch (error) {
      logger.error('ADMIN START GAME ERROR:', error);
      await bot.sendMessage(chatId, Messages.ERROR_OCCURRED);
    }
  }
}
