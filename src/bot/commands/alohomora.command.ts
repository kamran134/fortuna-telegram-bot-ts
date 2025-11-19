/**
 * Alohomora command - easter egg response
 */

import { BaseCommand } from './base.command';
import { CommandContext } from '../../types/command.types';

export class AlohomoraCommand extends BaseCommand {
  readonly name = 'алохамора';
  readonly description = 'Пасхалка';
  readonly matchType = 'contains' as const;

  async execute(context: CommandContext): Promise<void> {
    const { bot, chatId } = context;
    await bot.sendMessage(chatId, '*дверь открылась*');
  }
}
