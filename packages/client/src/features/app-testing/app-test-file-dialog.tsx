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
	FormTextarea,
	Spinner,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { parseAppTestRecordingFile } from "@/api/app-testing";
import type { AppTestRecording } from "./app-test.types";

const schema = z.object({ content: z.string().min(1) });

interface AppTestFileDialogProps {
	/** Snapshot at open time; background refreshes must not overwrite edits. */
	recording: AppTestRecording;
	mode: "view" | "edit" | "delete";
	onSave: (recording: AppTestRecording) => Promise<void>;
	onDelete: (id: string) => Promise<void>;
	onClose: () => void;
	onReturnFocus: () => void;
}

/** View, edit, or confirm deletion while keeping failed writes recoverable. */
export const AppTestFileDialog = ({
	recording,
	mode,
	onSave,
	onDelete,
	onClose,
	onReturnFocus,
}: AppTestFileDialogProps) => {
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: { content: JSON.stringify(recording, null, 2) },
	});
	const { isSubmitting, errors } = form.formState;
	const handleSubmit = async ({
		content,
	}: z.infer<typeof schema>): Promise<void> => {
		if (mode === "view") return;
		try {
			if (mode === "delete") await onDelete(recording.id);
			else await onSave(parseAppTestRecordingFile(content, recording.id));
		} catch (failure: unknown) {
			form.setError("root.server", {
				type: "server",
				message:
					failure instanceof Error
						? failure.message
						: "Could not update the test file",
			});
			return;
		}
		onClose();
	};
	return (
		<Dialog
			open
			onOpenChange={(isOpen) => {
				if (!isOpen && !isSubmitting) onClose();
			}}
		>
			<DialogContent
				className="flex max-h-dvh min-w-0 flex-col overflow-y-auto sm:max-w-3xl"
				showCloseButton={!isSubmitting}
				onEscapeKeyDown={(event) => {
					if (isSubmitting) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (isSubmitting) event.preventDefault();
				}}
				onCloseAutoFocus={(event) => {
					event.preventDefault();
					onReturnFocus();
				}}
			>
				<DialogHeader>
					<DialogTitle>
						{mode === "delete"
							? "Delete test file"
							: mode === "edit"
								? "Edit test file"
								: recording.name}
					</DialogTitle>
					<DialogDescription className="whitespace-pre-wrap break-words">
						{recording.description}
					</DialogDescription>
				</DialogHeader>
				<p className="break-all font-mono text-muted-foreground text-xs">
					assets/app-tests/recordings/{recording.id}.json
				</p>
				<Form
					form={form}
					onSubmit={handleSubmit}
					noValidate
					aria-busy={isSubmitting}
					className="flex min-w-0 flex-col gap-4"
				>
					{mode === "delete" ? (
						<p className="text-sm">
							Delete “{recording.name}”? The test definition will
							be removed. Previous run reports will be kept.
						</p>
					) : (
						<FormTextarea
							name="content"
							label="Test file JSON"
							description={
								mode === "edit"
									? "Keep the file id and version unchanged. A description and at least one step are required."
									: "Read-only test definition."
							}
							readOnly={mode === "view"}
							disabled={isSubmitting}
							rows={16}
							className="min-w-0 [&_textarea]:font-mono [&_textarea]:text-xs"
							spellCheck={false}
						/>
					)}
					{errors.root?.server?.message && (
						<Alert variant="destructive">
							<AlertDescription className="whitespace-pre-wrap break-words">
								{errors.root.server.message}
							</AlertDescription>
						</Alert>
					)}
					<DialogFooter className="flex-wrap">
						<Button
							type="button"
							variant="outline"
							disabled={isSubmitting}
							onClick={onClose}
						>
							{mode === "view" ? "Close file" : "Cancel"}
						</Button>
						{mode !== "view" && (
							<Button
								type="submit"
								variant={
									mode === "delete"
										? "destructive"
										: "default"
								}
								disabled={isSubmitting}
							>
								{isSubmitting && <Spinner className="size-4" />}
								{isSubmitting
									? mode === "delete"
										? "Deleting…"
										: "Saving…"
									: mode === "delete"
										? "Delete file"
										: "Save changes"}
							</Button>
						)}
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
