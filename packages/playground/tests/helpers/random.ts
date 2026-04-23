const SUFFIX_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

function randomSuffix(length = 6): string {
	let out = "";
	for (let i = 0; i < length; i++) {
		out +=
			SUFFIX_ALPHABET[Math.floor(Math.random() * SUFFIX_ALPHABET.length)];
	}
	return out;
}

/**
 * Prefix used on every object a workflow creates. Cleanup routines and humans
 * scanning the app can identify disposable test artifacts at a glance.
 */
export const TEST_PREFIX = "e2e-";

export function randomAgentName(label = "agent"): string {
	return `${TEST_PREFIX}${label}-${Date.now().toString(36)}-${randomSuffix()}`;
}

export function randomRoomMessage(): string {
	return `ping ${Date.now().toString(36)}-${randomSuffix(4)}`;
}
