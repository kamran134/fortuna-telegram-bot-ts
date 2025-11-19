/**
 * Avada Kedavra command - easter egg response
 */

import { BaseCommand } from './base.command';
import { CommandContext } from '../../types/command.types';

export class AvadaKedavraCommand extends BaseCommand {
  readonly name = 'авада кедавра';
  readonly description = 'Пасхалка';
  readonly matchType = 'contains' as const;

  async execute(context: CommandContext): Promise<void> {
    const { bot, chatId, userId } = context;
    
    try {
      await bot.banChatMember(chatId, userId);
      await bot.sendMessage(chatId, '💀 *пользователь умер*', { parse_mode: 'Markdown' });
      
      // Unban immediately so they can rejoin
      setTimeout(async () => {
        await bot.unbanChatMember(chatId, userId);
      }, 100);
    } catch {
      await bot.sendMessage(chatId, '⚡️ *заклинание не сработало*', { parse_mode: 'Markdown' });
    }
  }
}
