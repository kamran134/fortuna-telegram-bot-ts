/**
 * Game Player repository - handles game participants database operations
 */

import { Pool } from 'pg';
import { CreateGamePlayerDto, GamePlayerDetails } from '../../types/game.types';
import { logger } from '../../utils/logger';

export class GamePlayerRepository {
  constructor(private pool: Pool) {}

  /**
   * Get all players for games in a chat
   */
  async getGamePlayers(chatId: number): Promise<GamePlayerDetails[]> {
    try {
      const result = await this.pool.query<GamePlayerDetails>(
        `SELECT 
          gu.game_id, gu.user_id, gu.confirmed_attendance,
          u.first_name, u.last_name, u.username, u.is_guest,
          g.game_date, g.game_starts, g.game_ends, g.place, g.label, g.users_limit
         FROM game_users gu
         LEFT JOIN users u ON gu.user_id = u.id
         LEFT JOIN games g ON gu.game_id = g.id
         WHERE g.chat_id = $1 AND g.status = TRUE
         ORDER BY g.game_date, gu.participate_time`,
        [chatId]
      );
      return result.rows;
    } catch (error) {
      logger.error('GET GAME PLAYERS ERROR:', error);
      throw error;
    }
  }

  /**
   * Get undecided players (not confirmed attendance)
   */
  async getUndecidedPlayers(chatId: number): Promise<GamePlayerDetails[]> {
    try {
      const result = await this.pool.query<GamePlayerDetails>(
        `SELECT 
          gu.game_id, gu.user_id, gu.confirmed_attendance,
          u.first_name, u.last_name, u.username, u.is_guest,
          g.game_date, g.game_starts, g.game_ends, g.place, g.label, g.users_limit
         FROM game_users gu
         LEFT JOIN users u ON gu.user_id = u.id
         LEFT JOIN games g ON gu.game_id = g.id
         WHERE g.chat_id = $1 AND g.status = TRUE AND gu.confirmed_attendance = FALSE
         ORDER BY g.game_date, gu.participate_time`,
        [chatId]
      );
      return result.rows;
    } catch (error) {
      logger.error('GET UNDECIDED PLAYERS ERROR:', error);
      throw error;
    }
  }

  /**
   * Get undecided players for a specific game by label
   */
  async getUndecidedPlayersByGameLabel(chatId: number, gameLabel: string): Promise<GamePlayerDetails[]> {
    try {
      const result = await this.pool.query<GamePlayerDetails>(
        `SELECT 
          gu.game_id, gu.user_id, gu.confirmed_attendance,
          u.id as user_db_id, u.first_name, u.last_name, u.username, u.is_guest,
          g.game_date, g.game_starts, g.game_ends, g.place, g.label, g.users_limit
         FROM game_users gu
         LEFT JOIN users u ON gu.user_id = u.id
         LEFT JOIN games g ON gu.game_id = g.id
         WHERE g.chat_id = $1 AND g.status = TRUE AND gu.confirmed_attendance = FALSE 
         AND LOWER(g.label) = LOWER($2)
         ORDER BY gu.participate_time`,
        [chatId, gameLabel]
      );
      return result.rows;
    } catch (error) {
      logger.error('GET UNDECIDED PLAYERS BY GAME LABEL ERROR:', error);
      throw error;
    }
  }

  /**
   * Get all guests for a specific game by label (regardless of confirmed_attendance)
   */
  async getGuestsByGameLabel(chatId: number, gameLabel: string): Promise<GamePlayerDetails[]> {
    try {
      const result = await this.pool.query<GamePlayerDetails>(
        `SELECT 
          gu.game_id, gu.user_id, gu.confirmed_attendance,
          u.id as user_db_id, u.first_name, u.last_name, u.username, u.is_guest,
          g.game_date, g.game_starts, g.game_ends, g.place, g.label, g.users_limit
         FROM game_users gu
         LEFT JOIN users u ON gu.user_id = u.id
         LEFT JOIN games g ON gu.game_id = g.id
         WHERE g.chat_id = $1 AND g.status = TRUE AND u.is_guest = TRUE 
         AND LOWER(g.label) = LOWER($2)
         ORDER BY gu.participate_time`,
        [chatId, gameLabel]
      );
      return result.rows;
    } catch (error) {
      logger.error('GET GUESTS BY GAME LABEL ERROR:', error);
      throw error;
    }
  }

