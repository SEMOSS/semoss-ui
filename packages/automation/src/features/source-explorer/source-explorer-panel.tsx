import {
	ChevronLeft,
	ChevronRight,
	FilterX,
	Loader2,
	Maximize2,
	RefreshCw,
	Search,
} from "lucide-react";
import {
	type KeyboardEvent,
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Input,
	Label,
	Muted,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Small,
} from "@semoss/ui/next";
import {
	getAutomationRun,
	searchAutomationRuns,
} from "../../api/automation-history";
import { RunDataBrowser } from "../../components/canvas-editor/tabs/run-data-browser";
import { StatusBadge } from "../../components/status-badge";
import type {
	AutomationRunDetail,
	AutomationRunSearchFilters,
	AutomationRunSummary,
	AutomationTriggerType,
	RunStatus,
} from "../../domain/automation.types";
import {
	formatRunDuration,
	formatTimestamp,
} from "../../domain/automation-display";
import { normalizeAutomationErrorMessage } from "../../domain/automation-utils";

interface SourceExplorerPanelProps {
	appId: string;
	onOpenOutput: (output: string) => void;
	onOpenFullView?: () => void;
	onOpenRunFiles?: () => void;
	onRunSelected?: (run: AutomationRunDetail) => void;
}

type StatusFilter = RunStatus | "ALL";
type TriggerFilter = AutomationTriggerType | "ALL";

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
	{ value: "ALL", label: "All statuses" },
	{ value: "SUCCESS", label: "Succeeded" },
	{ value: "FAILED", label: "Failed" },
	{ value: "RUNNING", label: "Running" },
	{ value: "WAITING_FOR_INPUT", label: "Waiting for input" },
	{ value: "CANCELLED", label: "Cancelled" },
	{ value: "INTERRUPTED", label: "Interrupted" },
	{ value: "SUBMITTED", label: "Submitted" },
];

const TRIGGER_OPTIONS: Array<{ value: TriggerFilter; label: string }> = [
	{ value: "ALL", label: "All triggers" },
	{ value: "MANUAL", label: "Manual" },
	{ value: "SCHEDULED", label: "Scheduled" },
	{ value: "PLAYGROUND", label: "Playground" },
];

