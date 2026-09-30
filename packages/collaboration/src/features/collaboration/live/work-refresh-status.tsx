import { Alert, AlertDescription, Button } from "@semoss/ui/next";
import { useWorkUpdates } from "./work-updates.context";

/** Connection feedback belongs on work/source pages, never in the Context pane. */
export function WorkRefreshStatus() {
	const updates = useWorkUpdates();
	if (!updates) return null;
	return (
		<div className="flex flex-wrap items-center gap-2">
			<output className="text-muted-foreground text-sm">
				{updates.isRefreshing
					? "Checking for updates…"
					: updates.error
						? "Updates paused"
						: updates.lastUpdated
							? `Updated ${new Date(updates.lastUpdated).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
							: "Automatic updates on"}
			</output>
			<Button
				type="button"
				size="sm"
				variant="ghost"
				disabled={updates.isRefreshing}
				onClick={updates.refresh}
			>
				{updates.error ? "Retry updates" : "Refresh"}
			</Button>
			{updates.error && (
				<Alert variant="destructive">
					<AlertDescription>{updates.error}</AlertDescription>
				</Alert>
			)}
		</div>
	);
}