  /**
   * Confirm player attendance (set confirmed_attendance to true)
   */
  async confirmPlayerAttendance(gameId: number, userDbId: number): Promise<boolean> {
    try {
      const result = await this.pool.query(
        'UPDATE game_users SET confirmed_attendance = TRUE WHERE game_id = $1 AND user_id = $2',
        [gameId, userDbId]
      );
      return (result.rowCount || 0) > 0;
    } catch (error) {
      logger.error('CONFIRM PLAYER ATTENDANCE ERROR:', error);
      throw error;
    }
  }

  /**
   * Unconfirm player attendance (set confirmed_attendance to false)
   */
  async unconfirmPlayerAttendance(gameId: number, userDbId: number): Promise<boolean> {
    try {
      const result = await this.pool.query(
        'UPDATE game_users SET confirmed_attendance = FALSE WHERE game_id = $1 AND user_id = $2',
        [gameId, userDbId]
      );
      return (result.rowCount || 0) > 0;
    } catch (error) {
      logger.error('UNCONFIRM PLAYER ATTENDANCE ERROR:', error);
      throw error;
    }
  }

  /**
   * Delete guest from game by user database ID
   */
  async deleteGuest(gameId: number, userDbId: number): Promise<boolean> {
    try {
      // First verify this is actually a guest
      const userCheck = await this.pool.query(
        'SELECT is_guest FROM users WHERE id = $1',
        [userDbId]
      );

      if (userCheck.rows.length === 0 || !userCheck.rows[0].is_guest) {
        // Not a guest, don't delete
        return false;
      }

      // Delete from game_users
      const deleteGameUser = await this.pool.query(
        'DELETE FROM game_users WHERE game_id = $1 AND user_id = $2',
        [gameId, userDbId]
      );

      if ((deleteGameUser.rowCount || 0) === 0) {
        return false;
      }

      // Delete the guest user entirely (since guests are one-time)
      await this.pool.query(
        'DELETE FROM users WHERE id = $1 AND is_guest = TRUE',
        [userDbId]
      );

      return true;
    } catch (error) {
      logger.error('DELETE GUEST ERROR:', error);
      throw error;
    }
  }

  /**
   * Get confirmed players for a specific game by label
   */
  async getConfirmedPlayersByGameLabel(chatId: number, gameLabel: string): Promise<GamePlayerDetails[]> {
    try {
      const result = await this.pool.query<GamePlayerDetails>(
        `SELECT 
          gu.game_id, gu.user_id, gu.confirmed_attendance,
          u.id as user_db_id, u.first_name, u.last_name, u.username, u.is_guest,
          g.game_date, g.game_starts, g.game_ends, g.place, g.label, g.users_limit
         FROM game_users gu
         LEFT JOIN users u ON gu.user_id = u.id
         LEFT JOIN games g ON gu.game_id = g.id
         WHERE g.chat_id = $1 AND g.status = TRUE AND gu.confirmed_attendance = TRUE 
         AND LOWER(g.label) = LOWER($2)
         ORDER BY gu.participate_time`,
        [chatId, gameLabel]
      );
      return result.rows;
    } catch (error) {
      logger.error('GET CONFIRMED PLAYERS BY GAME LABEL ERROR:', error);
      throw error;
    }
  }

