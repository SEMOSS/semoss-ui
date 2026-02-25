import chalk from "chalk";

/**
 * Colorize JSON output for terminal display using chalk
 */
export function colorizeJson(jsonString: string): string {
	try {
		// Parse and pretty-print JSON
		const obj = JSON.parse(jsonString);
		const prettyJson = JSON.stringify(obj, null, 2);

		// Simple colorization with chalk
		return prettyJson
			.replace(/"([^"]+)":/g, (_match, key) => chalk.cyan(`"${key}":`)) // Keys in cyan
			.replace(/: "([^"]+)"/g, (_match, value) =>
				chalk.green(`: "${value}"`),
			) // String values in green
			.replace(/: (\d+)/g, (_match, num) => chalk.yellow(`: ${num}`)) // Numbers in yellow
			.replace(/: (true|false)/g, (_match, bool) =>
				chalk.magenta(`: ${bool}`),
			) // Booleans in magenta
			.replace(/: null/g, chalk.dim(": null")); // null in dim
	} catch {
		// Not valid JSON, return as-is
		return jsonString;
	}
}

/**
 * Check if a string is valid JSON
 */
export function isJson(str: string): boolean {
	try {
		JSON.parse(str);
		return true;
	} catch {
		return false;
	}
}
