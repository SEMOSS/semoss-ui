import { useState } from "react";
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
	DialogTrigger,
	Form,
	FormFileDropzone,
	Spinner,
	toast,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { uploadTopicFile } from "../api/topic-files";

const schema = z.object({
	files: z
		.array(z.instanceof(File))
		.min(1, "Choose at least one document.")
		.nullable()
		.refine(
			(files) => files !== null && files.length > 0,
			"Choose at least one document.",
		),
});
type Values = z.infer<typeof schema>;
interface UploadTopicFilesDialogProps {
	/** The writable topic receiving originals. */
	topicId: string;
	/** Server-enforced per-file size limit. */
	maxBytes: number | null;
	/** Reload the list after each file is persisted, including partial success. */
	onUploaded: () => void;
}
/** Reuses the platform dropzone unchanged, with deliberate submit and retry behavior. */
export function UploadTopicFilesDialog({
	topicId,
	maxBytes,
	onUploaded,
}: UploadTopicFilesDialogProps) {
	const { actions, insightId } = useInsight();
	const [isOpen, setIsOpen] = useState(false);
	const form = useForm<Values>({
		resolver: zodResolver(schema),
		defaultValues: { files: [] },
	});
	const { isSubmitting, errors } = form.formState;
	const handleOpenChange = (next: boolean): void => {
		if (isSubmitting) return;
		if (!next) form.reset({ files: [] });
		setIsOpen(next);
	};
	const handleSubmit = async ({ files }: Values): Promise<void> => {
		if (!files?.length) return;
		if (maxBytes === null) {
			form.setError("root.server", {
				message: "Wait for the file limits to load, then retry.",
			});
			return;
		}
		if (files.some((file) => file.size > maxBytes)) {
			form.setError("files", {
				message: `Each file must be no larger than ${Math.floor(maxBytes / 1024 / 1024)} MB.`,
			});
			return;
		}
		const remaining = [...files];
		try {
			for (const file of files) {
				await uploadTopicFile(actions, insightId, topicId, file);
				remaining.shift();
				form.setValue("files", [...remaining]);
				onUploaded();
			}
		} catch (error: unknown) {
			form.setError("root.server", {
				message:
					error instanceof Error
						? error.message
						: "Upload failed. Retry the remaining files.",
			});
			return;
		}
		toast.success("Documents uploaded");
		form.reset({ files: [] });
		setIsOpen(false);
	};
	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button type="button">Upload documents</Button>
			</DialogTrigger>
			<DialogContent
				showCloseButton={!isSubmitting}
				className="max-h-full overflow-y-auto"
				onEscapeKeyDown={(event) => {
					if (isSubmitting) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (isSubmitting) event.preventDefault();
				}}
			>
				<DialogHeader>
					<DialogTitle>Upload topic documents</DialogTitle>
					<DialogDescription>
						Click to choose files or drag them into the area below.
						{maxBytes === null
							? "Loading file limits…"
							: `Up to ${Math.floor(maxBytes / 1024 / 1024)} MB per file.`}
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
					/>
					{errors.root?.server?.message && (
						<Alert variant="destructive">
							<AlertDescription>
								{errors.root.server.message}
							</AlertDescription>
						</Alert>
					)}
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							disabled={isSubmitting}
							onClick={() => handleOpenChange(false)}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={
								isSubmitting || !form.watch("files")?.length
							}
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
