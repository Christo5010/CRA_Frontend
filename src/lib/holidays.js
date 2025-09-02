
import { eachDayOfInterval, getYear, addDays, subDays } from 'date-fns';

const getEaster = (year) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
};

export const getHolidays = (year) => {
  const easterDate = getEaster(year);
  return [
    { date: new Date(year, 0, 1), name: "Jour de l'an" },
    { date: addDays(easterDate, 1), name: 'Lundi de Pâques' },
    { date: new Date(year, 4, 1), name: 'Fête du Travail' },
    { date: new Date(year, 4, 8), name: 'Victoire 1945' },
    { date: addDays(easterDate, 39), name: 'Ascension' },
    { date: addDays(easterDate, 50), name: 'Lundi de Pentecôte' },
    { date: new Date(year, 6, 14), name: 'Fête Nationale' },
    { date: new Date(year, 7, 15), name: 'Assomption' },
    { date: new Date(year, 10, 1), name: 'Toussaint' },
    { date: new Date(year, 10, 11), name: 'Armistice' },
    { date: new Date(year, 11, 25), name: 'Noël' },
  ];
};
