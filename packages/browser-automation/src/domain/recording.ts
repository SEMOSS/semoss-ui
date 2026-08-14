import type {
	GeneratedRecordingMetadata,
	LoadedRecordingStep,
	StepsEnvelope,
} from "../types/browserEvents";
import { normalizeBrowserUrl } from "./browser-url";

export function flattenEnvelopeSteps(
	envelope: Pick<StepsEnvelope, "steps">,
): Array<Record<string, unknown>> {
	return Object.values(envelope.steps ?? {}).flatMap((tabSteps) => {
		const maybeNested = tabSteps as Array<
			Record<string, unknown> | Record<string, unknown>[]
		>;
		return maybeNested.flatMap((item) =>
			Array.isArray(item) ? item : [item],
		);
	});
}

function sanitizeFilePart(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9._-]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 96);
}

function isMeaningfulRecordingUrl(value: unknown): value is string {
	return (
		typeof value === "string" &&
		!!value.trim() &&
		value.trim() !== "about:blank"
	);
}

export function getRecordingStartUrl(
	envelope: Pick<StepsEnvelope, "steps">,
	requestedStartUrl = "",
): string {
	const steps = flattenEnvelopeSteps(envelope);
	const firstUrl = steps.find((step) =>
		isMeaningfulRecordingUrl(step.url),
	)?.url;
	return typeof firstUrl === "string"
		? firstUrl
		: normalizeBrowserUrl(requestedStartUrl);
}

function ensureRequestedNavigation(
	envelope: StepsEnvelope,
	requestedStartUrl: string,
): StepsEnvelope {
	const normalizedUrl = normalizeBrowserUrl(requestedStartUrl);
	if (!normalizedUrl || getRecordingStartUrl(envelope)) {
		return envelope;
	}

	let replaced = false;
	const steps = Object.fromEntries(
		Object.entries(envelope.steps ?? {}).map(([tabId, tabSteps]) => {
			const nextTabSteps = tabSteps.map((item) => {
				if (Array.isArray(item)) {
					return item.map((step) => {
						if (
							!replaced &&
							String(step.type || "").toUpperCase() === "NAVIGATE"
						) {
							replaced = true;
							return { ...step, url: normalizedUrl };
						}
						return step;
					});
				}
				if (
					!replaced &&
					String(item.type || "").toUpperCase() === "NAVIGATE"
				) {
					replaced = true;
					return { ...item, url: normalizedUrl };
				}
				return item;
			});
			return [tabId, nextTabSteps];
		}),
	) as StepsEnvelope["steps"];

	if (!replaced) {
		const tabId = Object.keys(steps)[0] || "tab-1";
		const navigation = {
			id: 1,
			type: "NAVIGATE",
			url: normalizedUrl,
			waitAfterMs: 100,
			shouldRun: true,
			required: false,
			timestamp: Date.now(),
		};
		const existing = steps[tabId] || [];
		const nestedExisting: LoadedRecordingStep[][] =
			existing.length > 0 && Array.isArray(existing[0])
				? (existing as LoadedRecordingStep[][])
				: existing.length > 0
					? [existing as LoadedRecordingStep[]]
					: [];
		steps[tabId] = [[navigation], ...nestedExisting];
	}

	return { ...envelope, steps };
}

export function buildRecordingFileName(
	envelope: StepsEnvelope,
	hint = "",
	requestedStartUrl = "",
	preferredBase = "",
): string {
	const firstUrl = getRecordingStartUrl(envelope, requestedStartUrl);
	let host = "browser";
	if (firstUrl) {
		try {
			host =
				new URL(firstUrl).hostname
					.replace(/^www\./, "")
					.split(".")[0] || host;
		} catch {
			host = firstUrl.replace(/^https?:\/\//, "").split("/")[0] || host;
		}
	}

	const base =
		sanitizeFilePart(preferredBase) ||
		sanitizeFilePart([hint, host].filter(Boolean).join(" ")) ||
		"playwright-recording";
	const stamp = new Date()
		.toISOString()
		.replace(/[-:]/g, "")
		.replace(/\..+$/, "")
		.replace("T", "-");
	return `${base}-${stamp}.json`;
}

export function applyGeneratedRecordingMetadata(
	envelope: StepsEnvelope,
	metadata: GeneratedRecordingMetadata | null,
): StepsEnvelope {
	if (!metadata?.success) return envelope;
	const title = metadata.title?.trim();
	const description = metadata.description?.trim();
	const intent = metadata.intent?.trim();
	if (!title || !description || !intent) return envelope;

	return {
		...envelope,
		meta: {
			...envelope.meta,
			title,
			description,
			intent,
			updatedAt: Date.now(),
		},
	};
}

function buildRecordingTitle(
	envelope: StepsEnvelope,
	hint = "",
	requestedStartUrl = "",
): string {
	const firstUrl = getRecordingStartUrl(envelope, requestedStartUrl);
	const parts = [hint, firstUrl].filter(
		(part) => typeof part === "string" && part.trim(),
	);
	return String(parts[0] || "Playwright browser recording").slice(0, 120);
}

function shouldReplaceRecordingTitle(value: string | undefined): boolean {
	const normalized = (value || "").trim().toLowerCase();
	return (
		!normalized || normalized === "about:blank" || normalized === "browser"
	);
}

export function enrichEnvelopeForRoomSave(
	envelope: StepsEnvelope,
	sessionId: string,
	hint = "",
	requestedStartUrl = "",
): StepsEnvelope {
	const enrichedEnvelope = ensureRequestedNavigation(
		envelope,
		requestedStartUrl,
	);
	const normalizedStartUrl = getRecordingStartUrl(
		enrichedEnvelope,
		requestedStartUrl,
	);
	const title = shouldReplaceRecordingTitle(enrichedEnvelope.meta?.title)
		? buildRecordingTitle(enrichedEnvelope, hint, normalizedStartUrl)
		: enrichedEnvelope.meta?.title;
	const now = Date.now();
	return {
		...enrichedEnvelope,
		version: enrichedEnvelope.version || "1.0",
		meta: {
			...enrichedEnvelope.meta,
			id: enrichedEnvelope.meta?.id || sessionId,
			title,
			description:
				enrichedEnvelope.meta?.description ||
				`Recorded from Playwright Sockets via Playground${
					normalizedStartUrl
						? ` starting at ${normalizedStartUrl}`
						: ""
				}.`,
			createdAt: enrichedEnvelope.meta?.createdAt || now,
			updatedAt: now,
			intent:
				enrichedEnvelope.meta?.intent ||
				hint ||
				buildRecordingTitle(enrichedEnvelope, hint, normalizedStartUrl),
			requestedStartUrl: normalizedStartUrl,
			searchTerms: Array.from(
				new Set(
					[hint, normalizedStartUrl, title].filter(
						Boolean,
					) as string[],
				),
			),
			source: "playwright-sockets-playground",
		},
	};
}
