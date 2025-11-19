/**
 * Start Game command - creates a new game
 */

import { BaseCommand } from './base.command';
import { CommandContext } from '../../types/command.types';
import { validateGameFormat, parseGameCommand } from '../../utils/validator';
import { Messages } from '../../constants/messages';

export class StartGameCommand extends BaseCommand {
  readonly name = '/startgame';
  readonly description = 'Создать новую игру';
  readonly adminOnly = true;

  async execute(context: CommandContext): Promise<void> {
    if (!this.checkPermission(context)) {
      await this.sendPermissionDenied(context, Messages.ADMIN_ONLY);
      return;
    }

    const commandText = context.messageText.replace('/startgame ', '').trim();
    
    if (!validateGameFormat(commandText)) {
      await context.bot.sendMessage(
        context.chatId,
        Messages.INVALID_GAME_FORMAT
      );
      return;
    }

    const gameData = parseGameCommand(commandText);
    if (gameData) {
      // Check if this is from admin chat and use selected group
      const g = global as typeof globalThis & { selectedChatForStartGame?: Record<number, number> };
      const targetChatId = g.selectedChatForStartGame?.[context.chatId] || context.chatId;
      
      // Use messageThreadId from context (will be undefined for regular groups without topics)
      await context.gameService.createGame(
        targetChatId, 
        { ...gameData, chat_id: targetChatId }, 
        context.messageThreadId
      );
      
      // Clear selected chat after game creation
      if (g.selectedChatForStartGame?.[context.chatId]) {
        delete g.selectedChatForStartGame[context.chatId];
      }
    }
  }
}
