/**
 * Admin Group service - business logic for admin group operations
 */

import TelegramBot from 'node-telegram-bot-api';
import { AdminGroupRepository } from '../database/repositories/adminGroup.repository';

export class AdminGroupService {
  constructor(private adminGroupRepository: AdminGroupRepository) {}

  /**
   * Connect admin chat to game chat
   */
  async connectToGroup(
    chatId: number,
    adminChatId: number,
    userId: number,
    bot: TelegramBot
  ): Promise<void> {
    try {
      const groupInfo = await bot.getChat(chatId);
      const groupName = groupInfo.title || 'noname';

      const member = await bot.getChatMember(chatId, userId);
      if (member.status !== 'administrator' && member.status !== 'creator') {
        await bot.sendMessage(adminChatId, 'Дело пахнет жареным. Вряд-ли вы админ той группы');
        return;
      }

      await this.adminGroupRepository.addAdminGroup({ chatId, adminChatId, groupName });
      await bot.sendMessage(
        adminChatId,
        `Группа ${groupName} успешно связана с текущей. Теперь вы можете создавать игры, редактировать пользователей и игры отсюда!`
      );
    } catch (error) {
      console.error('CONNECT TO GROUP ERROR:', error);
      await bot.sendMessage(adminChatId, 'Произошла ошибка при подключении группы');
    }
  }

  /**
   * Show groups managed by admin
   */
  async showGroups(adminChatId: number, bot: TelegramBot): Promise<void> {
    try {
      const groups = await this.adminGroupRepository.getGroups(adminChatId);

      if (!groups || groups.length === 0) {
        await bot.sendMessage(adminChatId, 'У вас нет подчинённых групп');
        return;
      }

      const groupsList = groups.map(g => g.group_name).join('\n');
      await bot.sendMessage(adminChatId, `Группы, которые вы админите:\n\n${groupsList}`);
    } catch (error) {
      console.error('SHOW GROUPS ERROR:', error);
      await bot.sendMessage(adminChatId, 'Произошла ошибка при получении списка групп');
    }
  }

  /**
   * Show groups with selection buttons
   */
  async showGroupsForSelection(adminChatId: number, command: string, bot: TelegramBot): Promise<void> {
    try {
      const groups = await this.adminGroupRepository.getGroups(adminChatId);

      if (!groups || groups.length === 0) {
        await bot.sendMessage(adminChatId, 'У вас нет подчинённых групп');
        return;
      }

      const groupsButtons = groups.map(group => [
        { text: group.group_name, callback_data: `selectedGroupFor${command}_${group.chat_id}` }
      ]);

      await bot.sendMessage(adminChatId, 'Выберите группу, которая подчиняется вам', {
        reply_markup: {
          inline_keyboard: groupsButtons
        }
      });
    } catch (error) {
      console.error('SHOW GROUPS FOR SELECTION ERROR:', error);
      await bot.sendMessage(adminChatId, 'Произошла ошибка');
    }
  }
}
