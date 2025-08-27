/**
 * Checks if a given string is a valid Python variable name.
 *
 * Python variable name rules:
 * 1. Must start with a letter (a-z, A-Z) or an underscore (_).
 * 2. The rest of the characters can be letters, numbers (0-9), or underscores.
 * 3. It is case-sensitive.
 * 4. Cannot be a Python reserved keyword.
 *
 * @param {string} variableName The string to validate.
 * @returns {boolean} True if the string is a valid Python variable name, false otherwise.
 */
export const isValidPythonVariableName = (variableName) => {
	// A comprehensive list of Python's reserved keywords.
	const pythonKeywords = [
		"False",
		"None",
		"True",
		"and",
		"as",
		"assert",
		"async",
		"await",
		"break",
		"class",
		"continue",
		"def",
		"del",
		"elif",
		"else",
		"except",
		"finally",
		"for",
		"from",
		"global",
		"if",
		"import",
		"in",
		"is",
		"lambda",
		"nonlocal",
		"not",
		"or",
		"pass",
		"raise",
		"return",
		"try",
		"while",
		"with",
		"yield",
	];

	// Rule 1 & 2: Check for valid characters and structure using a regular expression.
	// The regex ^[a-zA-Z_]\w*$ ensures the string starts with a letter or underscore,
	// and all subsequent characters are alphanumeric or underscores.
	if (!/^[a-zA-Z_]\w*$/.test(variableName)) {
		console.log(
			`'${variableName}' is invalid: does not match the required character pattern.`,
		);
		return false;
	}

	// Rule 4: Check if the string is a reserved Python keyword.
	if (pythonKeywords.includes(variableName)) {
		console.log(
			`'${variableName}' is invalid: is a reserved Python keyword.`,
		);
		return false;
	}

	// If all checks pass, the variable name is valid.
	console.log(`'${variableName}' is a valid Python variable name.`);
	return true;
};

/**
 * Generates a valid Python variable name from a given string by replacing invalid characters
 * and ensuring it doesn't conflict with reserved keywords.
 *
 * @param {string} inputString The string to convert into a valid Python variable name.
 * @returns {string} The new valid Python variable name.
 */
export const createValidPythonVariableName = (
	inputString,
	existingVariables = [],
) => {
	const pythonKeywords = [
		"False",
		"None",
		"True",
		"and",
		"as",
		"assert",
		"async",
		"await",
		"break",
		"class",
		"continue",
		"def",
		"del",
		"elif",
		"else",
		"except",
		"finally",
		"for",
		"from",
		"global",
		"if",
		"import",
		"in",
		"is",
		"lambda",
		"nonlocal",
		"not",
		"or",
		"pass",
		"raise",
		"return",
		"try",
		"while",
		"with",
		"yield",
	];

	console.log(inputString);

	// Replace any character that is not a letter, number, or underscore with an underscore.
	let cleanedString = inputString.replace(/[^a-zA-Z0-9_]/g, "_");

	console.log(cleanedString);
	// If the first character is a number, prefix it with an underscore.
	if (/^[0-9]/.test(cleanedString)) {
		cleanedString = "_" + cleanedString;
	}

	// If the cleaned string is a reserved keyword, append an underscore to it.
	if (pythonKeywords.includes(cleanedString)) {
		cleanedString += "_";
	}

	// Return a non-empty string, default to "variable" if the input resulted in an empty string.
	cleanedString = cleanedString || "variable";

	// Check for uniqueness and append a numerical suffix if needed.
	let name = cleanedString;
	let counter = 1;
	while (existingVariables.includes(name)) {
		name = `${cleanedString}_${counter}`;
		counter++;
	}

	return name;
};
