import { FileText, Link2, Plus, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Badge,
	Button,
	P,
	Spinner,
} from "@semoss/ui/next";
import { pixel } from "@/lib/pixel";
import { ImportChatSourceDialog } from "./import-chat-source-dialog";
import { LinkTopicSourceDialog } from "./link-topic-source-dialog";
import { TopicSourceDetails } from "./topic-source-details";
import { TopicSourceEditor } from "./topic-source-editor";
import {
	linkTopicSource,
	type TopicSource,
	topicSourceListSchema,
} from "./topic-sources.api";
import { UploadTopicDocumentsDialog } from "./upload-topic-documents-dialog";

interface TopicSourcesProps {
	topicId: string;
	isSample: boolean;
	isArchived: boolean;
	isSuggested?: boolean;
}

/** Persistent references shared by this topic's linked chats. */
export function TopicSources({
	topicId,
	isSample,
	isArchived,
	isSuggested = false,
}: TopicSourcesProps) {
	const { actions } = useInsight();
	const result = usePixel<unknown>(
		isSample ? "" : pixel("BrainListTopicSources", { topicId }),
	);
	const [editorKind, setEditorKind] = useState<"note" | "link" | null>(null);
	const [selected, setSelected] = useState<TopicSource | null>(null);
	const [isLinking, setIsLinking] = useState(false);
	const [isImporting, setIsImporting] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [isBusy, setIsBusy] = useState(false);
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");
	const actionRef = useRef<HTMLButtonElement | null>(null);
	const parsed = topicSourceListSchema.safeParse(result.data);
	const list =
		result.status === "SUCCESS" &&
		parsed.success &&
		parsed.data.topicId === topicId
			? parsed.data.sources
			: null;
	const readError =
		result.status === "ERROR"
			? (result.error?.message ?? "Could not read topic sources.")
			: result.status === "SUCCESS" && !list
				? "The source list does not match this topic."
				: "";
	const disabled = isBusy || isArchived || isSample || isSuggested;
	const close = (id?: string): void => {
		setEditorKind(null);
		setSelected(null);
		setIsLinking(false);
		setIsImporting(false);
		setIsUploading(false);
		if (id) {
			result.refresh();
			setNotice("Source saved.");
		}
		requestAnimationFrame(() => actionRef.current?.focus());
	};
	const handleRemove = async (sourceId: string): Promise<void> => {
		setIsBusy(true);
		setError("");
		setNotice("");
		try {
			await linkTopicSource(actions, topicId, sourceId, true);
			setNotice(
				"Source removed from this topic. Its other topic links are preserved.",
			);
			result.refresh();
		} catch (cause) {
			setError(
				cause instanceof Error
					? cause.message
					: "Could not remove this source.",
			);
		} finally {
			setIsBusy(false);
		}
	};
	return (
		<section aria-label="Topic sources" className="space-y-4 p-4 md:p-5">
			<div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
				<P className="max-w-prose text-muted-foreground text-sm">
					Documents, notes and links the assistant can use in chats
					linked to this topic. You do not need to attach them again.
				</P>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						disabled={disabled}
						onClick={(event) => {
							actionRef.current = event.currentTarget;
							setIsImporting(true);
						}}
					>
						From a chat
					</Button>
					<Button
						variant="outline"
						disabled={disabled}
						onClick={(event) => {
							actionRef.current = event.currentTarget;
							setIsLinking(true);
						}}
					>
						<Link2 aria-hidden="true" />
						Link existing
					</Button>
					<Button
						variant="outline"
						disabled={disabled}
						onClick={(event) => {
							actionRef.current = event.currentTarget;
							setEditorKind("link");
						}}
					>
						Add link
					</Button>
					<Button
						variant="outline"
						disabled={disabled}
						onClick={(event) => {
							actionRef.current = event.currentTarget;
							setEditorKind("note");
						}}
					>
						<Plus aria-hidden="true" />
						Add note
					</Button>
					<Button
						disabled={disabled}
						onClick={(event) => {
							actionRef.current = event.currentTarget;
							setError("");
							setNotice("");
							setIsUploading(true);
						}}
					>
						<Upload aria-hidden="true" />
						Upload documents
					</Button>
				</div>
			</div>
			{isSample && (
				<P className="text-muted-foreground text-sm">
					Open one of your own topics to add sources. Sample topics do
					not save documents.
				</P>
			)}
			{isSuggested && (
				<P className="text-muted-foreground text-sm">
					Set this topic to Active or Dormant to add sources.
				</P>
			)}
			{isArchived && (
				<P className="text-muted-foreground text-sm">
					Sources are preserved while this topic is archived. Set it
					to Active or Dormant to make changes and use its assistant.
				</P>
			)}
			{!isSample &&
				(result.status === "LOADING" ||
					result.status === "INITIAL") && (
					<Spinner aria-label="Loading topic sources" />
				)}
			{(error || readError) && (
				<Alert variant="destructive">
					<AlertDescription>{error || readError}</AlertDescription>
					{readError && (
						<Button variant="outline" onClick={result.refresh}>
							Retry
						</Button>
					)}
				</Alert>
			)}
			{notice && (
				<output className="block text-muted-foreground text-sm">
					{notice}
				</output>
			)}
			{list?.length === 0 && (
				<div className="space-y-2 py-6">
					<P className="font-medium">No sources yet</P>
					<P className="text-muted-foreground text-sm">
						Upload a specification, add meeting notes, or link a
						source from another topic.
					</P>
				</div>
			)}
			{list && list.length > 0 && (
				<ul
					aria-label="Saved topic sources"
					className="divide-y divide-border"
				>
					{list.map((source) => (
						<li
							key={source.sourceId}
							className="flex min-w-0 flex-wrap items-center gap-3 py-3"
						>
							<div className="flex w-full min-w-0 items-start gap-3 sm:w-auto sm:flex-1">
								<FileText
									aria-hidden="true"
									className="mt-1 size-5 shrink-0 text-muted-foreground"
								/>
								<div className="min-w-0 flex-1">
									<Button
										variant="link"
										className="h-auto max-w-full justify-start whitespace-normal break-words p-0 text-left"
										onClick={(event) => {
											actionRef.current =
												event.currentTarget;
											setSelected(source);
										}}
									>
										{source.title}
									</Button>
									<P className="text-muted-foreground text-sm">
										{source.kind} · Version {source.version}
										{(source.topicIds?.length ?? 0) > 1
											? ` · Used in ${source.topicIds?.length} topics`
											: ""}
									</P>
								</div>
							</div>
							<Badge variant="outline">
								{source.status === "reference"
									? "Link only"
									: source.status === "ready"
										? "Ready"
										: source.status}
								{source.truncated ? " · Text shortened" : ""}
							</Badge>
							<Button
								variant="ghost"
								className="ml-auto pointer-coarse:min-h-11"
								disabled={disabled}
								onClick={() =>
									void handleRemove(source.sourceId)
								}
							>
								Remove
								<span className="sr-only">
									{" "}
									{source.title} from this topic
								</span>
							</Button>
						</li>
					))}
				</ul>
			)}
			{editorKind && (
				<TopicSourceEditor
					topicId={topicId}
					kind={editorKind}
					onSubmit={close}
				/>
			)}
			{selected && (
				<TopicSourceDetails
					topicId={topicId}
					sourceId={selected.sourceId}
					canEdit={!disabled}
					onClose={() => close()}
					onSaved={() => {
						result.refresh();
						setNotice("Source updated.");
					}}
				/>
			)}
			{isLinking && (
				<LinkTopicSourceDialog topicId={topicId} onSubmit={close} />
			)}
			{isImporting && (
				<ImportChatSourceDialog topicId={topicId} onSubmit={close} />
			)}
			{isUploading && (
				<UploadTopicDocumentsDialog
					topicId={topicId}
					onUploaded={(count) => {
						result.refresh();
						setNotice(
							`${count} ${count === 1 ? "document added" : "documents added"}.`,
						);
					}}
					onSubmit={() => close()}
				/>
			)}
		</section>
	);
}
