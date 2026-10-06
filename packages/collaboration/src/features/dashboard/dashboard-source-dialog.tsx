import { useCallback } from "react";
import { useNavigate } from "react-router";
import {
	Alert,
	AlertDescription,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	Skeleton,
} from "@semoss/ui/next";
import { importSourceCommand } from "@/features/collaboration/import-source";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { getCalendarEvent, getMail } from "@/features/connectors/api/microsoft";
import {
	importCalendarEvent,
	importOutlookMail,
} from "@/features/connectors/api/source-mapping";
import { SourcePreview } from "@/features/connectors/components/source-preview";
import type { ImportedSource } from "@/features/connectors/types";
import { useDashboard } from "./dashboard.context";
import { useVisibleResource } from "./use-visible-resource";

/** Reuse the existing source reader and editable email actions from both entry points. */
export function DashboardSourceDialog() {
	const { actions, source, setSource, sourceReturnFocus } = useDashboard();
	const { state, dispatch } = useCollaborationSession();
	const navigate = useNavigate();
	const id = source?.id;
	const kind = source?.kind;
	const load = useCallback(async () => {
		if (!id) throw new Error("No source selected.");
		return kind === "calendar"
			? importCalendarEvent(await getCalendarEvent(actions, id))
			: importOutlookMail(await getMail(actions, id), "inbox");
	}, [actions, id, kind]);
	const resource = useVisibleResource(load, Boolean(id));
	const selected =
		source &&
		resource.data?.nativeId === id &&
		resource.data?.sourceKind ===
			(kind === "email" ? "outlook" : "calendar")
			? resource.data
			: null;
	function openAssistant(
		imported: ImportedSource,
		action: "ask" | "draft",
	): void {
		const existing = state.threads.find(
			(thread) =>
				thread.source?.nativeId === imported.nativeId &&
				thread.source?.kind === imported.sourceKind,
		);
		const command = importSourceCommand(imported);
		const threadId = existing?.id ?? command.thread.id;
		if (!existing) dispatch(command);
		setSource(null);
		void navigate(`/work/thread/${encodeURIComponent(threadId)}`, {
			state: {
				threadAction: {
					id: crypto.randomUUID(),
					threadId,
					action,
					...(kind === "calendar"
						? {
								prompt: `Help me prepare for ${imported.title}. Summarize the meeting context, participants, decisions to make, and questions to ask. Identify any missing information.`,
							}
						: {}),
					...(action === "draft"
						? { sourceMessageId: imported.nativeId }
						: {}),
				},
			},
		});
	}
	return (
		<Dialog
			open={Boolean(source)}
			onOpenChange={(open) => {
				if (!open) setSource(null);
			}}
		>
			<DialogContent
				className="max-h-[85dvh] overflow-y-auto sm:max-w-3xl"
				onCloseAutoFocus={(event) => {
					event.preventDefault();
					(sourceReturnFocus.current?.isConnected
						? sourceReturnFocus.current
						: document.querySelector<HTMLElement>("main")
					)?.focus();
				}}
			>
				<DialogHeader>
					<DialogTitle>
						{kind === "calendar" ? "Meeting details" : "Read email"}
					</DialogTitle>
					<DialogDescription>
						{kind === "calendar"
							? "Review this meeting and prepare with your assistant."
							: "Read, reply, or bring this email into a conversation."}
					</DialogDescription>
				</DialogHeader>
				{resource.error && (
					<Alert variant="destructive">
						<AlertDescription>{resource.error}</AlertDescription>
						<Button
							variant="outline"
							size="sm"
							onClick={resource.refresh}
						>
							Retry
						</Button>
					</Alert>
				)}
				{!selected && !resource.error && (
					<Skeleton className="h-64 w-full" />
				)}
				{selected && (
					<>
						<SourcePreview
							key={`${kind}:${id}`}
							source={selected}
							isLoading={resource.isLoading}
							onImport={(imported) =>
								openAssistant(imported, "ask")
							}
							onDraftReply={
								kind === "email"
									? () => openAssistant(selected, "draft")
									: undefined
							}
						/>
						{kind === "calendar" && (
							<Button
								onClick={() => openAssistant(selected, "ask")}
							>
								Prepare with assistant
							</Button>
						)}
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
