import { getCatalogImageValidationError } from "@semoss/sdk";
import { AGENT_MAX_GREETING_LENGTH } from "@semoss/shared";
import { z } from "@semoss/ui/next";
import { mcpConfigSchema } from "@/features/agents/api/agent-schemas";
import { TWIN_NOTE_MAX_LENGTH, type TwinProfile } from "./api/digital-twin";

// How a new twin is asked to sound, with NAME standing for its owner. Who it is, what it answers from and
// naming its sources are not here: the server adds those rules to every twin, whatever its instructions say.
const DEFAULT_INSTRUCTIONS =
	"Answer the way NAME would explain it to a colleague: plainly and briefly. Lead with the answer.";

/** What a twin's profile has to hold before any of it is sent. */
export const twinProfileSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Name is required")
		// the server's rule for an agent's name
		.regex(
			/^[a-zA-Z][a-zA-Z0-9 _-]*$/,
			"Start with a letter, then use only letters, numbers, spaces, hyphens and underscores.",
		),
	instructions: z.string(),
	greeting: z
		.string()
		.trim()
		.max(
			AGENT_MAX_GREETING_LENGTH,
			`Keep the greeting to ${AGENT_MAX_GREETING_LENGTH.toLocaleString("en-US")} characters or fewer.`,
		),
	// kept as written, blank lines and all: it is saved as a file its owner can also edit
	about: z
		.string()
		.max(
			TWIN_NOTE_MAX_LENGTH,
			`Keep the note to ${TWIN_NOTE_MAX_LENGTH.toLocaleString("en-US")} characters or fewer.`,
		),
	skills: z.array(z.string()),
	toolboxes: z.array(mcpConfigSchema),
	image: z
		.instanceof(File)
		.nullable()
		.superRefine((file, context) => {
			const message = file && getCatalogImageValidationError(file);
			if (message) context.addIssue({ code: "custom", message });
		}),
	usePersona: z.boolean(),
});

/**
 * The profile a new twin starts from: empty but for its instructions, which
 * say how it should sound. Someone with a persona starts without them, since
 * their persona says that and the two would pull against each other.
 *
 * @param ownerName - The owner as the instructions name them.
 * @param hasPersona - Whether the owner has a persona their twins use.
 */
export function newTwinProfile(
	ownerName: string,
	hasPersona = false,
): TwinProfile {
	return {
		name: "",
		instructions: hasPersona
			? ""
			: DEFAULT_INSTRUCTIONS.replaceAll("NAME", ownerName),
		greeting: "",
		about: "",
		skills: [],
		toolboxes: [],
		image: null,
		usePersona: true,
	};
}

/**
 * The instructions a new twin is made with: what its owner wrote, or how to
 * sound for a twin that would otherwise have neither that nor their persona.
 *
 * @param ownerName - The owner as the instructions name them.
 */
export function newTwinInstructions(
	profile: Pick<TwinProfile, "instructions" | "usePersona">,
	ownerName: string,
): string {
	return profile.instructions.trim() || profile.usePersona
		? profile.instructions
		: DEFAULT_INSTRUCTIONS.replaceAll("NAME", ownerName);
}
