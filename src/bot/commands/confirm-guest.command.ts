/**
 * Confirm Guest command - confirms undecided players for a game
 */

import { BaseCommand } from './base.command';
import { CommandContext } from '../../types/command.types';
import { Messages } from '../../constants/messages';

export class ConfirmGuestCommand extends BaseCommand {
  readonly name = '/confirmguest';
  readonly description = 'Подтвердить неопределившихся игроков';
  readonly adminOnly = true;

  async execute(context: CommandContext): Promise<void> {
    if (!this.checkPermission(context)) {
      await this.sendPermissionDenied(context, Messages.ADMIN_ONLY_CONFIRM_GUEST);
      return;
    }

    const gameLabel = context.messageText.replace('/confirmguest ', '').trim();

    if (!gameLabel || gameLabel === '/confirmguest') {
      await context.bot.sendMessage(
        context.chatId,
        Messages.INVALID_CONFIRMGUEST_FORMAT,
        context.messageThreadId ? { message_thread_id: context.messageThreadId } : {}
      );
      return;
    }

    await context.gameService.showUndecidedPlayersForConfirmation(
      context.chatId,
      gameLabel,
      context.messageThreadId
    );
  }
}
