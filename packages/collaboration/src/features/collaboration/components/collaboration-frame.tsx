import { Menu, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
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
	SidebarTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import semossLogo from "@/assets/img/semoss-logo.svg";
import { useDashboard } from "@/features/dashboard/dashboard.context";
import { DashboardSourceDialog } from "@/features/dashboard/dashboard-source-dialog";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { CollaborationNavigation } from "./collaboration-navigation";
import { CollaborationNavigationControlContext } from "./collaboration-navigation-control.context";
import { CollaborationSearch } from "./collaboration-search";
import { TopicEditor } from "./topic-editor";
import { useNavigationPreferences } from "./use-navigation-preferences";

// Keep responsive focus behavior aligned with the shell's lg breakpoint.
const DESKTOP_NAVIGATION_QUERY = "(min-width: 64rem)";

/** A single sidebar follows the user from their day into a conversation. */
export function CollaborationFrame() {
	const { isSearchOpen } = useDashboard();
	const { state } = useCollaborationSession();
	const {
		isCollapsed: isNavigationCollapsed,
		setIsCollapsed: setIsNavigationCollapsed,
		isTopicsOpen,
		setIsTopicsOpen,
		isSessionsOpen,
		setIsSessionsOpen,
	} = useNavigationPreferences(
		state.profile.email || state.profile.id,
		`${window.location.origin}${Env.MODULE}${window.location.pathname}`,
	);
	const [isNavOpen, setIsNavOpen] = useState(false);
	const [isCreatingTopic, setIsCreatingTopic] = useState(false);
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
	const headerNavigationRef = useRef<HTMLButtonElement>(null);
	const [hasHeaderNavigation, setHasHeaderNavigation] = useState(false);
	const registerHeaderNavigation = useCallback(
		(node: HTMLButtonElement | null) => {
			headerNavigationRef.current = node;
			setHasHeaderNavigation(Boolean(node));
		},
		[],
	);
	const mobileTriggerRef = useRef<HTMLButtonElement>(null);
	const newTopicReturnFocusRef = useRef<HTMLButtonElement>(null);
	const isNavigating = useRef(false);
	const shouldRestoreNavigationFocus = useRef(false);
	useEffect(() => {
		if (!shouldRestoreNavigationFocus.current) return;
		shouldRestoreNavigationFocus.current = false;
		const control = isCollapsed
			? (headerNavigationRef.current ??
				desktopNavigationRef.current?.querySelector<HTMLButtonElement>(
					'button[aria-label="Expand navigation"]',
				))
			: desktopNavigationRef.current?.querySelector<HTMLButtonElement>(
					'button[aria-label="Collapse navigation"]',
				);
		control?.focus();
	}, [isCollapsed]);
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
		const media = window.matchMedia?.(DESKTOP_NAVIGATION_QUERY);
		if (!media) return;
		const handleChange = () => {
			if (media.matches) {
				setIsNavOpen(false);
				if (document.activeElement === mobileTriggerRef.current)
					(
						headerNavigationRef.current ??
						desktopNavigationRef.current?.querySelector("button")
					)?.focus();
			} else if (
				desktopNavigationRef.current?.contains(
					document.activeElement,
				) ||
				document.activeElement === headerNavigationRef.current
			) {
				mobileTriggerRef.current?.focus();
			}
		};
		media.addEventListener("change", handleChange);
		return () => media.removeEventListener("change", handleChange);
	}, []);
	function handleNewTopic(trigger: HTMLButtonElement): void {
		newTopicReturnFocusRef.current = trigger;
		setIsCreatingTopic(true);
	}
	function handleNavigationOpenChange(isOpen: boolean): void {
		shouldRestoreNavigationFocus.current = Boolean(
			desktopNavigationRef.current?.contains(document.activeElement) ||
				document.activeElement === headerNavigationRef.current,
		);
		if (isRoom) {
			setNavigationOverride({ pathname, isCollapsed: !isOpen });
			return;
		}
		setIsNavigationCollapsed(!isOpen);
	}
	function handleCloseTopic(): void {
		if (!newTopicReturnFocusRef.current?.getClientRects().length) {
			newTopicReturnFocusRef.current = window.matchMedia?.(
				DESKTOP_NAVIGATION_QUERY,
			).matches
				? (headerNavigationRef.current ??
					desktopNavigationRef.current?.querySelector<HTMLButtonElement>(
						isCollapsed
							? "button"
							: 'button[aria-label="New topic"]',
					) ??
					null)
				: mobileTriggerRef.current;
		}
		setIsCreatingTopic(false);
	}
	const roomNavigationControl =
		isRoom && isCollapsed ? (
			<Tooltip disableHoverableContent={false}>
				<TooltipTrigger asChild>
					<SidebarTrigger
						ref={registerHeaderNavigation}
						variant="ghost"
						aria-label="Expand navigation"
						aria-expanded={false}
						aria-controls={navigationId}
						className="hidden pointer-coarse:size-11 size-8 shrink-0 text-muted-foreground lg:inline-flex"
					/>
				</TooltipTrigger>
				<TooltipContent>Expand navigation</TooltipContent>
			</Tooltip>
		) : null;
	return (
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
				className={cn(
					"relative hidden shrink-0 flex-col border-sidebar-border border-r bg-background lg:flex",
					isCollapsed ? "w-16" : "w-64",
				)}
			>
				{!isCollapsed && (
					<Tooltip disableHoverableContent={false}>
						<TooltipTrigger asChild>
							<SidebarRail
								type="button"
								tabIndex={0}
								aria-label="Collapse navigation"
								aria-expanded
								aria-controls={navigationId}
								title={undefined}
								onClick={() =>
									handleNavigationOpenChange(false)
								}
								className="focus-visible:-outline-offset-2 end-0 w-6 translate-x-1/2 focus-visible:outline-2 focus-visible:outline-ring motion-reduce:transition-none"
							/>
						</TooltipTrigger>
						<TooltipContent side="right">
							Collapse navigation
						</TooltipContent>
					</Tooltip>
				)}
				<div
					id={navigationId}
					className={cn("h-full min-h-0", !isCollapsed && "pr-2")}
				>
					<CollaborationNavigation
						isCollapsed={isCollapsed}
						onCollapse={
							isCollapsed && !hasHeaderNavigation
								? () => handleNavigationOpenChange(true)
								: undefined
						}
						isTopicsOpen={isTopicsOpen}
						onTopicsOpenChange={setIsTopicsOpen}
						isSessionsOpen={isSessionsOpen}
						onSessionsOpenChange={setIsSessionsOpen}
						onNewTopic={handleNewTopic}
					/>
				</div>
			</aside>
			<main
				ref={mainRef}
				id={mainId}
				tabIndex={-1}
				className="flex min-h-0 min-w-0 flex-1 flex-col outline-none"
			>
				<div className="flex shrink-0 items-center gap-2 border-border border-b bg-background px-3 py-2 lg:hidden">
					<Sheet
						open={isNavOpen}
						onOpenChange={(open) => {
							setIsNavOpen(open);
							if (open) isNavigating.current = false;
						}}
					>
						<SheetTrigger asChild>
							<Button
								ref={mobileTriggerRef}
								variant="ghost"
								size="icon"
								className="size-11"
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
								if (isCreatingTopic) {
									event.preventDefault();
								} else if (
									window.matchMedia?.(
										DESKTOP_NAVIGATION_QUERY,
									).matches
								) {
									event.preventDefault();
									if (!isSearchOpen)
										(
											headerNavigationRef.current ??
											desktopNavigationRef.current?.querySelector(
												"button",
											)
										)?.focus();
								} else if (isNavigating.current) {
									event.preventDefault();
									if (!isSearchOpen) mainRef.current?.focus();
								}
							}}
						>
							<SheetHeader className="sr-only">
								<SheetTitle>Workspace navigation</SheetTitle>
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
								isTopicsOpen={isTopicsOpen}
								onTopicsOpenChange={setIsTopicsOpen}
								isSessionsOpen={isSessionsOpen}
								onSessionsOpenChange={setIsSessionsOpen}
								onNewTopic={handleNewTopic}
								onNavigate={() => {
									isNavigating.current = true;
									setIsNavOpen(false);
								}}
							/>
						</SheetContent>
					</Sheet>
					<NavLink
						to="/"
						className="flex min-h-11 min-w-0 items-center gap-2 rounded-sm font-medium focus-visible:outline-2 focus-visible:outline-ring"
					>
						<img
							src={semossLogo}
							alt=""
							width={24}
							height={28}
							className="h-7 w-6 shrink-0 dark:invert"
						/>
						Collaboration
					</NavLink>
				</div>
				<CollaborationNavigationControlContext.Provider
					value={roomNavigationControl}
				>
					<Outlet />
				</CollaborationNavigationControlContext.Provider>
			</main>
			<CollaborationSearch paletteOnly />
			<DashboardSourceDialog />
			{isCreatingTopic && (
				<TopicEditor
					returnFocusRef={newTopicReturnFocusRef}
					onClose={handleCloseTopic}
				/>
			)}
		</SidebarProvider>
	);
}
