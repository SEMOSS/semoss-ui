type GridRowSelectionModel = (string | number)[];

import {
	ChevronsDownUp,
	ChevronsUpDown,
	Pause,
	Play,
	Plus,
	RefreshCw,
	Search,
	Trash,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { runPixel, useDebouncedValue } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Field,
	FieldContent,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Tabs,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import { useRootStore, useSettings } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";
import { DeleteJobModal } from "./delete-job-modal";
import type {
	HistoryJob,
	HistoryPaginationProps,
	Job,
	PixelReturnJob,
	SchedulerStats,
} from "./job.types";
import { convertDeltaToRuntimeString, convertTimetoDate } from "./job.utils";
import { JobHistory } from "./job-history";
import { JobsTable } from "./jobs-table";
import { KpiCard } from "./kpi-card";

type OutputType = {
	failed?: string[];
	success?: string[];
};

const subTabsListClass =
	"h-auto w-fit flex-nowrap justify-start gap-1 overflow-x-auto rounded-none bg-transparent p-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

const subTabTriggerClass =
	"!flex-none whitespace-nowrap rounded-full border border-transparent bg-transparent px-3 py-1 text-muted-foreground text-sm shadow-none transition-colors hover:text-foreground data-[state=active]:border-border data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none";

const formatPercent = (rate: number | undefined | null): string => {
	if (rate == null || !Number.isFinite(rate)) return "—";
	return `${(rate * 100).toFixed(1)}%`;
};

const successRateTone = (
	rate: number | undefined | null,
): "default" | "success" | "warning" | "destructive" => {
	if (rate == null || !Number.isFinite(rate)) return "default";
	if (rate >= 0.95) return "success";
	if (rate >= 0.8) return "warning";
	return "destructive";
};

const formatNextRunIn = (iso: string | null | undefined): string | null => {
	if (!iso) return null;
	const ms = new Date(iso).getTime() - Date.now();
	if (!Number.isFinite(ms) || ms < 0) return null;
	const min = Math.floor(ms / 60000);
	if (min < 1) return "<1m";
	if (min < 60) return `${min}m`;
	const hr = Math.floor(min / 60);
	if (hr < 24) return min % 60 === 0 ? `${hr}h` : `${hr}h ${min % 60}m`;
	return `${Math.floor(hr / 24)}d`;
};

export function JobsPage() {
	const { monolithStore } = useRootStore();
	const { adminMode } = useSettings();
	const navigate = useNavigate();

	const [notification, setNotification] = useState<{
		type: "success" | "error" | "warning";
		message: string;
	} | null>(null);

	const [searchValue, setSearchValue] = useState("");
	const debouncedSearchValue = useDebouncedValue(searchValue, 400);
	const [selectedTable, setSelectedTable] = useState("Jobs");
	const [selectedJobTab, setSelectedJobTab] = useState("All");
	const [selectedHistoryTab, setSelectedHistoryTab] = useState("All");
	const [historyPage, setHistoryPage] = useState<number>(0);
	const [historyRowsPerPage, setHistoryRowsPerPage] = useState<number>(50);
	const [historyCount, setHistoryCount] = useState<number>(-1);
	const [historySearch, setHistorySearch] = useState("");

	const [jobs, setJobs] = useState<Job[]>([]);
	const [history, setHistory] = useState<HistoryJob[]>([]);
	const [jobsLoading, setJobsLoading] = useState(false);
	const [historyLoading, setHistoryLoading] = useState(false);

	const [stats, setStats] = useState<SchedulerStats | null>(null);
	const [statsLoading, setStatsLoading] = useState(false);
	const [statsWindow, setStatsWindow] = useState<"24h" | "7d" | "30d">("24h");

	const [jobExpandedRows, setJobExpandedRows] = useState<Set<string>>(
		new Set(),
	);
	const [historyExpandedIndices, setHistoryExpandedIndices] = useState<
		Set<number>
	>(new Set());

	const toggleJobExpanded = (id: string) => {
		setJobExpandedRows((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const toggleHistoryExpanded = (idx: number) => {
		setHistoryExpandedIndices((prev) => {
			const next = new Set(prev);
			if (next.has(idx)) next.delete(idx);
			else next.add(idx);
			return next;
		});
	};

	const allExpanded =
		selectedTable === "Jobs"
			? jobs.length > 0 && jobExpandedRows.size === jobs.length
			: history.length > 0 &&
				historyExpandedIndices.size === history.length;

	const expandAllDisabled =
		selectedTable === "Jobs" ? jobs.length === 0 : history.length === 0;

	const handleRefreshTable = () => {
		if (selectedTable === "Jobs") {
			getJobs();
		} else {
			getHistory({ reload: true, search: debouncedSearchValue });
		}
	};

	const tableRefreshLoading =
		selectedTable === "Jobs" ? jobsLoading : historyLoading;

	const handleToggleAll = () => {
		if (selectedTable === "Jobs") {
			setJobExpandedRows(
				allExpanded ? new Set() : new Set(jobs.map((j) => j.id)),
			);
		} else {
			setHistoryExpandedIndices(
				allExpanded ? new Set() : new Set(history.map((_, i) => i)),
			);
		}
	};
	const [rowSelectionModel, setRowSelectionModel] =
		useState<GridRowSelectionModel>([]);

	const [jobToDelete, setJobToDelete] = useState(null);
	const [jobsToDelete, setJobsToDelete] = useState<Job[]>([]);
	const [deleteMultiple, setDeleteMultiple] = useState(false);

	const getJobs = () => {
		setJobsLoading(true);
		const pixel = "META|ListAllJobs()";
		monolithStore
			.runQuery<[Record<string, PixelReturnJob>]>(pixel)
			.then((response) => {
				const type = response.pixelReturn[0].operationType[0];

				if (type.indexOf("ERROR") > -1) {
					setNotification({
						type: "error",
						message:
							"Something went wrong. Jobs could not be retrieved.",
					});
				} else {
					const pixelJobs: Record<string, PixelReturnJob> =
						response.pixelReturn[0].output;
					const jobs: Job[] = [];
					Object.values(pixelJobs).forEach((job) => {
						if (!job.jobGroup || job.jobGroup === "undefined") {
							return;
						}
						jobs.push({
							id: job.jobId,
							name: job.jobName,
							cronExpression: job.cronExpression,
							timeZone: job.cronTz,
							tags: (job?.jobTags ?? "")
								.split(",")
								.filter((tag) => !!tag),
							lastRun: job.PREV_FIRE_TIME,
							nextRun: job.NEXT_FIRE_TIME,
							ownerId: job.USER_ID,
							isActive: job.NEXT_FIRE_TIME !== "INACTIVE",
							group: job.jobGroup,
							pixel: job.recipe,
							triggerOnLoad:
								job.TRIGGER_ON_LOAD === true ||
								job.TRIGGER_ON_LOAD === "true",
						});
					});

					setJobs(jobs);
				}
			})
			.finally(() => {
				setJobsLoading(false);
			});
	};

	const deleteJob = (jobId: string[], jobGroup: string[]) => {
		let pixel: string;
		if (jobId.length > 1 && jobGroup.length > 1) {
			pixel = `META | RemoveJobFromDB(jobId=${JSON.stringify(
				jobId,
			)}, jobGroup=${JSON.stringify(jobGroup)}) `;
		} else {
			pixel = "META | RemoveJobFromDB(";
			pixel += `jobId=["${jobId[0]}"], `;
			pixel += `jobGroup=["${jobGroup[0]}"]) `;
		}
		monolithStore
			.runQuery(pixel)
			.then((response) => {
				const type = response.pixelReturn[0].operationType;
				const output = response.pixelReturn[0].output as OutputType;
				const failedIds = output?.failed || [];

				if (type.indexOf("ERROR") === -1) {
					if (failedIds.length === 0) {
						setNotification({
							type: "success",
							message: `Successfully deleted all selected jobs`,
						});
					} else {
						const failedJobNames = jobs
							.filter((job) => failedIds.includes(job.id))
							.map((job) => job.name)
							.join(", ");
						setNotification({
							type: "warning",
							message: `Some jobs were deleted successfully, but the following jobs could not be deleted: ${failedJobNames}`,
						});
					}
					jobId.length > 1 && jobGroup.length > 1
						? setJobsToDelete([])
						: setJobToDelete(null);
					jobId.length > 1 && jobGroup.length > 1
						? setDeleteMultiple(false)
						: "";
					getJobs();
					getStats();
				} else {
					throw new Error(response.errors[0]);
				}
			})
			.catch((error) => {
				setNotification({
					type: "error",
					message: error.message,
				});
			});
	};

	const pauseJobs = async () => {
		let pixel = ``;
		selectedActiveJobs.forEach((job) => {
			pixel += `PauseJobTrigger(jobId=["${job.id}"], jobGroup=["${job.group}"]);`;
		});
		try {
			await runPixel(pixel);
		} catch (_e) {
			setNotification({
				type: "error",
				message: "Unable to pause jobs.",
			});
		} finally {
			getJobs();
		}
	};

	const resumeJobs = async () => {
		let pixel = ``;
		selectedPausedJobs.forEach((job) => {
			pixel += `ResumeJobTrigger(jobId=["${job.id}"], jobGroup=["${job.group}"]);`;
		});
		try {
			await runPixel(pixel);
		} catch (_e) {
			setNotification({
				type: "error",
				message: "Unable to resume jobs.",
			});
		} finally {
			getJobs();
		}
	};

	const loadHistory = async (
		page: number,
		rowsPerPage: number,
		search: string,
		statusFilter: string,
	) => {
		setHistoryLoading(true);
		const filters: string[] = [];
		if (search) {
			filters.push(
				`Filter(SMSS_JOB_RECIPES__JOB_NAME ?like "${search}")`,
			);
		}
		if (statusFilter === "Success") {
			filters.push("Filter(SMSS_AUDIT_TRAIL__SUCCESS == true)");
		} else if (statusFilter === "Failed") {
			filters.push("Filter(SMSS_AUDIT_TRAIL__SUCCESS == false)");
		}
		let pixel = "META|SchedulerHistory(";
		if (filters.length) {
			pixel += `filters=[${filters.join(", ")}],`;
		}
		pixel += `limit=${rowsPerPage},offset=${page * rowsPerPage})`;

		return monolithStore
			.runQuery<
				[
					{
						data: {
							values: string[][];
							headers: string[];
						};
					},
				]
			>(pixel)
			.then((response) => {
				const type = response.pixelReturn[0].operationType[0];
				if (type.indexOf("ERROR") > -1) {
					setNotification({
						type: "error",
						message:
							"Something went wrong. Job history could not be retrieved.",
					});
				} else {
					const historyData: HistoryJob[] = [];
					const output = response.pixelReturn[0].output;
					const headers = {};
					for (
						let headerIdx = 0,
							headerLen = output.data.headers.length;
						headerIdx < headerLen;
						headerIdx++
					) {
						headers[output.data.headers[headerIdx]] = headerIdx;
					}

					for (
						let valueIdx = 0, valueLen = output.data.values.length;
						valueIdx < valueLen;
						valueIdx++
					) {
						if (
							output.data.values[valueIdx][headers.SUCCESS] !==
							null
						) {
							const job = {
								jobId: Object.hasOwn(headers, "JOB_ID")
									? output.data.values[valueIdx][
											headers.JOB_ID
										]
									: "",
								jobName: Object.hasOwn(headers, "JOB_NAME")
									? output.data.values[valueIdx][
											headers.JOB_NAME
										]
									: "",
								jobGroup: Object.hasOwn(headers, "JOB_GROUP")
									? output.data.values[valueIdx][
											headers.JOB_GROUP
										]
									: "",
								execStart:
									Object.hasOwn(headers, "EXECUTION_START") &&
									output.data.values[valueIdx][
										headers.EXECUTION_START
									]
										? convertTimetoDate(
												output.data.values[valueIdx][
													headers.EXECUTION_START
												],
											)
										: "",
								execEnd: Object.hasOwn(headers, "EXECUTION_END")
									? output.data.values[valueIdx][
											headers.EXECUTION_END
										]
									: "",
								execDelta: Object.hasOwn(
									headers,
									"EXECUTION_DELTA",
								)
									? convertDeltaToRuntimeString(
											output.data.values[valueIdx][
												headers.EXECUTION_DELTA
											],
										)
									: "",
								success: Object.hasOwn(headers, "SUCCESS")
									? JSON.stringify(
											output.data.values[valueIdx][
												headers.SUCCESS
											],
										) === "true"
									: false,
								jobTags: Object.hasOwn(headers, "JOB_TAG")
									? output.data.values[valueIdx][
											headers.JOB_TAG
										].split(",")
									: [],
								isLatest: Object.hasOwn(headers, "IS_LATEST")
									? JSON.stringify(
											output.data.values[valueIdx][
												headers.IS_LATEST
											],
										) === "true"
									: false,
								schedulerOutput: Object.hasOwn(
									headers,
									"SCHEDULER_OUTPUT",
								)
									? output.data.values[valueIdx][
											headers.SCHEDULER_OUTPUT
										]
									: "No Output.",
							};

							historyData.push(job);
						}
					}
					return historyData;
				}
			})
			.finally(() => {
				setHistoryLoading(false);
			});
	};

	const getHistory = async (paginationProps: HistoryPaginationProps = {}) => {
		const { page, rowsPerPage, search, reload } = paginationProps;
		const oldSearch = historySearch;
		const oldNumOfRows = historyRowsPerPage;
		const oldPage = historyPage;
		const oldHistoryData = history;

		const newSearch = search ?? oldSearch;
		const newNumOfRows = rowsPerPage ?? oldNumOfRows;
		const newPage =
			newSearch !== oldSearch
				? 0
				: Math.floor(((page ?? oldPage) * oldNumOfRows) / newNumOfRows);

		if (
			newPage !== oldPage ||
			newNumOfRows !== oldNumOfRows ||
			newSearch !== oldSearch ||
			reload
		) {
			setHistorySearch(newSearch);
			const newHistoryData = await loadHistory(
				newPage,
				newNumOfRows,
				newSearch,
				selectedHistoryTab,
			);

			if (newHistoryData?.length) {
				if (newHistoryData.length < newNumOfRows) {
					setHistoryCount(
						newPage * newNumOfRows + newHistoryData.length,
					);
				} else {
					setHistoryCount(-1);
				}
				setHistoryPage(newPage);
				setHistoryRowsPerPage(newNumOfRows);
				setHistory(newHistoryData);
			} else if (newPage > oldPage && newNumOfRows === oldNumOfRows) {
				setHistoryCount(oldPage * oldNumOfRows + oldHistoryData.length);
			} else if (newPage !== 0) {
				setHistoryCount(-1);
				getHistory({
					page: 0,
					rowsPerPage: newNumOfRows,
					search: newSearch,
				});
			} else {
				setHistoryCount(0);
				setHistory([]);
			}
		}
	};

	const getStats = (window: "24h" | "7d" | "30d" = statsWindow) => {
		setStatsLoading(true);
		const pixel = `META|SchedulerStats(window=["${window}"])`;
		monolithStore
			.runQuery<[SchedulerStats]>(pixel)
			.then((response) => {
				const type = response.pixelReturn[0].operationType[0];
				if (type.indexOf("ERROR") > -1) {
					return;
				}
				const output = response.pixelReturn[0].output;
				if (output && typeof output === "object") {
					setStats(output);
				}
			})
			.finally(() => setStatsLoading(false));
	};

	const filteredJobs = useMemo(() => {
		if (selectedJobTab === "Active") {
			return jobs.filter((job) => job.isActive);
		} else if (selectedJobTab === "Inactive") {
			return jobs.filter((job) => !job.isActive);
		}
		return jobs;
	}, [jobs, selectedJobTab]);

	const selectedPausedJobs = useMemo(() => {
		return jobs.filter((job) => {
			return !job.isActive && rowSelectionModel.includes(job.id);
		});
	}, [jobs, rowSelectionModel]);

	const selectedActiveJobs = useMemo(() => {
		return jobs.filter((job) => {
			return job.isActive && rowSelectionModel.includes(job.id);
		});
	}, [jobs, rowSelectionModel]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: load once on mount
	useEffect(() => {
		getJobs();
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: refetch stats when the window selection changes
	useEffect(() => {
		getStats(statsWindow);
	}, [statsWindow]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: refetch history when tab, sub-tab, or search changes
	useEffect(() => {
		if (selectedTable !== "History") return;
		getHistory({ reload: true, search: debouncedSearchValue });
	}, [selectedTable, selectedHistoryTab, debouncedSearchValue]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: reset expansion when the jobs list reloads
	useEffect(() => {
		setJobExpandedRows(new Set());
	}, [jobs]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: reset expansion when the history page reloads
	useEffect(() => {
		setHistoryExpandedIndices(new Set());
	}, [history]);

	const deleteMutlipleJobs = () => {
		setDeleteMultiple(true);
		const rowsToBeDeleted = jobs.filter((job) =>
			rowSelectionModel.includes(job.id),
		);
		setJobsToDelete(rowsToBeDeleted);
	};

	if (!adminMode) {
		return <Navigate to="/settings" />;
	}

	return (
		<div className="flex flex-col gap-6">
			{notification && (
				<Alert
					variant={
						notification.type === "error"
							? "destructive"
							: "default"
					}
					className="mb-4"
				>
					<AlertTitle>
						{notification.type === "error" ? "Error" : "Success"}
					</AlertTitle>
					<AlertDescription>{notification.message}</AlertDescription>
				</Alert>
			)}

			<hr className="border-border" />

			<div className="flex flex-col gap-3">
				<div className="flex items-center justify-end gap-2">
					<Tabs
						value={statsWindow}
						onValueChange={(v) =>
							setStatsWindow(v as "24h" | "7d" | "30d")
						}
					>
						<TabsList>
							<TabsTrigger value="24h">24h</TabsTrigger>
							<TabsTrigger value="7d">7d</TabsTrigger>
							<TabsTrigger value="30d">30d</TabsTrigger>
						</TabsList>
					</Tabs>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						title="Refresh stats"
						onClick={() => getStats(statsWindow)}
						disabled={statsLoading}
					>
						<RefreshCw
							className={`size-3.5 ${
								statsLoading ? "animate-spin" : ""
							}`}
						/>
					</Button>
				</div>

				<div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<KpiCard
						label="Active jobs"
						loading={statsLoading && stats === null}
						value={
							stats?.activeJobs ??
							jobs.filter((j) => j.isActive).length
						}
						sub={(() => {
							const paused =
								stats?.pausedJobs ??
								jobs.filter((j) => !j.isActive).length;
							const overdue = stats?.overdueJobs ?? 0;
							const nextIn = formatNextRunIn(stats?.nextRunAt);
							const parts: string[] = [];
							if (paused > 0) parts.push(`${paused} paused`);
							if (overdue > 0) parts.push(`${overdue} overdue`);
							if (nextIn) parts.push(`next in ${nextIn}`);
							return parts.length ? parts.join(" · ") : null;
						})()}
						tone={
							(stats?.overdueJobs ?? 0) > 0
								? "warning"
								: "default"
						}
					/>

					<KpiCard
						label={`Runs (${statsWindow})`}
						loading={statsLoading && stats === null}
						value={stats?.totalRuns ?? "—"}
					/>

					<KpiCard
						label={`Success rate (${statsWindow})`}
						loading={statsLoading && stats === null}
						value={
							stats?.totalRuns === 0
								? "No runs"
								: formatPercent(stats?.successRate)
						}
						tone={
							stats?.totalRuns === 0
								? "default"
								: successRateTone(stats?.successRate)
						}
					/>

					<KpiCard
						label={`Failures (${statsWindow})`}
						loading={statsLoading && stats === null}
						value={stats?.failures ?? "—"}
						tone={
							(stats?.failures ?? 0) > 0
								? "destructive"
								: "default"
						}
						sub={
							stats?.worstJob &&
							stats.worstJob.consecutiveFailures > 1
								? `${stats.worstJob.name}: ${stats.worstJob.consecutiveFailures} in a row`
								: null
						}
					/>
				</div>
			</div>

			<Field className="rounded-lg border p-4">
				<FieldContent className="flex flex-col gap-2">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<Tabs
							value={selectedTable}
							onValueChange={setSelectedTable}
						>
							<TabsList className="flex">
								<TabsTrigger
									value="Jobs"
									className={`px-4 py-2 font-medium text-sm`}
								>
									Jobs
								</TabsTrigger>
								<TabsTrigger
									value="History"
									className={`px-4 py-2 font-medium text-sm`}
								>
									History
								</TabsTrigger>
							</TabsList>
						</Tabs>

						<div className="flex flex-wrap items-center gap-2">
							{selectedTable === "Jobs" && (
								<>
									<Button
										variant="outline"
										size="sm"
										disabled={!rowSelectionModel.length}
										onClick={() => pauseJobs()}
									>
										<Pause className="mr-1 h-4 w-4" /> Pause
									</Button>

									<Button
										variant="outline"
										size="sm"
										disabled={!rowSelectionModel.length}
										onClick={() => resumeJobs()}
									>
										<Play className="mr-1 h-4 w-4" /> Resume
									</Button>

									<Button
										variant="outline"
										size="sm"
										disabled={!rowSelectionModel.length}
										onClick={() => deleteMutlipleJobs()}
									>
										<Trash className="mr-1 h-4 w-4" />{" "}
										Delete
									</Button>
								</>
							)}

							<Button
								size="sm"
								onClick={() =>
									navigate("/settings/jobs/add-new-job")
								}
							>
								<Plus className="mr-1 h-4 w-4" /> Add New
							</Button>
						</div>
					</div>

					<div className="flex w-full items-center justify-between gap-2">
						{selectedTable === "Jobs" && (
							<Tabs
								value={selectedJobTab}
								onValueChange={setSelectedJobTab}
							>
								<TabsList className={subTabsListClass}>
									<TabsTrigger
										value="All"
										className={subTabTriggerClass}
									>
										All
									</TabsTrigger>
									<TabsTrigger
										value="Active"
										className={subTabTriggerClass}
									>
										Active
									</TabsTrigger>
									<TabsTrigger
										value="Inactive"
										className={subTabTriggerClass}
									>
										Inactive
									</TabsTrigger>
								</TabsList>
							</Tabs>
						)}

						{selectedTable === "History" && (
							<Tabs
								value={selectedHistoryTab}
								onValueChange={setSelectedHistoryTab}
							>
								<TabsList className={subTabsListClass}>
									<TabsTrigger
										value="All"
										className={subTabTriggerClass}
									>
										All
									</TabsTrigger>
									<TabsTrigger
										value="Success"
										className={subTabTriggerClass}
									>
										Success
									</TabsTrigger>
									<TabsTrigger
										value="Failed"
										className={subTabTriggerClass}
									>
										Failed
									</TabsTrigger>
								</TabsList>
							</Tabs>
						)}

						<div className="flex items-center gap-2">
							{selectedTable === "History" && (
								<div className="w-full sm:w-64">
									<InputGroup>
										<InputGroupAddon>
											<Search className="size-4" />
										</InputGroupAddon>
										<InputGroupInput
											value={searchValue}
											onChange={(
												e: React.ChangeEvent<HTMLInputElement>,
											) => setSearchValue(e.target.value)}
											placeholder="Search history..."
										/>
									</InputGroup>
								</div>
							)}
							<Button
								type="button"
								variant="ghost"
								size="sm"
								disabled={expandAllDisabled}
								onClick={handleToggleAll}
								className="h-7 px-2 text-muted-foreground text-xs"
							>
								{allExpanded ? (
									<>
										<ChevronsDownUp className="size-3" />{" "}
										Collapse all
									</>
								) : (
									<>
										<ChevronsUpDown className="size-3" />{" "}
										Expand all
									</>
								)}
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								title="Refresh"
								onClick={handleRefreshTable}
								disabled={tableRefreshLoading}
							>
								<RefreshCw
									className={`size-3.5 ${
										tableRefreshLoading
											? "animate-spin"
											: ""
									}`}
								/>
							</Button>
						</div>
					</div>

					{selectedTable === "Jobs" && (
						<JobsTable
							jobs={filteredJobs}
							jobsLoading={jobsLoading}
							rowSelectionModel={rowSelectionModel}
							setRowSelectionModel={setRowSelectionModel}
							getHistory={() => getHistory({ reload: true })}
							showDeleteJobModal={(job: Job) =>
								setJobToDelete(job)
							}
							refreshStats={getStats}
							expandedRows={jobExpandedRows}
							onToggleExpanded={toggleJobExpanded}
						/>
					)}

					{selectedTable === "History" && (
						<JobHistory
							history={history}
							historyLoading={historyLoading}
							historyCount={historyCount}
							historyPage={historyPage}
							historyRowsPerPage={historyRowsPerPage}
							onPageChange={(page) => getHistory({ page })}
							onRowsPerPageChange={(rowsPerPage) =>
								getHistory({ rowsPerPage })
							}
							expandedIndices={historyExpandedIndices}
							onToggleExpanded={toggleHistoryExpanded}
						/>
					)}
				</FieldContent>
			</Field>

			<DeleteJobModal
				job={deleteMultiple ? jobsToDelete : [jobToDelete]}
				isOpen={
					deleteMultiple
						? jobsToDelete && jobsToDelete.length !== 0
						: jobToDelete !== null
				}
				close={
					deleteMultiple
						? () => {
								setJobsToDelete([]);
								setDeleteMultiple(false);
							}
						: () => {
								setJobToDelete(null);
							}
				}
				deleteJob={deleteJob}
			/>
		</div>
	);
}
