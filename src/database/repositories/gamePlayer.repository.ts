/**
 * Game Player repository - handles game participants database operations
 */

import { Pool } from 'pg';
import { GamePlayer, CreateGamePlayerDto, GamePlayerDetails } from '../../types/game.types';

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
      console.error('GET GAME PLAYERS ERROR:', error);
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
      console.error('GET UNDECIDED PLAYERS ERROR:', error);
      throw error;
    }
  }

  /**
   * Add player to game by game ID
   */
  async addGamePlayerById(dto: CreateGamePlayerDto & { chatId: number }): Promise<string | null> {
    const { gameId, chatId, userId, confirmed_attendance } = dto;

    try {
      // Check if player already exists in game
      const checkPlayer = await this.pool.query(
        'SELECT * FROM game_users WHERE user_id = $1 AND game_id = $2',
        [userId, gameId]
      );

      if (checkPlayer.rows.length > 0) {
        // Update confirmed_attendance if player already exists
        await this.pool.query(
          'UPDATE game_users SET confirmed_attendance = $1 WHERE user_id = $2 AND game_id = $3',
          [confirmed_attendance, userId, gameId]
        );
      } else {
        // Insert new game player
        await this.pool.query(
          `INSERT INTO game_users (user_id, game_id, participate_time, confirmed_attendance) 
           VALUES ($1, $2, NOW(), $3)`,
          [userId, gameId, confirmed_attendance]
        );
      }

      // Get game label
      const gameResult = await this.pool.query<{ label: string }>(
        'SELECT label FROM games WHERE id = $1',
        [gameId]
      );

      return gameResult.rows[0]?.label || null;
    } catch (error) {
      console.error('ADD GAME PLAYER BY ID ERROR:', error);
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
      console.error('ADD GAME PLAYER BY LABEL ERROR:', error);
      throw error;
    }
  }

  /**
   * Remove player from game
   */
  async removeGamePlayerById(gameId: number, userId: number): Promise<string | null> {
    try {
      // Delete player from game
      await this.pool.query(
        'DELETE FROM game_users WHERE user_id = $1 AND game_id = $2',
        [userId, gameId]
      );

      // Get game label
      const gameResult = await this.pool.query<{ label: string }>(
        'SELECT label FROM games WHERE id = $1',
        [gameId]
      );

      return gameResult.rows[0]?.label || null;
    } catch (error) {
      console.error('REMOVE GAME PLAYER ERROR:', error);
      throw error;
    }
  }
}
