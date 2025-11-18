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

// If the caller passes a full cron expression (multiple space-separated fields),
// extract the single field at `index` (0-based, seconds=0, minutes=1...).
const extractFieldFromExpression = (value: string, index: number): string => {
	const parts = value.split(" ").filter((p) => p !== "");
	if (parts.length === 0) return value;
	while (parts.length < 7) parts.push("*");
	return parts[index] ?? "*";
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

// Extended per-field regexes for seconds..year (0..6)
const FIELD_REGEXES: RegExp[] = [
	/^([*]|(?:\*|(?:[0-9]|(?:[1-5][0-9])))\/(?:[0-9]|(?:[1-5][0-9]))|(?:[0-9]|(?:[1-5][0-9]))(?:(?:-[0-9]|-(?:[1-5][0-9]))?|(?:,(?:[0-9]|(?:[1-5][0-9])))*))$/,
	/^([*]|(?:\*|(?:[0-9]|(?:[1-5][0-9])))\/(?:[0-9]|(?:[1-5][0-9]))|(?:[0-9]|(?:[1-5][0-9]))(?:(?:-[0-9]|-(?:[1-5][0-9]))?|(?:,(?:[0-9]|(?:[1-5][0-9])))*))$/,
	/^([*]|(?:\*|(?:\*|(?:[0-9]|1[0-9]|2[0-3])))\/(?:[0-9]|1[0-9]|2[0-3])|(?:[0-9]|1[0-9]|2[0-3])(?:(?:-(?:[0-9]|1[0-9]|2[0-3]))?|(?:,(?:[0-9]|1[0-9]|2[0-3]))*))$/,
	/^([*]|\?|L(?:W|-(?:[1-9]|(?:[12][0-9])|3[01]))?|(?:[1-9]|(?:[12][0-9])|3[01])(?:W|\/(?:[1-9]|(?:[12][0-9])|3[01]))?|(?:[1-9]|(?:[12][0-9])|3[01])(?:(?:-(?:[1-9]|(?:[12][0-9])|3[01]))?|(?:,(?:[1-9]|(?:[12][0-9])|3[01]))*))$/i,
	/^([*]|(?:[1-9]|1[012]|JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(?:(?:-(?:[1-9]|1[012]|JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC))?|(?:,(?:[1-9]|1[012]|JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC))*))$/i,
	/^([*]|\?|[0-6](?:L|#[1-5])?|(?:[0-6]|SUN|MON|TUE|WED|THU|FRI|SAT)(?:(?:-(?:[0-6]|SUN|MON|TUE|WED|THU|FRI|SAT))?|(?:,(?:[0-6]|SUN|MON|TUE|WED|THU|FRI|SAT))*))$/i,
	/^([*]|(?:[1-9][0-9]{3})(?:(?:-[1-9][0-9]{3})?|(?:,[1-9][0-9]{3})*))$/,
];

const isFieldPatternValid = (value: string, index: number): boolean => {
	if (!value || typeof value !== "string") return false;
	const v = value.trim();
	// if value contains commas/lists or slashes we still test the whole token against the pattern
	const re = FIELD_REGEXES[index];
	try {
		return re.test(v);
	} catch (_e) {
		return false;
	}
};

export const hasValidMinutes = (minutes: string): CronValidation => {
	const field = minutes.includes(" ")
		? extractFieldFromExpression(minutes, 1)
		: minutes;

	// pattern check
	if (!isFieldPatternValid(field, 1)) {
		return { error: true, errorMessage: ERROR_MSGES.MINUTE_ERROR_MSG };
	}

	const isError = !validateForRange(field, ZERO, MAX_MINUTES);
	return {
		error: isError,
		errorMessage: isError ? ERROR_MSGES.MINUTE_ERROR_MSG : null,
	};
};

export const hasValidHours = (hours: string): CronValidation => {
	const field = hours.includes(" ")
		? extractFieldFromExpression(hours, 2)
		: hours;

	if (!isFieldPatternValid(field, 2)) {
		return { error: true, errorMessage: ERROR_MSGES.HOUR_ERROR_MSG };
	}

	const isError = !validateForRange(field, ZERO, MAX_HOURS);
	return {
		error: isError,
		errorMessage: isError ? ERROR_MSGES.HOUR_ERROR_MSG : null,
	};
};

export const hasValidDays = (days: string): CronValidation => {
	const field = days.includes(" ")
		? extractFieldFromExpression(days, 3)
		: days;

	if (!isFieldPatternValid(field, 3)) {
		return {
			error: true,
			errorMessage: ERROR_MSGES.DAY_OF_MONTH_ERROR_MSG,
		};
	}

	if (
		isQuestionMark(field) ||
		isLast(field) ||
		isLastWeekday(field) ||
		isWeekdayModifier(field, MAX_DAYS_OF_MONTH)
	) {
		return {
			error: false,
			errorMessage: null,
		};
	}

	const isError = !validateForRange(field, ONE, MAX_DAYS_OF_MONTH);
	return {
		error: isError,
		errorMessage: isError ? ERROR_MSGES.DAY_OF_MONTH_ERROR_MSG : null,
	};
};

export const hasValidMonths = (months: string): CronValidation => {
	const field = months.includes(" ")
		? extractFieldFromExpression(months, 4)
		: months;

	if (!isFieldPatternValid(field, 4)) {
		return { error: true, errorMessage: ERROR_MSGES.MONTH_ERROR_MSG };
	}

	// Prevents alias to be used as steps
	if (field.search(/\/[a-zA-Z]/) !== -1) {
		return {
			error: true,
			errorMessage: ERROR_MSGES.MONTH_ERROR_MSG,
		};
	}

	const remappedMonths = field
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
	const field = weekdays.includes(" ")
		? extractFieldFromExpression(weekdays, 5)
		: weekdays;

	if (!isFieldPatternValid(field, 5)) {
		return { error: true, errorMessage: ERROR_MSGES.DAY_OF_WEEK_ERROR_MSG };
	}

	if (isQuestionMark(field)) {
		return {
			error: false,
			errorMessage: null,
		};
	}

	// Prevents alias to be used as steps
	if (field.search(/\/[a-zA-Z]/) !== -1) {
		return {
			error: true,
			errorMessage: ERROR_MSGES.DAY_OF_WEEK_ERROR_MSG,
		};
	}

	const remappedWeekdays = field
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