  /**
   * Add player to game by game ID
   */
  async addGamePlayerById(dto: CreateGamePlayerDto & { chatId: number }): Promise<string | null> {
    const { gameId, userId, confirmed_attendance, chatId } = dto;

    try {
      // First, ensure user exists in users table
      const userCheck = await this.pool.query(
        'SELECT id FROM users WHERE user_id = $1 AND chat_id = $2',
        [userId, chatId]
      );

      let userDbId: number;

      if (userCheck.rows.length === 0) {
        // User doesn't exist, create them with default info
        // Note: We'll update with real info when they first send a message
        const insertResult = await this.pool.query(
          `INSERT INTO users (user_id, first_name, last_name, username, chat_id, active) 
           VALUES ($1, 'Unknown', '', '', $2, TRUE) 
           RETURNING id`,
          [userId, chatId]
        );
        userDbId = insertResult.rows[0].id;
      } else {
        userDbId = userCheck.rows[0].id;
      }

      // Check if player already exists in game
      const checkPlayer = await this.pool.query(
        'SELECT * FROM game_users WHERE user_id = $1 AND game_id = $2',
        [userDbId, gameId]
      );

      if (checkPlayer.rows.length > 0) {
        // Update confirmed_attendance if player already exists
        await this.pool.query(
          'UPDATE game_users SET confirmed_attendance = $1 WHERE user_id = $2 AND game_id = $3',
          [confirmed_attendance, userDbId, gameId]
        );
      } else {
        // Insert new game player
        await this.pool.query(
          `INSERT INTO game_users (user_id, game_id, participate_time, confirmed_attendance) 
           VALUES ($1, $2, NOW(), $3)`,
          [userDbId, gameId, confirmed_attendance]
        );
      }

      // Get game label
      const gameResult = await this.pool.query<{ label: string }>(
        'SELECT label FROM games WHERE id = $1',
        [gameId]
      );

      return gameResult.rows[0]?.label || null;
    } catch (error) {
      logger.error('ADD GAME PLAYER BY ID ERROR:', error);
      throw error;
    }
  }

  /**
   * Add player to game by game label
   */
  async addGamePlayerByLabel(chatId: number, gameLabel: string, userId: number, confirmed_attendance: boolean): Promise<void> {
    try {
      // Get game ID by label
      const gameResult = await this.pool.query<{ id: number }>(
        'SELECT id FROM games WHERE chat_id = $1 AND LOWER(label) = LOWER($2) AND status = TRUE ORDER BY id DESC LIMIT 1',
        [chatId, gameLabel]
      );

      if (gameResult.rows.length === 0) {
        throw new Error('Game not found');
      }

      const gameId = gameResult.rows[0].id;

      // Add player
      await this.pool.query(
        `INSERT INTO game_users (user_id, game_id, participate_time, confirmed_attendance) 
         VALUES ($1, $2, NOW(), $3)`,
        [userId, gameId, confirmed_attendance]
      );
    } catch (error) {
      logger.error('ADD GAME PLAYER BY LABEL ERROR:', error);
      throw error;
    }
  }

  /**
   * Remove player from game
   */
  async removeGamePlayerById(gameId: number, telegramUserId: number, chatId: number): Promise<string | null> {
    try {
      // Find user database ID
      const userResult = await this.pool.query(
        'SELECT id FROM users WHERE user_id = $1 AND chat_id = $2',
        [telegramUserId, chatId]
      );

      if (userResult.rows.length === 0) {
        // User doesn't exist, nothing to remove
        return null;
      }

      const userDbId = userResult.rows[0].id;

      // Delete player from game and check if anything was deleted
      const deleteResult = await this.pool.query(
        'DELETE FROM game_users WHERE user_id = $1 AND game_id = $2',
        [userDbId, gameId]
      );

      // If no rows were deleted, player wasn't in the game
      if (!deleteResult.rowCount || deleteResult.rowCount === 0) {
        return null;
      }

      // Get game label only if player was actually removed
      const gameResult = await this.pool.query<{ label: string }>(
        'SELECT label FROM games WHERE id = $1',
        [gameId]
      );

      return gameResult.rows[0]?.label || null;
    } catch (error) {
      logger.error('REMOVE GAME PLAYER ERROR:', error);
      throw error;
    }
  }
}
