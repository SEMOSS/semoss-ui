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
	FormCheckbox,
	FormInput,
	FormSelect,
	FormSelectItem,
	FormTextarea,
	Spinner,
	Textarea,
	useForm,
	zodResolver,
} from "@semoss/ui/next";
import { parseAppTestRecording } from "@/api/app-testing";
import type {
	AppTestRecording,
	AppTestRecordingSummary,
} from "./app-test.types";
import {
	type AppTestRecordingFormValues,
	appTestRecordingFormSchema,
	fromAppTestFormValues,
	toAppTestFormValues,
} from "./app-test-recording-form";
import { AppTestStepsEditor } from "./app-test-steps-editor";

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
	const form = useForm<AppTestRecordingFormValues>({
		resolver:
			mode === "edit"
				? zodResolver(appTestRecordingFormSchema)
				: undefined,
		defaultValues: {
			name: "",
			description: "",
			startPath: "",
			steps: [],
			cleanupSteps: [],
			routeMatch: "EXACT",
			useVariables: false,
		},
		values: toAppTestFormValues(
			definition ?? { ...recording, startPath: "", steps: [] },
		),
		resetOptions: { keepDirtyValues: true },
	});
	const { isSubmitting, errors, dirtyFields } = form.formState;
	const handleSubmit = async (
		values: AppTestRecordingFormValues,
	): Promise<void> => {
		if (mode === "view" || !isReady) return;
		try {
			if (mode === "delete") await onDelete(recording.id);
			else if (definition)
				await onSave(fromAppTestFormValues(definition, values));
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
					assets/app-tests/tests/{recording.id}.json
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
					) : mode === "view" ? (
						<Textarea
							aria-label="Test file JSON"
							value={JSON.stringify(definition, null, 2)}
							readOnly
							rows={16}
							className="font-mono text-xs"
						/>
					) : (
						<>
							<FormInput
								name="name"
								label="Test name (required)"
								required
								maxLength={120}
								disabled={isSubmitting}
							/>
							<FormTextarea
								name="description"
								label="Description (required)"
								description="Describe the workflow and expected result."
								required
								maxLength={2000}
								disabled={isSubmitting}
							/>
							<FormInput
								name="startPath"
								label="Start page"
								description="Relative to this app. Leave empty for the app home page."
								disabled={isSubmitting}
							/>
							<FormSelect
								name="routeMatch"
								label="Route matching"
								disabled={isSubmitting}
							>
								<FormSelectItem value="EXACT">
									Exact URL
								</FormSelectItem>
								<FormSelectItem value="PORTAL_ROOT">
									Allow portal entry/root aliases
								</FormSelectItem>
							</FormSelect>
							<p className="text-muted-foreground text-sm">
								Root alias matching is explicit. Query
								parameters, including the selected database
								environment, always remain significant.
							</p>
							<FormCheckbox
								name="useVariables"
								label="Enable per-attempt variables"
								disabled={isSubmitting}
							/>
							<p className="text-muted-foreground text-sm">
								Use {"{{uniqueId}}"} for a value unique to each
								replay; reuse it in matching assertions or
								cleanup.{" "}
								{"{{runId}}, {{testId}}, {{attemptId}}"} are
								also supported.
							</p>
							<AppTestStepsEditor section="steps" />
							<AppTestStepsEditor section="cleanupSteps" />
						</>
					)}
					{mode === "edit" && Object.keys(dirtyFields).length > 0 && (
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
