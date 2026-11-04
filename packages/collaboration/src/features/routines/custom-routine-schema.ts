import { z } from "@semoss/ui/next";
import {
	routineDaySchema,
	routineScheduleSchema,
	routineStatusSchema,
} from "./routine-schema";

const { enabled, time, timezone } = routineScheduleSchema.shape;

export const CUSTOM_ROUTINE_DELIVERIES = ["email", "teams", "none"] as const;

/** Where a routine's answer goes; always only to the owner. */
export const DELIVERY_LABELS = {
	email: "Email me",
	teams: "Teams message to me",
	none: "Keep it here",
} as const;

/** What the owner sets on one of their own routines. */
export const customRoutineSettingsSchema = z.object({
	enabled,
	name: z
		.string()
		.trim()
		.min(1, "Give the routine a name.")
		.max(80, "Keep the name to 80 characters."),
	prompt: z
		.string()
		.trim()
		.min(1, "Say what the routine should do.")
		.max(4000, "Keep the task to 4000 characters."),
	time,
	days: z
		.array(routineDaySchema)
		.min(1, "Choose at least one day.")
		.max(7)
		.refine(
			(days) => new Set(days).size === days.length,
			"Choose each day only once.",
		),
	timezone,
	delivery: z.enum(CUSTOM_ROUTINE_DELIVERIES),
	skills: z.array(z.string()),
	agentId: z.string(),
});

export const customRoutineSchema = customRoutineSettingsSchema
	.extend(routineStatusSchema.shape)
	.extend({ id: z.string().min(1) });

export const customRoutineListSchema = z.object({
	routines: z.array(customRoutineSchema),
});

export const mySkillSchema = z.object({
	id: z.string().min(1),
	name: z.string(),
	description: z.string().nullish().default(null),
	inAssistant: z.boolean(),
});

export const mySkillListSchema = z.object({ skills: z.array(mySkillSchema) });

/** One of the owner's reference documents for a routine, copied into each of its runs. */
export const routineDocumentSchema = z.object({
	name: z.string().min(1),
	size: z.number(),
	updatedAt: z.string(),
});

/** The routine's documents folder in the owner's user assets, and what is in it. */
export const routineDocumentsSchema = z.object({
	path: z.string().min(1),
	documents: z.array(routineDocumentSchema),
});

export type CustomRoutineSettings = z.infer<typeof customRoutineSettingsSchema>;
export type CustomRoutine = z.infer<typeof customRoutineSchema>;
export type MySkill = z.infer<typeof mySkillSchema>;
export type RoutineDocument = z.infer<typeof routineDocumentSchema>;
