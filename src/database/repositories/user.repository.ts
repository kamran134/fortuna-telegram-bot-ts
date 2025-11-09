/**
 * User repository - handles all user-related database operations
 */

import { Pool } from 'pg';
import { User, CreateUserDto, UpdateUserDto, GroupUser, UserWithGameStats } from '../../types/user.types';

export class UserRepository {
  constructor(private pool: Pool) {}

  /**
   * Add a new user to the database
   */
  async addUser(dto: CreateUserDto): Promise<string> {
    const { user_id, first_name, last_name, username, chat_id, is_guest = false } = dto;

    try {
      // Check if user already exists
      const checkUser = await this.pool.query<User>(
        'SELECT * FROM users WHERE user_id = $1',
        [user_id]
      );

      if (checkUser.rows.length > 0) {
        // Add user to group_users if not exists
        const userId = checkUser.rows[0].id;
        const checkGroupUser = await this.pool.query<GroupUser>(
          'SELECT * FROM group_users WHERE user_id = $1 AND chat_id = $2',
          [userId, chat_id]
        );

        if (checkGroupUser.rows.length === 0) {
          await this.pool.query(
            `INSERT INTO group_users (user_id, chat_id, chat_role) VALUES ($1, $2, 'game')`,
            [userId, chat_id]
          );
          return '✅ Siz uğurla qrupa əlavə edildiniz / Вы успешно добавлены в группу';
        }
        return 'İstifadəçi artıq qrupda var / Пользователь уже существует в группе';
      }

      // Insert new user
      const result = await this.pool.query<{ id: number }>(
        `INSERT INTO users (first_name, last_name, user_id, chat_id, username, is_guest, active) 
         VALUES ($1, $2, $3, $4, $5, $6, TRUE) RETURNING id`,
        [first_name, last_name, user_id, chat_id, username, is_guest]
      );

      if (result.rows.length > 0) {
        await this.pool.query(
          `INSERT INTO group_users (user_id, chat_id, chat_role) VALUES ($1, $2, 'game')`,
          [result.rows[0].id, chat_id]
        );
      }

      return '✅ Siz uğurla sistemdə qeydiyyatdan keçdiniz / Вы успешно зарегистрировались в системе';
    } catch (error) {
      console.error('ADD USER ERROR:', error);
      throw error;
    }
  }

  /**
   * Get all active users in a chat
   */
  async getUsers(chatId: number): Promise<User[]> {
    try {
      const result = await this.pool.query<User>(
        `SELECT u.* FROM group_users gu 
         LEFT JOIN users u ON gu.user_id = u.id 
         WHERE gu.chat_id = $1 AND u.is_guest = FALSE AND u.active = TRUE 
         ORDER BY gu.user_id`,
        [chatId]
      );
      return result.rows;
    } catch (error) {
      console.error('GET USERS ERROR:', error);
      throw error;
    }
  }

