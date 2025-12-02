/**
 * Add Guest command - adds a guest player to a game
 */

import { BaseCommand } from './base.command';
import { CommandContext } from '../../types/command.types';
import { Messages } from '../../constants/messages';
import { capitalizeWords } from '../../utils/formatter';

export class AddGuestCommand extends BaseCommand {
  readonly name = '/addguest';
  readonly description = 'Добавить гостя в игру';
  readonly adminOnly = true;

  async execute(context: CommandContext): Promise<void> {
    if (!this.checkPermission(context)) {
      await this.sendPermissionDenied(context, Messages.ADMIN_ONLY_ADD_GUEST);
      return;
    }

    const query = context.messageText.replace('/addguest ', '').trim();
    const parts = query.split('/');

    if (parts.length < 2) {
      await context.bot.sendMessage(
        context.chatId,
        'Формат: /addguest название_игры/Имя Фамилия или /addguest название_игры/Имя Фамилия/* (если не точно)'
      );
      return;
    }

    const gameLabel = parts[0];
    const fullname = capitalizeWords(parts[1].trim());
    const confirmedAttendance = parts.length > 2 && parts[2].includes('*') ? false : true;

    await context.gameService.addGuestToGame(context.chatId, gameLabel, fullname, confirmedAttendance);
  }
}
