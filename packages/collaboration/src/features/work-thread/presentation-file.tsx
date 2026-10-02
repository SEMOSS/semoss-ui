import { Download, Eye, FolderSearch, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FILE_PANEL_TYPES } from "@semoss/panels";
import { Alert, AlertDescription, Button, Small } from "@semoss/ui/next";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import {
	retrievePresentation,
	savePresentation,
} from "./api/retrieve-presentation";
import type { PresentationReference } from "./presentation-run";
import { workPanelTarget } from "./work-pane-layout";

/** All three file actions share one durable room/path identity and retrieval gate. */
export function PresentationFile({ file }: { file: PresentationReference }) {
	const workbench = useToolWorkbench();
	const { roomId, insightId } = workbench;
	const { roomId: fileRoomId, path, name, sourceHash } = file;
	const [state, setState] = useState<{
		key: string;
		status: "checking" | "available" | "unavailable";
		error?: string;
	}>({ key: "", status: "checking" });
	const [attempt, setAttempt] = useState(0);
	const [busy, setBusy] = useState(false);
	const identity = JSON.stringify([
		roomId,
		insightId,
		file.roomId,
		file.path,
		file.sourceHash,
		attempt,
	]);
	const current = useRef<string | null>(identity);
	current.current = identity;
	useEffect(() => {
		let active = true;
		current.current = identity;
		setBusy(false);
		setState({ key: identity, status: "checking" });
		void retrievePresentation(insightId, roomId, {
			roomId: fileRoomId,
			path,
			name,
			sourceHash,
		}).then(
			() => {
				if (active) setState({ key: identity, status: "available" });
			},
			(cause: unknown) => {
				if (active)
					setState({
						key: identity,
						status: "unavailable",
						error:
							cause instanceof Error
								? cause.message
								: "Presentation unavailable.",
					});
			},
		);
		return () => {
			active = false;
			if (current.current === identity) current.current = null;
		};
	}, [identity, insightId, roomId, fileRoomId, path, name, sourceHash]);
	const status = state.key === identity ? state.status : "checking";
	const act = async (
		action: "preview" | "download" | "locate",
	): Promise<void> => {
		if (busy) return;
		setBusy(true);
		try {
			const bytes = await retrievePresentation(insightId, roomId, file);
			if (current.current !== identity) return;
			if (action === "preview") workbench.openFile(file.path, file.name);
			if (action === "download") savePresentation(bytes, file.name);
			if (action === "locate") {
				const layout = workbench.store.getState().layout;
				const config = {
					mode: { type: "INSIGHT", insightId },
					reveal: { path: file.path, requestId: crypto.randomUUID() },
				};
				const id = layout.actions.selectPanel(
					FILE_PANEL_TYPES.FILE_EXPLORER,
					config,
					{ name: "Files", target: workPanelTarget(layout) },
				);
				layout.actions.updatePanel(id, { config });
				workbench.openWorkbench();
			}
		} catch (cause) {
			if (current.current === identity)
				setState({
					key: identity,
					status: "unavailable",
					error:
						cause instanceof Error
							? cause.message
							: "Presentation unavailable.",
				});
		} finally {
			if (current.current === identity) setBusy(false);
		}
	};
	return (
		<div className="min-w-0 space-y-2">
			<Small className="block break-words">{file.name}</Small>
			<output className="block text-muted-foreground text-sm">
				{status === "checking"
					? "Checking presentation..."
					: status === "available"
						? "Available"
						: "Unavailable"}
			</output>
			{status === "unavailable" && (
				<Alert variant="destructive">
					<AlertDescription>{state.error}</AlertDescription>
				</Alert>
			)}
			<div className="flex flex-wrap gap-2">
				<Button
					type="button"
					size="sm"
					variant="outline"
					disabled={status !== "available" || busy}
					onClick={() => void act("preview")}
				>
					<Eye aria-hidden="true" />
					Preview
				</Button>
				<Button
					type="button"
					size="sm"
					variant="ghost"
					disabled={status !== "available" || busy}
					onClick={() => void act("download")}
				>
					<Download aria-hidden="true" />
					Download
				</Button>
				<Button
					type="button"
					size="sm"
					variant="ghost"
					disabled={status !== "available" || busy}
					onClick={() => void act("locate")}
				>
					<FolderSearch aria-hidden="true" />
					Locate File
				</Button>
				{status === "unavailable" && (
					<Button
						type="button"
						size="sm"
						variant="ghost"
						onClick={() => setAttempt((value) => value + 1)}
					>
						<RefreshCw aria-hidden="true" />
						Retry
					</Button>
				)}
			</div>
		</div>
	);
}
