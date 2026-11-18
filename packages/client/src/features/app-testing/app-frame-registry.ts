import { useStoreSelector } from "@semoss/utility/react/use-store-selector";
import { AppFrameRegistryStore } from "./app-frame-registry.store";

// The client has one workbench registry shared by preview and Testing panels.
const registry = new AppFrameRegistryStore();

/** Publish an app preview iframe; returns the matching unregister. */
export const registerAppFrame = registry.register;

/** Read only this app's resource revision, then return its current DOM resource. */
export const useAppFrame = (appId: string): HTMLIFrameElement | null => {
	useStoreSelector(registry, (snapshot) => snapshot.revisions[appId]);
	return registry.getFrame(appId);
};
