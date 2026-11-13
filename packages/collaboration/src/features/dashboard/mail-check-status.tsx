import { RefreshCw } from "lucide-react";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { checkTime } from "@/features/collaboration/live/work-refresh-status";
import { useWorkUpdates } from "@/features/collaboration/live/work-updates.context";
import { useDashboard } from "./dashboard.context";

/** When Microsoft 365 was last read, after a button that reads it again; the same line on every hero page. */
export function MailCheckStatus() {
	const { refreshSources } = useDashboard();
	const updates = useWorkUpdates();
	// the same check as the Refresh on Topics: when Microsoft 365 was last read, not when this page re-read
	const check = updates?.lastMailCheck ?? null;
	const isChecking = Boolean(
		updates?.isSyncing || check?.status === "running",
	);
	return (
		// the button leads, pulled left so its icon sits on the text edge whether or not a time follows
		<div className="-ms-1.5 flex items-center gap-1">
			<Tooltip disableHoverableContent={false}>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Check for new mail"
						disabled={!updates || isChecking}
						className="pointer-coarse:size-11 size-7 text-muted-foreground"
						onClick={() => {
							updates?.syncMail();
							refreshSources();
						}}
					>
						<RefreshCw
							aria-hidden="true"
							className={cn(
								"size-3.5",
								isChecking && "animate-spin",
							)}
						/>
					</Button>
				</TooltipTrigger>
				<TooltipContent>Check for new mail</TooltipContent>
			</Tooltip>
			<span>
				{isChecking
					? "Checking…"
					: updates?.syncError || check?.status === "failed"
						? "Last check failed"
						: check?.at
							? `Updated ${checkTime(check.at)}`
							: ""}
			</span>
		</div>
	);
}
