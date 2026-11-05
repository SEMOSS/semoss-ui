/** A FEEL expression translated to Python, and the variables it reads. */
export interface FeelTranslation {
	python: string;
	/** Top-level variable names the expression reads from the scope. */
	variables: string[];
	/** Whether `python` calls {@link NUMBER_HELPER_SOURCE}'s `_num`. */
	usesNumberHelper: boolean;
}

/**
 * Python helper that `_num(...)` calls refer to. Run inputs arrive as text,
 * while FEEL compares and calculates on numbers, so a numeric string used as a
 * number is converted first.
 */
export const NUMBER_HELPER_SOURCE = [
	"def _num(value):",
	"    if isinstance(value, str):",
	"        try:",
	"            return int(value)",
	"        except ValueError:",
	"            try:",
	"                return float(value)",
	"            except ValueError:",
	"                return value",
	"    return value",
	"",
].join("\n");

const NUMERIC_OPERATORS = new Set([">=", "<=", ">", "<", "-", "*", "/"]);

type Token =
	| { kind: "string"; value: string }
	| { kind: "number"; value: string }
	| { kind: "name"; value: string }
	| { kind: "op"; value: string };

const KEYWORDS = new Set(["if", "then", "else", "and", "or", "not"]);
const LITERALS: Record<string, string> = {
	true: "True",
	false: "False",
	null: "None",
};
/** FEEL built-ins with a direct Python equivalent. */
const FUNCTIONS: Record<string, string> = { string: "str" };
const TOKEN_PATTERN =
	/\s*(?:("(?:[^"\\]|\\.)*")|(\d+(?:\.\d+)?)|([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)|(>=|<=|!=|[=<>+\-*/(),]))/y;

function tokenize(source: string): Token[] | null {
	const tokens: Token[] = [];
	TOKEN_PATTERN.lastIndex = 0;
	while (TOKEN_PATTERN.lastIndex < source.length) {
		if (/^\s*$/.test(source.slice(TOKEN_PATTERN.lastIndex))) break;
		const match = TOKEN_PATTERN.exec(source);
		if (!match) return null;
		if (match[1] !== undefined) {
			tokens.push({ kind: "string", value: match[1] });
		} else if (match[2] !== undefined) {
			tokens.push({ kind: "number", value: match[2] });
		} else if (match[3] !== undefined) {
			tokens.push({ kind: "name", value: match[3] });
		} else {
			tokens.push({ kind: "op", value: match[4] });
		}
	}
	return tokens;
}

function isOp(token: Token | undefined, value: string): boolean {
	return token?.kind === "op" && token.value === value;
}

function isWord(token: Token | undefined, value: string): boolean {
	return token?.kind === "name" && token.value === value;
}

/** Index of the parenthesis closing the one opened at `open`, or -1. */
function matchingParen(tokens: Token[], open: number): number {
	let depth = 0;
	for (let index = open; index < tokens.length; index++) {
		if (isOp(tokens[index], "(")) depth++;
		if (isOp(tokens[index], ")") && --depth === 0) return index;
	}
	return -1;
}

/**
 * Whether the variable at `index` is used as a number: next to a numeric
 * operator, or next to `+`, `=` or `!=` with a number on the other side.
 */
function isNumericOperand(tokens: Token[], index: number): boolean {
	const around = [
		{ operator: tokens[index - 1], other: tokens[index - 2] },
		{ operator: tokens[index + 1], other: tokens[index + 2] },
	];
	return around.some(({ operator, other }) => {
		if (operator?.kind !== "op") return false;
		if (NUMERIC_OPERATORS.has(operator.value)) return true;
		return (
			["+", "=", "!="].includes(operator.value) &&
			other?.kind === "number"
		);
	});
}

