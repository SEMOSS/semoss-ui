import { z } from "@semoss/ui/next";

/** The guardrail type the Jev policy guardrail is created with. */
export const JEV_POLICY_GUARDRAIL_TYPE = "EMBEDDED_JEV_POLICY";

/** The model subtype a Jev policy guardrail's judge must have. */
export const JEV_JUDGE_SUBTYPE = "TYPESAFE";

/** A decimal number as the guardrail reads it, such as 0.75, 1 or .5. */
const DECIMAL_PATTERN = /^(\d+(\.\d*)?|\.\d+)$/;

/** How strict a choice question is when the judge is less sure than it must be. */
export const STRICTNESS_OPTIONS = [
	{
		value: "STRICT",
		label: "Strict: Allow a Call Only When the Judge Is Sure",
	},
	{
		value: "LENIENT",
		label: "Lenient: Block a Call Only When the Judge Is Sure",
	},
] as const;

/**
 * Reads a percentage the form holds, such as "20" or "37.5".
 *
 * @param value - The field's text.
 * @returns The percentage, or NaN when the text is not a decimal number.
 */
const toPercent = (value: string): number =>
	DECIMAL_PATTERN.test(value.trim()) ? Number(value.trim()) : Number.NaN;

/**
 * Writes a share from 0 to 1 the way the guardrail reads it, without the
 * float noise subtraction can leave, such as 0.93 rather than 0.9299999.
 *
 * @param share - The share.
 * @returns The share as text.
 */
const formatShare = (share: number): string => String(Number(share.toFixed(4)));

/**
 * One answer the judge can pick for a choice question: the name it answers
 * with, such as APPROVED, what the choice means, and whether picking it
 * blocks the call.
 */
const choiceSchema = z.object({
	name: z.string().trim(),
	description: z.string().trim(),
	isBlocking: z.boolean(),
});

/**
 * A Jev policy guardrail's settings. A yes or no question blocks on the answer
 * its direction names, once the chance of a violation reaches
 * VIOLATION_CHANCE_PERCENT; a choice question lists its choices, each named
 * and described, blocks on the ones marked, and needs CONFIDENCE_PERCENT
 * confidence, with STRICTNESS deciding a less sure answer. Only the fields of
 * the chosen question type are checked.
 */
export const jevPolicyGuardrailSchema = z
	.object({
		MODEL_NAME: z
			.string()
			.trim()
			.min(1, "Catalog name is required")
			.regex(
				/^[\w\-\s]+$/,
				"Use only letters, numbers, spaces, underscores, and dashes",
			),
		MODEL_ENGINE_ID: z
			.string()
			.min(1, "Choose the Jev model that judges the policy"),
		QUESTION_TYPE: z.enum(["NOUL", "CHOICE"]),
		QUESTION_INSTRUCTIONS: z
			.string()
			.trim()
			.min(1, "Enter the question the judge answers"),
		VIOLATION_DIRECTION: z.enum(["YES", "NO"]),
		CHOICES: z.array(choiceSchema),
		VIOLATION_CHANCE_PERCENT: z.string().trim(),
		CONFIDENCE_PERCENT: z.string().trim(),
		STRICTNESS: z.enum(["STRICT", "LENIENT"]),
		JUDGE_ERROR_VERDICT: z.enum(["BLOCK", "PASS"]),
		TIMEOUT_SECONDS: z
			.string()
			.trim()
			.refine(
				(value) =>
					value === "" ||
					(DECIMAL_PATTERN.test(value) && Number(value) > 0),
				"Enter a number of seconds above 0, or leave it empty",
			),
		BLOCKED_MESSAGE: z.string().trim(),
	})
	.superRefine((values, context) => {
		if (values.QUESTION_TYPE !== "CHOICE") {
			const chance = toPercent(values.VIOLATION_CHANCE_PERCENT);
			if (!(chance > 0 && chance <= 100)) {
				context.addIssue({
					code: "custom",
					path: ["VIOLATION_CHANCE_PERCENT"],
					message: "Enter a percentage above 0, up to 100",
				});
			}
			return;
		}
		const confidence = toPercent(values.CONFIDENCE_PERCENT);
		if (!(confidence >= 0 && confidence <= 100)) {
			context.addIssue({
				code: "custom",
				path: ["CONFIDENCE_PERCENT"],
				message: "Enter a percentage from 0 to 100",
			});
		}
		const seen = new Set<string>();
		values.CHOICES.forEach((choice, index) => {
			if (!choice.name) {
				context.addIssue({
					code: "custom",
					path: ["CHOICES", index, "name"],
					message: "Enter the choice's name",
				});
			} else {
				// names differing only in case would read as the same answer
				const normalized = choice.name.toUpperCase();
				if (seen.has(normalized)) {
					context.addIssue({
						code: "custom",
						path: ["CHOICES", index, "name"],
						message: "Another choice already has this name",
					});
				}
				seen.add(normalized);
			}
			if (!choice.description) {
				context.addIssue({
					code: "custom",
					path: ["CHOICES", index, "description"],
					message: "Describe what this choice means",
				});
			}
		});
		if (!values.CHOICES.some((choice) => choice.isBlocking)) {
			context.addIssue({
				code: "custom",
				path: ["CHOICES"],
				message: "Mark at least one choice as blocking the call",
			});
		} else if (values.CHOICES.every((choice) => choice.isBlocking)) {
			context.addIssue({
				code: "custom",
				path: ["CHOICES"],
				message: "Leave at least one choice that allows the call",
			});
		}
	});

