/**
 * Agilli Ol command - randomly selects a user to be smart
 */

import { BaseCommand } from './base.command';
import { CommandContext } from '../../types/command.types';

export class AgilliOlCommand extends BaseCommand {
  readonly name = '/agilliol';
  readonly description = 'Ağıllı ol - случайный игрок';

  async execute(context: CommandContext): Promise<void> {
    const result = await context.userService.getRandomUserMessage(context.chatId);
    await context.bot.sendMessage(
      context.chatId,
      result,
      {
        parse_mode: 'HTML',
        ...(context.messageThreadId ? { message_thread_id: context.messageThreadId } : {}),
      }
    );
  }
}
