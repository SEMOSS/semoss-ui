import { useEffect, useMemo, useRef, useState } from "react";
import { useSessionPixel } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Button,
	Form,
	FormInput,
	FormSwitch,
	P,
	Spinner,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import {
	abandonAppChange,
	getAppChangeBuildLog,
	parseAppChanges,
	saveAppChanges,
} from "@/api/app-testing";

const schema = z.object({
	enabled: z.boolean(),
	baseBranch: z.string().trim().min(1, "A base branch is required").max(200),
	buildCommand: z.string().trim().max(2000),
});

interface AppTestChangesPanelProps {
	/** App whose chat may use the candidate/test/merge workflow. */
	appId: string;
	/** Existing recording or replay prevents changing workflow settings. */
	isBusy: boolean;
}

/** Configure automatic candidate changes and observe the platform's merge decision. */
export const AppTestChangesPanel = ({
	appId,
	isBusy,
}: AppTestChangesPanelProps) => {
	const query = useSessionPixel<unknown>(
		`META | ManageAppTestChanges(project=${JSON.stringify([appId])}, action=["get"]);`,
	);
	const parsed = useMemo(() => {
		if (query.status !== "SUCCESS") return null;
		try {
			return { data: parseAppChanges(appId, query.data), error: "" };
		} catch (failure: unknown) {
			return {
				data: null,
				error:
					failure instanceof Error
						? failure.message
						: "Invalid app change status",
			};
		}
	}, [appId, query.data, query.status]);
	const [previousRead, setPreviousRead] = useState<ReturnType<
		typeof parseAppChanges
	> | null>(null);
	const successfulRead = parsed?.data;
	// The SDK clears query data during refresh. Keep the last validated read so polling never unmounts a dirty form.
	useEffect(() => {
		if (successfulRead) setPreviousRead(successfulRead);
	}, [successfulRead]);
	const data = successfulRead ?? previousRead;
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			enabled: false,
			baseBranch: "master",
			buildCommand: "",
		},
		values: data?.configuration,
		resetOptions: { keepDirtyValues: true },
	});
	const { isSubmitting, dirtyFields, errors } = form.formState;
	const hasEdits = Object.keys(dirtyFields).length > 0;
	const lifetime = useRef<AbortController | null>(null);
	const [operation, setOperation] = useState<"abandon" | "log" | null>(null);
	const [operationError, setOperationError] = useState("");
	const [buildLog, setBuildLog] = useState<string | null>(null);
	const isDisabled =
		isBusy ||
		Boolean(data?.isActive) ||
		isSubmitting ||
		operation !== null ||
		query.status === "ERROR" ||
		Boolean(parsed?.error);
	const readError =
		query.status === "ERROR"
			? query.error?.message || "Could not read app change settings"
			: parsed?.error;
	useEffect(() => {
		const controller = new AbortController();
		lifetime.current = controller;
		return () => controller.abort();
	}, []);
	useEffect(() => {
		if (!data?.configuration.enabled && !data?.isActive) return;
		const timer = window.setInterval(
			() => query.refresh(),
			data.isActive ? 2000 : 5000,
		);
		return () => window.clearInterval(timer);
	}, [data?.configuration.enabled, data?.isActive, query.refresh]);
	const handleSave = async (
		values: z.infer<typeof schema>,
	): Promise<void> => {
		const signal = lifetime.current?.signal;
		try {
			const saved = await saveAppChanges(appId, values);
			if (signal?.aborted) return;
			form.reset(saved.configuration);
			query.refresh();
		} catch (failure: unknown) {
			if (!signal?.aborted)
				form.setError("root.server", {
					type: "server",
					message:
						failure instanceof Error
							? failure.message
							: "Could not save app change settings",
				});
		}
	};
	const handleOperation = async (
		action: "abandon" | "log",
	): Promise<void> => {
		const signal = lifetime.current?.signal;
		setOperation(action);
		setOperationError("");
		try {
			if (action === "log") {
				const log = await getAppChangeBuildLog(appId);
				if (!signal?.aborted) setBuildLog(log);
			} else {
				await abandonAppChange(appId);
				if (!signal?.aborted) {
					setBuildLog(null);
					query.refresh();
				}
			}
		} catch (failure: unknown) {
			if (!signal?.aborted)
				setOperationError(
					failure instanceof Error
						? failure.message
						: "Could not update the app change",
				);
		} finally {
			if (!signal?.aborted) setOperation(null);
		}
	};
	return (
		<details className="mb-4 min-w-0 border-b pb-3">
			<summary className="cursor-pointer font-medium text-sm focus-visible:outline focus-visible:outline-ring">
				Test-gated app changes
				{data?.change.status ? ` · ${data.change.status}` : ""}
			</summary>
			<div className="mt-3 flex min-w-0 flex-col gap-3">
				<P className="text-muted-foreground text-xs">
					App chat edits a private branch, builds it and runs saved
					regression workflows. Only a passing candidate fast-forwards
					the base branch. Failed candidates stay available for repair
					in the next chat.
				</P>
				{readError && (
					<Alert variant="destructive">
						<AlertDescription>{readError}</AlertDescription>
					</Alert>
				)}
				{!data ? (
					!readError && <Spinner className="size-4" />
				) : (
					<Form
						form={form}
						onSubmit={handleSave}
						noValidate
						className="flex min-w-0 flex-col gap-3"
					>
						<FormSwitch
							name="enabled"
							label="Use tested branches for app chat"
							disabled={isDisabled}
						/>
						<FormInput
							name="baseBranch"
							label="Base branch"
							required
							disabled={isDisabled}
						/>
						<FormInput
							name="buildCommand"
							label="Build command"
							disabled={isDisabled}
							description="Runs in candidate assets, for example npm run build. Install dependencies in the candidate as needed. Leave empty for static HTML without a build script."
						/>
						{errors.root?.server?.message && (
							<Alert variant="destructive">
								<AlertDescription>
									{errors.root.server.message}
								</AlertDescription>
							</Alert>
						)}
						<div className="flex flex-wrap gap-2">
							<Button
								type="button"
								size="sm"
								variant="outline"
								disabled={isDisabled || !hasEdits}
								onClick={() => form.reset(data.configuration)}
							>
								Discard settings
							</Button>
							<Button
								type="submit"
								size="sm"
								disabled={isDisabled || !hasEdits}
							>
								{isSubmitting && <Spinner className="size-4" />}
								Save settings
							</Button>
						</div>
					</Form>
				)}
				{data?.change.id && (
					<div className="flex min-w-0 flex-col gap-2">
						<output
							aria-live="polite"
							className="break-words text-sm"
						>
							{data.change.status}:{" "}
							{data.change.reason || data.change.branch}
						</output>
						<P className="break-all text-muted-foreground text-xs">
							Branch: {data.change.branch}
							{data.change.candidateCommit
								? ` · Commit: ${data.change.candidateCommit.slice(0, 10)}`
								: ""}
							{data.change.runId
								? ` · Test run: ${data.change.runId}`
								: ""}
						</P>
						{data.change.summary && (
							<P className="text-sm">
								{data.change.summary.passed ?? 0} passed ·{" "}
								{data.change.summary.failed ?? 0} failed ·{" "}
								{data.change.summary.error ?? 0} errors ·{" "}
								{data.change.summary.skipped ?? 0} skipped
							</P>
						)}
						<div className="flex flex-wrap gap-2">
							<Button
								type="button"
								size="sm"
								variant="outline"
								disabled={isDisabled}
								onClick={() => void handleOperation("log")}
							>
								View build log
							</Button>
							{!["MERGED", "NO_CHANGES", "ABANDONED"].includes(
								data.change.status ?? "",
							) && (
								<Button
									type="button"
									size="sm"
									variant="outline"
									disabled={isDisabled}
									onClick={() =>
										void handleOperation("abandon")
									}
								>
									Abandon pending change
								</Button>
							)}
						</div>
						{buildLog !== null && (
							<section aria-label="Private candidate build log">
								<pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-2 text-xs">
									{buildLog}
								</pre>
							</section>
						)}
					</div>
				)}
				{operationError && (
					<Alert variant="destructive">
						<AlertDescription>{operationError}</AlertDescription>
					</Alert>
				)}
				<Button
					type="button"
					size="sm"
					variant="ghost"
					className="self-start"
					onClick={() => query.refresh()}
				>
					Refresh change status
				</Button>
			</div>
		</details>
	);
};
