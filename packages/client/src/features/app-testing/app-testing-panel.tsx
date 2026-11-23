import { CircleIcon, PlusIcon, SquareIcon, UploadIcon } from "lucide-react";
import { useRef } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Form,
	FormInput,
	FormTextarea,
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

const regressionSchema = z.object({
	candidateCommitSha: z
		.string()
		.trim()
		.regex(/^[a-f0-9]{40}$/, "Enter the full 40-character Git commit SHA"),
});

interface AppTestingPanelProps {
	/** The app whose preview iframe, in the App panel, is recorded. */
	appId: string;
}

/** Record workflows and manage saved test definitions without changing application code. */
export const AppTestingPanel = ({ appId }: AppTestingPanelProps) => {
	const uploadInput = useRef<HTMLInputElement | null>(null);
	const frame = useAppFrame(appId);
	const state = useAppTesting(appId, frame);
	const regressionForm = useForm<z.infer<typeof regressionSchema>>({
		resolver: zodResolver(regressionSchema),
		defaultValues: { candidateCommitSha: "" },
	});
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
			<input
				ref={uploadInput}
				type="file"
				accept=".json,application/json"
				aria-label="Upload test JSON"
				hidden
				onChange={(event) => {
					const file = event.currentTarget.files?.[0];
					event.currentTarget.value = "";
					if (file) void state.uploadTest(file);
				}}
			/>
			<Form
				form={form}
				onSubmit={handleSave}
				noValidate
				className="flex flex-col gap-2"
			>
				<fieldset className="flex min-w-0 flex-col gap-2 border-b pb-4">
					<legend className="mb-2 font-medium text-sm">
						Add test
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
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										type="button"
										size="sm"
										variant="outline"
										aria-label="Add test"
										title="Add test"
										disabled={
											hasDraft ||
											state.isRunning ||
											state.isSaving
										}
									>
										<PlusIcon
											aria-hidden="true"
											className="size-4"
										/>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="start">
									<DropdownMenuItem
										disabled={!state.isAccessible}
										onSelect={handleRecord}
									>
										<CircleIcon
											aria-hidden="true"
											className="size-4"
										/>
										Record workflow
									</DropdownMenuItem>
									<DropdownMenuItem
										onSelect={() =>
											uploadInput.current?.click()
										}
									>
										<UploadIcon
											aria-hidden="true"
											className="size-4"
										/>
										Upload test
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
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
							No tests yet. Run a page visibility check, or record
							a workflow and add a check to test it later.
						</p>
					)}
				{((state.isSaving && !hasDraft) ||
					(state.isRunning && !state.run)) && (
					<output className="flex items-center gap-2 text-sm">
						<Spinner className="size-4" />
						{state.isSaving ? "Saving test…" : "Starting test run…"}
					</output>
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
							{state.run.mode === "ISOLATED_H2" &&
								" with isolated H2"}
							{summary
								? ` · ${summary.passed ?? 0} passed · ${summary.failed ?? 0} failed · ${summary.error ?? 0} errors · ${summary.skipped ?? 0} skipped`
								: ""}
						</output>
						{state.run.candidateCommitSha && (
							<p className="break-all font-mono text-muted-foreground text-xs">
								{state.run.candidateCommitSha}
							</p>
						)}
						{state.run.error && (
							<Alert variant="destructive">
								<AlertDescription>
									{state.run.error}
								</AlertDescription>
							</Alert>
						)}
						{(state.run.historyWarning ||
							state.run.reportWarning) && (
							<Alert>
								<AlertDescription>
									{state.run.historyWarning ||
										state.run.reportWarning}
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
									{test.classification
										? `${test.classification} · `
										: ""}
									{test.reason || test.status}
									{test.failedStep !== undefined
										? ` · Step ${test.failedStep}`
										: ""}
									{test.stepsCompleted !== undefined
										? ` · ${test.stepsCompleted}/${test.stepsAttempted ?? test.stepsCompleted} attempted steps completed`
										: ""}
									{test.expected !== undefined
										? ` · Expected: ${String(test.expected)}`
										: ""}
									{test.actual !== undefined
										? ` · Actual: ${String(test.actual)}`
										: ""}
									{test.page ? ` · Page: ${test.page}` : ""}
									{test.availableTestIds?.length
										? ` · Available test IDs: ${test.availableTestIds.join(", ")}`
										: ""}
									{test.cleanup
										? ` · Cleanup: ${test.cleanup.status}`
										: ""}
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
				appId={appId}
				runKey={
					state.run
						? `${state.run.runId}:${state.run.status}`
						: undefined
				}
				recordings={state.recordings}
				invalidFiles={state.invalidFiles}
				onDeleteInvalid={state.deleteInvalidFile}
				isLoading={state.isLoading}
				onSelect={state.setSelectedId}
				isBusy={
					state.isSaving ||
					state.isRunning ||
					state.isRecording ||
					hasDraft
				}
				selectedId={state.selectedId}
				onRefresh={state.refreshRecordings}
				onRun={(id) => void state.startRun(id)}
				onRunAll={() => void state.runAll()}
				onSave={state.updateRecording}
				onDelete={state.deleteRecording}
			/>
			{state.approvedH2RecordingId && (
				<Form
					form={regressionForm}
					onSubmit={async ({ candidateCommitSha }) => {
						if (state.approvedH2RecordingId) {
							await state.startRun(
								state.approvedH2RecordingId,
								candidateCommitSha,
							);
						}
					}}
					noValidate
					className="mt-3 flex flex-col gap-2 border-t pt-3"
				>
					<FormInput
						name="candidateCommitSha"
						label="Candidate Commit SHA (Required)"
						description="Replays the approved scenario with synthetic data in a fresh H2 database."
						autoComplete="off"
						spellCheck={false}
						required
						disabled={
							state.isRunning ||
							state.isSaving ||
							state.isRecording ||
							hasDraft
						}
					/>
					<Button
						type="submit"
						size="sm"
						variant="outline"
						className="self-start"
						disabled={
							state.isRunning ||
							state.isSaving ||
							state.isRecording ||
							hasDraft
						}
					>
						Run H2 Regression
					</Button>
				</Form>
			)}
			<div className="mt-3 flex flex-col gap-1 border-t pt-3">
				<Button
					type="button"
					size="sm"
					variant="ghost"
					className="self-start"
					disabled={
						state.isRunning ||
						state.isSaving ||
						state.isRecording ||
						hasDraft
					}
					onClick={() => void state.startRun("__platform_smoke__")}
				>
					Page visibility check
				</Button>
				<p className="text-muted-foreground text-xs">
					Checks visible content and immediate JavaScript errors only.
					Test runs replay each selected test once in a background
					browser.
				</p>
			</div>
		</section>
	);
};
