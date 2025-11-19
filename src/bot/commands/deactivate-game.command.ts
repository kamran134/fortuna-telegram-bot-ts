/**
 * Deactivate Game command - closes/deactivates a game
 */

import { BaseCommand } from './base.command';
import { CommandContext } from '../../types/command.types';

export class DeactivateGameCommand extends BaseCommand {
  readonly name = '/deactivegame';
  readonly description = 'Закрыть/деактивировать игру';
  readonly adminOnly = true;

  async execute(context: CommandContext): Promise<void> {
    if (!this.checkPermission(context)) {
      await this.sendPermissionDenied(context, 'Только одмэн может закрыть игру.');
      return;
    }

    await context.gameService.deactivateGames(context.chatId, context.isAdmin, context.messageThreadId);
  }
}
