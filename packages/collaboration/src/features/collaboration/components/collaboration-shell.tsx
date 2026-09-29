import { Menu, Moon, Sun, Undo2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Link, NavLink, Outlet, useMatch } from "react-router";
import {
	Button,
	cn,
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	useTheme,
} from "@semoss/ui/next";
import { useCurrentUser } from "@/features/account/api/use-current-user";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { CollaborationNavigation } from "./collaboration-navigation";
import { CollaborationSearch } from "./collaboration-search";
import { CollaborationSidebarProvider } from "./collaboration-sidebar-provider";
import { PersonAvatar } from "./person-avatar";

/** Shell implementation is exported separately for focused navigation tests. */
export function CollaborationShell() {
	const threadMatch = useMatch("/work/thread/:threadId");
	const isWorkThread = Boolean(threadMatch);
	const activeThreadId = threadMatch?.params.threadId;
	const { undo, canUndo, dispatch, state } = useCollaborationSession();
	// an owner with no mail yet starts with onboarding
	const needsSetup = state.threads.length === 0;
	const { theme, setTheme } = useTheme();
	const user = useCurrentUser();
	const mainId = useId();
	const mainRef = useRef<HTMLElement>(null);
	const [isNavOpen, setIsNavOpen] = useState(false);
	const isNavigating = useRef(false);
	useEffect(() => {
		if (activeThreadId) setIsNavOpen(false);
	}, [activeThreadId]);
	useEffect(() => {
		if (!user.name && !user.email) return;
		dispatch({
			type: "live-profile.set",
			profile: {
				id: "live-me",
				name: user.name || user.email,
				email: user.email,
				initials: "",
				org: "",
				role: { value: "", source: "you" },
				timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
				workingHours: "",
				vips: [],
				style: {
					summary: "",
					source: "you",
					confirmed: true,
					examples: [],
				},
			},
		});
	}, [dispatch, user.name, user.email]);
	return (
		<CollaborationSidebarProvider>
			<div className="-m-4 flex h-dvh flex-col overflow-hidden bg-muted text-foreground dark:bg-background">
				<a
					href={`#${mainId}`}
					onClick={(event) => {
						event.preventDefault();
						mainRef.current?.focus();
					}}
					className="sr-only focus:not-sr-only focus:p-3"
				>
					Skip to content
				</a>
				<header className="dark flex min-h-13 shrink-0 items-center gap-1 border-border border-b bg-background px-2 py-1.5 text-foreground sm:gap-3 sm:px-4">
					<Sheet
						open={isNavOpen}
						onOpenChange={(open) => {
							if (open) isNavigating.current = false;
							setIsNavOpen(open);
						}}
					>
						<SheetTrigger asChild>
							<Button
								className={cn(!isWorkThread && "lg:hidden")}
								variant="ghost"
								size="icon"
								aria-label="Open navigation"
							>
								<Menu aria-hidden="true" />
							</Button>
						</SheetTrigger>
						<SheetContent
							side="left"
							onCloseAutoFocus={(event) => {
								if (isNavigating.current)
									event.preventDefault();
								isNavigating.current = false;
							}}
							className="w-full overflow-y-auto sm:max-w-xs"
						>
							<SheetHeader>
								<SheetTitle>Workspace navigation</SheetTitle>
							</SheetHeader>
							<CollaborationNavigation
								onNavigate={() => {
									isNavigating.current = true;
									setIsNavOpen(false);
								}}
							/>
						</SheetContent>
					</Sheet>
					<NavLink
						to="/work"
						className="mr-1 hidden shrink-0 items-center gap-3 font-medium lg:flex"
					>
						<span className="font-bold text-lg tracking-tight">
							collaboration<span className="text-primary">.</span>
						</span>
					</NavLink>
					<nav
						aria-label="Workspace area"
						className="flex shrink-0 rounded-lg border border-border bg-sidebar p-0.5"
					>
						{["Work", "Brain"].map((area) => (
							<NavLink
								key={area}
								to={`/${area.toLowerCase()}`}
								className={({ isActive }) =>
									cn(
										"inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 font-medium text-sm sm:px-3",
										isActive
											? "bg-muted text-foreground before:size-1.5 before:rounded-full before:bg-primary"
											: "text-muted-foreground hover:text-foreground",
									)
								}
							>
								{area}
							</NavLink>
						))}
					</nav>
					<CollaborationSearch />
					<div className="ml-auto flex items-center gap-1">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									disabled={!canUndo}
									aria-label="Undo last session change"
									onClick={undo}
								>
									<Undo2 aria-hidden="true" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Undo session change</TooltipContent>
						</Tooltip>
						<Button
							variant="ghost"
							size="icon-sm"
							className="rounded-full border border-border"
							aria-label={
								theme === "dark"
									? "Use light theme"
									: "Use dark theme"
							}
							onClick={() =>
								setTheme(theme === "dark" ? "light" : "dark")
							}
						>
							{theme === "dark" ? (
								<Sun aria-hidden="true" />
							) : (
								<Moon aria-hidden="true" />
							)}
						</Button>
						<span
							title={user.name || "Signed-in account"}
							className="hidden sm:block"
						>
							<PersonAvatar
								name={user.name || "You"}
								className="size-8 ring-1 ring-border"
							/>
						</span>
					</div>
				</header>
				<div
					className={cn(
						"mx-auto flex min-h-0 w-full flex-1 px-2 lg:px-0",
						!isWorkThread && "max-w-350",
					)}
				>
					<aside
						className={cn(
							"hidden w-60 shrink-0 overflow-y-auto",
							!isWorkThread && "lg:block",
						)}
						aria-label="Workspace navigation"
					>
						<CollaborationNavigation />
					</aside>
					<main
						ref={mainRef}
						id={mainId}
						tabIndex={-1}
						className="flex min-h-0 min-w-0 flex-1 flex-col outline-none"
					>
						{needsSetup && (
							<div className="m-2 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-card p-3 text-sm shadow-sm ring-1 ring-border/50 sm:mt-3 sm:mr-2 sm:ml-1">
								<span>
									No mail yet. Set up with your mailbox to
									fill Work and Brain.
								</span>
								<Button asChild size="sm">
									<Link to="/onboarding">Set up</Link>
								</Button>
							</div>
						)}
						<Outlet />
					</main>
				</div>
			</div>
		</CollaborationSidebarProvider>
	);
}
