import { z } from "@semoss/ui/next";

/** The access a SQL query policy rule can require, as the guardrail stores it. */
export const REQUIREMENT_VALUES = [
	"FOLLOW_ENGINE_PERMISSIONS",
	"READ_ONLY",
	"EDIT",
	"OWNER",
	"DENY",
] as const;

/** One access level a rule can require. */
export type Requirement = (typeof REQUIREMENT_VALUES)[number];

/** Each access level in words. */
export const REQUIREMENT_OPTIONS: readonly {
	value: Requirement;
	label: string;
}[] = [
	{ value: "FOLLOW_ENGINE_PERMISSIONS", label: "Follow engine permissions" },
	{ value: "READ_ONLY", label: "Require view access" },
	{ value: "EDIT", label: "Require edit access" },
	{ value: "OWNER", label: "Require database ownership" },
	{ value: "DENY", label: "Always deny" },
];

/**
 * The operations a SQL query policy can name, by group. A rule can name every
 * operation (*), a group, or one operation, and the most specific rule wins.
 */
export const OPERATION_GROUPS = [
	{
		name: "DDL",
		operations: [
			"ALTER_TABLE",
			"ALTER_VIEW",
			"COMMENT",
			"CREATE_INDEX",
			"CREATE_TABLE",
			"CREATE_VIEW",
			"DROP",
			"SELECT_INTO",
			"TRUNCATE",
		],
	},
	{ name: "LOCK", operations: ["SELECT_FOR_UPDATE"] },
	{ name: "METADATA", operations: ["DESCRIBE", "SHOW"] },
	{ name: "READ", operations: ["EXPLAIN", "SELECT", "VALUES"] },
	{ name: "ROUTINE", operations: ["BLOCK", "EXECUTE"] },
	{ name: "SESSION", operations: ["DECLARE", "SET", "USE"] },
	{ name: "TRANSACTION", operations: ["COMMIT"] },
	{ name: "UNKNOWN", operations: ["UNKNOWN"] },
	{
		name: "WRITE",
		operations: [
			"DELETE",
			"INSERT",
			"MERGE",
			"REPLACE",
			"UPDATE",
			"UPSERT",
		],
	},
] as const;

/** The key of a rule for every operation */
export const ALL_OPERATIONS = "*";

/** The SMSS properties that each hold one policy, as a JSON object of rules. */
export const POLICY_FIELDS = [
	"OPERATION_POLICY",
	"FUNCTION_POLICY",
	"VARIABLE_POLICY",
	"KEYWORD_POLICY",
	"RELATION_POLICY",
	"ROUTINE_POLICY",
] as const;

/** One policy's property. */
export type PolicyField = (typeof POLICY_FIELDS)[number];

/** One policy of names the SQL uses, which has built-in rules. */
export type IdentifierPolicyField = Exclude<PolicyField, "OPERATION_POLICY">;

/**
 * The policies of names the SQL uses, which start with the guardrail's built-in
 * rules for the dialect. The operation policy has none.
 */
export const IDENTIFIER_POLICY_FIELDS = POLICY_FIELDS.filter(
	(field): field is IdentifierPolicyField => field !== "OPERATION_POLICY",
);

/** One rule of a policy: what it applies to, and the access it requires. */
export interface PolicyRule {
	/** An operation, group or * for the operation policy; a name or pattern for the others. */
	key: string;
	/** The access the rule requires. */
	requirement: Requirement;
	/** Whether this is one of the guardrail's built-in rules, whose name is fixed. */
	builtIn?: boolean;
}

/**
 * A policy as a list of rules. A rule needs something to apply to, and two
 * rules cannot apply to the same thing; the guardrail reads names without
 * regard to case, so neither does this check.
 */
export const policyRulesSchema = z
	.array(
		z.object({
			key: z.string(),
			requirement: z.enum(REQUIREMENT_VALUES),
			builtIn: z.boolean().optional(),
		}),
	)
	.superRefine((rules, context) => {
		const seen = new Set<string>();
		rules.forEach((rule, index) => {
			const key = rule.key.trim();
			if (!key) {
				context.addIssue({
					code: "custom",
					path: [index, "key"],
					message: "Enter what this rule applies to",
				});
				return;
			}
			const normalized = key.toUpperCase();
			if (seen.has(normalized)) {
				context.addIssue({
					code: "custom",
					path: [index, "key"],
					message: "Another rule already applies to this",
				});
			}
			seen.add(normalized);
		});
	});

/** Whether two rule keys name the same thing, as the guardrail reads them. */
export const isSameRuleKey = (left: string, right: string): boolean =>
	left.trim().toUpperCase() === right.trim().toUpperCase();

/** The guardrail's built-in rules for the chosen dialect, by identifier policy. */
export type BuiltInRules = Partial<Record<IdentifierPolicyField, PolicyRule[]>>;

/**
 * A policy's built-in rules from the guardrail, marked as built in. An access
 * level the form does not know is left out.
 *
 * @param rules - Each built-in name or pattern to the access it requires.
 * @returns The built-in rules, in the guardrail's order.
 */
