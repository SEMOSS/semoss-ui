import { useRef, useState } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	Input,
	P,
	Spinner,
} from "@semoss/ui/next";
import { pixel } from "@/lib/pixel";
import { TopicSourceEditor } from "./topic-source-editor";
import {
	saveTopicDocument,
	topicSourceDetailSchema,
} from "./topic-sources.api";

interface TopicSourceDetailsProps {
	topicId: string;
	sourceId: string;
	version?: number;
	canEdit?: boolean;
	onClose: () => void;
	onSaved?: () => void;
}

/** Reauthorize every inspection, including historical answer citations. */
export function TopicSourceDetails({
	topicId,
	sourceId,
	version,
	canEdit = false,
	onClose,
	onSaved,
}: TopicSourceDetailsProps) {
	const { actions, insightId } = useInsight();
	const fileInput = useRef<HTMLInputElement>(null);
	const [isReplacing, setIsReplacing] = useState(false);
	const [replaceError, setReplaceError] = useState("");
	const result = usePixel<unknown>(
		pixel("BrainGetTopicSource", { topicId, sourceId, version }),
	);
	const [isEditing, setIsEditing] = useState(false);
	const parsed = topicSourceDetailSchema.safeParse(result.data);
	const source =
		result.status === "SUCCESS" &&
		parsed.success &&
		parsed.data.sourceId === sourceId &&
		(version === undefined || parsed.data.version === version)
			? parsed.data
			: null;
	const error =
		result.status === "ERROR"
			? (result.error?.message ?? "Could not read this source.")
			: result.status === "SUCCESS" && !source
				? "The returned source does not match this reference."
				: "";
	const handleReplace = async (file: File): Promise<void> => {
		if (!source || !canEdit || isReplacing) return;
		setIsReplacing(true);
		setReplaceError("");
		try {
			await saveTopicDocument(actions, insightId, topicId, file, source);
			result.refresh();
			onSaved?.();
		} catch (cause) {
			setReplaceError(
				cause instanceof Error
					? cause.message
					: "Could not replace this document.",
			);
		} finally {
			setIsReplacing(false);
			if (fileInput.current) fileInput.current.value = "";
		}
	};
	if (isEditing && source)
		return (
			<TopicSourceEditor
				topicId={topicId}
				kind={source.kind}
				source={source}
				onSubmit={(id) => {
					setIsEditing(false);
					if (id) {
						result.refresh();
						onSaved?.();
					}
				}}
			/>
		);
	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open && !isReplacing) onClose();
			}}
		>
			<DialogContent
				className="max-h-dvh overflow-y-auto sm:max-w-2xl"
				showCloseButton={!isReplacing}
				onEscapeKeyDown={(event) => {
					if (isReplacing) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (isReplacing) event.preventDefault();
				}}
			>
				<DialogHeader>
					<DialogTitle>
						{source?.title ?? "Source details"}
					</DialogTitle>
					<DialogDescription>
						{source
							? `Version ${source.version} · ${source.kind}`
							: "Read the saved source available to this topic."}
					</DialogDescription>
				</DialogHeader>
				{(result.status === "INITIAL" ||
					result.status === "LOADING") && (
					<Spinner aria-label="Loading source" />
				)}
				{(error || replaceError) && (
					<Alert variant="destructive">
						<AlertDescription>
							{error || replaceError}
						</AlertDescription>
						<Button variant="outline" onClick={result.refresh}>
							Retry
						</Button>
					</Alert>
				)}
				{source && (
					<>
						{source.truncated && (
							<P className="text-sm text-warning">
								Only the first 120,000 characters could be saved
								for the assistant. Use a smaller document for
								complete coverage.
							</P>
						)}
						{source.fileName && (
							<P className="break-words text-muted-foreground text-sm">
								{source.fileName}
							</P>
						)}
						{source.url && /^https?:\/\//i.test(source.url) && (
							<Button
								asChild
								variant="link"
								className="h-auto justify-start whitespace-normal break-all p-0"
							>
								<a
									href={source.url}
									target="_blank"
									rel="noopener noreferrer"
								>
									Open original link
								</a>
							</Button>
						)}
						<section aria-label="Source text">
							<P className="whitespace-pre-wrap break-words text-sm">
								{source.content ||
									"This source is a link only. Add reference text to make its contents available to the assistant."}
							</P>
						</section>
						{canEdit && (
							<Button
								variant="outline"
								disabled={isReplacing}
								onClick={() => setIsEditing(true)}
							>
								Edit source
							</Button>
						)}
						{canEdit && source.kind === "document" && (
							<>
								<P className="text-muted-foreground text-sm">
									Replacing this document updates every topic
									using it. Earlier answers retain their cited
									version.
								</P>
								<Button
									variant="outline"
									disabled={isReplacing}
									onClick={() => fileInput.current?.click()}
								>
									{isReplacing
										? "Replacing…"
										: "Replace document"}
								</Button>
								<Input
									ref={fileInput}
									type="file"
									className="hidden"
									aria-label="Replacement document"
									disabled={isReplacing}
									onChange={(event) => {
										const file = event.target.files?.[0];
										if (file) void handleReplace(file);
									}}
								/>
							</>
						)}
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
