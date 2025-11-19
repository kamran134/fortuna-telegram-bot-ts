/**
 * Show Games command - displays all active games
 */

import { BaseCommand } from './base.command';
import { CommandContext } from '../../types/command.types';

export class ShowGamesCommand extends BaseCommand {
  readonly name = '/showgames';
  readonly description = 'Показать все активные игры';

  async execute(context: CommandContext): Promise<void> {
    await context.gameService.showGames(context.chatId, context.messageThreadId);
  }
}
