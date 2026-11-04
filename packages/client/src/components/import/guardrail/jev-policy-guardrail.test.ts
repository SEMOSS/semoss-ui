import { describe, expect, it } from "vitest";
import {
	JEV_POLICY_GUARDRAIL_DEFAULTS,
	type JevPolicyGuardrailFormValues,
	jevPolicyGuardrailSchema,
	toJevPolicyGuardrailDetails,
	toViolationChanceSettings,
} from "./jev-policy-guardrail";

const NOUL_VALUES: JevPolicyGuardrailFormValues = {
	...JEV_POLICY_GUARDRAIL_DEFAULTS,
	MODEL_NAME: "Scope check",
	MODEL_ENGINE_ID: "jev-model",
	QUESTION_INSTRUCTIONS: "Is this request within the approved scope?",
	VIOLATION_DIRECTION: "NO",
};

const CHOICE_VALUES: JevPolicyGuardrailFormValues = {
	...NOUL_VALUES,
	QUESTION_TYPE: "CHOICE",
	QUESTION_INSTRUCTIONS: "Does this answer share only approved figures?",
	CHOICES: [
		{
			name: "APPROVED",
			description: "shares approved figures",
			isBlocking: false,
		},
		{
			name: "OFF_PLAN",
			description: "mentions figures not on the approved list",
			isBlocking: true,
		},
	],
};

/**
 * Reads the schema's problems for a set of values, by field path. Like the
 * form, it keeps the first problem of each field.
 *
 * @param values - The values to check.
 * @returns Each field's first problem, by its dotted path.
 */
const problemsOf = (
	values: JevPolicyGuardrailFormValues,
): Record<string, string> => {
	const result = jevPolicyGuardrailSchema.safeParse(values);
	if (result.success) {
		return {};
	}
	const problems: Record<string, string> = {};
	for (const issue of result.error.issues) {
		problems[issue.path.join(".")] ??= issue.message;
	}
	return problems;
};

describe("Jev policy guardrail SMSS configuration", () => {
	it("writes a yes or no policy, leaving the choices and the empty options out", () => {
		const details = toJevPolicyGuardrailDetails(NOUL_VALUES);

		expect(details).toEqual({
			GUARDRAIL_TYPE: "EMBEDDED_JEV_POLICY",
			MODEL_ENGINE_ID: "jev-model",
			QUESTION_TYPE: "NOUL",
			QUESTION_INSTRUCTIONS: "Is this request within the approved scope?",
			VIOLATION_DIRECTION: "NO",
			CONFIDENCE_THRESHOLD: "0.5",
			LOW_CONFIDENCE_VERDICT: "PASS",
			JUDGE_ERROR_VERDICT: "BLOCK",
		});
	});

	it.each([
		// at 50% or more, unsure answers pass and the cutoff is the threshold
		[50, "0.5", "PASS"],
		[80, "0.8", "PASS"],
		[100, "1", "PASS"],
		// under 50%, unsure answers block and the threshold is the cutoff mirrored
		[20, "0.8", "BLOCK"],
		[7, "0.93", "BLOCK"],
		[37.5, "0.625", "BLOCK"],
	] as const)(
		"blocks a yes or no answer at a %s%% violation chance with a %s threshold and %s for unsure answers",
		(percent, threshold, verdict) => {
			expect(toViolationChanceSettings(percent)).toEqual({
				CONFIDENCE_THRESHOLD: threshold,
				LOW_CONFIDENCE_VERDICT: verdict,
			});
			expect(
				toJevPolicyGuardrailDetails({
					...NOUL_VALUES,
					VIOLATION_CHANCE_PERCENT: String(percent),
				}),
			).toMatchObject({
				CONFIDENCE_THRESHOLD: threshold,
				LOW_CONFIDENCE_VERDICT: verdict,
			});
		},
	);

	it("writes a choice question's confidence, blocking an unsure choice when strict", () => {
		expect(
			toJevPolicyGuardrailDetails({
				...CHOICE_VALUES,
				CONFIDENCE_PERCENT: "70",
				STRICTNESS: "STRICT",
			}),
		).toMatchObject({
			CONFIDENCE_THRESHOLD: "0.7",
			LOW_CONFIDENCE_VERDICT: "BLOCK",
		});
		expect(
			toJevPolicyGuardrailDetails({
				...CHOICE_VALUES,
				CONFIDENCE_PERCENT: "70",
				STRICTNESS: "LENIENT",
			}),
		).toMatchObject({
			CONFIDENCE_THRESHOLD: "0.7",
			LOW_CONFIDENCE_VERDICT: "PASS",
		});
	});

	it("writes a choice policy's choices as the JSON the guardrail reads", () => {
		const details = toJevPolicyGuardrailDetails({
			...CHOICE_VALUES,
			CHOICES: [
				{ ...CHOICE_VALUES.CHOICES[0], name: " APPROVED " },
				CHOICE_VALUES.CHOICES[1],
			],
		});

		expect(details).not.toHaveProperty("VIOLATION_DIRECTION");
		expect(details.QUESTION_TYPE).toBe("CHOICE");
		expect(JSON.parse(details.QUESTION_CRITERIA)).toEqual({
			APPROVED: "shares approved figures",
			OFF_PLAN: "mentions figures not on the approved list",
		});
		expect(JSON.parse(details.VIOLATION_CHOICES)).toEqual(["OFF_PLAN"]);
	});

	it("writes a timeout and a blocked message once they are given", () => {
		const details = toJevPolicyGuardrailDetails({
			...NOUL_VALUES,
			TIMEOUT_SECONDS: "30",
			BLOCKED_MESSAGE: " Only monthly reporting questions. ",
			JUDGE_ERROR_VERDICT: "PASS",
		});

		expect(details).toMatchObject({
			TIMEOUT_SECONDS: "30",
			BLOCKED_MESSAGE: "Only monthly reporting questions.",
			JUDGE_ERROR_VERDICT: "PASS",
		});
	});
});

