/**
 * List Players command - displays all game participants
 */

import { BaseCommand } from './base.command';
import { CommandContext } from '../../types/command.types';

export class ListPlayersCommand extends BaseCommand {
  readonly name = '/list';
  readonly description = 'Показать всех участников игр';

  async execute(context: CommandContext): Promise<void> {
    await context.gameService.showGamePlayers(context.chatId, context.messageThreadId);
  }
}
