import { type Job, mapJob } from "@/features/onboarding/onboarding-api";
import type { InsightActions } from "@/lib/pixel";
import { pixel } from "@/lib/pixel";
import type { ProfileStyle } from "../state/collaboration.types";
import { mapStyle, runBatch } from "./live-state";

type Row = Record<string, unknown>;

/** Starts learning the owner's writing style, or returns the job already running. */
export async function startStyleLearning(
	actions: InsightActions,
): Promise<Job> {
	const [output] = await runBatch(actions, [pixel("BrainLearnStyle")]);
	return mapJob((output ?? {}) as Row);
}

/** The style as the server holds it, including a proposal the learning just left for review. */
export async function readServerStyle(
	actions: InsightActions,
): Promise<ProfileStyle> {
	const [profile] = await runBatch(actions, [pixel("BrainGetProfile")]);
	return mapStyle(((profile as Row | undefined)?.style ?? {}) as Row);
}

/** BrainSaveProfile with only the style, returning the style the server now holds. */
export async function saveStyleNow(
	actions: InsightActions,
	style: Record<string, unknown>,
): Promise<ProfileStyle> {
	const [profile] = await runBatch(actions, [
		pixel("BrainSaveProfile", { profile: { style } }),
	]);
	const saved = (profile as Row | undefined)?.style;
	if (!saved || typeof saved !== "object")
		throw new Error("The server did not confirm the saved style.");
	return mapStyle(saved as Row);
}
