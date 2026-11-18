import { CircleIcon, PlayIcon, SquareIcon } from "lucide-react";
import { useId } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	Form,
	FormInput,
	FormTextarea,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { useAppFrame } from "./app-frame-registry";
import { AppTestFiles } from "./app-test-files";
import { useAppTesting } from "./use-app-testing";

const schema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Name is required")
		.max(80, "Use at most 80 characters"),
	description: z
		.string()
		.trim()
		.min(1, "Describe the workflow and expected outcome")
		.max(2000, "Use at most 2000 characters"),
});

interface AppTestingPanelProps {
	/** The app whose preview iframe, in the App panel, is recorded. */
	appId: string;
}

/** Record workflows and manage saved test definitions without changing application code. */
export const AppTestingPanel = ({ appId }: AppTestingPanelProps) => {
	const replaySelectId = useId();
	const frame = useAppFrame(appId);
	const state = useAppTesting(appId, frame);
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: { name: "", description: "" },
	});
	const hasDraft = state.steps.length > 0;
	const checkCount = state.steps.filter((step) =>
		step.type.startsWith("ASSERT_"),
	).length;
	const handleRecord = (): void => {
		form.reset({
			name: `Recording ${new Date().toLocaleString()}`,
			description: "",
		});
		state.startRecording();
	};
	const handleSave = async ({
		name,
		description,
	}: z.infer<typeof schema>): Promise<void> => {
		try {
			await state.save(name, description);
		} catch (failure: unknown) {
			form.setError("root.server", {
				type: "server",
				message:
					failure instanceof Error
						? failure.message
						: "Could not save the recording",
			});
		}
	};
	const error = state.error || form.formState.errors.root?.server?.message;
	const summary = state.run?.summary;
	const selectedDescription = state.recordings.find(
		(recording) => recording.id === state.selectedId,
	)?.description;
	const runLabels: Record<string, string> = {
		RUNNING: "Running",
		QUEUED: "Queued",
		COMPLETED: "Finished",
		ERROR: "Test run error",
		NO_TESTS: "No tests matched",
		UNKNOWN: "Result unavailable",
	};
	const runLabel = state.run
		? (runLabels[state.run.status] ?? state.run.status)
		: "";
	return (
		<section
			aria-label="App recording and tests"
			className="h-full min-w-0 overflow-y-auto bg-background p-3"
		>
			<Form
				form={form}
				onSubmit={handleSave}
				noValidate
				className="flex flex-col gap-2"
			>
				<fieldset className="flex min-w-0 flex-col gap-2 border-b pb-4">
					<legend className="mb-2 font-medium text-sm">
						Record workflow
					</legend>
					<div className="flex flex-wrap items-center gap-2">
						{state.isRecording ? (
							<>
								<Button
									type="button"
									size="sm"
									onClick={state.stopRecording}
								>
									<SquareIcon
										aria-hidden="true"
										className="size-4"
									/>
									Stop recording
								</Button>
								<Button
									type="button"
									size="sm"
									variant="outline"
									onClick={state.addCheck}
									disabled={!state.isAccessible}
								>
									{state.isPickingCheck
										? "Cancel check"
										: "Add check"}
								</Button>
							</>
						) : (
							<Button
								type="button"
								size="sm"
								variant="outline"
								onClick={handleRecord}
								disabled={
									!state.isAccessible ||
									hasDraft ||
									state.isRunning ||
									state.isSaving
								}
							>
								<CircleIcon
									aria-hidden="true"
									className="size-4"
								/>
								Record
							</Button>
						)}
						{(state.isRecording || hasDraft) && (
							<output
								aria-live="polite"
								className="text-muted-foreground text-sm"
							>
								{state.steps.length} steps · {checkCount} checks
							</output>
						)}
					</div>
				</fieldset>
				{!state.isRecording && !hasDraft && (
					<fieldset className="flex min-w-0 flex-col gap-2 py-2">
						<legend className="font-medium text-sm">
							Run saved test
						</legend>
						<label htmlFor={replaySelectId} className="text-sm">
							Test file
						</label>
						<div className="flex min-w-0 flex-wrap items-center gap-2">
							<Select
								value={state.selectedId}
								onValueChange={state.setSelectedId}
								disabled={
									state.isLoading ||
									state.isRunning ||
									state.isSaving
								}
							>
								<SelectTrigger
									id={replaySelectId}
									className="w-full min-w-0 flex-1"
								>
									<SelectValue
										placeholder={
											state.isLoading
												? "Loading recordings…"
												: "Select a recording"
										}
									/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="__platform_smoke__">
										Page visibility check
									</SelectItem>
									{state.recordings.map((recording) => (
										<SelectItem
											key={recording.id}
											value={recording.id}
										>
											{recording.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Button
								type="button"
								size="sm"
								onClick={() => void state.startRun()}
								disabled={
									!state.selectedId ||
									state.isRunning ||
									state.isLoading ||
									state.isSaving
								}
							>
								{state.isRunning ? (
									<Spinner className="size-4" />
								) : (
									<PlayIcon
										aria-hidden="true"
										className="size-4"
									/>
								)}
								{state.isRunning ? "Running…" : "Run test"}
							</Button>
						</div>
						<p className="whitespace-pre-wrap break-words text-muted-foreground text-sm">
							{selectedDescription ||
								"Checks that the app displays content without immediate JavaScript errors. No workflow is tested."}
						</p>
						<p className="text-muted-foreground text-xs">
							Runs once in a background browser.
						</p>
					</fieldset>
				)}
				{!frame ? (
					<p className="text-muted-foreground text-sm">
						Open the App preview to record a workflow.
					</p>
				) : (
					!state.isAccessible && (
						<p className="text-muted-foreground text-sm">
							Recording becomes available when this app's document
							can be accessed. External frames cannot be recorded
							here.
						</p>
					)
				)}
				{state.isPickingCheck && (
					<output className="text-sm">
						Click an element in the app, or focus it and press
						Enter, to check its current text or visibility. Escape
						cancels selection. This selection will not activate it.
					</output>
				)}
				{state.notice && (
					<output className="text-muted-foreground text-sm">
						{state.notice}
					</output>
				)}
				{hasDraft && !state.isRecording && (
					<div className="flex flex-wrap items-end gap-2">
						<div className="w-64 max-w-full">
							<FormInput
								name="name"
								label="Recording name"
								required
								disabled={state.isSaving}
							/>
						</div>
						<div className="w-full">
							<FormTextarea
								name="description"
								label="Test description (required)"
								description="Describe the workflow and the expected result this test verifies."
								required
								maxLength={2000}
								disabled={state.isSaving}
							/>
						</div>
						<Button
							type="button"
							size="sm"
							variant="ghost"
							onClick={state.discard}
							disabled={state.isSaving}
						>
							Discard
						</Button>
						<Button
							type="submit"
							size="sm"
							disabled={state.isSaving || state.weakSteps > 0}
						>
							{state.isSaving && <Spinner className="size-4" />}
							{state.isSaving ? "Saving…" : "Save recording"}
						</Button>
						{checkCount === 0 && (
							<p className="text-muted-foreground text-sm">
								No outcome checks recorded. Replay alone will
								not verify the app.
							</p>
						)}
						{state.weakSteps > 0 && (
							<p className="text-destructive text-sm">
								{state.weakSteps} step
								{state.weakSteps === 1 ? " has" : "s have"} no
								unique data-testid, so this recording cannot be
								saved. Ask the assistant to add test ids to
								those elements, then record again.
							</p>
						)}
					</div>
				)}
				{!state.isRecording &&
					!hasDraft &&
					!state.isLoading &&
					state.recordings.length === 0 &&
					!error && (
						<p className="text-muted-foreground text-sm">
							No recordings yet. Run a page visibility check, or
							record a workflow and add a check to test it later.
						</p>
					)}
				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
				{state.run && (
					<div className="flex flex-col gap-2">
						{state.run.coverageWarning && (
							<p className="text-muted-foreground text-sm">
								{state.run.coverageWarning}
							</p>
						)}
						<output aria-live="polite" className="text-sm">
							{runLabel}
							{summary
								? ` · ${summary.passed ?? 0} passed · ${summary.failed ?? 0} failed · ${summary.error ?? 0} errors · ${summary.skipped ?? 0} skipped`
								: ""}
						</output>
						{state.run.error && (
							<Alert variant="destructive">
								<AlertDescription>
									{state.run.error}
								</AlertDescription>
							</Alert>
						)}
						{state.run.tests
							?.filter((test) => test.status !== "PASSED")
							.map((test, index) => (
								<p
									key={`${test.name}-${index}`}
									className="text-sm"
								>
									{test.name}:{" "}
									{test.reason ||
										test.classification ||
										test.status}
								</p>
							))}
						{state.run.status === "UNKNOWN" && (
							<Button
								type="button"
								size="sm"
								variant="outline"
								className="self-start"
								onClick={() => void state.refreshRun()}
							>
								Refresh result
							</Button>
						)}
					</div>
				)}
			</Form>
			<AppTestFiles
				recordings={state.recordings}
				isLoading={state.isLoading}
				onSelect={state.setSelectedId}
				isBusy={state.isSaving || state.isRunning || state.isRecording}
				selectedId={state.selectedId}
				onRefresh={state.refreshRecordings}
				onSave={state.updateRecording}
				onDelete={state.deleteRecording}
			/>
		</section>
	);
};
