import {
	type RefObject,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { useLocation } from "react-router";
import { CollaborationSidebarContext } from "./collaboration-sidebar.context";
import { restoreThreadFocus } from "./thread-menu.utils";

// Matches CollaborationSurface's xl sidebar breakpoint.
const SIDEBAR_QUERY = "(min-width: 80rem)";

interface SidebarControls {
	desktopRef: RefObject<HTMLElement | null>;
	triggerRef: RefObject<HTMLButtonElement | null>;
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onCloseAutoFocus: (event: Event) => void;
}

/** Register the page sidebar and coordinate its sheet, desktop focus, and dismissal. */
export function useCollaborationSidebar(
	hasSidebar: boolean,
	title: string,
): SidebarControls {
	const { key: routeKey } = useLocation();
	const registerSidebar = useContext(
		CollaborationSidebarContext,
	)?.registerSidebar;
	const desktopRef = useRef<HTMLElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const returnFocus = useRef<HTMLElement | null>(null);
	const pendingFrame = useRef<number | null>(null);
	const [openRoute, setOpenRoute] = useState<string | null>(null);
	const [isWide, setIsWide] = useState(
		() => window.matchMedia?.(SIDEBAR_QUERY).matches ?? false,
	);
	useEffect(() => {
		const media = window.matchMedia?.(SIDEBAR_QUERY);
		if (!media) return;
		const handleChange = () => setIsWide(media.matches);
		handleChange();
		media.addEventListener("change", handleChange);
		return () => media.removeEventListener("change", handleChange);
	}, []);
	useEffect(() => {
		setOpenRoute((current) =>
			hasSidebar && current === routeKey ? current : null,
		);
		return () => {
			if (pendingFrame.current !== null)
				cancelAnimationFrame(pendingFrame.current);
		};
	}, [routeKey, hasSidebar]);
	useEffect(() => {
		if (isWide && openRoute === routeKey) {
			setOpenRoute(null);
			desktopRef.current?.focus();
		}
	}, [isWide, openRoute, routeKey]);
	const open = useCallback(
		(trigger: HTMLElement | null) => {
			returnFocus.current = trigger;
			if (pendingFrame.current !== null)
				cancelAnimationFrame(pendingFrame.current);
			// Let the originating menu/navigation sheet finish releasing its focus scope.
			pendingFrame.current = requestAnimationFrame(() => {
				pendingFrame.current = null;
				if (window.matchMedia?.(SIDEBAR_QUERY).matches)
					desktopRef.current?.focus();
				else setOpenRoute(routeKey);
			});
		},
		[routeKey],
	);
	useEffect(() => {
		if (hasSidebar && registerSidebar)
			return registerSidebar({ title, open });
	}, [hasSidebar, registerSidebar, title, open]);
	return {
		desktopRef,
		triggerRef,
		isOpen: hasSidebar && !isWide && openRoute === routeKey,
		onOpenChange: (isOpen) => {
			if (isOpen) returnFocus.current = triggerRef.current;
			setOpenRoute(isOpen ? routeKey : null);
		},
		onCloseAutoFocus: (event) => {
			event.preventDefault();
			if (isWide) desktopRef.current?.focus();
			else restoreThreadFocus(returnFocus.current ?? triggerRef.current);
		},
	};
}
