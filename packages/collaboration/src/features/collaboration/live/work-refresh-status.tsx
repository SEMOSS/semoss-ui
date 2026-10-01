import { ChevronDown, RefreshCw } from "lucide-react";
import { Link } from "react-router";
import {
	Button,
	cn,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@semoss/ui/next";
import { useCollaborationSession } from "../state/collaboration-session.context";
import type { MailCheck, MailSyncResult, SyncOutcome } from "./live-state";
import { useWorkUpdates } from "./work-updates.context";

const time = (at: string) =>
	new Date(at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

// what each outcome means to the owner, in summary order
const OUTCOMES: { key: SyncOutcome; summary: string; label: string }[] = [
	{ key: "new", summary: "new for you", label: "New in Work" },
	{ key: "updated", summary: "updated", label: "Work item updated" },
	{ key: "cleared", summary: "cleared", label: "Cleared, you answered" },
	{
		key: "automated",
		summary: "automated",
		label: "Automated, kept out of Work",
	},
	{ key: "quiet", summary: "no action needed", label: "In Brain, no action" },
];

// where the new mail went, not just how many messages came in
function describeSync(result: MailSyncResult): string {
	const parts = OUTCOMES.filter(({ key }) => result.outcomes[key]).map(
		({ key, summary }) => `${result.outcomes[key]} ${summary}`,
	);
	if (parts.length) return parts.join(", ");
	return result.newMessages ? "nothing new for you" : "no new mail";
}

// when Microsoft 365 was last checked, not when this page last re-read the database
function describeCheck(check: MailCheck | null): string {
	if (!check) return "Mail not checked yet";
	if (check.status === "failed") return "Last mail check failed";
	return check.at ? `Checked ${time(check.at)}` : "Checked";
}

/** One quiet line beside the page title; what came in opens in a popover. */
export function WorkRefreshStatus({ className }: { className?: string }) {
	const updates = useWorkUpdates();
	if (!updates) return null;
	// a sync started elsewhere (after a send, later the webhook) shows here too
	const checking =
		updates.isSyncing || updates.lastMailCheck?.status === "running";
	const error =
		updates.syncError ||
		updates.error ||
		(updates.lastMailCheck?.status === "failed"
			? updates.lastMailCheck.error
			: "");
	const changes = updates.lastSync?.changes ?? [];
	return (
		<div
			className={cn(
				"flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground text-xs",
				className,
			)}
		>
			<output>
				{checking
					? "Checking mail..."
					: updates.error
						? "Updates paused"
						: describeCheck(updates.lastMailCheck)}
			</output>
			{!checking && updates.lastSync && (
				<>
					<span
						aria-hidden="true"
						className="inline-block size-1 rounded-full bg-current opacity-50"
					/>
					{changes.length ? (
						<SyncChanges
							summary={describeSync(updates.lastSync)}
							changes={changes}
						/>
					) : (
						<span>{describeSync(updates.lastSync)}</span>
					)}
				</>
			)}
			{error && (
				<span
					className="max-w-64 truncate text-destructive"
					title={error}
				>
					{error}
				</span>
			)}
			<Button
				type="button"
				size="sm"
				variant="ghost"
				className="h-7 px-2 text-xs"
				disabled={updates.isSyncing}
				onClick={updates.syncMail}
			>
				<RefreshCw
					aria-hidden="true"
					className={cn("size-3.5", checking && "animate-spin")}
				/>
				{updates.isSyncing
					? "Checking..."
					: error
						? "Try again"
						: "Refresh"}
			</Button>
		</div>
	);
}

/** Each thread the last check touched, grouped by where it went. */
function SyncChanges({
	summary,
	changes,
}: {
	summary: string;
	changes: MailSyncResult["changes"];
}) {
	const { state } = useCollaborationSession();
	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					type="button"
					aria-label={`What came in: ${summary}`}
					className="inline-flex items-center gap-0.5 rounded-sm hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring"
				>
					{summary}
					<ChevronDown aria-hidden="true" className="size-3" />
				</button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-80 max-w-full p-3">
				<p className="mb-2 font-medium text-sm">What came in</p>
				<div className="max-h-80 space-y-3 overflow-y-auto">
					{OUTCOMES.map(({ key, label }) => {
						const group = changes.filter(
							(change) => change.outcome === key,
						);
						if (!group.length) return null;
						return (
							<section key={key}>
								<p className="text-muted-foreground text-xs">
									{label}
								</p>
								<ul className="mt-1 space-y-1">
									{group.map(({ threadId }) => (
										<li
											key={threadId}
											className="truncate text-sm"
										>
											<Link
												className="hover:underline"
												to={`/brain/threads/${encodeURIComponent(threadId)}`}
											>
												{state.threads.find(
													(thread) =>
														thread.id === threadId,
												)?.subject ?? "Conversation"}
											</Link>
										</li>
									))}
								</ul>
							</section>
						);
					})}
				</div>
			</PopoverContent>
		</Popover>
	);
}
