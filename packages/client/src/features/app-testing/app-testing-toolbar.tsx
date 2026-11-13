import type { RefObject } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	Form,
	FormInput,
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
import { useAppTesting } from "./use-app-testing";

const schema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Name is required")
		.max(80, "Use at most 80 characters"),
});

interface AppTestingToolbarProps {
	/** The explicit app whose ordinary iframe is recorded. */
	appId: string;
	frameRef: RefObject<HTMLIFrameElement | null>;
}

/** Record workflows and explicit checks without changing the app's files. */
export const AppTestingToolbar = ({
	appId,
	frameRef,
}: AppTestingToolbarProps) => {
	const state = useAppTesting(appId, frameRef);
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: { name: "" },
	});
	const hasDraft = state.steps.length > 0;
	const checkCount = state.steps.filter((step) =>
		step.type.startsWith("ASSERT_"),
	).length;
	const handleRecord = (): void => {
		form.reset({ name: `Recording ${new Date().toLocaleString()}` });
		state.startRecording();
	};
	const handleSave = async ({
		name,
	}: z.infer<typeof schema>): Promise<void> => {
		try {
			await state.save(name);
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
			className="shrink-0 border-b bg-background p-2"
		>
			<Form
				form={form}
				onSubmit={handleSave}
				noValidate
				className="flex flex-col gap-2"
			>
				<div className="flex flex-wrap items-center gap-2">
					{state.isRecording ? (
						<>
							<Button
								type="button"
								size="sm"
								onClick={state.stopRecording}
							>
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
					{!state.isRecording && !hasDraft && (
						<>
							<Select
								value={state.selectedId}
								onValueChange={state.setSelectedId}
								disabled={state.isLoading || state.isRunning}
							>
								<SelectTrigger
									aria-label="Saved app recording"
									className="w-64 max-w-full"
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
								variant="outline"
								onClick={state.refreshRecordings}
								disabled={state.isLoading || state.isRunning}
							>
								Refresh recordings
							</Button>
							<Button
								type="button"
								size="sm"
								onClick={() => void state.startRun()}
								disabled={
									!state.selectedId ||
									state.isRunning ||
									state.isLoading
								}
							>
								{state.isRunning && (
									<Spinner className="size-4" />
								)}
								{state.isRunning ? "Running…" : "Run test"}
							</Button>
						</>
					)}
				</div>
				{!state.isAccessible && (
					<p className="text-muted-foreground text-sm">
						Recording becomes available when this app's document can
						be accessed. External frames cannot be recorded here.
					</p>
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
							disabled={state.isSaving}
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
		</section>
	);
};
