import type { ApiRequestConfig } from "./automation.types";

const REFERENCE = /\$\{([^}]+)\}/g;

/** Lists every distinct `${path}` the request refers to, in first-use order. */
export function referencedPaths(config: ApiRequestConfig): string[] {
	const found: string[] = [];
	for (const text of [
		config.url,
		config.query,
		config.headers,
		config.body,
	]) {
		for (const match of text.matchAll(REFERENCE)) {
			const path = match[1].trim();
			if (path && !found.includes(path)) found.push(path);
		}
	}
	return found;
}

function sampleValue(text: string): unknown {
	const trimmed = text.trim();
	if (!trimmed) return "";
	try {
		const parsed: unknown = JSON.parse(trimmed);
		return typeof parsed === "string" ? trimmed : parsed;
	} catch {
		return text;
	}
}

/** Builds the scope a test request resolves references against. */
export function buildSampleScope(
	values: Record<string, string>,
): Record<string, unknown> {
	const scope: Record<string, unknown> = {};
	for (const [path, text] of Object.entries(values)) {
		const parts = path.split(".");
		let cursor = scope;
		parts.forEach((part, index) => {
			if (index === parts.length - 1) {
				cursor[part] = sampleValue(text);
				return;
			}
			const next = cursor[part];
			if (typeof next !== "object" || next === null) cursor[part] = {};
			cursor = cursor[part] as Record<string, unknown>;
		});
	}
	return scope;
}
