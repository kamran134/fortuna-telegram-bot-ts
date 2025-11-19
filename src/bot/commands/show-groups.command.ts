/**
 * Show Groups command - show all connected groups
 */

import { BaseCommand } from './base.command';
import { CommandContext } from '../../types/command.types';
import { Messages } from '../../constants/messages';
import { logger } from '../../utils/logger';

export class ShowGroupsCommand extends BaseCommand {
  readonly name = '/showgroups';
  readonly description = 'Показать привязанные группы';
  readonly creatorOnly = true;

  async execute(context: CommandContext): Promise<void> {
    if (!this.checkPermission(context)) {
      await this.sendPermissionDenied(context, Messages.CREATOR_ONLY);
      return;
    }

    const { bot, chatId, pool } = context;

    try {
      const result = await pool.query<{ id: number; chat_id: number; admin_chat_id: number; group_name: string }>(
        'SELECT * FROM admin_groups WHERE admin_chat_id = $1',
        [chatId]
      );
      const groups = result.rows;

      if (groups.length === 0) {
        await bot.sendMessage(chatId, '📝 Нет привязанных групп');
        return;
      }

      let message = '📝 *Привязанные группы:*\n\n';
      groups.forEach((group: { id: number; chat_id: number; admin_chat_id: number; group_name: string }) => {
        message += `• ${group.group_name} (ID: ${group.chat_id})\n`;
      });

      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      logger.error('SHOW GROUPS ERROR:', error);
      await bot.sendMessage(chatId, Messages.ERROR_OCCURRED);
    }
  }
}