function translateTokens(
	tokens: Token[],
	variables: Set<string>,
	usage: { numbers: boolean },
): string | null {
	if (tokens.length === 0) return null;

	if (isWord(tokens[0], "if")) {
		let thenIndex = -1;
		let elseIndex = -1;
		let nested = 0;
		for (let index = 1; index < tokens.length; index++) {
			if (isOp(tokens[index], "(")) {
				const close = matchingParen(tokens, index);
				if (close < 0) return null;
				index = close;
			} else if (isWord(tokens[index], "if")) {
				nested++;
			} else if (isWord(tokens[index], "then") && thenIndex < 0) {
				thenIndex = index;
			} else if (isWord(tokens[index], "else")) {
				if (nested === 0) {
					elseIndex = index;
					break;
				}
				nested--;
			}
		}
		if (thenIndex < 0 || elseIndex < 0) return null;
		const condition = translateTokens(
			tokens.slice(1, thenIndex),
			variables,
			usage,
		);
		const whenTrue = translateTokens(
			tokens.slice(thenIndex + 1, elseIndex),
			variables,
			usage,
		);
		const whenFalse = translateTokens(
			tokens.slice(elseIndex + 1),
			variables,
			usage,
		);
		if (condition === null || whenTrue === null || whenFalse === null) {
			return null;
		}
		return `(${whenTrue}) if (${condition}) else (${whenFalse})`;
	}

	const parts: string[] = [];
	// Two operands in a row ("for i in list") means FEEL we do not understand.
	let afterOperand = false;
	const operand = (python: string): boolean => {
		if (afterOperand) return false;
		afterOperand = true;
		parts.push(python);
		return true;
	};
	const operator = (python: string) => {
		afterOperand = false;
		parts.push(python);
	};
	for (let index = 0; index < tokens.length; index++) {
		const token = tokens[index];
		if (token.kind === "string") {
			let literal: string;
			try {
				literal = JSON.stringify(JSON.parse(token.value));
			} catch {
				return null;
			}
			if (!operand(literal)) return null;
		} else if (token.kind === "number") {
			if (!operand(token.value)) return null;
		} else if (token.kind === "name") {
			if (token.value in LITERALS) {
				if (!operand(LITERALS[token.value])) return null;
			} else if (token.value === "and" || token.value === "or") {
				operator(token.value);
			} else if (token.value === "not") {
				operator("not");
			} else if (KEYWORDS.has(token.value)) {
				return null;
			} else if (isOp(tokens[index + 1], "(")) {
				const python = FUNCTIONS[token.value];
				const close = matchingParen(tokens, index + 1);
				if (!python || close < 0) return null;
				const inner = tokens.slice(index + 2, close);
				if (inner.some((item) => isOp(item, ","))) return null;
				const argument = translateTokens(inner, variables, usage);
				if (argument === null) return null;
				if (!operand(`${python}(${argument})`)) return null;
				index = close;
			} else {
				const [root, ...path] = token.value.split(".");
				variables.add(root);
				const reference = `scope[${JSON.stringify(root)}]${path
					.map((part) => `[${JSON.stringify(part)}]`)
					.join("")}`;
				const numeric = isNumericOperand(tokens, index);
				if (numeric) usage.numbers = true;
				if (!operand(numeric ? `_num(${reference})` : reference)) {
					return null;
				}
			}
		} else if (token.value === "(") {
			const close = matchingParen(tokens, index);
			if (close < 0) return null;
			const inner = translateTokens(
				tokens.slice(index + 1, close),
				variables,
				usage,
			);
			if (inner === null) return null;
			if (!operand(`(${inner})`)) return null;
			index = close;
		} else if (token.value === "=") {
			operator("==");
		} else if (token.value === "," || token.value === ")") {
			return null;
		} else {
			operator(token.value);
		}
	}
	return parts.join(" ");
}

/**
 * Translates a FEEL expression to a Python expression over `scope`.
 *
 * Covers what simple Camunda scripts use: literals, variable and field
 * references, arithmetic and comparisons, `and` / `or` / `not`,
 * `if … then … else …`, and `string()`. Anything else returns null so the
 * caller can keep the original expression for a person to translate.
 */
export function translateFeel(expression: string): FeelTranslation | null {
	const tokens = tokenize(expression.trim().replace(/^=/, ""));
	if (!tokens) return null;
	const variables = new Set<string>();
	const usage = { numbers: false };
	const python = translateTokens(tokens, variables, usage);
	return python === null
		? null
		: {
				python,
				variables: [...variables],
				usesNumberHelper: usage.numbers,
			};
}

/**
 * Parses an ISO 8601 duration such as `PT10S` or `P1DT2H` to whole seconds,
 * or undefined when it isn't a plain duration (months and years vary).
 */
export function isoDurationToSeconds(value: string): number | undefined {
	const match = value
		.trim()
		.match(
			/^P(?:(\d+(?:\.\d+)?)W)?(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/,
		);
	if (!match || match[0] === "P" || match[0].endsWith("T")) return undefined;
	const [, weeks, days, hours, minutes, seconds] = match.map(Number);
	const total =
		(weeks || 0) * 604800 +
		(days || 0) * 86400 +
		(hours || 0) * 3600 +
		(minutes || 0) * 60 +
		(seconds || 0);
	return Math.round(total);
}
