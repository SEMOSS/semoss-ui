import { ERROR_MSGES, MonthAlias, WeekdaysAlias } from "./job.constants";
import type { CronValidation } from "./job.types";

const ZERO = 0;
const ONE = 1;
const MAX_MINUTES = 59;
const MAX_HOURS = 23;
const MAX_DAYS_OF_MONTH = 31;
const MAX_DAYS_OF_WEEK = 7;
const MAX_DAYS_OF_WEEK_OFFSET = 5;
const MAX_MONTH = 12;
// This comes from the fact that parseInt trims characters coming
// after digits and consider it a valid int, so `1*` becomes `1`.
const safeParseInt = (value: string): number => {
	if (/^\d+$/.test(value)) {
		return Number(value);
	} else {
		return NaN;
	}
};

const isWildcard = (value: string): boolean => {
	return value === "*";
};

const isQuestionMark = (value: string): boolean => {
	return value === "?";
};

const isLast = (value: string): boolean => {
	return value === "L" || value === "l";
};

const isLastWeekday = (value: string): boolean => {
	return /^lw$/i.test(value.trim());
};

const isInRange = (value: number, start: number, stop: number): boolean => {
	return value >= start && value <= stop;
};

// Matches strings like "L-2"
const isValidDayL = (value: string, maxDay: number) => {
	const match = /^L-(\d+)$/i.exec(value);
	if (!match) return false;
	const n = Number(match[1]);
	return n >= 1 && n <= maxDay;
};

// used to match Weekday with "1W"
const isWeekdayModifier = (value: string, maxDay: number): boolean => {
	const match = /^(\d{1,2})W$/i.exec(value);
	if (!match) return false;
	const day = Number(match[1]);
	return day >= 1 && day <= maxDay;
};

// Supports "5L" (last Friday), or just "L"
const isLastDayOfWeek = (value: string, maxDay: number): boolean => {
	if (value === "L") return true;
	const match = /^(\d)L$/i.exec(value);
	if (!match) return false;
	const day = Number(match[1]);
	return day >= 0 && day <= maxDay;
};

const isValidRange = (
	value: string,
	start: number,
	stop: number,
	isDayOfMonth: boolean,
	isDayOfWeek: boolean,
): boolean => {
	const sides = value.split("-");
	switch (sides.length) {
		case 1: {
			let valid = false;
			// Check if its an L or W
			if (isDayOfMonth) {
				valid = isLast(value);
			} else if (isDayOfWeek) {
				valid = isLastDayOfWeek(value, stop);
			}
			return (
				isWildcard(value) ||
				isInRange(safeParseInt(value), start, stop) ||
				valid
			);
		}
		case 2: {
			if (isDayOfMonth && isValidDayL(value, stop)) {
				return true;
			}
			const [small, big] = sides.map((side: string): number =>
				safeParseInt(side),
			);
			return (
				small <= big &&
				isInRange(small, start, stop) &&
				isInRange(big, start, stop)
			);
		}
		default:
			return false;
	}
};

// Makes sure after / is a number
const isValidStep = (value: string | undefined, stop: number): boolean => {
	if (value === undefined) return true;
	if (value.search(/[^\d]/) !== -1) return false;
	const step = safeParseInt(value);
	return step > 0 && step <= stop;
};