/** Searches durable run summaries and opens one authorized run as a trace tree. */
export function SourceExplorerPanel({
	appId,
	onOpenOutput,
	onOpenFullView,
	onOpenRunFiles,
	onRunSelected,
}: SourceExplorerPanelProps) {
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState<StatusFilter>("ALL");
	const [triggerType, setTriggerType] = useState<TriggerFilter>("ALL");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [appliedFilters, setAppliedFilters] =
		useState<AutomationRunSearchFilters>({});
	const [runs, setRuns] = useState<AutomationRunSummary[]>([]);
	const [offsets, setOffsets] = useState([0]);
	const [nextOffset, setNextOffset] = useState(0);
	const [hasMore, setHasMore] = useState(false);
	const [loading, setLoading] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [selectedRun, setSelectedRun] = useState<AutomationRunDetail | null>(
		null,
	);
	const [detailLoading, setDetailLoading] = useState(false);
	const requestRef = useRef(0);
	const detailRequestRef = useRef(0);
	const searchId = useId();
	const statusId = useId();
	const triggerId = useId();
	const startDateId = useId();
	const endDateId = useId();
	const offset = offsets.at(-1) ?? 0;

	const buildCurrentFilters = (): AutomationRunSearchFilters => {
		return {
			...(search.trim() ? { search: search.trim() } : {}),
			...(status !== "ALL" ? { status } : {}),
			...(triggerType !== "ALL" ? { triggerType } : {}),
			...(startDate ? { startDate: localDateTimeToIso(startDate) } : {}),
			...(endDate ? { endDate: localDateTimeToIso(endDate) } : {}),
		};
	};

	const loadRuns = useCallback(
		async (nextPageOffset: number) => {
			const requestId = ++requestRef.current;
			setLoading(true);
			setLoadError(null);
			try {
				const page = await searchAutomationRuns(
					appId,
					appliedFilters,
					nextPageOffset,
				);
				if (requestId !== requestRef.current) return;
				setRuns(page.runs);
				setNextOffset(page.nextOffset);
				setHasMore(page.hasMore);
			} catch (error) {
				if (requestId !== requestRef.current) return;
				setLoadError(
					error instanceof Error
						? normalizeAutomationErrorMessage(error.message)
						: "Unable to search Automation runs.",
				);
			} finally {
				if (requestId === requestRef.current) setLoading(false);
			}
		},
		[appId, appliedFilters],
	);

	useEffect(() => {
		void loadRuns(0);
	}, [loadRuns]);

	useEffect(() => {
		const hasActiveRun = runs.some((run) =>
			["SUBMITTED", "RUNNING", "WAITING_FOR_INPUT"].includes(run.STATUS),
		);
		if (!hasActiveRun) return;
		const interval = window.setInterval(() => void loadRuns(offset), 5000);
		return () => window.clearInterval(interval);
	}, [loadRuns, offset, runs]);

	const handleApplyFilters = () => {
		setOffsets([0]);
		setSelectedRun(null);
		setAppliedFilters(buildCurrentFilters());
	};

	const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") handleApplyFilters();
	};

	const handleClearFilters = () => {
		setSearch("");
		setStatus("ALL");
		setTriggerType("ALL");
		setStartDate("");
		setEndDate("");
		setOffsets([0]);
		setSelectedRun(null);
		setAppliedFilters({});
	};

	const handleOpenRun = useCallback(
		async (runId: string) => {
			const requestId = ++detailRequestRef.current;
			setDetailLoading(true);
			setLoadError(null);
			try {
				const detail = await getAutomationRun(appId, runId);
				if (requestId === detailRequestRef.current) {
					setSelectedRun(detail);
					onRunSelected?.(detail);
				}
			} catch (error) {
				if (requestId !== detailRequestRef.current) return;
				setLoadError(
					error instanceof Error
						? normalizeAutomationErrorMessage(error.message)
						: "Unable to load Automation run details.",
				);
			} finally {
				if (requestId === detailRequestRef.current)
					setDetailLoading(false);
			}
		},
		[appId, onRunSelected],
	);

	useEffect(() => {
		if (
			!selectedRun ||
			!["SUBMITTED", "RUNNING", "WAITING_FOR_INPUT"].includes(
				selectedRun.STATUS,
			)
		) {
			return;
		}
		const interval = window.setInterval(
			() => void handleOpenRun(selectedRun.RUN_ID),
			5000,
		);
		return () => window.clearInterval(interval);
	}, [handleOpenRun, selectedRun]);

	if (selectedRun) {
		return (
			<div className="flex h-full min-h-0 flex-col gap-3 p-3">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div className="min-w-0">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => setSelectedRun(null)}
						>
							<ChevronLeft aria-hidden="true" />
							Source Explorer
						</Button>
						<p className="truncate px-3 font-medium text-sm">
							{formatTimestamp(selectedRun.STARTED_AT)} ·{" "}
							{selectedRun.RUN_ID}
						</p>
					</div>
					<StatusBadge status={selectedRun.STATUS} />
				</div>
				<RunDataBrowser
					appId={appId}
					run={selectedRun}
					onOutputPopout={onOpenOutput}
					onOpenRunFiles={onOpenRunFiles}
				/>
			</div>
		);
	}

	return (
		<section
			className="flex h-full min-h-0 flex-col gap-3 p-3"
			aria-label="Automation source explorer"
		>
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="font-semibold text-sm">Source Explorer</p>
					<Muted>
						Search retained runs, then inspect the path and data for
						one run.
					</Muted>
				</div>
				<div className="flex items-center gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => void loadRuns(offset)}
						disabled={loading}
					>
						<RefreshCw
							className={loading ? "animate-spin" : undefined}
							aria-hidden="true"
						/>
						Refresh
					</Button>
					{onOpenFullView ? (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={onOpenFullView}
						>
							<Maximize2 aria-hidden="true" />
							Open full view
						</Button>
					) : null}
				</div>
			</div>

			<div className="flex flex-wrap items-end gap-2">
				<div className="min-w-48 flex-1 space-y-1">
					<Label htmlFor={searchId}>Run, creator, or failure</Label>
					<div className="relative">
						<Search
							className="-translate-y-1/2 absolute top-1/2 left-2 size-4 text-muted-foreground"
							aria-hidden="true"
						/>
						<Input
							id={searchId}
							value={search}
							maxLength={255}
							placeholder="Search runs"
							className="pl-8"
							onChange={(event) => setSearch(event.target.value)}
							onKeyDown={handleSearchKeyDown}
						/>
					</div>
				</div>
				<div className="min-w-40 space-y-1">
					<Label htmlFor={statusId}>Status</Label>
					<Select
						value={status}
						onValueChange={(value) => {
							if (isStatusFilter(value)) setStatus(value);
						}}
					>
						<SelectTrigger id={statusId}>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{STATUS_OPTIONS.map((option) => (
								<SelectItem
									key={option.value}
									value={option.value}
								>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="min-w-40 space-y-1">
					<Label htmlFor={triggerId}>Trigger</Label>
					<Select
						value={triggerType}
						onValueChange={(value) => {
							if (isTriggerFilter(value)) setTriggerType(value);
						}}
					>
						<SelectTrigger id={triggerId}>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{TRIGGER_OPTIONS.map((option) => (
								<SelectItem
									key={option.value}
									value={option.value}
								>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="min-w-48 space-y-1">
					<Label htmlFor={startDateId}>Started after</Label>
					<Input
						id={startDateId}
						type="datetime-local"
						value={startDate}
						onChange={(event) => setStartDate(event.target.value)}
					/>
				</div>
				<div className="min-w-48 space-y-1">
					<Label htmlFor={endDateId}>Started before</Label>
					<Input
						id={endDateId}
						type="datetime-local"
						value={endDate}
						onChange={(event) => setEndDate(event.target.value)}
					/>
				</div>
				<Button
					type="button"
					onClick={handleApplyFilters}
					disabled={loading}
				>
					{loading ? (
						<Loader2 className="animate-spin" aria-hidden="true" />
					) : (
						<Search aria-hidden="true" />
					)}
					Apply filters
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={handleClearFilters}
					disabled={loading}
				>
					<FilterX aria-hidden="true" />
					Clear
				</Button>
			</div>

			{loadError ? (
				<Alert variant="destructive">
					<AlertTitle>Source Explorer could not load</AlertTitle>
					<AlertDescription className="flex flex-wrap items-center justify-between gap-2">
						<span>{loadError}</span>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => void loadRuns(offset)}
						>
							<RefreshCw aria-hidden="true" />
							Retry
						</Button>
					</AlertDescription>
				</Alert>
			) : null}

			<div className="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
				{loading || detailLoading ? (
					<output className="flex min-h-40 items-center justify-center gap-2 text-muted-foreground text-sm">
						<Loader2
							className="size-4 animate-spin"
							aria-hidden="true"
						/>
						<span>Loading Automation runs…</span>
					</output>
				) : runs.length === 0 ? (
					<div className="flex min-h-40 flex-col items-center justify-center gap-1 p-4 text-center">
						<Small>No matching runs</Small>
						<Muted>
							Change or clear the filters to search again.
						</Muted>
					</div>
				) : (
					<table className="w-full min-w-[760px] text-sm">
						<thead className="sticky top-0 z-10 bg-muted/95 text-left text-muted-foreground text-xs backdrop-blur">
							<tr>
								<th className="px-3 py-2 font-medium">
									Status
								</th>
								<th className="px-3 py-2 font-medium">
									Started
								</th>
								<th className="px-3 py-2 font-medium">
									Trigger
								</th>
								<th className="px-3 py-2 font-medium">User</th>
								<th className="px-3 py-2 font-medium">
									Duration
								</th>
								<th className="px-3 py-2 font-medium">
									Summary
								</th>
								<th className="px-3 py-2 font-medium">
									<span className="sr-only">Open</span>
								</th>
							</tr>
						</thead>
						<tbody className="divide-y">
							{runs.map((run) => (
								<tr
									key={run.RUN_ID}
									className="hover:bg-accent/50"
								>
									<td className="px-3 py-2">
										<StatusBadge status={run.STATUS} />
									</td>
									<td className="whitespace-nowrap px-3 py-2">
										{formatTimestamp(run.STARTED_AT)}
									</td>
									<td className="px-3 py-2">
										{run.TRIGGER_TYPE ?? "MANUAL"}
									</td>
									<td className="max-w-44 truncate px-3 py-2">
										{run.CREATED_BY ?? "Unknown user"}
									</td>
									<td className="whitespace-nowrap px-3 py-2">
										{run.COMPLETED_AT
											? formatRunDuration(
													run.STARTED_AT,
													run.COMPLETED_AT,
												)
											: "In progress"}
									</td>
									<td className="max-w-80 truncate px-3 py-2 text-muted-foreground">
										{run.RESULT_SUMMARY || run.RUN_ID}
									</td>
									<td className="px-3 py-2 text-right">
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() =>
												void handleOpenRun(run.RUN_ID)
											}
										>
											Inspect
											<ChevronRight aria-hidden="true" />
										</Button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>

			<div className="flex flex-wrap items-center justify-between gap-2">
				<output className="text-muted-foreground text-xs">
					{runs.length === 0
						? "No results"
						: `Showing ${offset + 1}–${offset + runs.length}`}
				</output>
				<div className="flex items-center gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={offsets.length === 1 || loading}
						onClick={() => {
							const previousOffsets = offsets.slice(0, -1);
							const previousOffset = previousOffsets.at(-1) ?? 0;
							setOffsets(previousOffsets);
							void loadRuns(previousOffset);
						}}
					>
						<ChevronLeft aria-hidden="true" />
						Previous
					</Button>
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={!hasMore || loading}
						onClick={() => {
							setOffsets((current) => [...current, nextOffset]);
							void loadRuns(nextOffset);
						}}
					>
						Next
						<ChevronRight aria-hidden="true" />
					</Button>
				</div>
			</div>
		</section>
	);
}

function localDateTimeToIso(value: string): string {
	return new Date(value).toISOString();
}

function isStatusFilter(value: string): value is StatusFilter {
	return STATUS_OPTIONS.some((option) => option.value === value);
}

function isTriggerFilter(value: string): value is TriggerFilter {
	return TRIGGER_OPTIONS.some((option) => option.value === value);
}
