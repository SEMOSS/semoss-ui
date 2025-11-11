import {
	DaysOfWeek,
	JobTypeCustomJob,
	JobTypeSendEmail,
	Months,
} from "./job.constants";
import type { JobBuilder, SendEmailJob } from "./job.types";

export function getHumanReadableCronExpression(cronExpression: string) {
	const cronValues = cronExpression.split(" ");
	if (cronValues.length < 6) {
		return "Invalid cron syntax";
	} else if (isNaN(Number(cronValues[1])) || isNaN(Number(cronValues[2]))) {
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
		currentDate = yyyy + "-" + mm + "-" + dd,
		jobDate = time.split(" ")[0],
		jobTime = time.split(" ")[1].split(":"),
		jobHour = Number(jobTime[0]),
		jobMin = jobTime[1];

	let runDateString = "";

	if (jobDate === currentDate) {
		runDateString += "Today at ";
	} else {
		runDateString += jobDate + " at ";
	}

	if (jobHour > 12)
		runDateString +=
			(jobHour - 12).toString() + ":" + jobMin.toString() + "pm";
	else if (jobHour === 12) runDateString += "12" + ":" + jobMin + "pm";
	else if (jobHour === 0) runDateString += "12" + ":" + jobMin + "am";
	else runDateString += jobHour.toString() + ":" + jobMin + "am";

	return runDateString;
}

export function convertDeltaToRuntimeString(duration) {
	// padding for leading zeros
	function _pad(number: number) {
		let tempNumStr = number + "";

		for (let i = tempNumStr.length; i < 3; i++) {
			tempNumStr = "0" + tempNumStr;
		}

		return tempNumStr;
	}
	let milliseconds = _pad(parseFloat(String((duration % 1000) / 100)) * 100);
	const seconds = Math.floor((duration / 1000) % 60);
	const minutes = Math.floor((duration / (1000 * 60)) % 60);
	const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

	const hoursStr = hours < 10 ? "0" + hours : hours;
	const minutesStr = minutes < 10 ? "0" + minutes : minutes;
	const secondsStr = seconds < 10 ? "0" + seconds : seconds;

	// always have milliseconds a let size
	while (milliseconds.length < 3) {
		milliseconds = milliseconds + "0";
	}
	milliseconds = milliseconds.substring(0, 3);
	return hoursStr + ":" + minutesStr + ":" + secondsStr + "." + milliseconds;
}

export function convertSendEmailRecipeToJob(recipe: string): SendEmailJob {
	if (!recipe.includes("SendEmail")) {
		return;
	}
	const recipeMatches: RegExpMatchArray = recipe.match(/(?<=\().*/g);
	if (recipeMatches.length === 0) {
		return;
	}
	let cleanedRecipe: string = recipeMatches[0];
	cleanedRecipe = cleanedRecipe.replaceAll(/[([\];)]/g, "");
	cleanedRecipe = cleanedRecipe.replaceAll(",,", ",");
	cleanedRecipe = cleanedRecipe.replaceAll("=", "':");
	cleanedRecipe = cleanedRecipe.replaceAll("', ", "', '");
	cleanedRecipe = cleanedRecipe.replaceAll("'", '"');
	cleanedRecipe = `{"${cleanedRecipe}}`;
	try {
		const job: SendEmailJob = JSON.parse(cleanedRecipe);
		return job;
	} catch (_e) {
		// skip a bad email job
		return;
	}
}

export function getEncodeByJobType(builder: JobBuilder) {
	switch (builder.jobType) {
		case JobTypeCustomJob:
			return builder.pixel;
		case JobTypeSendEmail:
			return `SendEmail(smtpHost=['${builder.smtpHost}'], smtpPort=['${builder.smtpPort}'], subject=['${builder.subject}'], to=['${builder.to}'], cc=['${builder.cc}'], bcc=['${builder.bcc}'], from=['${builder.from}'], message=['${builder.message}'], username=['${builder.username}'], password=['${builder.password}']);`;
	}
}