describe("Jev policy guardrail settings", () => {
	it("accepts a complete yes or no policy and a complete choice policy", () => {
		expect(problemsOf(NOUL_VALUES)).toEqual({});
		expect(problemsOf(CHOICE_VALUES)).toEqual({});
	});

	it("asks for the judge and the question", () => {
		expect(
			problemsOf({
				...NOUL_VALUES,
				MODEL_ENGINE_ID: "",
				QUESTION_INSTRUCTIONS: "  ",
			}),
		).toEqual({
			MODEL_ENGINE_ID: "Choose the Jev model that judges the policy",
			QUESTION_INSTRUCTIONS: "Enter the question the judge answers",
		});
	});

	it("ignores the choices of a yes or no policy", () => {
		expect(
			problemsOf({
				...NOUL_VALUES,
				CHOICES: [{ name: "", description: "", isBlocking: false }],
			}),
		).toEqual({});
	});

	it("asks for each choice's name and meaning, and tells apart names only by more than case", () => {
		expect(
			problemsOf({
				...CHOICE_VALUES,
				CHOICES: [
					...CHOICE_VALUES.CHOICES,
					{ name: "approved", description: "", isBlocking: false },
					{ name: " ", description: "other", isBlocking: false },
				],
			}),
		).toEqual({
			"CHOICES.2.name": "Another choice already has this name",
			"CHOICES.2.description": "Describe what this choice means",
			"CHOICES.3.name": "Enter the choice's name",
		});
	});

	it("needs a choice that blocks the call and one that allows it", () => {
		const [approved, offPlan] = CHOICE_VALUES.CHOICES;

		expect(
			problemsOf({
				...CHOICE_VALUES,
				CHOICES: [approved, { ...offPlan, isBlocking: false }],
			}),
		).toEqual({ CHOICES: "Mark at least one choice as blocking the call" });
		expect(
			problemsOf({
				...CHOICE_VALUES,
				CHOICES: [{ ...approved, isBlocking: true }, offPlan],
			}),
		).toEqual({
			CHOICES: "Leave at least one choice that allows the call",
		});
	});

	it("checks the choices alongside the other settings", () => {
		expect(
			problemsOf({
				...CHOICE_VALUES,
				MODEL_NAME: "",
				CHOICES: [],
			}),
		).toEqual({
			MODEL_NAME: "Catalog name is required",
			CHOICES: "Mark at least one choice as blocking the call",
		});
	});

	it.each([
		["20", true],
		["100", true],
		["37.5", true],
		["0", false],
		["101", false],
		["", false],
		["0x1", false],
		["-5", false],
	])("reads a violation chance of '%s' as valid: %s", (value, isValid) => {
		expect(
			problemsOf({ ...NOUL_VALUES, VIOLATION_CHANCE_PERCENT: value }),
		).toEqual(
			isValid
				? {}
				: {
						VIOLATION_CHANCE_PERCENT:
							"Enter a percentage above 0, up to 100",
					},
		);
	});

	it.each([
		["0", true],
		["100", true],
		["62.5", true],
		["101", false],
		["", false],
		["-1", false],
	])("reads a choice confidence of '%s' as valid: %s", (value, isValid) => {
		expect(
			problemsOf({ ...CHOICE_VALUES, CONFIDENCE_PERCENT: value }),
		).toEqual(
			isValid
				? {}
				: { CONFIDENCE_PERCENT: "Enter a percentage from 0 to 100" },
		);
	});

	it("checks only the confidence of the chosen question type", () => {
		expect(problemsOf({ ...NOUL_VALUES, CONFIDENCE_PERCENT: "" })).toEqual(
			{},
		);
		expect(
			problemsOf({ ...CHOICE_VALUES, VIOLATION_CHANCE_PERCENT: "" }),
		).toEqual({});
	});

	it.each([
		["", true],
		["30", true],
		["2.5", true],
		["0", false],
		["-5", false],
		["soon", false],
	])("reads a timeout of '%s' as valid: %s", (value, isValid) => {
		expect(problemsOf({ ...NOUL_VALUES, TIMEOUT_SECONDS: value })).toEqual(
			isValid
				? {}
				: {
						TIMEOUT_SECONDS:
							"Enter a number of seconds above 0, or leave it empty",
					},
		);
	});
});