const validateForRange = (
	value: string,
	start: number,
	stop: number,
): boolean => {
	const isDayOfMonth = stop === MAX_DAYS_OF_MONTH;
	const isDayOfWeek = stop === MAX_DAYS_OF_WEEK;

	if (isDayOfMonth && value.search(/[^\d-,/*lLwW]/) !== -1) {
		return false;
	} else if (
		!(isDayOfMonth || isDayOfWeek) &&
		value.search(/[^\d-,/*]/) !== -1
	) {
		return false;
	}

	const list = value.split(",");
	return list.every((condition: string): boolean => {
		const splits = condition.split("/");
		// Prevents `*/ * * * *` from being accepted.
		if (condition.trim().endsWith("/")) {
			return false;
		}

		// Prevents `*/*/* * * * *` from being accepted
		if (splits.length > 2) {
			return false;
		}

		// L and W can't be used with other numbers
		if (isDayOfMonth && list.length > 1 && /[lw]/i.test(condition)) {
			return false;
		}

		// If we don't have a `/`, right will be undefined which is considered a valid step if we don't a `/`.
		const [left, right] = splits;
		return (
			isValidRange(left, start, stop, isDayOfMonth, isDayOfWeek) &&
			isValidStep(right, stop)
		);
	});
};

export const hasValidMinutes = (minutes: string): CronValidation => {
	const isError = !validateForRange(minutes, ZERO, MAX_MINUTES);
	return {
		error: isError,
		errorMessage: isError ? ERROR_MSGES.MINUTE_ERROR_MSG : null,
	};
};

export const hasValidHours = (hours: string): CronValidation => {
	const isError = !validateForRange(hours, ZERO, MAX_HOURS);
	return {
		error: isError,
		errorMessage: isError ? ERROR_MSGES.HOUR_ERROR_MSG : null,
	};
};

export const hasValidDays = (days: string): CronValidation => {
	if (
		isQuestionMark(days) ||
		isLast(days) ||
		isLastWeekday(days) ||
		isWeekdayModifier(days, MAX_DAYS_OF_MONTH)
	) {
		return {
			error: false,
			errorMessage: null,
		};
	}

	const isError = !validateForRange(days, ONE, MAX_DAYS_OF_MONTH);
	return {
		error: isError,
		errorMessage: isError ? ERROR_MSGES.DAY_OF_MONTH_ERROR_MSG : null,
	};
};

export const hasValidMonths = (months: string): CronValidation => {
	// Prevents alias to be used as steps
	if (months.search(/\/[a-zA-Z]/) !== -1) {
		return {
			error: true,
			errorMessage: ERROR_MSGES.MONTH_ERROR_MSG,
		};
	}

	const remappedMonths = months
		.toLowerCase()
		.replace(/[a-z]{3}/g, (match: string): string => {
			return MonthAlias[match] === undefined ? match : MonthAlias[match];
		});
	// If any invalid alias was used, it won't pass the other checks as there will be non-numeric values in the months
	const isError = !validateForRange(remappedMonths, ONE, MAX_MONTH);

	return {
		error: isError,
		errorMessage: isError ? ERROR_MSGES.MONTH_ERROR_MSG : null,
	};
};

export const hasValidWeekdays = (weekdays: string): CronValidation => {
	if (isQuestionMark(weekdays)) {
		return {
			error: false,
			errorMessage: null,
		};
	}

	// Prevents alias to be used as steps
	if (weekdays.search(/\/[a-zA-Z]/) !== -1) {
		return {
			error: true,
			errorMessage: ERROR_MSGES.DAY_OF_WEEK_ERROR_MSG,
		};
	}

	const remappedWeekdays = weekdays
		.toLowerCase()
		.replace(/[a-z]{3}/g, (match: string): string => {
			return WeekdaysAlias[match] === undefined
				? match
				: WeekdaysAlias[match];
		});

	const splitByHash = remappedWeekdays.split("#");
	if (splitByHash.length >= 2) {
		const [weekday, occurrence, ...leftOvers] = splitByHash;
		if (leftOvers.length !== 0) {
			return {
				error: true,
				errorMessage: ERROR_MSGES.DAY_OF_WEEK_OCCURENCE_ERROR_MSG,
			};
		}

		const isOccurenceError = !isInRange(
			safeParseInt(occurrence),
			ONE,
			MAX_DAYS_OF_WEEK_OFFSET,
		);
		const isWeekDayError = !isInRange(
			safeParseInt(weekday),
			ZERO,
			MAX_DAYS_OF_WEEK,
		);

		return {
			error: isOccurenceError || isWeekDayError,
			errorMessage: isOccurenceError
				? ERROR_MSGES.DAY_OF_WEEK_OCCURENCE_ERROR_MSG
				: isWeekDayError
					? ERROR_MSGES.DAY_OF_WEEK_WEEKDAY_ERROR_MSG
					: null,
		};
	}

	const isError = !validateForRange(remappedWeekdays, ONE, MAX_DAYS_OF_WEEK);
	return {
		error: isError,
		errorMessage: isError ? ERROR_MSGES.DAY_OF_WEEK_ERROR_MSG : null,
	};
};