  /**
   * Get last registered user
   */
  async getLastUser(chatId: number): Promise<User | null> {
    try {
      const result = await this.pool.query<User>(
        `SELECT * FROM users 
         WHERE chat_id = $1 AND is_guest = FALSE AND active = TRUE 
         ORDER BY id DESC LIMIT 1`,
        [chatId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('GET LAST USER ERROR:', error);
      throw error;
    }
  }

  /**
   * Search users by name or username
   */
  async searchUser(chatId: number, searchString: string): Promise<User[]> {
    try {
      const result = await this.pool.query<User>(
        `SELECT * FROM users 
         WHERE chat_id = $1 AND is_guest = FALSE AND active = TRUE
         AND (first_name ILIKE $2 OR last_name ILIKE $2 OR username ILIKE $2)
         ORDER BY id DESC`,
        [chatId, `%${searchString}%`]
      );
      return result.rows;
    } catch (error) {
      console.error('SEARCH USER ERROR:', error);
      throw error;
    }
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const result = await this.pool.query<User>(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('GET USER BY USERNAME ERROR:', error);
      throw error;
    }
  }

  /**
   * Get user's chat
   */
  async getUserChat(userId: number): Promise<{ chat_id: number } | null> {
    try {
      const result = await this.pool.query<{ chat_id: number }>(
        'SELECT chat_id FROM users WHERE id = $1',
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('GET USER CHAT ERROR:', error);
      throw error;
    }
  }

  /**
   * Update user information
   */
  async updateUser(dto: UpdateUserDto): Promise<User | null> {
    const { id, firstName, lastName, fullnameAz } = dto;
    
    try {
      const result = await this.pool.query<User>(
        `UPDATE users 
         SET first_name = COALESCE($1, first_name),
             last_name = COALESCE($2, last_name),
             fullname_az = COALESCE($3, fullname_az)
         WHERE id = $4
         RETURNING *`,
        [firstName, lastName, fullnameAz, id]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('UPDATE USER ERROR:', error);
      throw error;
    }
  }

  /**
   * Add guest user
   */
  async addGuest(chatId: number, firstName: string, lastName: string): Promise<number> {
    try {
      const result = await this.pool.query<{ id: number }>(
        `INSERT INTO users (user_id, chat_id, is_guest, first_name, last_name, active) 
         VALUES ((SELECT MAX(id) FROM users) + 1, $1, TRUE, $2, $3, TRUE) 
         RETURNING id`,
        [chatId, firstName, lastName]
      );
      return result.rows[0].id;
    } catch (error) {
      console.error('ADD GUEST ERROR:', error);
      throw error;
    }
  }

  /**
   * Get random user
   */
  async getRandomUser(chatId: number): Promise<User | null> {
    try {
      const result = await this.pool.query<User>(
        `SELECT * FROM users 
         WHERE chat_id = $1 AND is_guest = FALSE AND active = TRUE 
         ORDER BY RANDOM() LIMIT 1`,
        [chatId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('GET RANDOM USER ERROR:', error);
      throw error;
    }
  }

  /**
   * Get inactive users (participated in less than 2 games in last 2 months)
   */
  async getInactiveUsers(chatId: number): Promise<UserWithGameStats[]> {
    try {
      const result = await this.pool.query<UserWithGameStats>(
        `SELECT u.user_id, u.first_name, u.last_name, u.username, COUNT(gu.game_id) AS game_count 
         FROM users u 
         LEFT JOIN game_users gu ON gu.user_id = u.id 
           AND gu.participate_time >= NOW() - INTERVAL '2 months' 
         WHERE u.chat_id = $1 AND u.is_guest = FALSE AND u.active = TRUE 
         GROUP BY u.user_id, u.first_name, u.last_name, u.username 
         HAVING COUNT(gu.game_id) < 2 
         ORDER BY game_count ASC`,
        [chatId]
      );
      return result.rows;
    } catch (error) {
      console.error('GET INACTIVE USERS ERROR:', error);
      throw error;
    }
  }

  /**
   * Get Azerbaijani names list for a game
   */
  async getAzList(chatId: number, gameLabel: string): Promise<Array<{ fullname_az: string }>> {
    try {
      const result = await this.pool.query<{ fullname_az: string }>(
        `SELECT u.fullname_az FROM users u 
         LEFT JOIN game_users gu ON gu.user_id = u.id 
         WHERE u.chat_id = $1 
         AND gu.game_id = (SELECT MAX(g.id) FROM games g WHERE LOWER(g.label) = LOWER($2))`,
        [chatId, gameLabel]
      );
      return result.rows;
    } catch (error) {
      console.error('GET AZ LIST ERROR:', error);
      throw error;
    }
  }

  /**
   * Edit user information
   */
  async editUser(dto: UpdateUserDto): Promise<User | null> {
    const { id, firstName, lastName, fullnameAz } = dto;

    try {
      const updateFields: string[] = [];
      const values: unknown[] = [];
      let paramCount = 1;

      if (firstName) {
        updateFields.push(`first_name = $${paramCount++}`);
        values.push(firstName);
      }

      if (lastName) {
        updateFields.push(`last_name = $${paramCount++}`);
        values.push(lastName);
      }

      if (fullnameAz) {
        updateFields.push(`fullname_az = $${paramCount++}`);
        values.push(fullnameAz);
      }

      if (updateFields.length === 0) {
        return null;
      }

      values.push(id);
      const setClause = updateFields.join(', ');

      const result = await this.pool.query<User>(
        `UPDATE users SET ${setClause} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('EDIT USER ERROR:', error);
      throw error;
    }
  }

  /**
   * Remove user from database
   */
  async removeUser(chatId: number, userId: number): Promise<boolean> {
    try {
      const result = await this.pool.query(
        'DELETE FROM users WHERE user_id = $1 AND chat_id = $2',
        [userId, chatId]
      );
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('REMOVE USER ERROR:', error);
      throw error;
    }
  }

  /**
   * Get user by name (for guests)
   */
  async getUserByName(chatId: number, firstName: string, lastName: string): Promise<User | null> {
    try {
      const result = await this.pool.query<User>(
        'SELECT * FROM users WHERE chat_id = $1 AND first_name = $2 AND last_name = $3 AND is_guest = TRUE ORDER BY id DESC LIMIT 1',
        [chatId, firstName, lastName]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('GET USER BY NAME ERROR:', error);
      throw error;
    }
  }

  /**
   * Get all users by chat ID (for admin commands)
   */
  async getUsersByChatId(chatId: number): Promise<User[]> {
    try {
      const result = await this.pool.query<User>(
        `SELECT u.* FROM group_users gu 
         LEFT JOIN users u ON gu.user_id = u.id 
         WHERE gu.chat_id = $1 AND u.is_guest = FALSE AND u.active = TRUE 
         ORDER BY u.first_name`,
        [chatId]
      );
      return result.rows;
    } catch (error) {
      console.error('GET USERS BY CHAT ID ERROR:', error);
      throw error;
    }
  }
}
