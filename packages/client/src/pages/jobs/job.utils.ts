import { DaysOfWeek, Months } from "./job.constants";
import type { Frequencies, ParsedCron } from "./job.types";

export function getHumanReadableCronExpression(cronExpression: string) {
	const cronValues = cronExpression.split(" ");
	if (cronValues.length < 6) {
		return "Invalid cron syntax";
	} else if (
		Number.isNaN(Number(cronValues[1])) ||
		Number.isNaN(Number(cronValues[2]))
	) {
		return cronExpression;
	}

	try {
		const hour = parseInt(cronValues[2], 10);
		const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
		const displayMinute = parseInt(cronValues[1], 10);
		const amPm = hour >= 12 ? "PM" : "AM";
		if (
			cronValues[3] === "*" &&
			cronValues[4] === "*" &&
			cronValues[5] === "*"
		) {
			// daily frequency
			return `Daily at ${displayHour}:${
				displayMinute < 10 ? `0${displayMinute}` : displayMinute
			} ${amPm}`;
		} else if (cronValues[3] === "*" && cronValues[4] === "*") {
			// weekly frequency
			const dayOfWeek = DaysOfWeek.find(
				(value) => value.value === parseInt(cronValues[5], 10),
			);
			return `Every ${dayOfWeek.day} at ${displayHour}:${
				displayMinute < 10 ? `0${displayMinute}` : displayMinute
			} ${amPm}`;
		} else if (cronValues[4] === "*" && cronValues[5] === "*") {
			// monthly frequency
			return `Every month on day ${cronValues[3]} at ${displayHour}:${
				displayMinute < 10 ? `0${displayMinute}` : displayMinute
			} ${amPm}`;
		} else if (cronValues[5] === "*") {
			const month = Months.find(
				(value) => value.value === parseInt(cronValues[4], 10),
			);
			return `Yearly on ${month.month} ${
				cronValues[3]
			} at ${displayHour}:${
				displayMinute < 10 ? `0${displayMinute}` : displayMinute
			} ${amPm}`;
		} else {
			return cronExpression;
		}
	} catch (_e) {
		return cronExpression;
	}
}

export function convertTimetoDate(time) {
	const today = new Date(),
		dd = String(today.getDate()).padStart(2, "0"),
		mm = String(today.getMonth() + 1).padStart(2, "0"),
		yyyy = today.getFullYear(),
		currentDate = `${yyyy}-${mm}-${dd}`,
		jobDate = time.split(" ")[0],
		jobTime = time.split(" ")[1].split(":"),
		jobHour = Number(jobTime[0]),
		jobMin = jobTime[1];

	let runDateString = "";

	if (jobDate === currentDate) {
		runDateString += "Today at ";
	} else {
		runDateString += `${jobDate} at `;
	}

	if (jobHour > 12)
		runDateString += `${(jobHour - 12).toString()}:${jobMin.toString()}pm`;
	else if (jobHour === 12) runDateString += `12:${jobMin}pm`;
	else if (jobHour === 0) runDateString += `12:${jobMin}am`;
	else runDateString += `${jobHour.toString()}:${jobMin}am`;

	return runDateString;
}

export function convertDeltaToRuntimeString(duration) {
	// padding for leading zeros
	function _pad(number: number) {
		let tempNumStr = `${number}`;

		for (let i = tempNumStr.length; i < 3; i++) {
			tempNumStr = `0${tempNumStr}`;
		}

		return tempNumStr;
	}
	let milliseconds = _pad(parseFloat(String((duration % 1000) / 100)) * 100);
	const seconds = Math.floor((duration / 1000) % 60);
	const minutes = Math.floor((duration / (1000 * 60)) % 60);
	const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

	const hoursStr = hours < 10 ? `0${hours}` : hours;
	const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
	const secondsStr = seconds < 10 ? `0${seconds}` : seconds;

	// always have milliseconds a let size
	while (milliseconds.length < 3) {
		milliseconds = `${milliseconds}0`;
	}
	milliseconds = milliseconds.substring(0, 3);
	return `${hoursStr}:${minutesStr}:${secondsStr}.${milliseconds}`;
}

