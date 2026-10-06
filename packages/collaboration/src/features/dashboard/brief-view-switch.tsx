import { LayoutGrid, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Button, cn } from "@semoss/ui/next";

/** Switches brief/chat while carrying the current chat identity back to the brief. */
export function BriefViewSwitch({
	view,
	chatPath,
	chatState,
}: {
	view: "brief" | "chat";
	chatPath?: string;
	chatState?: unknown;
}) {
	const location = useLocation();
	const navigate = useNavigate();
	const returnTo: unknown = location.state?.chatReturnTo;
	const saved =
		returnTo &&
		typeof returnTo === "object" &&
		"pathname" in returnTo &&
		typeof returnTo.pathname === "string" &&
		(returnTo.pathname === "/new" ||
			returnTo.pathname.startsWith("/work/thread/"))
			? returnTo
			: null;
	const destination = view === "chat" ? "/" : (saved?.pathname ?? "/new");
	const navigationState =
		view === "chat"
			? {
					chatReturnTo: {
						pathname: chatPath ?? location.pathname,
						state: chatState ?? location.state,
					},
				}
			: saved && "state" in saved
				? saved.state
				: undefined;
	useEffect(() => {
		const handleKey = (event: KeyboardEvent) => {
			if (
				(event.metaKey || event.ctrlKey) &&
				event.key.toLowerCase() === "j" &&
				!event.altKey &&
				!event.shiftKey
			) {
				event.preventDefault();
				void navigate(destination, { state: navigationState });
			}
		};
		window.addEventListener("keydown", handleKey);
		return () => window.removeEventListener("keydown", handleKey);
	}, [destination, navigationState, navigate]);
	return (
		<nav
			aria-label="Brief and chat"
			className="flex shrink-0 items-center rounded-xl border bg-muted/50 p-1"
		>
			{(["brief", "chat"] as const).map((mode) => {
				const Icon = mode === "brief" ? LayoutGrid : Sparkles;
				return (
					<Button
						key={mode}
						asChild
						variant="ghost"
						size="sm"
						className={cn(
							"h-8 gap-2 rounded-lg px-3 font-normal text-muted-foreground",
							view === mode &&
								"bg-card text-foreground shadow-sm hover:bg-card",
						)}
					>
						<Link
							onClick={(event) => {
								if (view === mode) event.preventDefault();
							}}
							to={view === mode ? location.pathname : destination}
							state={
								view === mode ? location.state : navigationState
							}
							aria-current={view === mode ? "page" : undefined}
						>
							<Icon aria-hidden="true" className="size-4" />
							{mode === "brief" ? "Brief" : "Chat"}
							{mode === "chat" && (
								<kbd className="hidden rounded border bg-background px-1 font-mono text-muted-foreground text-xs sm:inline">
									⌘J
								</kbd>
							)}
						</Link>
					</Button>
				);
			})}
		</nav>
	);
}
