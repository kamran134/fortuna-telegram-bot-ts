/**
 * Command Registry - manages command registration and execution
 * Replaces the giant if-else chain with a clean registry pattern
 */

import { ICommand, CommandMatcher, CommandContext } from '../types/command.types';
import { logger } from '../utils/logger';

interface CommandRegistration {
  command: ICommand;
  matcher: CommandMatcher;
}

export class CommandRegistry {
  private commands: CommandRegistration[] = [];
  private exactMatchCommands = new Map<string, ICommand>();

  /**
   * Register a command with exact match
   */
  registerExact(commandName: string, command: ICommand): void {
    this.exactMatchCommands.set(commandName.toLowerCase(), command);
    logger.debug(`Registered exact command: ${commandName}`);
  }

  /**
   * Register a command with custom matcher
   */
  register(matcher: CommandMatcher, command: ICommand): void {
    this.commands.push({ command, matcher });
    logger.debug(`Registered command: ${command.name}`);
  }

  /**
   * Register a command that starts with a prefix
   */
  registerPrefix(prefix: string, command: ICommand): void {
    this.register(
      (text) => text.startsWith(prefix.toLowerCase()),
      command
    );
  }

  /**
   * Register a command that contains a substring
   */
  registerContains(substring: string, command: ICommand): void {
    this.register(
      (text) => text.includes(substring.toLowerCase()),
      command
    );
  }

  /**
   * Find and execute matching command
   */
  async execute(context: CommandContext): Promise<boolean> {
    const messageText = context.messageText.toLowerCase();

    // Try exact match first (most common case)
    const exactCommand = this.exactMatchCommands.get(messageText);
    if (exactCommand) {
      await this.executeCommand(exactCommand, context);
      return true;
    }

    // Try pattern matchers
    for (const { command, matcher } of this.commands) {
      if (matcher(messageText)) {
        await this.executeCommand(command, context);
        return true;
      }
    }

    return false;
  }

  private async executeCommand(command: ICommand, context: CommandContext): Promise<void> {
    try {
      // Check permissions
      if (command.adminOnly && !context.isAdmin) {
        logger.warn(`Non-admin user attempted admin command`, { 
          userId: context.userId, 
          command: command.name 
        });
        return;
      }

      if (command.creatorOnly) {
        // Creator check will be handled in command itself
      }

      logger.info(`Executing command: ${command.name}`, { 
        userId: context.userId, 
        chatId: context.chatId 
      });

      await command.execute(context);
    } catch (error) {
      logger.error(`Command execution failed: ${command.name}`, error, { 
        userId: context.userId, 
        chatId: context.chatId 
      });
      throw error;
    }
  }

  /**
   * Get all registered commands
   */
  getCommands(): ICommand[] {
    const exactCommands = Array.from(this.exactMatchCommands.values());
    const patternCommands = this.commands.map(reg => reg.command);
    return [...exactCommands, ...patternCommands];
  }
}
