import { Menu, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
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
} from "@semoss/ui/next";
import { useDashboard } from "@/features/dashboard/dashboard.context";
import { DashboardSourceDialog } from "@/features/dashboard/dashboard-source-dialog";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { CollaborationNavigation } from "./collaboration-navigation";
import { CollaborationSearch } from "./collaboration-search";
import { TopicEditor } from "./topic-editor";
import { useNavigationPreferences } from "./use-navigation-preferences";

// Keep responsive focus behavior aligned with the shell's lg breakpoint.
const DESKTOP_NAVIGATION_QUERY = "(min-width: 64rem)";

/** A single sidebar follows the user from their day into a conversation. */
export function CollaborationFrame() {
	const { isSearchOpen } = useDashboard();
	const { state } = useCollaborationSession();
	const { isCollapsed, setIsCollapsed, isTopicsOpen, setIsTopicsOpen } =
		useNavigationPreferences(
			state.profile.email || state.profile.id,
			`${window.location.origin}${Env.MODULE}${window.location.pathname}`,
		);
	const [isNavOpen, setIsNavOpen] = useState(false);
	const [isCreatingTopic, setIsCreatingTopic] = useState(false);
	const { pathname } = useLocation();
	const mainId = useId();
	const mainRef = useRef<HTMLElement>(null);
	const desktopNavigationRef = useRef<HTMLElement>(null);
	const mobileTriggerRef = useRef<HTMLButtonElement>(null);
	const newTopicReturnFocusRef = useRef<HTMLButtonElement>(null);
	const isNavigating = useRef(false);
	useEffect(() => {
		void pathname;
		setIsNavOpen(false);
	}, [pathname]);
	useEffect(() => {
		const media = window.matchMedia?.(DESKTOP_NAVIGATION_QUERY);
		if (!media) return;
		const handleChange = () => {
			if (media.matches) {
				setIsNavOpen(false);
				if (document.activeElement === mobileTriggerRef.current)
					desktopNavigationRef.current
						?.querySelector("button")
						?.focus();
			} else if (
				desktopNavigationRef.current?.contains(document.activeElement)
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
	function handleCloseTopic(): void {
		if (!newTopicReturnFocusRef.current?.getClientRects().length) {
			newTopicReturnFocusRef.current = window.matchMedia?.(
				DESKTOP_NAVIGATION_QUERY,
			).matches
				? (desktopNavigationRef.current?.querySelector<HTMLButtonElement>(
						isCollapsed
							? "button"
							: 'button[aria-label="New topic"]',
					) ?? null)
				: mobileTriggerRef.current;
		}
		setIsCreatingTopic(false);
	}
	return (
		<div className="-m-4 collaboration-frame relative flex h-dvh overflow-hidden bg-muted/20 text-foreground">
			<a
				href={`#${mainId}`}
				className="sr-only focus:not-sr-only focus:absolute focus:z-10 focus:bg-background focus:p-3"
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
				className={cn(
					"hidden shrink-0 flex-col border-border border-r bg-background lg:flex",
					isCollapsed ? "w-16" : "w-64",
				)}
			>
				<CollaborationNavigation
					isCollapsed={isCollapsed}
					onCollapse={() => setIsCollapsed(!isCollapsed)}
					isTopicsOpen={isTopicsOpen}
					onTopicsOpenChange={setIsTopicsOpen}
					onNewTopic={handleNewTopic}
				/>
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
										desktopNavigationRef.current
											?.querySelector("button")
											?.focus();
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
								onNewTopic={handleNewTopic}
								onNavigate={() => {
									isNavigating.current = true;
									setIsNavOpen(false);
								}}
							/>
						</SheetContent>
					</Sheet>
					<NavLink to="/" className="font-medium">
						Collaboration
					</NavLink>
				</div>
				<Outlet />
			</main>
			<CollaborationSearch paletteOnly />
			<DashboardSourceDialog />
			{isCreatingTopic && (
				<TopicEditor
					returnFocusRef={newTopicReturnFocusRef}
					onClose={handleCloseTopic}
				/>
			)}
		</div>
	);
}
