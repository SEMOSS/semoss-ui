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
	Form,
	FormFileDropzone,
	Spinner,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { saveTopicDocument } from "./topic-sources.api";

const schema = z.object({
	files: z
		.array(z.instanceof(File))
		.nullable()
		.superRefine((files, context) => {
			if (!files?.length) {
				context.addIssue({
					code: "custom",
					message: "Choose at least one document.",
				});
			}
			const oversized = files?.find(
				(file) => file.size > 10 * 1024 * 1024,
			);
			if (oversized) {
				context.addIssue({
					code: "custom",
					message: `${oversized.name} is over the 10 MB source limit.`,
				});
			}
		}),
});

interface UploadTopicDocumentsDialogProps {
	/** Topic that will receive the uploaded sources. */
	topicId: string;
	/** Refreshes saved sources, including successes before a partial failure. */
	onUploaded: (count: number) => void;
	/** Receives the last saved source id on success, or no argument on cancel. */
	onSubmit: (id?: string) => void;
}

/** Stages documents before upload and retains only unfinished files for retry. */
export function UploadTopicDocumentsDialog({
	topicId,
	onUploaded,
	onSubmit,
}: UploadTopicDocumentsDialogProps) {
	const { actions, insightId } = useInsight();
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: { files: [] },
	});
	const { isSubmitting, errors } = form.formState;
	const files = form.watch("files");
	const handleSubmit = async (
		values: z.infer<typeof schema>,
	): Promise<void> => {
		if (!values.files?.length) return;
		let saved = 0;
		let lastId: string | undefined;
		try {
			for (const file of values.files) {
				lastId = await saveTopicDocument(
					actions,
					insightId,
					topicId,
					file,
				);
				saved++;
			}
		} catch (cause) {
			// Successful writes stay saved; retry must not upload them again.
			form.setValue("files", values.files.slice(saved));
			form.setError("root.server", {
				message: `${saved ? `${saved} document(s) added. ` : ""}${cause instanceof Error ? cause.message : "Could not add this document."} Retry the remaining files or remove them from the selection.`,
			});
			if (saved) onUploaded(saved);
			return;
		}
		onUploaded(saved);
		onSubmit(lastId);
	};

	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open && !isSubmitting) onSubmit();
			}}
		>
			<DialogContent
				showCloseButton={!isSubmitting}
				onEscapeKeyDown={(event) => {
					if (isSubmitting) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (isSubmitting) event.preventDefault();
				}}
			>
				<DialogHeader>
					<DialogTitle>Upload documents</DialogTitle>
					<DialogDescription>
						Add documents the assistant can use in chats linked to
						this topic.
					</DialogDescription>
				</DialogHeader>
				<Form
					form={form}
					onSubmit={handleSubmit}
					noValidate
					aria-busy={isSubmitting}
					className="space-y-4"
				>
					<FormFileDropzone
						name="files"
						label="Documents (required)"
						multiple
						disabled={isSubmitting}
						description="Click the area to browse or drag and drop files. Maximum 10 MB per document. Review your selection, then choose Upload."
					/>
					{errors.root?.server?.message && (
						<Alert variant="destructive">
							<AlertDescription>
								{errors.root.server.message}
							</AlertDescription>
						</Alert>
					)}
					<DialogFooter className="flex-col sm:flex-row">
						<Button
							type="button"
							variant="outline"
							className="pointer-coarse:min-h-11"
							disabled={isSubmitting}
							onClick={() => onSubmit()}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							className="pointer-coarse:min-h-11"
							disabled={isSubmitting || !files?.length}
						>
							{isSubmitting && <Spinner />}
							{isSubmitting ? "Uploading…" : "Upload"}
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
