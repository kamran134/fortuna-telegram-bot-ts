/**
 * Formatting utilities for messages
 */

import { User } from '../types/user.types';

interface FormattableUser {
  user_id?: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

/**
 * Format users list with HTML tags
 */
export function tagUsers(users: (User | FormattableUser)[]): string {
  return users
    .map((user, index) => {
      if (user.username) {
        return `${index + 1}. @${user.username}`;
      }
      return `${index + 1}. <a href="tg://user?id=${user.user_id}">${user.first_name}</a>`;
    })
    .join('\n');
}

/**
 * Format users list with commas
 */
export function tagUsersByCommas(users: (User | FormattableUser)[]): string {
  return users
    .map(user => {
      if (user.username) {
        return `@${user.username}`;
      }
      const userId = 'user_id' in user ? user.user_id : ('id' in user ? (user as User).user_id : 0);
      return `<a href="tg://user?id=${userId}">${user.first_name}</a>`;
    })
    .join(', ');
}

/**
 * Format users list without tags
 */
export function listUsers(users: (User | FormattableUser)[]): string {
  return users
    .map((user, index) => {
      const lastName = user.last_name ? ` ${user.last_name}` : '';
      const username = user.username ? ` (@${user.username})` : '';
      return `${index + 1}. ${user.first_name}${lastName}${username}`;
    })
    .join('\n');
}

/**
 * Format user mention
 */
export function mentionUser(user: User | { user_id: number; first_name: string; username?: string }): string {
  if ('username' in user && user.username) {
    return `@${user.username}`;
  }
  return `<a href="tg://user?id=${user.user_id}">${user.first_name}</a>`;
}

/**
 * Escape markdown characters
 */
export function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}
