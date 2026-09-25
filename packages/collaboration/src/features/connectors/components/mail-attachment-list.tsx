import { useEffect, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import { Alert, AlertDescription, Button, P } from "@semoss/ui/next";
import type { InsightActions } from "@/lib/pixel";
import { downloadMailAttachmentIsolated } from "../api/mail-attachment-download";
import { stageMailAttachment } from "../api/microsoft";
import type { SourceAttachment, StagedSourceAttachment } from "../types";

export interface MailAttachmentListProps {
	sourceUid: string;
	attachments: SourceAttachment[];
	/** Override when a thread owns a separate insight from the page shell. */
	insight?: { insightId: string; actions: InsightActions };
	/** Enables an explicit use-in-thread action after staging succeeds. */
	onStaged?: (file: StagedSourceAttachment) => void;
}

/** Download native file attachments without reading them until a person selects an action. */
export function MailAttachmentList({
	sourceUid,
	attachments,
	insight,
	onStaged,
}: MailAttachmentListProps) {
	const context = useInsight();
	const insightId = insight?.insightId ?? context.insightId;
	const actions = insight?.actions ?? context.actions;
	const scopeKey = JSON.stringify([context.insightId, insightId, sourceUid]);
	const [pending, setPending] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [status, setStatus] = useState("");
	const staged = useRef(new Map<string, StagedSourceAttachment>());
	const generation = useRef(0);
	const busy = useRef(false);
	useEffect(() => {
		const prefix = `${scopeKey}:`;
		for (const key of staged.current.keys())
			if (!key.startsWith(prefix)) staged.current.delete(key);
		setPending(null);
		setError(null);
		setStatus("");
		busy.current = false;
		return () => {
			generation.current += 1;
		};
	}, [scopeKey]);

	async function handleFile(
		file: SourceAttachment,
		useInThread: boolean,
	): Promise<void> {
		if (busy.current) return;
		busy.current = true;
		const token = generation.current;
		setPending(file.id);
		setError(null);
		setStatus("");
		try {
			if (!useInThread) {
				await downloadMailAttachmentIsolated(
					{ insightId: context.insightId, actions: context.actions },
					sourceUid,
					file,
				);
				if (token === generation.current)
					setStatus(`Download requested for ${file.name}.`);
				return;
			}
			const key = `${scopeKey}:${file.id}`;
			let downloaded = staged.current.get(key);
			if (!downloaded) {
				downloaded = await stageMailAttachment(
					actions,
					insightId,
					sourceUid,
					file.id,
					file.name,
				);
				staged.current.set(key, downloaded);
			}
			if (token !== generation.current) return;
			onStaged?.(downloaded);
			setStatus(`${file.name} is ready in this thread.`);
		} catch (cause: unknown) {
			if (token === generation.current)
				setError(
					cause instanceof Error
						? cause.message
						: "The attachment could not be downloaded.",
				);
		} finally {
			if (token === generation.current) {
				busy.current = false;
				setPending(null);
			}
		}
	}

	return (
		<div className="flex flex-col gap-2">
			{attachments.map((attachment) => (
				<div
					key={attachment.id}
					className="flex flex-wrap items-center gap-2 rounded-md border border-border p-3"
				>
					<div className="min-w-0 flex-1">
						<P className="break-words">{attachment.name}</P>
						<P className="text-muted-foreground">
							{attachment.size === undefined
								? ""
								: `${Math.ceil(attachment.size / 1024)} KB · `}
							{attachment.isFile
								? "File attachment"
								: "Open this linked or embedded attachment in Outlook"}
						</P>
					</div>
					{attachment.isFile && (
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={pending !== null}
							aria-label={`Download ${attachment.name}`}
							onClick={() => void handleFile(attachment, false)}
						>
							{pending === attachment.id
								? "Preparing…"
								: "Download"}
						</Button>
					)}
					{attachment.isFile && onStaged && (
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={pending !== null}
							onClick={() => void handleFile(attachment, true)}
						>
							Use in thread
						</Button>
					)}
				</div>
			))}
			{error && (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
			<output className="block text-muted-foreground text-sm">
				{status}
			</output>
		</div>
	);
}
