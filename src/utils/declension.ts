/**
 * Utility functions for word declension in Russian and Azerbaijani
 */

import { WeekDay, Case, AzCase } from '../types/common.types';

type DeclensionMap = Record<WeekDay, Record<Case, string>>;
type AzDeclensionMap = Record<WeekDay, Record<AzCase, string>>;

const ruDeclensions: DeclensionMap = {
  'понедельник': {
    'именительный': 'понедельник',
    'родительный': 'понедельника',
    'дательный': 'понедельнику',
    'винительный': 'понедельник',
    'творительный': 'понедельником',
    'предложный': 'понедельнике'
  },
  'вторник': {
    'именительный': 'вторник',
    'родительный': 'вторника',
    'дательный': 'вторнику',
    'винительный': 'вторник',
    'творительный': 'вторником',
    'предложный': 'вторнике'
  },
  'среда': {
    'именительный': 'среда',
    'родительный': 'среды',
    'дательный': 'среде',
    'винительный': 'среду',
    'творительный': 'средой',
    'предложный': 'среде'
  },
  'четверг': {
    'именительный': 'четверг',
    'родительный': 'четверга',
    'дательный': 'четвергу',
    'винительный': 'четверг',
    'творительный': 'четвергом',
    'предложный': 'четверге'
  },
  'пятница': {
    'именительный': 'пятница',
    'родительный': 'пятницы',
    'дательный': 'пятнице',
    'винительный': 'пятницу',
    'творительный': 'пятницей',
    'предложный': 'пятнице'
  },
  'суббота': {
    'именительный': 'суббота',
    'родительный': 'субботы',
    'дательный': 'субботе',
    'винительный': 'субботу',
    'творительный': 'субботой',
    'предложный': 'субботе'
  },
  'воскресенье': {
    'именительный': 'воскресенье',
    'родительный': 'воскресенья',
    'дательный': 'воскресенью',
    'винительный': 'воскресенье',
    'творительный': 'воскресеньем',
    'предложный': 'воскресенье'
  }
};

const azDeclensions: AzDeclensionMap = {
  'понедельник': {
    'именительный': 'bazar ertəsi',
    'родительный': 'bazar ertəsinin',
    'дательный': 'bazar ertəsinə',
    'винительный': 'bazar ertəsini',
    'местный': 'bazar ertəsində',
    'исходный': 'bazar ertəsindən'
  },
  'вторник': {
    'именительный': 'çərşənbə axşamı',
    'родительный': 'çərşənbə axşamının',
    'дательный': 'çərşənbə axşamına',
    'винительный': 'çərşənbə axşamını',
    'местный': 'çərşənbə axşamında',
    'исходный': 'çərşənbə axşamından'
  },
  'среда': {
    'именительный': 'çərşənbə',
    'родительный': 'çərşənbənin',
    'дательный': 'çərşənbəyə',
    'винительный': 'çərşənbəni',
    'местный': 'çərşənbədə',
    'исходный': 'çərşənbədən'
  },
  'четверг': {
    'именительный': 'cümə axşamı',
    'родительный': 'cümə axşamının',
    'дательный': 'cümə axşamına',
    'винительный': 'cümə axşamını',
    'местный': 'cümə axşamında',
    'исходный': 'cümə axşamından'
  },
  'пятница': {
    'именительный': 'cümə',
    'родительный': 'cümənin',
    'дательный': 'cüməyə',
    'винительный': 'cüməni',
    'местный': 'cümədə',
    'исходный': 'cümədən'
  },
  'суббота': {
    'именительный': 'şənbə',
    'родительный': 'şənbənin',
    'дательный': 'şənbəyə',
    'винительный': 'şənbəni',
    'местный': 'şənbədə',
    'исходный': 'şənbədən'
  },
  'воскресенье': {
    'именительный': 'bazar',
    'родительный': 'bazarın',
    'дательный': 'bazara',
    'винительный': 'bazarı',
    'местный': 'bazarda',
    'исходный': 'bazardan'
  }
};

const azFullDeclensions: AzDeclensionMap = {
  'понедельник': {
    'именительный': 'bazar ertəsi',
    'родительный': 'bazar ertəsinin',
    'дательный': 'bazar ertəsinə',
    'винительный': 'bazar ertəsini',
    'местный': 'bazar ertəsində',
    'исходный': 'bazar ertəsindən'
  },
  'вторник': {
    'именительный': 'çərşənbə axşamı',
    'родительный': 'çərşənbə axşamının',
    'дательный': 'çərşənbə axşamına',
    'винительный': 'çərşənbə axşamını',
    'местный': 'çərşənbə axşamında',
    'исходный': 'çərşənbə axşamından'
  },
  'среда': {
    'именительный': 'çərşənbə günü',
    'родительный': 'çərşənbə gününün',
    'дательный': 'çərşənbə gününə',
    'винительный': 'çərşənbə gününü',
    'местный': 'çərşənbə günündə',
    'исходный': 'çərşənbə günündən'
  },
  'четверг': {
    'именительный': 'cümə axşamı',
    'родительный': 'cümə axşamının',
    'дательный': 'cümə axşamına',
    'винительный': 'cümə axşamını',
    'местный': 'cümə axşamında',
    'исходный': 'cümə axşamından'
  },
  'пятница': {
    'именительный': 'cümə günü',
    'родительный': 'cümə gününün',
    'дательный': 'cümə gününə',
    'винительный': 'cümə gününü',
    'местный': 'cümə günündə',
    'исходный': 'cümə günündən'
  },
  'суббота': {
    'именительный': 'şənbə günü',
    'родительный': 'şənbə gününün',
    'дательный': 'şənbə gününə',
    'винительный': 'şənbə gününü',
    'местный': 'şənbə günündə',
    'исходный': 'şənbə günündən'
  },
  'воскресенье': {
    'именительный': 'bazar günü',
    'родительный': 'bazar gününün',
    'дательный': 'bazar gününə',
    'винительный': 'bazar gününü',
    'местный': 'bazar günündə',
    'исходный': 'bazar günündən'
  }
};

/**
 * Decline Russian weekday
 */
export function declineRussian(weekDay: string, caseType: Case): string {
  const day = weekDay.toLowerCase() as WeekDay;
  return ruDeclensions[day]?.[caseType] || weekDay;
}

/**
 * Decline Azerbaijani weekday (short form)
 */
export function declineAzerbaijani(weekDay: string, caseType: AzCase): string {
  const day = weekDay.toLowerCase() as WeekDay;
  return azDeclensions[day]?.[caseType] || weekDay;
}

/**
 * Decline Azerbaijani weekday (full form with "günü")
 */
export function declineAzerbaijaniFull(weekDay: string, caseType: AzCase): string {
  const day = weekDay.toLowerCase() as WeekDay;
  return azFullDeclensions[day]?.[caseType] || weekDay;
}
