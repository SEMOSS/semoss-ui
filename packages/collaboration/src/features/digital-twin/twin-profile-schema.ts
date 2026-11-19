import { getCatalogImageValidationError } from "@semoss/sdk";
import { AGENT_MAX_GREETING_LENGTH } from "@semoss/shared";
import { z } from "@semoss/ui/next";
import { mcpConfigSchema } from "@/features/agents/api/agent-schemas";
import type { TwinProfile } from "./api/digital-twin";

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
	skills: z.array(z.string()),
	toolboxes: z.array(mcpConfigSchema),
	image: z
		.instanceof(File)
		.nullable()
		.superRefine((file, context) => {
			const message = file && getCatalogImageValidationError(file);
			if (message) context.addIssue({ code: "custom", message });
		}),
});

/**
 * The profile a new twin starts from: empty but for its instructions, which
 * tell it whose twin it is.
 *
 * @param ownerName - The owner as the instructions name them.
 */
export function newTwinProfile(ownerName: string): TwinProfile {
	return {
		name: "",
		instructions: DEFAULT_INSTRUCTIONS.replaceAll("NAME", ownerName),
		greeting: "",
		skills: [],
		toolboxes: [],
		image: null,
	};
}
