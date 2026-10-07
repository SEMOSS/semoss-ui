import { Mail } from "lucide-react";
import { useNavigate } from "react-router";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { threadPath } from "@/lib/workspace-paths";
import { useDashboard } from "./dashboard.context";
import type { DashboardWidget } from "./dashboard-layout";
import { DashboardResourceStatus } from "./dashboard-resource-status";
import { relevantEmails } from "./dashboard-selectors";

/** Relevance is an explainable ordering over imported Work and available inbox headers. */
export function DashboardEmail({ widget }: { widget: DashboardWidget }) {
	const { state } = useCollaborationSession();
	const { mail, setSource } = useDashboard();
	const navigate = useNavigate();
	const messages = relevantEmails(state, mail.data ?? []).filter((row) =>
		widget.filter === "vip"
			? row.isVip
			: widget.filter === "unread"
				? row.unread
				: true,
	);
	return (
		<div className="space-y-3">
			<DashboardResourceStatus
				disconnected={
					!state.settings.sourcesJson.email
						? "Connect email to include your inbox."
						: undefined
				}
				error={mail.error}
				loading={mail.isLoading && !mail.data}
				onRetry={mail.refresh}
			/>
			{messages.map((row) => (
				<article
					key={row.id}
					className="dashboard-row space-y-2 border-b py-3 last:border-0"
				>
					<div className="flex items-center gap-2 text-muted-foreground text-xs">
						<Mail
							aria-hidden="true"
							className="size-3.5 shrink-0"
						/>
						<span className="min-w-0 truncate">{row.sender}</span>
						{row.unread && (
							<span className="size-1.5 shrink-0 rounded-full bg-primary">
								<span className="sr-only">Unread</span>
							</span>
						)}
					</div>
					<button
						type="button"
						className="block text-left font-medium text-sm hover:underline"
						onClick={() => {
							const id =
								row.mail?.uid || row.thread?.source?.nativeId;
							if (id) setSource({ kind: "email", id });
							else if (row.thread)
								void navigate(threadPath(row.thread.id));
						}}
					>
						{row.title}
					</button>
					<p className="text-muted-foreground text-xs">
						{row.reason}
					</p>
					{row.at && (
						<time
							dateTime={row.at}
							className="block text-muted-foreground text-xs"
						>
							{new Date(row.at).toLocaleDateString(undefined, {
								month: "short",
								day: "numeric",
							})}
						</time>
					)}
				</article>
			))}
			{!messages.length && !mail.isLoading && (
				<p className="py-6 text-muted-foreground text-sm">
					No matching email in the available records.
				</p>
			)}
			<p className="text-muted-foreground text-xs">
				Imported conversations + up to 20 inbox messages from the past 7
				days.
			</p>
		</div>
	);
}
