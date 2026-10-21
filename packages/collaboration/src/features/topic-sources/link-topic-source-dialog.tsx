import { useState } from "react";
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
	P,
	Spinner,
} from "@semoss/ui/next";
import { pixel } from "@/lib/pixel";
import { linkTopicSource, topicSourceListSchema } from "./topic-sources.api";

interface LinkTopicSourceDialogProps {
	topicId: string;
	onSubmit: (id?: string) => void;
}

/** Explicit reuse links the same source; editing it later affects every linked topic. */
export function LinkTopicSourceDialog({
	topicId,
	onSubmit,
}: LinkTopicSourceDialogProps) {
	const { actions } = useInsight();
	const result = usePixel<unknown>(pixel("BrainListTopicSources"));
	const [pendingId, setPendingId] = useState("");
	const [error, setError] = useState("");
	const parsed = topicSourceListSchema.safeParse(result.data);
	const sources =
		result.status === "SUCCESS" && parsed.success
			? parsed.data.sources.filter(
					(source) => !source.topicIds?.includes(topicId),
				)
			: [];
	const readError =
		result.status === "ERROR"
			? (result.error?.message ?? "Could not read your sources.")
			: result.status === "SUCCESS" && !parsed.success
				? "The source list could not be read."
				: "";
	const handleLink = async (sourceId: string): Promise<void> => {
		setError("");
		setPendingId(sourceId);
		try {
			await linkTopicSource(actions, topicId, sourceId);
		} catch (cause) {
			setError(
				cause instanceof Error
					? cause.message
					: "Could not link this source.",
			);
			setPendingId("");
			return;
		}
		setPendingId("");
		onSubmit(sourceId);
	};
	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open && !pendingId) onSubmit();
			}}
		>
			<DialogContent
				className="max-h-dvh overflow-y-auto"
				showCloseButton={!pendingId}
				onEscapeKeyDown={(event) => {
					if (pendingId) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (pendingId) event.preventDefault();
				}}
			>
				<DialogHeader>
					<DialogTitle>Link an existing source</DialogTitle>
					<DialogDescription>
						Use a source from another topic. Future edits apply to
						both topics.
					</DialogDescription>
				</DialogHeader>
				{(result.status === "LOADING" ||
					result.status === "INITIAL") && (
					<Spinner aria-label="Loading sources" />
				)}
				{(error || readError) && (
					<Alert variant="destructive">
						<AlertDescription>
							{error || readError}
						</AlertDescription>
						{readError && (
							<Button variant="outline" onClick={result.refresh}>
								Retry
							</Button>
						)}
					</Alert>
				)}
				{result.status === "SUCCESS" &&
					parsed.success &&
					sources.length === 0 && (
						<P className="text-muted-foreground text-sm">
							No other sources yet. Upload a document or add a
							note to a topic first.
						</P>
					)}
				<ul className="divide-y divide-border">
					{sources.map((source) => (
						<li
							key={source.sourceId}
							className="flex min-w-0 flex-wrap items-center gap-3 py-3"
						>
							<div className="min-w-0 flex-1">
								<P className="break-words text-sm">
									{source.title}
								</P>
								<P className="text-muted-foreground text-sm">
									{source.kind} · Version {source.version}
								</P>
							</div>
							<Button
								variant="outline"
								disabled={!!pendingId}
								onClick={() => void handleLink(source.sourceId)}
							>
								{pendingId === source.sourceId
									? "Linking…"
									: "Link source"}
								<span className="sr-only"> {source.title}</span>
							</Button>
						</li>
					))}
				</ul>
			</DialogContent>
		</Dialog>
	);
}
