/**
 * User-related types and interfaces
 */

export interface User {
  id: number;
  user_id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  is_guest: boolean;
  chat_id: number;
  fullname_az?: string;
  active: boolean;
}

export interface CreateUserDto {
  user_id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  chat_id: number;
  is_guest?: boolean;
  fullname_az?: string;
}

export interface UpdateUserDto {
  id: number;
  firstName?: string;
  lastName?: string;
  fullnameAz?: string;
}

export interface GroupUser {
  user_id: number;
  chat_id: number;
  chat_role: 'game' | 'admin';
}

export interface UserWithGameStats {
  user_id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  game_count: number;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}
