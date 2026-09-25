import { Download, Paperclip, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Alert, AlertDescription, Button, P } from "@semoss/ui/next";
import type { SourceAttachment } from "@/features/connectors/types";

interface ThreadSourceAttachmentsProps {
	attachments: SourceAttachment[];
	selected: string[];
	onToggle: (id: string) => void;
	onPendingChange: (isPending: boolean) => void;
	isDisabled: boolean;
	onDownload: (attachment: SourceAttachment) => Promise<void>;
}

/** Queue source references; the send path stages them after binding its room. */
export function ThreadSourceAttachments({
	attachments,
	selected,
	onToggle,
	onPendingChange,
	isDisabled,
	onDownload,
}: ThreadSourceAttachmentsProps) {
	const [pending, setPending] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const generation = useRef(0);
	const isBusy = useRef(false);
	useEffect(
		() => () => {
			generation.current += 1;
			onPendingChange(false);
		},
		[onPendingChange],
	);
	async function download(attachment: SourceAttachment): Promise<void> {
		if (isBusy.current) return;
		isBusy.current = true;
		const token = generation.current;
		setPending(attachment.id);
		onPendingChange(true);
		setError(null);
		try {
			await onDownload(attachment);
		} catch (cause) {
			if (token === generation.current)
				setError(
					cause instanceof Error
						? cause.message
						: "Could not download this attachment.",
				);
		} finally {
			isBusy.current = false;
			if (token === generation.current) {
				setPending(null);
				onPendingChange(false);
			}
		}
	}
	return (
		<details className="rounded-lg border border-border px-3 py-2">
			<summary className="cursor-pointer font-medium text-sm focus-visible:outline-2 focus-visible:outline-ring">
				Source attachments
				{selected.length
					? ` · ${selected.length} attached to your next message`
					: ""}
			</summary>
			<div className="mt-3 flex flex-col gap-2">
				<P className="text-muted-foreground text-sm">
					Attach only the files you want Assistant to read with your
					next message.
				</P>
				{attachments
					.filter((attachment) => attachment.isFile)
					.map((attachment) => {
						const attached = selected.includes(attachment.id);
						return (
							<div
								key={attachment.id}
								className="flex flex-wrap items-center gap-2 rounded-md bg-muted/40 px-3 py-2"
							>
								<span className="min-w-0 flex-1 break-words text-sm">
									{attachment.name}
								</span>
								<Button
									type="button"
									size="sm"
									variant="ghost"
									disabled={isDisabled || pending !== null}
									onClick={() => void download(attachment)}
									aria-label={`Download ${attachment.name}`}
								>
									<Download aria-hidden="true" />
									{pending === attachment.id
										? "Preparing…"
										: "Download"}
								</Button>
								<Button
									type="button"
									size="sm"
									variant={attached ? "secondary" : "outline"}
									disabled={
										isDisabled ||
										(!attached && selected.length >= 5)
									}
									aria-pressed={attached}
									aria-label={`${attached ? "Remove" : "Attach"} ${attachment.name}`}
									onClick={() => onToggle(attachment.id)}
								>
									{attached ? (
										<X aria-hidden="true" />
									) : (
										<Paperclip aria-hidden="true" />
									)}
									{attached ? "Attached" : "Attach"}
								</Button>
							</div>
						);
					})}
				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
			</div>
		</details>
	);
}
