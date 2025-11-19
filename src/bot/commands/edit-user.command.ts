/**
 * Edit User command - edits user information
 */

import { BaseCommand } from './base.command';
import { CommandContext } from '../../types/command.types';
import { Messages } from '../../constants/messages';

export class EditUserCommand extends BaseCommand {
  readonly name = '/adminedituser';
  readonly description = 'Редактировать данные пользователя';
  readonly adminOnly = true;

  async execute(context: CommandContext): Promise<void> {
    if (!this.checkPermission(context)) {
      await this.sendPermissionDenied(context, Messages.ADMIN_ONLY_EDIT_USER);
      return;
    }

    const userOptionsString = context.messageText
      .replace('/adminedituser ', '')
      .replace('/adminedituser@fortunavolleybalbot ', '')
      .trim();
    const parts = userOptionsString.split('/');
    
    if (parts.length < 2) {
      await context.bot.sendMessage(
        context.chatId,
        'Формат: /adminedituser userId/firstName/lastName/fullnameAz'
      );
      return;
    }

    const [userId, firstName, lastName, fullnameAz] = parts;
    const result = await context.userService.updateUserInfo({
      id: parseInt(userId),
      firstName,
      lastName,
      fullnameAz
    });

    await context.bot.sendMessage(context.chatId, result);
  }
}
