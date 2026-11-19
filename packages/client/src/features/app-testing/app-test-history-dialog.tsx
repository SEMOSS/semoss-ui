import { useState } from "react";
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
	Spinner,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@semoss/ui/next";
import {
	formatLocalDateTime,
	formatRoundedDurationMs,
} from "@semoss/utility/date";
import { parseAppTestRunHistory } from "@/api/app-testing";
import type {
	AppTestRecordingSummary,
	AppTestRunHistory,
} from "./app-test.types";
import { useAppTestHistory } from "./use-app-test-history";

interface AppTestHistoryDialogProps {
	appId: string;
	/** History is keyed by this UUID, including results saved before the test was renamed. */
	recording: AppTestRecordingSummary;
	onClose: () => void;
	onReturnFocus: () => void;
}

/** Browse bounded summaries and load just one test's run details when requested. */
export const AppTestHistoryDialog = ({
	appId,
	recording,
	onClose,
	onReturnFocus,
}: AppTestHistoryDialogProps) => {
	const [offset, setOffset] = useState(0);
	const [selectedRun, setSelectedRun] = useState<string | null>(null);
	const history = useAppTestHistory(appId, {
		recordingId: recording.id,
		offset,
	});
	const detailQuery = useSessionPixel<unknown>(
		selectedRun
			? `META | GetAppTestRunHistory(project=${JSON.stringify([appId])}, runId=${JSON.stringify([selectedRun])}, recordingId=${JSON.stringify([recording.id])});`
			: "",
	);
	let detail: AppTestRunHistory | null = null;
	let detailError = detailQuery.error?.message ?? "";
	if (selectedRun && detailQuery.status === "SUCCESS") {
		try {
			detail = parseAppTestRunHistory(
				appId,
				selectedRun,
				recording.id,
				detailQuery.data,
			);
		} catch {
			detailError = "This test run result could not be read.";
		}
	}
	const result = detail?.tests[0];
	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent
				className="flex min-w-0 flex-col sm:max-w-3xl"
				onCloseAutoFocus={(event) => {
					event.preventDefault();
					onReturnFocus();
				}}
			>
				<DialogHeader>
					<DialogTitle>Run history: {recording.name}</DialogTitle>
					<DialogDescription>
						Results follow this test's ID across edits. An earlier
						pass does not verify the current app or edited test.
					</DialogDescription>
				</DialogHeader>
				<p className="break-all font-mono text-muted-foreground text-xs">
					assets/app-tests/test-runs
				</p>
				<div className="flex flex-wrap items-center justify-between gap-2">
					<output className="text-muted-foreground text-sm">
						{history.page
							? `${history.page.total} recorded runs for this test`
							: "Run history"}
					</output>
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={history.isLoading}
						onClick={() => {
							history.refresh();
							detailQuery.refresh();
						}}
					>
						Refresh history
					</Button>
				</div>
				{history.isLoading ? (
					<output className="flex items-center gap-2 text-sm">
						<Spinner className="size-4" />
						Loading run history…
					</output>
				) : history.error ? (
					<Alert variant="destructive">
						<AlertDescription>{history.error}</AlertDescription>
					</Alert>
				) : history.page?.runs.length === 0 ? (
					<p className="text-sm">No recorded runs for this test.</p>
				) : (
					history.page && (
						<section
							aria-label="Test run history"
							// biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard users need access to the bounded horizontal table scroll.
							tabIndex={0}
							className="min-w-0 overflow-x-auto focus-visible:outline-2 focus-visible:outline-ring"
						>
							<Table wrapperClassName="overflow-visible">
								<TableHeader>
									<TableRow>
										<TableHead scope="col">
											Started
										</TableHead>
										<TableHead scope="col">
											Result
										</TableHead>
										<TableHead scope="col">
											Completed steps
										</TableHead>
										<TableHead scope="col">
											Assertions passed
										</TableHead>
										<TableHead scope="col">
											Details
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{history.page.runs.map((run) => (
										<TableRow key={run.runId}>
											<TableCell className="whitespace-normal">
												<time dateTime={run.startedAt}>
													{formatLocalDateTime(
														run.startedAt,
													)}
												</time>
											</TableCell>
											<TableCell>
												{run.test?.status ?? run.status}
											</TableCell>
											<TableCell>
												{run.test
													? `${run.test.stepsCompleted}/${run.test.steps}`
													: "—"}
											</TableCell>
											<TableCell>
												{run.test
													? `${run.test.assertionsPassed}/${run.test.assertions}`
													: "—"}
											</TableCell>
											<TableCell>
												<Button
													type="button"
													variant="ghost"
													size="sm"
													aria-label={`View result ${run.runId}`}
													onClick={() =>
														setSelectedRun(
															run.runId,
														)
													}
												>
													View result
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</section>
					)
				)}
				{history.page && (
					<div className="flex flex-wrap items-center justify-between gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={offset === 0 || history.isLoading}
							onClick={() => setOffset(Math.max(0, offset - 20))}
						>
							Previous runs
						</Button>
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={
								!history.page.hasMore || history.isLoading
							}
							onClick={() => setOffset(offset + 20)}
						>
							Next runs
						</Button>
					</div>
				)}
				<output className="sr-only">
					{selectedRun && result ? "Run result loaded." : ""}
				</output>
				{selectedRun && (
					<section
						aria-label="Selected run result"
						className="flex min-w-0 flex-col gap-2 border-t pt-3"
					>
						{detailError ? (
							<>
								<Alert variant="destructive">
									<AlertDescription>
										{detailError}
									</AlertDescription>
								</Alert>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={detailQuery.refresh}
								>
									Retry reading result
								</Button>
							</>
						) : !result ? (
							<output className="text-sm">
								Loading run result…
							</output>
						) : (
							<>
								<p className="break-all font-mono text-xs">
									Run {detail?.runId}
								</p>
								<p className="text-sm">
									{result.name}: {result.status}
								</p>
								<dl className="grid min-w-0 grid-cols-1 gap-1 text-sm sm:grid-cols-2">
									<dt>Started</dt>
									<dd>
										{formatLocalDateTime(
											result.startedAt ??
												detail?.startedAt,
										)}
									</dd>
									<dt>Finished</dt>
									<dd>
										{formatLocalDateTime(
											result.finishedAt ??
												detail?.finishedAt,
										) ?? "Not recorded"}
									</dd>
									<dt>Steps attempted</dt>
									<dd>
										{result.stepsAttempted}/{result.steps}
									</dd>
									<dt>Steps completed</dt>
									<dd>
										{result.stepsCompleted}/{result.steps}
									</dd>
									<dt>Assertions passed</dt>
									<dd>
										{result.assertionsPassed}/
										{result.assertions}
									</dd>
									<dt>Duration</dt>
									<dd>
										{result.durationMs === undefined
											? "Unavailable"
											: formatRoundedDurationMs(
													result.durationMs,
												)}
									</dd>
									{result.failedStep !== undefined && (
										<>
											<dt>Failed step</dt>
											<dd>{result.failedStep}</dd>
										</>
									)}
									{result.classification && (
										<>
											<dt>Classification</dt>
											<dd className="break-words">
												{result.classification}
											</dd>
										</>
									)}
									{result.repeats && (
										<>
											<dt>Replays passed</dt>
											<dd>
												{result.passedRepeats ?? 0}/
												{result.repeats}
											</dd>
										</>
									)}
								</dl>
								{result.reason && (
									<p className="whitespace-pre-wrap break-words text-sm">
										{result.reason}
									</p>
								)}
								{result.definitionHash && (
									<p className="break-all font-mono text-muted-foreground text-xs">
										Test definition SHA-256:{" "}
										{result.definitionHash}
									</p>
								)}
							</>
						)}
					</section>
				)}
				<p className="text-muted-foreground text-xs">
					The latest {history.page?.retainedRuns ?? 100} finished runs
					per app are retained, plus active runs. Detailed browser
					evidence stays private to the user who ran the test.
				</p>
				<DialogFooter>
					<Button type="button" variant="outline" onClick={onClose}>
						Close history
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
