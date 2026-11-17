import { create } from "zustand";
import type { AppTestSession } from "./app-test.types";

export interface AppFrameTestMode {
	frame: HTMLIFrameElement;
	session: AppTestSession;
	normalUrl: string;
	/** Best-effort revocation when the preview is destroyed; expiry also fails closed. */
	dispose: () => void;
}

interface AppFrameRegistry {
	frames: Record<string, HTMLIFrameElement>;
	testModes: Record<string, AppFrameTestMode>;
}

/** The app preview and the Testing panel are separate workbench panels; this links them by app id. */
const useAppFrameRegistry = create<AppFrameRegistry>(() => ({
	frames: {},
	testModes: {},
}));

/** Publish an app preview iframe; returns the matching unregister. */
export const registerAppFrame = (
	appId: string,
	frame: HTMLIFrameElement,
): (() => void) => {
	useAppFrameRegistry.setState((state) => ({
		frames: { ...state.frames, [appId]: frame },
	}));
	return () => {
		const mode = useAppFrameRegistry.getState().testModes[appId];
		if (mode?.frame === frame) {
			mode.dispose();
			setAppFrameTestMode(appId, null);
		}
		useAppFrameRegistry.setState((state) => {
			if (state.frames[appId] !== frame) return state;
			return {
				frames: Object.fromEntries(
					Object.entries(state.frames).filter(([id]) => id !== appId),
				),
			};
		});
	};
};

/** The currently mounted preview iframe of an app, if any. */
export const useAppFrame = (appId: string): HTMLIFrameElement | null =>
	useAppFrameRegistry((state) => state.frames[appId] ?? null);

/** The routing session lives with the preview rather than a collapsible Testing panel. */
export const useAppFrameTestMode = (appId: string): AppFrameTestMode | null =>
	useAppFrameRegistry((state) => state.testModes[appId] ?? null);

export const getAppFrameTestMode = (appId: string): AppFrameTestMode | null =>
	useAppFrameRegistry.getState().testModes[appId] ?? null;

export const setAppFrameTestMode = (
	appId: string,
	mode: AppFrameTestMode | null,
): void => {
	useAppFrameRegistry.setState((state) => ({
		testModes: mode
			? { ...state.testModes, [appId]: mode }
			: Object.fromEntries(
					Object.entries(state.testModes).filter(
						([id]) => id !== appId,
					),
				),
	}));
};