export const toBuiltInRules = (
	rules: Record<string, string> | undefined,
): PolicyRule[] =>
	Object.entries(rules ?? {}).flatMap(([key, requirement]) => {
		const known = REQUIREMENT_VALUES.find((value) => value === requirement);
		return known ? [{ key, requirement: known, builtIn: true }] : [];
	});

/**
 * Each policy's built-in rules from the guardrail, marked as built in.
 *
 * @param defaults - Each identifier policy's built-in names and patterns to the access each requires.
 * @returns The built-in rules, by identifier policy, in the guardrail's order.
 */
export const toBuiltInRulesByPolicy = (
	defaults: Record<string, Record<string, string>>,
): BuiltInRules =>
	Object.fromEntries(
		IDENTIFIER_POLICY_FIELDS.map((field) => [
			field,
			toBuiltInRules(defaults[field]),
		]),
	);

/**
 * The built-in rules a policy does not list, which the guardrail then does not
 * apply. A built-in name the user gave a rule of their own is listed by it.
 *
 * @param rules - The policy's rules.
 * @param builtIns - The dialect's built-in rules for the policy.
 * @returns The removed built-in rules, in the guardrail's order.
 */
export const toRemovedBuiltIns = (
	rules: readonly PolicyRule[],
	builtIns: readonly PolicyRule[],
): PolicyRule[] =>
	builtIns.filter(
		(builtIn) =>
			!rules.some((rule) => isSameRuleKey(rule.key, builtIn.key)),
	);

/**
 * A policy's rules with one dialect's built-in rules swapped for another's. A
 * built-in rule both dialects have keeps the access it was given, and stays
 * out when it was removed; the user's own rules stay, and a built-in name one
 * of them already covers is not added again.
 *
 * @param rules - The policy's rules in the form.
 * @param previous - The built-in rules the rules started with.
 * @param next - The built-in rules to start with instead.
 * @returns The next built-in rules, then the user's own.
 */
export const mergeBuiltInRules = (
	rules: readonly PolicyRule[],
	previous: readonly PolicyRule[],
	next: readonly PolicyRule[],
): PolicyRule[] => {
	const ownRules = rules.filter((rule) => !rule.builtIn);
	const nextBuiltIns = next.flatMap((builtIn) => {
		if (ownRules.some((rule) => isSameRuleKey(rule.key, builtIn.key))) {
			return [];
		}
		const listed = rules.find(
			(rule) => rule.builtIn && isSameRuleKey(rule.key, builtIn.key),
		);
		if (listed) {
			return [{ ...builtIn, requirement: listed.requirement }];
		}
		const wasRemoved = previous.some((rule) =>
			isSameRuleKey(rule.key, builtIn.key),
		);
		return wasRemoved ? [] : [{ ...builtIn }];
	});
	return [...nextBuiltIns, ...ownRules];
};

/**
 * A policy's rules as the JSON object the guardrail stores, each rule's key as
 * entered and its access level as the value. The guardrail applies its
 * built-in rules on its own, below the rules it is given, so a built-in rule
 * left at its access is not written, and one that was removed is written as an
 * exemption, FOLLOW_ENGINE_PERMISSIONS, which takes precedence over it.
 *
 * @param rules - The policy's rules.
 * @param builtIns - The dialect's built-in rules for the policy.
 * @returns The JSON object, {} for no rules.
 */
export const toPolicyJson = (
	rules: readonly PolicyRule[],
	builtIns: readonly PolicyRule[] = [],
): string => {
	const isUnchangedBuiltIn = (rule: PolicyRule) =>
		rule.builtIn === true &&
		builtIns.some(
			(builtIn) =>
				isSameRuleKey(builtIn.key, rule.key) &&
				builtIn.requirement === rule.requirement,
		);
	return JSON.stringify(
		Object.fromEntries([
			...rules
				.filter((rule) => !isUnchangedBuiltIn(rule))
				.map((rule) => [rule.key.trim(), rule.requirement]),
			...toRemovedBuiltIns(rules, builtIns).map((builtIn) => [
				builtIn.key,
				"FOLLOW_ENGINE_PERMISSIONS",
			]),
		]),
	);
};

/**
 * How many rules a policy has, and how many built-in rules were removed, in
 * words.
 *
 * @param ruleCount - The policy's rules.
 * @param removedCount - The built-in rules removed from it.
 * @returns The summary, such as "12 rules, 2 built-in removed".
 */
export const summarizeRules = (
	ruleCount: number,
	removedCount: number,
): string => {
	const rules =
		ruleCount === 0
			? "No rules"
			: `${ruleCount} ${ruleCount === 1 ? "rule" : "rules"}`;
	return removedCount === 0
		? rules
		: `${rules}, ${removedCount} built-in removed`;
};

/** The part of the SQL query policy form that holds the policies' rules. */
export type PolicyFormValues = Record<PolicyField, PolicyRule[]>;
