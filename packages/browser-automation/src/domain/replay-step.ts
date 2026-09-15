import type {
	BrowserSelector,
	LoadedRecordingStep,
} from "../types/browserEvents";

export function getStepCoords(
	step: LoadedRecordingStep,
): { x: number; y: number } | null {
	const coords = step.coords;
	if (!coords || typeof coords !== "object") return null;
	const raw = coords as Record<string, unknown>;
	const x = Number(raw.x);
	const y = Number(raw.y);
	return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
}

export function getStepSelector(
	step: LoadedRecordingStep,
): BrowserSelector | undefined {
	const raw = step.selector;
	if (!raw || typeof raw !== "object") return undefined;
	const selector = raw as Record<string, unknown>;
	if (
		typeof selector.strategy !== "string" ||
		typeof selector.value !== "string"
	) {
		return undefined;
	}
	return {
		strategy: selector.strategy,
		value: selector.value,
		frameSelector:
			typeof selector.frameSelector === "string"
				? selector.frameSelector
				: null,
	};
}

export function getReplayWaitAfterMs(
	step: LoadedRecordingStep,
	fallback: number,
): number {
	const waitAfterMs = Number(step.waitAfterMs);
	return Number.isFinite(waitAfterMs) && waitAfterMs >= 0
		? waitAfterMs
		: fallback;
}

export function wait(ms: number): Promise<void> {
	return new Promise((resolve) => window.setTimeout(resolve, ms));
}
