/**
 * Tag Gamers command - mentions all game players
 */

import { BaseCommand } from './base.command';
import { CommandContext } from '../../types/command.types';

export class TagGamersCommand extends BaseCommand {
  readonly name = '/taggamers';
  readonly description = 'Упомянуть всех игроков';
  readonly adminOnly = true;

  async execute(context: CommandContext): Promise<void> {
    const result = await context.gameService.tagGamePlayers(context.chatId, context.isAdmin);
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
