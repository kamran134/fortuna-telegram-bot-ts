/**
 * Event handler - processes chat events (new members, left members)
 */

import TelegramBot, { Message } from 'node-telegram-bot-api';
import { Pool } from 'pg';

export class EventHandler {
  constructor(private pool: Pool, private bot: TelegramBot) {}

  /**
   * Handle new chat members
   */
  async handleNewChatMembers(msg: Message): Promise<void> {
    const chatId = msg.chat.id;
    const newMembers = msg.new_chat_members || [];

    for (const member of newMembers) {
      if (!member.is_bot) {
        await this.bot.sendMessage(
          chatId,
          `Добро пожаловать, ${member.first_name}! 👋\n` +
            `Xoş gəlmisiniz! 🏐\n\n` +
            `Используйте /register для регистрации\n` +
            `Qeydiyyatdan keçmək üçün /register istifadə edin`
        );
      }
    }
  }

  /**
   * Handle left chat member
   */
  async handleLeftChatMember(msg: Message): Promise<void> {
    const chatId = msg.chat.id;
    const leftMember = msg.left_chat_member;

    if (leftMember && !leftMember.is_bot) {
      await this.bot.sendMessage(
        chatId,
        `${leftMember.first_name} покинул(а) чат. Прощай! 👋\n` +
          `${leftMember.first_name} çatı tərk etdi. Sağ olun! 👋`
      );
    }
  }
}
