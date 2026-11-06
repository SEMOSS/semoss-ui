import { createContext, type ReactNode, useContext } from "react";

const PortalContainerContext = createContext<HTMLElement | null>(null);

/** Props for {@link PortalContainerProvider}. */
export interface PortalContainerProviderProps {
	/** Where overlays portal to; the document body when null. */
	container: HTMLElement | null;
	children: ReactNode;
}

/**
 * Portal every overlay beneath it (menus, popovers, dialogs, tooltips,
 * sheets) into `container` instead of the document body, so an app inside
 * a Shadow DOM can style them. An overlay's own `container` prop still wins.
 *
 * @component
 */
export function PortalContainerProvider({
	container,
	children,
}: PortalContainerProviderProps) {
	return (
		<PortalContainerContext.Provider value={container}>
			{children}
		</PortalContainerContext.Provider>
	);
}

/**
 * Where overlays portal to: the nearest provider's container, or undefined
 * for the document body.
 *
 * @returns The container.
 */
export const usePortalContainer = (): HTMLElement | undefined =>
	useContext(PortalContainerContext) ?? undefined;
