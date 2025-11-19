/**
 * Connect To command - connect admin chat to group
 */

import { BaseCommand } from './base.command';
import { CommandContext } from '../../types/command.types';
import { Messages } from '../../constants/messages';
import { logger } from '../../utils/logger';

export class ConnectToCommand extends BaseCommand {
  readonly name = '/connectto';
  readonly description = 'Привязать группу к админ-чату';
  readonly creatorOnly = true;

  async execute(context: CommandContext): Promise<void> {
    if (!this.checkPermission(context)) {
      await this.sendPermissionDenied(context, Messages.CREATOR_ONLY);
      return;
    }

    const { bot, chatId, text } = context;

    // Parse: /connectto {chatId} {groupName}
    const parts = text.split(' ').filter((p: string) => p);
    
    if (parts.length < 3) {
      await bot.sendMessage(
        chatId,
        '❌ Использование: /connectto {chatId} {groupName}'
      );
      return;
    }

    const groupChatId = parseInt(parts[1]);
    const groupName = parts.slice(2).join(' ');

    if (isNaN(groupChatId)) {
      await bot.sendMessage(chatId, '❌ Invalid chat ID');
      return;
    }

    try {
      await context.pool.query(
        `INSERT INTO admin_groups (chat_id, admin_chat_id, group_name) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (chat_id, admin_chat_id) DO NOTHING`,
        [groupChatId, chatId, groupName]
      );

      await bot.sendMessage(
        chatId,
        `✅ Группа "${groupName}" (${groupChatId}) привязана к этому админ-чату`
      );
    } catch (error) {
      logger.error('CONNECT TO ERROR:', error);
      await bot.sendMessage(chatId, Messages.ERROR_OCCURRED);
    }
  }
}
