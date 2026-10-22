import { useEffect, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	P,
	Spinner,
	toast,
} from "@semoss/ui/next";
import type { UploadedRoomFile } from "@/features/rooms/api/upload-room-files";
import {
	copyTopicFile,
	deleteTopicFile,
	downloadTopicFile,
	type TopicFile,
} from "../api/topic-files";
import { useTopicFiles } from "../hooks/use-topic-files";
import { UploadTopicFilesDialog } from "./upload-topic-files-dialog";

interface TopicFileListProps {
	/** Owner topic page, or a linked room's complete file scope. */
	topicId?: string;
	roomId?: string;
	/** Archived and suggested topics are read-only. */
	isWritable?: boolean;
	/** Demo topics have no server-side attachments. */
	isSample?: boolean;
	/** Queue the copied file for the room's next message. */
	onAttach?: (file: UploadedRoomFile) => void;
	/** Prevent adding context while a turn is running. */
	isDisabled?: boolean;
}
/** File list shared by the topic Files tab and the chat topic panel. */
export function TopicFileList({
	topicId,
	roomId,
	isWritable = false,
	isSample = false,
	onAttach,
	isDisabled = false,
}: TopicFileListProps) {
	const { actions, insightId } = useInsight();
	const isMounted = useRef(true);
	useEffect(() => {
		isMounted.current = true;
		return () => {
			isMounted.current = false;
		};
	}, []);
	const [offset, setOffset] = useState(0);
	const query = useTopicFiles({ topicId, roomId }, offset, !isSample);
	const [pending, setPending] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [deleting, setDeleting] = useState<TopicFile | null>(null);
	const listRef = useRef<HTMLElement>(null);

	const handleAction = async (
		file: TopicFile,
		action: "download" | "attach" | "delete",
	): Promise<void> => {
		if (pending) return;
		setPending(file.fileId);
		setError(null);
		try {
			if (action === "download")
				await downloadTopicFile(actions, insightId, file);
			else if (action === "attach" && roomId && onAttach) {
				const copied = await copyTopicFile(actions, roomId, file);
				if (!isMounted.current) return;
				onAttach(copied);
				toast.success("File added to the next message");
			} else if (action === "delete") {
				await deleteTopicFile(actions, file);
				setDeleting(null);
				if (query.files.length === 1 && offset > 0)
					setOffset((value) => Math.max(0, value - 50));
				else query.refresh();
				toast.success("File deleted");
			}
		} catch (failure: unknown) {
			setError(
				failure instanceof Error
					? failure.message
					: "File operation failed.",
			);
		} finally {
			setPending(null);
		}
	};
	if (isSample)
		return (
			<P className="p-4 text-muted-foreground">
				Files are available on your own topics.
			</P>
		);
	return (
		<section
			ref={listRef}
			tabIndex={-1}
			aria-label="Topic files"
			className="min-w-0 space-y-4 p-4 focus-visible:outline-2 focus-visible:outline-ring"
		>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<P className="text-muted-foreground">
					Reference documents for chats linked to{" "}
					{roomId ? "these topics" : "this topic"}.
				</P>
				<div className="flex flex-wrap gap-2">
					<Button
						type="button"
						variant="outline"
						disabled={query.isLoading || pending !== null}
						onClick={query.refresh}
					>
						Refresh files
					</Button>
					{isWritable && topicId && (
						<UploadTopicFilesDialog
							topicId={topicId}
							maxBytes={query.maxBytes}
							onUploaded={query.refresh}
						/>
					)}
				</div>
			</div>
			{(query.error || (error && !deleting)) && (
				<Alert variant="destructive">
					<AlertDescription>{query.error ?? error}</AlertDescription>
				</Alert>
			)}
			{query.isLoading && (
				<output className="flex items-center gap-2">
					<Spinner aria-hidden="true" />
					Loading files…
				</output>
			)}
			{!query.isLoading && !query.error && query.files.length === 0 && (
				<P className="text-muted-foreground">No topic files yet.</P>
			)}
			<ul className="divide-y divide-border">
				{query.files.map((file) => (
					<li
						key={file.fileId}
						className="flex min-w-0 flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
					>
						<div className="min-w-0">
							<P className="break-all font-medium">{file.name}</P>
							<P className="text-muted-foreground text-sm">
								{Math.ceil(file.size / 1024)} KB ·{" "}
								{new Date(file.uploadedAt).toLocaleDateString()}
							</P>
						</div>
						<div className="flex shrink-0 flex-wrap gap-2">
							<Button
								type="button"
								size="sm"
								variant="outline"
								disabled={pending !== null}
								aria-label={`Download ${file.name}`}
								onClick={() =>
									void handleAction(file, "download")
								}
							>
								Download
							</Button>
							{onAttach && (
								<Button
									type="button"
									size="sm"
									variant="outline"
									disabled={isDisabled || pending !== null}
									aria-label={`Add ${file.name} to next message`}
									onClick={() =>
										void handleAction(file, "attach")
									}
								>
									Add to next message
								</Button>
							)}
							{isWritable && (
								<Button
									type="button"
									size="sm"
									variant="ghost"
									disabled={pending !== null}
									aria-label={`Delete ${file.name}`}
									onClick={() => {
										setError(null);
										setDeleting(file);
									}}
								>
									Delete
								</Button>
							)}
						</div>
					</li>
				))}
			</ul>
			{query.total > 50 && (
				<div className="flex flex-wrap items-center gap-2">
					<Button
						type="button"
						variant="outline"
						disabled={query.isLoading || offset === 0}
						onClick={() =>
							setOffset((value) => Math.max(0, value - 50))
						}
					>
						Previous files
					</Button>
					<P>
						{offset + 1}–{Math.min(offset + 50, query.total)} of{" "}
						{query.total}
					</P>
					<Button
						type="button"
						variant="outline"
						disabled={query.isLoading || offset + 50 >= query.total}
						onClick={() => setOffset((value) => value + 50)}
					>
						Next files
					</Button>
				</div>
			)}
			<Dialog
				open={deleting !== null}
				onOpenChange={(next) => {
					if (!next && !pending) {
						setDeleting(null);
						setError(null);
					}
				}}
			>
				<DialogContent
					showCloseButton={!pending}
					onCloseAutoFocus={(event) => {
						event.preventDefault();
						// The removed row and refresh control can disappear/disable during reload.
						listRef.current?.focus();
					}}
					onEscapeKeyDown={(event) => {
						if (pending) event.preventDefault();
					}}
					onInteractOutside={(event) => {
						if (pending) event.preventDefault();
					}}
				>
					<DialogHeader>
						<DialogTitle>Delete topic file?</DialogTitle>
						<DialogDescription className="break-all">
							Permanently delete {deleting?.name} from this topic
							and its storage provider. Copies already added to
							chats are separate attachments.
						</DialogDescription>
					</DialogHeader>
					{error && (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							disabled={pending !== null}
							onClick={() => setDeleting(null)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="destructive"
							disabled={pending !== null}
							onClick={() => {
								if (deleting)
									void handleAction(deleting, "delete");
							}}
						>
							{pending ? "Deleting…" : "Delete file"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</section>
	);
}
