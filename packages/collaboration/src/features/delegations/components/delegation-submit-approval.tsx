import { FileText, X } from "lucide-react";
import { useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	Spinner,
	Textarea,
} from "@semoss/ui/next";
import type { ConversationTool } from "@/features/messages/types/message";
import type { PendingToolApproval } from "@/features/rooms/types/room";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import { filePaths } from "../utils/file-paths";
import { AttachRoomFile } from "./attach-room-file";

const SUBMIT_TOOL_KIND = "semoss_submit_delegation";

/** Name of the person the delegation room answers, when the backend sent it. */
export function delegationRequester(
	tool: ConversationTool,
): string | undefined {
	const name = tool.metadata?.SMSS_DELEGATION_REQUESTER;
	return typeof name === "string" && name.trim() ? name : undefined;
}

/** Whether a tool is the delegation room's send-back step. */
export function isDelegationSubmit(tool: ConversationTool): boolean {
	return tool.metadata?.SMSS_TOOL_KIND === SUBMIT_TOOL_KIND;
}

function text(value: unknown): string {
	return typeof value === "string" ? value : "";
}

/** Inline review of exactly what goes back to the requester before it is sent. */
export function DelegationSubmitApproval({
	tool,
	action,
}: {
	tool: ConversationTool;
	action: PendingToolApproval;
}) {
	const { onApproveTool, onRejectTool, closeTool, openFile } =
		useToolWorkbench();
	const declining = action.arguments.decline === true;
	const requester = delegationRequester(tool) ?? "the requester";
	const field = declining ? "reason" : "response";
	const [value, setValue] = useState(text(action.arguments[field]));
	const [busy, setBusy] = useState<"send" | "keep" | null>(null);
	const [error, setError] = useState<string | null>(null);
	const empty = !declining && !value.trim();
	const [files, setFiles] = useState(() =>
		declining ? [] : filePaths(action.arguments.files),
	);

	const resolve = async (kind: "send" | "keep") => {
		setBusy(kind);
		setError(null);
		try {
			if (kind === "send")
				await onApproveTool(action, {
					...action.arguments,
					[field]: value,
					...(!declining && { files }),
				});
			else await onRejectTool(action);
			closeTool(tool.id);
		} catch (cause) {
			setError(
				cause instanceof Error
					? cause.message
					: "Could not update this request.",
			);
		} finally {
			setBusy(null);
		}
	};

	return (
		<div className="flex flex-col gap-3 border-t p-3">
			<p className="text-muted-foreground text-xs">
				{declining
					? `You're declining ${requester}'s request. This reason goes back to them, and the request closes.`
					: `This answers ${requester}'s request and closes it. They get exactly this text and the files below; nothing else in this room is shared. Edit it if needed.`}
			</p>
			<Textarea
				aria-label={declining ? "Decline reason" : "Answer to send"}
				className="min-h-28 text-sm leading-6"
				value={value}
				disabled={busy !== null}
				onChange={(event) => setValue(event.target.value)}
			/>
			{!declining && (
				<div className="flex flex-col gap-1 text-xs">
					<span className="font-medium">
						Files they get ({files.length})
					</span>
					<ul className="flex flex-col gap-1">
						{files.map((file) => (
							<li key={file} className="flex items-center gap-1">
								<button
									type="button"
									title="Open to check before sending"
									className="flex w-full items-center gap-2 rounded-md border bg-background px-2 py-1 text-start hover:bg-accent"
									onClick={() =>
										openFile(
											file,
											file.split("/").pop() ?? file,
										)
									}
								>
									<FileText
										aria-hidden="true"
										className="size-3.5 shrink-0"
									/>
									<span className="wrap-break-word min-w-0 flex-1 font-mono">
										{file}
									</span>
								</button>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="size-6 shrink-0"
									aria-label={`Remove ${file}`}
									disabled={busy !== null}
									onClick={() =>
										setFiles(
											files.filter((f) => f !== file),
										)
									}
								>
									<X
										aria-hidden="true"
										className="size-3.5"
									/>
								</Button>
							</li>
						))}
					</ul>
					<AttachRoomFile
						selected={files}
						disabled={busy !== null}
						onAttach={(path) => setFiles([...files, path])}
					/>
				</div>
			)}
			{error && (
				<Alert variant="destructive" className="text-xs">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
			<div className="flex flex-wrap justify-end gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={busy !== null}
					onClick={() => void resolve("keep")}
				>
					{busy === "keep" && (
						<Spinner aria-hidden="true" className="size-4" />
					)}
					Keep working
				</Button>
				<Button
					type="button"
					size="sm"
					disabled={busy !== null || empty}
					onClick={() => void resolve("send")}
				>
					{busy === "send" && (
						<Spinner aria-hidden="true" className="size-4" />
					)}
					{declining ? "Send decline" : "Send answer"}
				</Button>
			</div>
		</div>
	);
}
