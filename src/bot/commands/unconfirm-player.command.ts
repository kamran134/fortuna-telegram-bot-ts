/**
 * Unconfirm Player command - makes confirmed players undecided
 */

import { BaseCommand } from './base.command';
import { CommandContext } from '../../types/command.types';
import { Messages } from '../../constants/messages';

export class UnconfirmPlayerCommand extends BaseCommand {
  readonly name = '/unconfirmplayer';
  readonly description = 'Сделать подтверждённого игрока неподтверждённым';
  readonly adminOnly = true;

  async execute(context: CommandContext): Promise<void> {
    if (!this.checkPermission(context)) {
      await this.sendPermissionDenied(context, Messages.ADMIN_ONLY_CONFIRM_GUEST);
      return;
    }

    const gameLabel = context.messageText.replace('/unconfirmplayer ', '').trim();

    if (!gameLabel || gameLabel === '/unconfirmplayer') {
      await context.bot.sendMessage(
        context.chatId,
        'Использование: /unconfirmplayer <день недели>\nПример: /unconfirmplayer понедельник',
        context.messageThreadId ? { message_thread_id: context.messageThreadId } : {}
      );
      return;
    }

    await context.gameService.showConfirmedPlayersForUnconfirmation(
      context.chatId,
      gameLabel,
      context.messageThreadId
    );
  }
}
