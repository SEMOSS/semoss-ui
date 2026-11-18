import { useSessionPixel } from "@semoss/sdk/react";
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
import {
	parseAppTestRecording,
	parseAppTestRecordingFile,
} from "@/api/app-testing";
import type {
	AppTestRecording,
	AppTestRecordingSummary,
} from "./app-test.types";

const schema = z.object({ content: z.string().min(1) });

interface AppTestFileDialogProps {
	/** Summary selected from the listing; full content is read only when opened. */
	recording: AppTestRecordingSummary;
	appId: string;
	mode: "view" | "edit" | "delete";
	onSave: (recording: AppTestRecording) => Promise<void>;
	onDelete: (id: string) => Promise<void>;
	onClose: () => void;
	onReturnFocus: () => void;
}

/** View, edit, or confirm deletion while keeping failed writes recoverable. */
export const AppTestFileDialog = ({
	appId,
	recording,
	mode,
	onSave,
	onDelete,
	onClose,
	onReturnFocus,
}: AppTestFileDialogProps) => {
	const query = useSessionPixel<unknown>(
		mode === "delete"
			? ""
			: `META | GetAppTestRecording(project=${JSON.stringify([appId])}, recordingId=${JSON.stringify([recording.id])});`,
	);
	let definition: AppTestRecording | null = null;
	let readError = query.error?.message || "";
	if (mode !== "delete" && query.status === "SUCCESS") {
		try {
			definition = parseAppTestRecording(appId, recording.id, query.data);
		} catch (failure: unknown) {
			readError =
				failure instanceof Error
					? failure.message
					: "Could not read this test file";
		}
	}
	const isReady = mode === "delete" || definition !== null;
	const content = JSON.stringify(
		mode === "delete" ? recording : definition,
		null,
		2,
	);
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: { content: "" },
		values: { content: isReady ? content : "" },
		resetOptions: { keepDirtyValues: true },
	});
	const { isSubmitting, errors, dirtyFields } = form.formState;
	const handleSubmit = async ({
		content,
	}: z.infer<typeof schema>): Promise<void> => {
		if (mode === "view" || !isReady) return;
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
					) : !isReady ? (
						readError ? (
							<Alert variant="destructive">
								<AlertDescription>{readError}</AlertDescription>
							</Alert>
						) : (
							<output className="flex items-center gap-2 text-sm">
								<Spinner className="size-4" />
								Loading test file…
							</output>
						)
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
					{mode === "edit" && dirtyFields.content && (
						<p className="text-muted-foreground text-xs">
							Unsaved changes
						</p>
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
						{readError && !isReady && (
							<Button
								type="button"
								variant="outline"
								onClick={query.refresh}
							>
								Retry reading file
							</Button>
						)}
						{mode !== "view" && isReady && (
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
