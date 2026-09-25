import { Brain, Menu, Moon, Sun, Undo2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { NavLink, Outlet } from "react-router";
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
import { PersonAvatar } from "./person-avatar";

/** Shell implementation is exported separately for focused navigation tests. */
export function CollaborationShell() {
	const { undo, canUndo, dispatch } = useCollaborationSession();
	const { theme, setTheme } = useTheme();
	const user = useCurrentUser();
	const mainId = useId();
	const mainRef = useRef<HTMLElement>(null);
	const [isNavOpen, setIsNavOpen] = useState(false);
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
		<div className="-m-4 flex h-dvh flex-col overflow-hidden bg-background text-foreground">
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
			<header className="flex min-h-14 shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2 md:gap-4 md:px-5">
				<Sheet open={isNavOpen} onOpenChange={setIsNavOpen}>
					<SheetTrigger asChild>
						<Button
							className="lg:hidden"
							variant="ghost"
							size="icon"
							aria-label="Open navigation"
						>
							<Menu aria-hidden="true" />
						</Button>
					</SheetTrigger>
					<SheetContent
						side="left"
						className="w-full overflow-y-auto sm:max-w-xs"
					>
						<SheetHeader>
							<SheetTitle>Workspace navigation</SheetTitle>
						</SheetHeader>
						<CollaborationNavigation
							onNavigate={() => setIsNavOpen(false)}
						/>
					</SheetContent>
				</Sheet>
				<NavLink
					to="/work"
					className="mr-2 hidden items-center gap-2 font-medium md:flex"
				>
					<Brain className="size-5 text-primary" aria-hidden="true" />
					collaboration<span className="text-primary">.</span>
				</NavLink>
				<nav
					aria-label="Workspace area"
					className="flex rounded-lg bg-muted p-1"
				>
					{["Work", "Brain"].map((area) => (
						<NavLink
							key={area}
							to={`/${area.toLowerCase()}`}
							className={({ isActive }) =>
								cn(
									"rounded-md px-3 py-1.5 font-medium text-sm",
									isActive
										? "bg-background text-foreground shadow-sm"
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
								size="icon"
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
						size="icon"
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
						<PersonAvatar name={user.name || "You"} />
					</span>
				</div>
			</header>
			<div className="flex min-h-0 flex-1">
				<aside
					className="hidden w-56 shrink-0 overflow-y-auto border-r bg-muted/30 lg:block"
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
					<Outlet />
				</main>
			</div>
		</div>
	);
}
