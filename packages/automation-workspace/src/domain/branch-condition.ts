/**
 * Parses and generates the simple "Value 1 + Operator + Value 2" business-mode representation
 * of a branch/`control.if` step's persisted condition expression (`BranchConfig.condition`).
 *
 * The persisted condition is evaluated by the backend's Java condition evaluator. This module
 * only recognizes a narrow, well-defined subset of that expression syntax — a single comparison between two
 * operands, each either a `${varName}` reference, a quoted string literal, or a number. Any
 * condition outside that subset (multiple comparisons, boolean combinators, unsupported
 * operators, etc.) fails to parse so the caller can fall back to the raw Python editor instead
 * of silently rewriting something it can't faithfully represent.
 */

export type BranchConditionOperator =
	| "equals"
	| "notEquals"
	| "greaterThan"
	| "greaterThanOrEqual"
	| "lessThan"
	| "lessThanOrEqual";

export interface BranchConditionOperatorOption {
	value: BranchConditionOperator;
	label: string;
}

/** Business-friendly labels for every supported operator, in the order shown in the picker. */
export const BRANCH_CONDITION_OPERATORS: BranchConditionOperatorOption[] = [
	{ value: "equals", label: "equals" },
	{ value: "notEquals", label: "does not equal" },
	{ value: "greaterThan", label: "is greater than" },
	{ value: "greaterThanOrEqual", label: "is greater than or equal to" },
	{ value: "lessThan", label: "is less than" },
	{ value: "lessThanOrEqual", label: "is less than or equal to" },
];

export interface ParsedBranchCondition {
	value1: string;
	operator: BranchConditionOperator;
	value2: string;
}

const VAR_TOKEN = String.raw`\$\{[^}]+\}`;
const STRING_TOKEN = String.raw`"(?:[^"\\]|\\.)*"`;
const NUMBER_TOKEN = String.raw`-?\d+(?:\.\d+)?`;
/** A single recognized operand: a variable reference, a quoted string, or a number. */
const OPERAND = `(?:${VAR_TOKEN}|${STRING_TOKEN}|${NUMBER_TOKEN})`;

const OPERATOR_PATTERNS: Array<{
	operator: BranchConditionOperator;
	// Capture group order in `pattern` — [1] and [2] map to the resulting value1/value2.
	pattern: RegExp;
	valueOrder: [1, 2];
}> = [
	{
		operator: "equals",
		pattern: new RegExp(`^(${OPERAND})\\s*==\\s*(${OPERAND})$`),
		valueOrder: [1, 2],
	},
	{
		operator: "notEquals",
		pattern: new RegExp(`^(${OPERAND})\\s*!=\\s*(${OPERAND})$`),
		valueOrder: [1, 2],
	},
	{
		operator: "greaterThan",
		pattern: new RegExp(`^(${OPERAND})\\s*>\\s*(${OPERAND})$`),
		valueOrder: [1, 2],
	},
	{
		operator: "greaterThanOrEqual",
		pattern: new RegExp(`^(${OPERAND})\\s*>=\\s*(${OPERAND})$`),
		valueOrder: [1, 2],
	},
	{
		operator: "lessThan",
		pattern: new RegExp(`^(${OPERAND})\\s*<\\s*(${OPERAND})$`),
		valueOrder: [1, 2],
	},
	{
		operator: "lessThanOrEqual",
		pattern: new RegExp(`^(${OPERAND})\\s*<=\\s*(${OPERAND})$`),
		valueOrder: [1, 2],
	},
];

function isVariableToken(token: string): boolean {
	return new RegExp(`^${VAR_TOKEN}$`).test(token);
}

function isStringToken(token: string): boolean {
	return new RegExp(`^${STRING_TOKEN}$`).test(token);
}

/** Converts a matched Python operand token into the plain text shown in the builder's inputs. */
function operandToDisplayValue(token: string): string {
	if (isVariableToken(token)) return token;
	if (isStringToken(token)) {
		try {
			return JSON.parse(token) as string;
		} catch {
			return token;
		}
	}
	// Numeric literal — displayed as-is.
	return token;
}

/** Converts a builder input's plain text into the condition operand token that will be persisted. */
export function displayValueToOperand(text: string): string {
	const trimmed = text.trim();
	if (new RegExp(`^${VAR_TOKEN}$`).test(trimmed)) return trimmed;
	if (new RegExp(`^${NUMBER_TOKEN}$`).test(trimmed)) return trimmed;
	return JSON.stringify(text);
}

/**
 * Attempts to parse a persisted condition string into the simple Value 1/Operator/Value 2
 * shape. Returns `null` when the condition uses syntax the simple builder can't represent —
 * callers must leave the original string untouched in that case.
 */
export function parseBranchCondition(
	condition: string,
): ParsedBranchCondition | null {
	const trimmed = condition.trim();
	if (!trimmed) {
		return {
			value1: "",
			operator: "equals",
			value2: "",
		};
	}
	for (const { operator, pattern, valueOrder } of OPERATOR_PATTERNS) {
		const match = pattern.exec(trimmed);
		if (!match) continue;
		const [firstIndex, secondIndex] = valueOrder;
		return {
			value1: operandToDisplayValue(match[firstIndex]),
			operator,
			value2: operandToDisplayValue(match[secondIndex]),
		};
	}
	return null;
}

/** Builds the persisted condition expression from the simple builder's current values. */
export function generateBranchCondition(parsed: ParsedBranchCondition): string {
	const value1 = displayValueToOperand(parsed.value1);
	const value2 = displayValueToOperand(parsed.value2);
	switch (parsed.operator) {
		case "equals":
			return `${value1} == ${value2}`;
		case "notEquals":
			return `${value1} != ${value2}`;
		case "greaterThan":
			return `${value1} > ${value2}`;
		case "greaterThanOrEqual":
			return `${value1} >= ${value2}`;
		case "lessThan":
			return `${value1} < ${value2}`;
		case "lessThanOrEqual":
			return `${value1} <= ${value2}`;
		default: {
			const exhaustiveCheck: never = parsed.operator;
			throw new Error(
				`Unsupported branch condition operator: ${exhaustiveCheck}`,
			);
		}
	}
}
