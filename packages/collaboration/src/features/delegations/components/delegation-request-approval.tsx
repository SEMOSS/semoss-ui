import { FileText, Link2, X } from "lucide-react";
import { useId, useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	Input,
	Spinner,
	Textarea,
} from "@semoss/ui/next";
import type { ConversationTool } from "@/features/messages/types/message";
import type { PendingToolApproval } from "@/features/rooms/types/room";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import { filePaths } from "../utils/file-paths";
import { AttachRoomFile } from "./attach-room-file";

const REQUEST_TOOL_KIND = "semoss_delegate_to_person";

interface RequestLink {
	url: string;
	title?: string;
}

/** Whether a tool is an agent's request to hand work to a person. */
export function isDelegationRequest(tool: ConversationTool): boolean {
	return tool.metadata?.SMSS_TOOL_KIND === REQUEST_TOOL_KIND;
}

function text(value: unknown): string {
	return typeof value === "string" ? value : "";
}

function linkList(value: unknown): RequestLink[] {
	if (!Array.isArray(value)) return [];
	return value.flatMap((item): RequestLink[] => {
		if (typeof item === "string") return [{ url: item }];
		if (item && typeof item === "object" && "url" in item) {
			const { url, title } = item as { url: unknown; title?: unknown };
			return typeof url === "string"
				? [
						{
							url,
							title:
								typeof title === "string" ? title : undefined,
						},
					]
				: [];
		}
		return [];
	});
}

/** Inline review of who gets the request, what it says, and what is shared. */
export function DelegationRequestApproval({
	tool,
	action,
}: {
	tool: ConversationTool;
	action: PendingToolApproval;
}) {
	const { onApproveTool, onRejectTool, closeTool } = useToolWorkbench();
	const args = action.arguments;
	const id = useId();
	const [assignee, setAssignee] = useState(text(args.assignee));
	const [question, setQuestion] = useState(text(args.question));
	const [context, setContext] = useState(text(args.context));
	const [dueAt, setDueAt] = useState(text(args.dueAt));
	const [files, setFiles] = useState(() => filePaths(args.files));
	const [links, setLinks] = useState(() => linkList(args.links));
	const [busy, setBusy] = useState<"send" | "cancel" | null>(null);
	const [error, setError] = useState<string | null>(null);
	const incomplete = !assignee.trim() || !question.trim();

	const resolve = async (kind: "send" | "cancel") => {
		setBusy(kind);
		setError(null);
		try {
			if (kind === "send")
				await onApproveTool(action, {
					...args,
					assignee,
					question,
					context,
					dueAt: dueAt.trim() || undefined,
					files,
					links,
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
		<div className="flex flex-col gap-3 border-t p-3 text-sm">
			<p className="text-muted-foreground text-xs">
				This starts a new request. The person gets their own room with
				only what is below, not this conversation. Their response is
				posted here when they send it. Nothing is shared until you send.
			</p>
			<div className="flex flex-col gap-1">
				<label
					htmlFor={`${id}-assignee`}
					className="font-medium text-xs"
				>
					To
				</label>
				<Input
					id={`${id}-assignee`}
					value={assignee}
					disabled={busy !== null}
					onChange={(event) => setAssignee(event.target.value)}
				/>
			</div>
			<div className="flex flex-col gap-1">
				<label
					htmlFor={`${id}-question`}
					className="font-medium text-xs"
				>
					Request
				</label>
				<Textarea
					id={`${id}-question`}
					className="min-h-20 leading-6"
					value={question}
					disabled={busy !== null}
					onChange={(event) => setQuestion(event.target.value)}
				/>
			</div>
			<div className="flex flex-col gap-1">
				<label
					htmlFor={`${id}-context`}
					className="font-medium text-xs"
				>
					Context they get
				</label>
				<Textarea
					id={`${id}-context`}
					className="min-h-24 leading-6"
					value={context}
					disabled={busy !== null}
					onChange={(event) => setContext(event.target.value)}
				/>
			</div>
			<div className="flex flex-col gap-1">
				<label htmlFor={`${id}-due`} className="font-medium text-xs">
					Due (optional)
				</label>
				<Input
					id={`${id}-due`}
					value={dueAt}
					placeholder="YYYY-MM-DD"
					disabled={busy !== null}
					onChange={(event) => setDueAt(event.target.value)}
				/>
			</div>
			<div className="flex flex-col gap-1">
				<span className="font-medium text-xs">
					Files (they get their own copy)
				</span>
				<ul className="flex flex-col gap-1">
					{files.map((file) => (
						<li
							key={file}
							className="flex items-center gap-2 rounded-md border bg-background px-2 py-1 text-xs"
						>
							<FileText
								aria-hidden="true"
								className="size-3.5 shrink-0"
							/>
							<span className="wrap-break-word min-w-0 flex-1 font-mono">
								{file}
							</span>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="size-6"
								aria-label={`Remove ${file}`}
								disabled={busy !== null}
								onClick={() =>
									setFiles(files.filter((f) => f !== file))
								}
							>
								<X aria-hidden="true" className="size-3.5" />
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
			{links.length > 0 && (
				<div className="flex flex-col gap-1">
					<span className="font-medium text-xs">
						Links (not copied; they need access at the source)
					</span>
					<ul className="flex flex-col gap-1">
						{links.map((link) => (
							<li
								key={link.url}
								className="flex items-center gap-2 rounded-md border bg-background px-2 py-1 text-xs"
							>
								<Link2
									aria-hidden="true"
									className="size-3.5 shrink-0"
								/>
								<a
									href={link.url}
									target="_blank"
									rel="noreferrer"
									className="wrap-break-word min-w-0 flex-1 text-link underline"
								>
									{link.title || link.url}
								</a>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="size-6"
									aria-label={`Remove ${link.title || link.url}`}
									disabled={busy !== null}
									onClick={() =>
										setLinks(
											links.filter(
												(l) => l.url !== link.url,
											),
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
					onClick={() => void resolve("cancel")}
				>
					{busy === "cancel" && (
						<Spinner aria-hidden="true" className="size-4" />
					)}
					Don't send
				</Button>
				<Button
					type="button"
					size="sm"
					disabled={busy !== null || incomplete}
					onClick={() => void resolve("send")}
				>
					{busy === "send" && (
						<Spinner aria-hidden="true" className="size-4" />
					)}
					Send request
				</Button>
			</div>
		</div>
	);
}
