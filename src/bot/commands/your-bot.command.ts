/**
 * Your Bot command - easter egg response
 */

import { BaseCommand } from './base.command';
import { CommandContext } from '../../types/command.types';

export class YourBotCommand extends BaseCommand {
  readonly name = 'твой бот';
  readonly description = 'Пасхалка';
  readonly matchType = 'contains' as const;

  async execute(context: CommandContext): Promise<void> {
    const { bot, chatId } = context;
    await bot.sendMessage(chatId, 'Сам бот.');
  }
}
