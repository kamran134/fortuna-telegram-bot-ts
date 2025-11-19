/**
 * Command: /activategame
 * Activates the last deactivated game
 */

import { BaseCommand } from './base.command';
import { CommandContext } from '../../types/command.types';

export class ActivateGameCommand extends BaseCommand {
  readonly name = '/activategame';
  readonly description = 'Активировать последнюю деактивированную игру';
  readonly adminOnly = true;

  async execute(context: CommandContext): Promise<void> {
    if (!this.checkPermission(context)) {
      await this.sendPermissionDenied(context, 'Только одмэн может активировать игру.');
      return;
    }

    await context.gameService.activateGame(
      context.chatId,
      context.isAdmin,
      context.messageThreadId
    );
  }
}
