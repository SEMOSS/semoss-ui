import { Square, SquareCheck } from "lucide-react";
import { useId, useState } from "react";
import {
	OneDriveViewer,
	type OneDriveViewerProps,
	TeamsFilesViewer,
} from "@semoss/connectors";
import { useInsight } from "@semoss/sdk/react";
import { H2, P, Spinner, toast } from "@semoss/ui/next";
import { OneDriveIcon, TeamsFilesIcon } from "@/components/common/app-icons";
import { useRecordIds } from "@/features/collaboration/live/work-updates.context";
import type {
	Topic,
	TopicFile,
} from "@/features/collaboration/state/collaboration.types";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { connectMicrosoft } from "@/features/connectors/api/microsoft";
import { linkTopicFile } from "./api/topic-files";
import { TopicChecklist, type TopicChecklistRow } from "./topic-checklist";

/** The drives a file can be picked from, as the page names them. */
const DRIVES = {
	onedrive: {
		label: "OneDrive",
		description:
			"Your OneDrive files and the files shared with you. Open a folder to see what is in it.",
	},
	teams: {
		label: "Teams files",
		description:
			"The files of a Teams channel. Choose a team and a channel, then open a folder to see what is in it.",
	},
} as const;

interface FileSourceProps {
	/** A saved topic; the server keeps its file links. */
	topic: Topic;
	/** The topic's own files, or a drive to pick more from. */
	view: "topic" | keyof typeof DRIVES;
}

/**
 * The files linked to a topic, and the owner's OneDrive and Teams files to link more from, each with a box
 * that puts it in the topic or takes it off. A link points at the file where it lives; nothing is copied. A
 * change is saved before the row shows it.
 */
export function FileSource({ topic, view }: FileSourceProps) {
	const { dispatch } = useCollaborationSession();
	const { actions } = useInsight();
	const { serverId } = useRecordIds();
	const labelId = useId();
	const [query, setQuery] = useState("");
	const [savingIds, setSavingIds] = useState<ReadonlySet<string>>(new Set());
	const [status, setStatus] = useState("");

	const files = topic.files ?? [];
	// the topic's files as the list opened on them: one taken off keeps its row and its place, so the change
	// can be undone where it was made
	const [filesAtOpen] = useState(files);
	const linkedIds = new Set(files.map((file) => file.itemId));

	const handleToggle = async (
		file: Pick<TopicFile, "itemId" | "driveId" | "source" | "name">,
		toLinked: boolean,
	): Promise<void> => {
		if (savingIds.has(file.itemId)) return;
		const setSaving = (isSaving: boolean): void =>
			setSavingIds((current) => {
				const next = new Set(current);
				if (isSaving) next.add(file.itemId);
				else next.delete(file.itemId);
				return next;
			});
		setSaving(true);
		try {
			const linked = await linkTopicFile(
				actions,
				// a topic made on this page is known to the server by another id
				await serverId(topic.id),
				file,
				!toLinked,
			);
			// the page's copy of the topic; the server already holds the change
			dispatch({
				type: "topic.save",
				topic: { id: topic.id, files: linked },
			});
			setStatus(
				toLinked
					? `Added "${file.name}" to this topic.`
					: `Removed "${file.name}" from this topic.`,
			);
		} catch (cause) {
			toast.error(
				`Could not ${toLinked ? "add" : "remove"} "${file.name}".`,
				{
					description:
						cause instanceof Error ? cause.message : undefined,
				},
			);
		} finally {
			setSaving(false);
		}
	};

	if (view === "topic") {
		const terms = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
		const listed = [
			...filesAtOpen,
			...files.filter(
				(file) =>
					!filesAtOpen.some((open) => open.itemId === file.itemId),
			),
		].filter((file) => {
			const name = file.name.toLocaleLowerCase();
			return terms.every((term) => name.includes(term));
		});
		const rows = listed.map(
			(file): TopicChecklistRow => ({
				id: file.itemId,
				title: file.name,
				detail: file.source === "teams" ? "In Teams" : "In OneDrive",
				icon: file.source === "teams" ? TeamsFilesIcon : OneDriveIcon,
				isChecked: linkedIds.has(file.itemId),
				isSaving: savingIds.has(file.itemId),
			}),
		);
		return (
			// rows with nothing to read beside them stay a readable width on a wide screen
			<div className="flex min-h-0 min-w-0 flex-1">
				<div className="flex min-h-0 min-w-0 flex-1 flex-col xl:max-w-3xl xl:border-r">
					<TopicChecklist
						label="Files in this topic"
						description="The OneDrive and Teams files linked to this topic. Uncheck one to take it off."
						noun="files"
						searchPlaceholder="Search by file name"
						query={query}
						onQueryChange={setQuery}
						rows={rows}
						onToggle={(itemId, isChecked) => {
							const file = listed.find(
								(entry) => entry.itemId === itemId,
							);
							if (file) void handleToggle(file, isChecked);
						}}
						hasMore={false}
						onShowMore={() => undefined}
						emptyText="No files in this topic yet. Pick some under OneDrive or Teams files."
						status={status}
						hint="Uncheck a file to take it off this topic."
					/>
				</div>
			</div>
		);
	}

	const getFileAction: OneDriveViewerProps["getFileAction"] = (item) => {
		const isLinked = linkedIds.has(item.id);
		let icon = <Square aria-hidden="true" />;
		if (savingIds.has(item.id)) icon = <Spinner aria-hidden="true" />;
		else if (isLinked)
			icon = <SquareCheck aria-hidden="true" className="text-primary" />;
		return {
			name: isLinked
				? `Remove ${item.name} from this topic`
				: `Add ${item.name} to this topic`,
			icon,
			tooltip: isLinked ? "Remove from topic" : "Add to topic",
			action: () =>
				handleToggle(
					{
						itemId: item.id,
						driveId: item.driveId,
						source: view,
						name: item.name,
					},
					!isLinked,
				),
		};
	};
	const handleSignIn = async (): Promise<boolean> => {
		try {
			// called before the first await, so the sign in window opens inside the click
			await connectMicrosoft();
			return true;
		} catch (cause) {
			toast.error("Could not sign in to Microsoft 365.", {
				description: cause instanceof Error ? cause.message : undefined,
			});
			return false;
		}
	};
	const Viewer = view === "teams" ? TeamsFilesViewer : OneDriveViewer;
	const drive = DRIVES[view];

	return (
		<div className="flex min-h-0 min-w-0 flex-1">
			<section
				aria-labelledby={labelId}
				className="flex min-h-0 min-w-0 flex-1 flex-col xl:max-w-3xl xl:border-r"
			>
				<div className="shrink-0 border-b px-4 py-3">
					<H2
						id={labelId}
						className="font-medium text-base leading-snug tracking-normal"
					>
						{drive.label}
					</H2>
					<P className="text-muted-foreground text-sm">
						{drive.description}
					</P>
				</div>
				<div className="min-h-0 flex-1">
					<Viewer
						onSignIn={handleSignIn}
						getFileAction={getFileAction}
					/>
				</div>
				{/* always there, so the first status does not move the list */}
				<output className="wrap-anywhere line-clamp-2 shrink-0 border-t px-4 py-2 text-muted-foreground text-sm">
					{status || "Check a file to add it to this topic."}
				</output>
			</section>
		</div>
	);
}
