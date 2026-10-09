import { Menu, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router";
import { Env } from "@semoss/sdk/react";
import {
	Button,
	cn,
	Sheet,
	SheetClose,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
	SidebarProvider,
	SidebarRail,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useDashboard } from "@/features/dashboard/dashboard.context";
import { DashboardSourceDialog } from "@/features/dashboard/dashboard-source-dialog";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { CollaborationAccountContext } from "./collaboration-account.context";
import { CollaborationHeader } from "./collaboration-header";
import { CollaborationHeaderContext } from "./collaboration-header.context";
import { CollaborationNavigation } from "./collaboration-navigation";
import { CollaborationSearch } from "./collaboration-search";
import { CollaborationWorkbenchLayoutContext } from "./collaboration-workbench-layout.context";
import { useCollaborationAccount } from "./use-collaboration-account";
import { useCollaborationWorkbenchLayout } from "./use-collaboration-workbench-layout";
import { useNavigationPreferences } from "./use-navigation-preferences";

// Keep responsive focus behavior aligned with the shell's lg breakpoint.
const DESKTOP_NAVIGATION_QUERY = "(min-width: 64rem)";

/** A single sidebar follows the user from their day into a conversation. */
export function CollaborationFrame() {
	const { isSearchOpen } = useDashboard();
	const { state } = useCollaborationSession();
	const account = useCollaborationAccount();
	const {
		contentRef,
		headerRef,
		registerConversation,
		isWorkbenchLayoutActive,
	} = useCollaborationWorkbenchLayout();
	const {
		isCollapsed: isNavigationCollapsed,
		setIsCollapsed: setIsNavigationCollapsed,
	} = useNavigationPreferences(
		state.profile.email || state.profile.id,
		`${window.location.origin}${Env.MODULE}${window.location.pathname}`,
	);
	const [isNavOpen, setIsNavOpen] = useState(false);
	const [headerControls, setHeaderControls] = useState<HTMLDivElement | null>(
		null,
	);
	const { pathname } = useLocation();
	const [navigationOverride, setNavigationOverride] = useState<{
		pathname: string;
		isCollapsed: boolean;
	} | null>(null);
	if (navigationOverride && navigationOverride.pathname !== pathname) {
		// An explicit expansion applies only until the user opens another page.
		setNavigationOverride(null);
	}
	const isRoom = pathname.startsWith("/thread/");
	const isCollapsed =
		navigationOverride?.pathname === pathname
			? navigationOverride.isCollapsed
			: isRoom || isNavigationCollapsed;
	const mainId = useId();
	const navigationId = useId();
	const mainRef = useRef<HTMLElement>(null);
	const desktopNavigationRef = useRef<HTMLElement>(null);
	const navigationRailRef = useRef<HTMLButtonElement>(null);
	const mobileTriggerRef = useRef<HTMLButtonElement>(null);
	const isNavigating = useRef(false);
	useEffect(() => {
		if (
			pathname.startsWith("/thread/") &&
			desktopNavigationRef.current?.contains(document.activeElement)
		) {
			// Opening a room hides session links; move keyboard focus into the room.
			mainRef.current?.focus();
		}
		setIsNavOpen(false);
	}, [pathname]);
	useEffect(() => {
		if (isSearchOpen) setIsNavOpen(false);
	}, [isSearchOpen]);
	useEffect(() => {
		const media = window.matchMedia?.(DESKTOP_NAVIGATION_QUERY);
		if (!media) return;
		let focusFrame: number | undefined;
		const handleChange = () => {
			if (focusFrame !== undefined)
				window.cancelAnimationFrame(focusFrame);
			// Portaled menus retain their navigation owner through the trigger label.
			const menuTriggerId = document.activeElement
				?.closest('[role="menu"]')
				?.getAttribute("aria-labelledby");
			const menuTrigger = menuTriggerId
				? document.getElementById(menuTriggerId)
				: null;
			if (media.matches) {
				setIsNavOpen(false);
				if (document.activeElement === mobileTriggerRef.current)
					(
						navigationRailRef.current ??
						desktopNavigationRef.current?.querySelector("button")
					)?.focus();
			} else if (
				desktopNavigationRef.current?.contains(
					document.activeElement,
				) ||
				(menuTrigger &&
					desktopNavigationRef.current?.contains(menuTrigger)) ||
				document.activeElement === navigationRailRef.current
			) {
				if (menuTrigger) {
					// Wait until the closing menu releases its modal focus scope.
					focusFrame = window.requestAnimationFrame(() =>
						mobileTriggerRef.current?.focus(),
					);
				} else mobileTriggerRef.current?.focus();
			}
		};
		media.addEventListener("change", handleChange);
		return () => {
			media.removeEventListener("change", handleChange);
			if (focusFrame !== undefined)
				window.cancelAnimationFrame(focusFrame);
		};
	}, []);
	function handleNavigationOpenChange(isOpen: boolean): void {
		if (
			desktopNavigationRef.current?.contains(document.activeElement) ||
			document.activeElement === navigationRailRef.current
		)
			navigationRailRef.current?.focus();
		if (isRoom) {
			setNavigationOverride({ pathname, isCollapsed: !isOpen });
			return;
		}
		setIsNavigationCollapsed(!isOpen);
	}
	const navigationLabel = isCollapsed
		? "Expand navigation"
		: "Collapse navigation";
	return (
		<CollaborationAccountContext.Provider value={account}>
			<SidebarProvider
				open={!isCollapsed}
				onOpenChange={handleNavigationOpenChange}
				className="-m-4 collaboration-frame relative h-dvh min-h-0 w-auto overflow-hidden bg-muted/20 text-foreground"
			>
				<a
					href={`#${mainId}`}
					className="sr-only focus:not-sr-only focus:absolute focus:z-30 focus:bg-background focus:p-3"
					onClick={(event) => {
						event.preventDefault();
						mainRef.current?.focus();
					}}
				>
					Skip to content
				</a>
				<aside
					ref={desktopNavigationRef}
					aria-label="Workspace navigation"
					data-side="left"
					data-state={isCollapsed ? "collapsed" : "expanded"}
					className={cn(
						"relative hidden shrink-0 flex-col border-sidebar-border border-r bg-background lg:flex",
						isCollapsed ? "w-16" : "w-64",
					)}
				>
					<div id={navigationId} className="h-full min-h-0">
						<CollaborationNavigation isCollapsed={isCollapsed} />
					</div>
					<Tooltip disableHoverableContent={false}>
						<TooltipTrigger asChild>
							<SidebarRail
								ref={navigationRailRef}
								type="button"
								tabIndex={0}
								aria-label={navigationLabel}
								aria-expanded={!isCollapsed}
								aria-controls={navigationId}
								title={undefined}
								onClick={() =>
									handleNavigationOpenChange(isCollapsed)
								}
								className="-right-3 w-6 translate-x-0 after:rounded-full hover:after:bg-muted-foreground focus-visible:outline-none focus-visible:after:bg-ring motion-reduce:transition-none"
							/>
						</TooltipTrigger>
						<TooltipContent side="right">
							{navigationLabel}
						</TooltipContent>
					</Tooltip>
				</aside>
				<div
					ref={contentRef}
					className="relative flex min-h-0 min-w-0 flex-1 flex-col"
				>
					<CollaborationHeaderContext.Provider value={headerControls}>
						<CollaborationWorkbenchLayoutContext.Provider
							value={{ registerConversation }}
						>
							<div
								className={cn(
									"@container/collaboration-header shrink-0",
									isWorkbenchLayoutActive &&
										"md:absolute md:top-0 md:left-0 md:z-10 md:w-(--collaboration-conversation-width)",
								)}
							>
								<CollaborationHeader
									roomControlsRef={setHeaderControls}
									headerRef={headerRef}
								>
									<Sheet
										open={isNavOpen}
										onOpenChange={(open) => {
											setIsNavOpen(open);
											if (open)
												isNavigating.current = false;
										}}
									>
										<SheetTrigger asChild>
											<Button
												ref={mobileTriggerRef}
												variant="ghost"
												size="icon"
												className="size-11 shrink-0 lg:hidden"
												aria-label="Open navigation"
											>
												<Menu aria-hidden="true" />
											</Button>
										</SheetTrigger>
										<SheetContent
											side="left"
											showCloseButton={false}
											className="flex w-72 flex-col gap-0 bg-background p-0 pt-12 motion-reduce:animate-none"
											aria-describedby={undefined}
											onCloseAutoFocus={(event) => {
												if (
													window.matchMedia?.(
														DESKTOP_NAVIGATION_QUERY,
													).matches
												) {
													event.preventDefault();
													if (!isSearchOpen)
														(
															navigationRailRef.current ??
															desktopNavigationRef.current?.querySelector(
																"button",
															)
														)?.focus();
												} else if (
													isNavigating.current
												) {
													event.preventDefault();
													if (!isSearchOpen)
														mainRef.current?.focus();
												}
											}}
										>
											<SheetHeader className="sr-only">
												<SheetTitle>
													Workspace navigation
												</SheetTitle>
											</SheetHeader>
											<SheetClose asChild>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													className="absolute top-1 right-2 size-11"
													aria-label="Close navigation"
												>
													<X aria-hidden="true" />
												</Button>
											</SheetClose>
											<CollaborationNavigation
												onNavigate={() => {
													isNavigating.current = true;
													setIsNavOpen(false);
												}}
											/>
										</SheetContent>
									</Sheet>
								</CollaborationHeader>
							</div>
							<main
								ref={mainRef}
								id={mainId}
								tabIndex={-1}
								className="flex min-h-0 min-w-0 flex-1 flex-col outline-none"
							>
								<Outlet />
							</main>
						</CollaborationWorkbenchLayoutContext.Provider>
					</CollaborationHeaderContext.Provider>
				</div>
				<CollaborationSearch paletteOnly />
				<DashboardSourceDialog />
			</SidebarProvider>
		</CollaborationAccountContext.Provider>
	);
}
