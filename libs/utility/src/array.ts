/**
 * Whether two arrays hold the same items in the same order, each compared
 * with `===`.
 *
 * @param a - One array.
 * @param b - The other array.
 * @return True when they match item for item.
 */
export const isSameArray = <T>(a: readonly T[], b: readonly T[]): boolean =>
	a.length === b.length && a.every((item, index) => item === b[index]);
