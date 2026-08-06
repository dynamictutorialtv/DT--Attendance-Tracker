import { Student } from '../types';

/**
 * Returns a numerical rank for sorting classes from Junior to Senior.
 * Junior classes (e.g. 3rd, 4th, 5th) return smaller numbers (3, 4, 5).
 * Passed out or alumni return 999.
 */
export function getClassLevelNumber(gradeClass: string): number {
  if (!gradeClass) return 99;
  const lc = gradeClass.toLowerCase().trim();

  if (lc.includes('pre-nursery') || lc.includes('prenursery')) return -4;
  if (lc.includes('nursery')) return -3;
  if (lc.includes('lkg')) return -2;
  if (lc.includes('ukg')) return -1;
  if (lc.includes('passed out') || lc.includes('alumni')) return 999;

  // Extract digits e.g. "6th", "Class 10th", "12th"
  const match = lc.match(/(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }

  return 99;
}

/**
 * Sorts students list:
 * - When selectedGrade === 'all': Order by class level ascending (Junior classes first),
 *   and alphabetically by student name within the same class.
 * - When selectedGrade !== 'all': Order strictly alphabetically by student name.
 */
export function sortStudents(students: Student[], selectedGrade: string = 'all'): Student[] {
  return [...students].sort((a, b) => {
    if (selectedGrade !== 'all') {
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    }

    const levelA = getClassLevelNumber(a.gradeClass);
    const levelB = getClassLevelNumber(b.gradeClass);

    if (levelA !== levelB) {
      return levelA - levelB;
    }

    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
}

/**
 * Promotes a class string to the next academic level (e.g. 1st April upgrade).
 * e.g., "6th" -> "7th", "Class 10th" -> "Class 11th", "12th" -> "Passed Out (Alumni)"
 */
export function promoteGradeString(gradeClass: string): string {
  if (!gradeClass) return 'Class 1st';
  const raw = gradeClass.trim();
  const lc = raw.toLowerCase();

  if (lc.includes('pre-nursery') || lc.includes('prenursery')) return 'Nursery';
  if (lc.includes('nursery')) return 'LKG';
  if (lc.includes('lkg')) return 'UKG';
  if (lc.includes('ukg')) return 'Class 1st';

  const match = raw.match(/(\d+)/);
  if (match) {
    const currentNum = parseInt(match[1], 10);
    if (currentNum >= 12) {
      return 'Passed Out (Alumni)';
    }

    const nextNum = currentNum + 1;
    // Format suffix (1st, 2nd, 3rd, 4th...)
    let suffix = 'th';
    if (nextNum === 1) suffix = 'st';
    else if (nextNum === 2) suffix = 'nd';
    else if (nextNum === 3) suffix = 'rd';

    return raw.replace(match[0], `${nextNum}${suffix}`);
  }

  return raw;
}
