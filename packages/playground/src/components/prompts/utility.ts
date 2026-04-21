import type { Prompt } from "@/types";

const PLATFORM_URL = import.meta.env.VITE_PLATFORM_URL
	? import.meta.env.VITE_PLATFORM_URL
	: "";

/**
 * Convert the Prompt into a platform url
 */
export const promptToPlatformUrl = (prompt: Pick<Prompt, "id">): string => {
	return `${PLATFORM_URL}/#/prompt/${prompt.id}`;
};