/** The Jev policy guardrail form's values. */
export type JevPolicyGuardrailFormValues = z.infer<
	typeof jevPolicyGuardrailSchema
>;

/**
 * The values the form starts with. A choice question starts with two choices,
 * the second of them blocking the call.
 */
export const JEV_POLICY_GUARDRAIL_DEFAULTS: JevPolicyGuardrailFormValues = {
	MODEL_NAME: "",
	MODEL_ENGINE_ID: "",
	QUESTION_TYPE: "NOUL",
	QUESTION_INSTRUCTIONS: "",
	VIOLATION_DIRECTION: "YES",
	CHOICES: [
		{ name: "", description: "", isBlocking: false },
		{ name: "", description: "", isBlocking: true },
	],
	VIOLATION_CHANCE_PERCENT: "50",
	CONFIDENCE_PERCENT: "50",
	STRICTNESS: "STRICT",
	JUDGE_ERROR_VERDICT: "BLOCK",
	TIMEOUT_SECONDS: "",
	BLOCKED_MESSAGE: "",
};

/**
 * The guardrail's confidence settings for a yes or no question that blocks
 * once the chance of a violation reaches a percentage. The guardrail decides
 * a yes or no answer only when it is sure enough, and an unsure answer gets
 * LOW_CONFIDENCE_VERDICT, so one cutoff is either a threshold that unsure
 * answers pass (at 50% or more: block only at the cutoff) or the threshold
 * mirrored that unsure answers block (under 50%: block above the cutoff).
 *
 * @param percent - The chance of a violation, above 0 and up to 100, that blocks.
 * @returns CONFIDENCE_THRESHOLD and LOW_CONFIDENCE_VERDICT.
 */
export const toViolationChanceSettings = (
	percent: number,
): {
	CONFIDENCE_THRESHOLD: string;
	LOW_CONFIDENCE_VERDICT: "BLOCK" | "PASS";
} =>
	percent >= 50
		? {
				CONFIDENCE_THRESHOLD: formatShare(percent / 100),
				LOW_CONFIDENCE_VERDICT: "PASS",
			}
		: {
				CONFIDENCE_THRESHOLD: formatShare((100 - percent) / 100),
				LOW_CONFIDENCE_VERDICT: "BLOCK",
			};

/**
 * Converts validated form values into the string-valued properties written to
 * the guardrail SMSS file. A yes or no question writes its VIOLATION_DIRECTION
 * and turns its violation chance into CONFIDENCE_THRESHOLD and
 * LOW_CONFIDENCE_VERDICT. A choice question's choices become
 * QUESTION_CRITERIA, the JSON object of each choice's name to its description,
 * and VIOLATION_CHOICES, the JSON array of the blocking choices' names; its
 * confidence becomes CONFIDENCE_THRESHOLD, and strict blocks an unsure
 * answer. An empty timeout or blocked message is left out, so the guardrail
 * uses its own default.
 *
 * @param values - Validated Jev policy guardrail settings.
 * @returns Every SMSS property the guardrail reads, including its type.
 */
export const toJevPolicyGuardrailDetails = (
	values: JevPolicyGuardrailFormValues,
): Record<string, string> => {
	const details: Record<string, string> = {
		GUARDRAIL_TYPE: JEV_POLICY_GUARDRAIL_TYPE,
		MODEL_ENGINE_ID: values.MODEL_ENGINE_ID,
		QUESTION_TYPE: values.QUESTION_TYPE,
		QUESTION_INSTRUCTIONS: values.QUESTION_INSTRUCTIONS.trim(),
		...(values.QUESTION_TYPE === "CHOICE"
			? {
					CONFIDENCE_THRESHOLD: formatShare(
						toPercent(values.CONFIDENCE_PERCENT) / 100,
					),
					LOW_CONFIDENCE_VERDICT:
						values.STRICTNESS === "STRICT" ? "BLOCK" : "PASS",
				}
			: toViolationChanceSettings(
					toPercent(values.VIOLATION_CHANCE_PERCENT),
				)),
		JUDGE_ERROR_VERDICT: values.JUDGE_ERROR_VERDICT,
	};
	if (values.QUESTION_TYPE === "CHOICE") {
		details.QUESTION_CRITERIA = JSON.stringify(
			Object.fromEntries(
				values.CHOICES.map((choice) => [
					choice.name.trim(),
					choice.description.trim(),
				]),
			),
		);
		details.VIOLATION_CHOICES = JSON.stringify(
			values.CHOICES.filter((choice) => choice.isBlocking).map((choice) =>
				choice.name.trim(),
			),
		);
	} else {
		details.VIOLATION_DIRECTION = values.VIOLATION_DIRECTION;
	}
	const timeout = values.TIMEOUT_SECONDS.trim();
	if (timeout) {
		details.TIMEOUT_SECONDS = timeout;
	}
	const blockedMessage = values.BLOCKED_MESSAGE.trim();
	if (blockedMessage) {
		details.BLOCKED_MESSAGE = blockedMessage;
	}
	return details;
};
