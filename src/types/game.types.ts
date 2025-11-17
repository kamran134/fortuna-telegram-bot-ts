/**
 * Game-related types and interfaces
 */

export interface Game {
  id: number;
  chat_id: number;
  game_date: Date;
  game_starts: string;
  game_ends: string;
  place: string;
  users_limit: number;
  status: boolean;
  label: string;
}

export interface CreateGameDto {
  chat_id: number;
  date: string;
  start: string;
  end: string;
  users_limit: number;
  location: string;
  label: string;
}

export interface GamePlayer {
  user_id: number;
  game_id: number;
  participate_time: Date;
  confirmed_attendance: boolean;
  payed: boolean;
}

export interface CreateGamePlayerDto {
  userId: number;
  gameId: number;
  confirmed_attendance: boolean;
}

export interface GamePlayerDetails {
  game_id: number;
  user_id: number;
  user_db_id?: number; // Database ID of the user (from users table)
  first_name: string;
  last_name?: string;
  username?: string;
  confirmed_attendance: boolean;
  is_guest: boolean;
  game_date: Date;
  game_starts: string;
  game_ends: string;
  place: string;
  label: string;
  users_limit: number;
}

export interface GameGuest {
  game_id: number;
  fullname: string;
  participate_time: Date;
  confirmed_attendance: boolean;
}

export interface ChangeGameLimitDto {
  chatId: number;
  label: string;
  limit: number;
}