const DEFAULT_PARSED: ParsedCron = {
	mode: "expression",
	minute: "0",
	hour: "12",
	dayOfMonth: "*",
	month: "*",
	dayOfWeek: "?",
};

const isInt = (val: string, min: number, max: number) => {
	if (!/^\d+$/.test(val)) return false;
	const n = parseInt(val, 10);
	return n >= min && n <= max;
};

const isWildcard = (val: string) => val === "*" || val === "?";

export function parseCron(cron: string): ParsedCron {
	if (!cron || typeof cron !== "string") {
		return { ...DEFAULT_PARSED };
	}
	const parts = cron.trim().split(/\s+/);
	if (parts.length < 6) {
		return { ...DEFAULT_PARSED };
	}
	const [, minute, hour, dayOfMonth, month, dayOfWeek] = parts;

	const validTime = isInt(minute, 0, 59) && isInt(hour, 0, 23);

	if (validTime) {
		let frequency: Frequencies | undefined;
		if (isWildcard(dayOfMonth) && month === "*" && isWildcard(dayOfWeek)) {
			frequency = "Daily";
		} else if (
			isWildcard(dayOfMonth) &&
			month === "*" &&
			isInt(dayOfWeek, 0, 6)
		) {
			frequency = "Weekly";
		} else if (
			isInt(dayOfMonth, 1, 31) &&
			month === "*" &&
			isWildcard(dayOfWeek)
		) {
			frequency = "Monthly";
		} else if (
			isInt(dayOfMonth, 1, 31) &&
			isInt(month, 1, 12) &&
			isWildcard(dayOfWeek)
		) {
			frequency = "Yearly";
		}

		if (frequency) {
			return {
				mode: "standard",
				frequency,
				minute,
				hour,
				dayOfMonth,
				month,
				dayOfWeek,
			};
		}
	}

	const dropdownEligible =
		isInt(minute, 0, 59) &&
		isInt(hour, 0, 23) &&
		(isWildcard(dayOfMonth) || isInt(dayOfMonth, 1, 31)) &&
		(month === "*" || isInt(month, 1, 12)) &&
		(isWildcard(dayOfWeek) || isInt(dayOfWeek, 0, 6));

	if (dropdownEligible) {
		return {
			mode: "dropdown",
			minute,
			hour,
			dayOfMonth,
			month,
			dayOfWeek,
		};
	}

	return {
		mode: "expression",
		minute,
		hour,
		dayOfMonth,
		month,
		dayOfWeek,
	};
}

export function buildCron(parts: {
	minute: string;
	hour: string;
	dayOfMonth: string;
	month: string;
	dayOfWeek: string;
}): string {
	return `0 ${parts.minute} ${parts.hour} ${parts.dayOfMonth} ${parts.month} ${parts.dayOfWeek}`;
}

export function buildStandardCron(
	frequency: Frequencies,
	hour: string,
	minute: string,
	options: {
		dayOfWeek?: string;
		dayOfMonth?: string;
		month?: string;
	} = {},
): string {
	switch (frequency) {
		case "Daily":
			return buildCron({
				minute,
				hour,
				dayOfMonth: "*",
				month: "*",
				dayOfWeek: "?",
			});
		case "Weekly":
			return buildCron({
				minute,
				hour,
				dayOfMonth: "?",
				month: "*",
				dayOfWeek: options.dayOfWeek ?? "0",
			});
		case "Monthly":
			return buildCron({
				minute,
				hour,
				dayOfMonth: options.dayOfMonth ?? "1",
				month: "*",
				dayOfWeek: "?",
			});
		case "Yearly":
			return buildCron({
				minute,
				hour,
				dayOfMonth: options.dayOfMonth ?? "1",
				month: options.month ?? "1",
				dayOfWeek: "?",
			});
	}
}
