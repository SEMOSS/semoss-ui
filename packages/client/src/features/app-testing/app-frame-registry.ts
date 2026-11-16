import { create } from "zustand";

interface AppFrameRegistry {
	frames: Record<string, HTMLIFrameElement>;
}

/** The app preview and the Testing panel are separate workbench panels; this links them by app id. */
const useAppFrameRegistry = create<AppFrameRegistry>(() => ({ frames: {} }));

/** Publish an app preview iframe; returns the matching unregister. */
export const registerAppFrame = (
	appId: string,
	frame: HTMLIFrameElement,
): (() => void) => {
	useAppFrameRegistry.setState((state) => ({
		frames: { ...state.frames, [appId]: frame },
	}));
	return () =>
		useAppFrameRegistry.setState((state) => {
			if (state.frames[appId] !== frame) return state;
			return {
				frames: Object.fromEntries(
					Object.entries(state.frames).filter(([id]) => id !== appId),
				),
			};
		});
};

/** The currently mounted preview iframe of an app, if any. */
export const useAppFrame = (appId: string): HTMLIFrameElement | null =>
	useAppFrameRegistry((state) => state.frames[appId] ?? null);
