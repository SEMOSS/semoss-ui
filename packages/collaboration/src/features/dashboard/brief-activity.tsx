import { type ReactNode, useCallback } from "react";
import { Link } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import { getFileIconComponent } from "@semoss/shared";
import { cn, P, Spinner } from "@semoss/ui/next";
import {
	formatDateToRelative,
	parseTimestampWithUtcDefault,
} from "@semoss/utility/date";
import { channelMeta } from "@/features/collaboration/channel-meta";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { listRecentFiles } from "@/features/connectors/api/microsoft";
import { threadPath } from "@/lib/workspace-paths";
import { BriefPanel } from "./brief-panel";
import { useDashboard } from "./dashboard.context";
import { DashboardResourceStatus } from "./dashboard-resource-status";
import { useOpenFileRoom } from "./use-open-file-room";
import { useVisibleResource } from "./use-visible-resource";

/** How many rows the card lists. */
const SHOWN = 6;
/** How many of those rows files may take, so a busy inbox cannot push every file out. */
const FILES_SHOWN = 3;
/** Files are read again when the window regains focus and on Today's refresh; otherwise this often. */
const FILES_INTERVAL = 5 * 60_000;

/** Stretched over its row, so the whole row opens it. */
const ROW_LINK =
	"min-w-0 flex-1 truncate font-medium after:absolute after:inset-0 after:rounded-lg hover:underline focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring";

interface ActivityRow {
	id: string;
	/** What it is, for a screen reader; the logo beside it says the same to the eye. */
	kind: string;
	title: string;
	/** When it last changed. */
	at: string;
	icon: ReactNode;
	/** A conversation opens on its own page. */
	to?: string;
	/** A file opens in a room of its own, which takes a moment to get ready. */
	onOpen?: () => void;
	isOpening?: boolean;
}

const time = (at: string): number =>
	parseTimestampWithUtcDefault(at).valueOf() || 0;

/** What changed last: the newest mail, chats and meetings Collaboration has read, and the files changed lately in the owner's OneDrive. */
export function BriefActivity() {
	const { state } = useCollaborationSession();
	const { actions } = useInsight();
	const { refreshRevision } = useDashboard();
	const loadFiles = useCallback(() => {
		// Today's refresh bumps the revision, and a new loader is read at once
		void refreshRevision;
		return listRecentFiles(actions, FILES_SHOWN);
	}, [actions, refreshRevision]);
	const sources = state.settings.sourcesJson;
	// OneDrive has no switch of its own: it is read whenever Microsoft 365 is connected at all
	const files = useVisibleResource(
		loadFiles,
		Boolean(sources.email || sources.teams || sources.calendar),
		FILES_INTERVAL,
	);
	const { open, openingId } = useOpenFileRoom();

	const fileRows = (files.data ?? []).map((file): ActivityRow => {
		const FileIcon = getFileIconComponent(file.name);
		return {
			id: `file:${file.id}`,
			kind: "File",
			title: file.name,
			at: file.lastModifiedDateTime,
			icon: <FileIcon className="size-5 shrink-0" />,
			onOpen: () => open(file),
			isOpening: openingId === file.id,
		};
	});
	const threadRows = state.threads
		.filter(
			(thread) =>
				!thread.muted &&
				!thread.automated &&
				(thread.channel === "email" ||
					thread.channel === "teams" ||
					thread.channel === "calendar"),
		)
		.sort((a, b) => time(b.lastAt) - time(a.lastAt))
		.slice(0, SHOWN - fileRows.length)
		.map((thread): ActivityRow => {
			const { label, icon: Icon } = channelMeta(thread.channel);
			return {
				id: thread.id,
				kind: label,
				title: thread.subject || "No subject",
				at: thread.lastAt,
				icon: <Icon aria-hidden="true" className="size-5" />,
				to: threadPath(thread.id),
			};
		});
	const rows = [...fileRows, ...threadRows].sort(
		(a, b) => time(b.at) - time(a.at),
	);

	return (
		<BriefPanel title="Recent activity">
			{rows.length > 0 ? (
				<ul>
					{rows.map((row) => {
						// the kind goes ahead of the name: a hidden label after a long, cut-off name lands outside the row and widens the page
						const name = (
							<>
								<span className="sr-only">{row.kind}: </span>
								{row.title}
							</>
						);
						return (
							<li
								key={row.id}
								className="group relative flex items-center gap-3"
							>
								{row.icon}
								{/* the rule starts at the text, not under the logo */}
								<div className="flex min-w-0 flex-1 items-baseline gap-3 border-b py-3 group-last:border-b-0">
									{row.to ? (
										<Link
											to={row.to}
											title={row.title}
											className={ROW_LINK}
										>
											{name}
										</Link>
									) : (
										<button
											type="button"
											title={row.title}
											// one room at a time: a second file waits until the first has opened
											disabled={Boolean(openingId)}
											aria-busy={row.isOpening}
											className={cn(
												ROW_LINK,
												"cursor-pointer text-left disabled:cursor-default",
											)}
											onClick={row.onOpen}
										>
											{name}
										</button>
									)}
									{row.isOpening ? (
										<Spinner
											aria-label="Opening"
											className="size-4 shrink-0 self-center text-muted-foreground"
										/>
									) : (
										<span className="shrink-0 text-muted-foreground text-sm">
											{formatDateToRelative(row.at)}
										</span>
									)}
								</div>
							</li>
						);
					})}
				</ul>
			) : (
				!files.error && (
					<P className="text-muted-foreground text-sm">
						Nothing yet. New mail, chats, meetings and changed files
						show up here.
					</P>
				)
			)}
			{/* the conversations above stay when only the files could not be read */}
			<DashboardResourceStatus
				error={files.error}
				onRetry={files.refresh}
			/>
		</BriefPanel>
	);
}
