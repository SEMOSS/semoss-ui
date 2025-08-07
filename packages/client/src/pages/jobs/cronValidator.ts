interface CronValidationResult {
	isValid: boolean;
	errors: string[];
}

interface CronValidator {
	validate(cronExpression: string): CronValidationResult;
}

class CronExpressionValidator implements CronValidator {
	// Regex patterns for cron fields: https://www.codeproject.com/Tips/5299523/Regex-for-Cron-Expressions
	private readonly CRON_PATTERNS: RegExp[] = [
		/^(\*|(?:\*|(?:[0-9]|(?:[1-5][0-9])))\/(?:[0-9]|(?:[1-5][0-9]))|(?:[0-9]|(?:[1-5][0-9]))(?:(?:\-[0-9]|\-(?:[1-5][0-9]))?|(?:\,(?:[0-9]|(?:[1-5][0-9])))*))$/, // Seconds: 0-59
		/^(\*|(?:\*|(?:[0-9]|(?:[1-5][0-9])))\/(?:[0-9]|(?:[1-5][0-9]))|(?:[0-9]|(?:[1-5][0-9]))(?:(?:\-[0-9]|\-(?:[1-5][0-9]))?|(?:\,(?:[0-9]|(?:[1-5][0-9])))*))$/, // Minutes: 0-59
		/^(\*|(?:\*|(?:\*|(?:[0-9]|1[0-9]|2[0-3])))\/(?:[0-9]|1[0-9]|2[0-3])|(?:[0-9]|1[0-9]|2[0-3])(?:(?:\-(?:[0-9]|1[0-9]|2[0-3]))?|(?:\,(?:[0-9]|1[0-9]|2[0-3]))*))$/, // Hours: 0-23
		/^(\*|\?|L(?:W|\-(?:[1-9]|(?:[12][0-9])|3[01]))?|(?:[1-9]|(?:[12][0-9])|3[01])(?:W|\/(?:[1-9]|(?:[12][0-9])|3[01]))?|(?:[1-9]|(?:[12][0-9])|3[01])(?:(?:\-(?:[1-9]|(?:[12][0-9])|3[01]))?|(?:\,(?:[1-9]|(?:[12][0-9])|3[01]))*))$/, // Day of Month: 1-31, ?
		/^(\*|(?:[1-9]|1[012]|JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(?:(?:\-(?:[1-9]|1[012]|JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC))?|(?:\,(?:[1-9]|1[012]|JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC))*))$/, // Month: 1-12
		/^(\*|\?|[0-6](?:L|\#[1-5])?|(?:[0-6]|SUN|MON|TUE|WED|THU|FRI|SAT)(?:(?:\-(?:[0-6]|SUN|MON|TUE|WED|THU|FRI|SAT))?|(?:\,(?:[0-6]|SUN|MON|TUE|WED|THU|FRI|SAT))*))$/, // Day of Week: 0-6, ?
		/^(\*|(?:[1-9][0-9]{3})(?:(?:\-[1-9][0-9]{3})?|(?:\,[1-9][0-9]{3})*))$/, // Year: 1000-9999
	];

	private readonly FIELD_NAMES = [
		"Seconds",
		"Minutes",
		"Hours",
		"Day of Month",
		"Month",
		"Day of Week",
		"Year",
	];

	private getCronFields(cronExpression: string): string[] {
		const fields = cronExpression.split(" ");
		while (fields.length < 7) fields.push("*");
		return fields.slice(0, 7);
	}

	validate(cronExpression: string): CronValidationResult {
		const errors: string[] = [];

		if (!cronExpression || cronExpression.trim() === "") {
			return {
				isValid: false,
				errors: ["Cron expression cannot be empty"],
			};
		}

		const cronFields = this.getCronFields(cronExpression.trim());

		if (cronFields.length !== 7) {
			return {
				isValid: false,
				errors: [
					`Cron expression must have exactly 7 fields, found ${cronFields.length}`,
				],
			};
		}

		for (let i = 0; i < 7; i++) {
			if (!this.CRON_PATTERNS[i].test(cronFields[i])) {
				errors.push(
					`Invalid ${this.FIELD_NAMES[i]} field: ${cronFields[i] ? cronFields[i] : `missing`}`,
				);
			}
		}

		// Logical validation: Day of Month and Day of Week mutual exclusivity
		const dayOfMonth = cronFields[3]; // index 3
		const dayOfWeek = cronFields[5]; // index 5

		// Both fields cannot have specific values at the same time
		// One must be ?, *, or the other must be ? or *
		if (dayOfMonth !== "?" && dayOfWeek !== "?") {
			errors.push(
				"Cannot specify both Day of Month and Day of Week. Use '?' in one of them when the other is specified.",
			);
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}
}

// Create a singleton instance
const cronValidator = new CronExpressionValidator();

// Export everything
export type { CronValidator, CronValidationResult };
export { CronExpressionValidator, cronValidator };
