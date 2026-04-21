import {
	AlertCircle,
	Moon,
	Pause,
	Play,
	Plus,
	Search,
	Timer,
	Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { debounced, runPixel } from "@semoss/sdk/react";
import {
	Button,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Tabs,
	TabsList,
	TabsTrigger,
	toast,
} from "@semoss/ui/next";
import { useRootStore, useSettings } from "@/hooks";
import { DeleteJobModal } from "./DeleteJobModal";
import { JobBuilderModal } from "./JobBuilderModal";
import { JobCard } from "./JobCard";
import { JobHistory } from "./JobHistory";
import { JobsTable } from "./JobsTable";
import type {
	HistoryJob,
	HistoryPaginationProps,
	Job,
	JobBuilder,
	JobUIState,
	PixelReturnJob,
	SendEmailJob,
} from "./job.types";
import {
	convertDeltaToRuntimeString,
	convertSendEmailRecipeToJob,
	convertTimetoDate,
} from "./job.utils";

export function JobsPage() {
	const { monolithStore } = useRootStore();

	const tabs = ["All", "Active", "Inactive"];

	const [searchValue, setSearchValue] = useState("");
	const [selectedTab, setSelectedTab] = useState(tabs[0]);

	const [failedJobCount, setFailedJobCount] = useState<number>(0);

	const [initalBuilderState, setInitialBuilderState] =
		useState<JobBuilder>(null);

	const [jobs, setJobs] = useState<Job[]>([]);
	const [jobsLoading, setJobsLoading] = useState<boolean>(false);

	const [jobToDelete, setJobToDelete] = useState<Job>(null);

	const [jobsToDelete, setJobsToDelete] = useState<Job[]>([]);
	const [deleteMutliple, setDeleteMultiple] = useState<boolean>(false);

	const [rowSelectionModel, setRowSelectionModel] = useState<string[]>([]);

	const [history, setHistory] = useState<HistoryJob[]>([]);
	const [historyLoading, setHistoryLoading] = useState<boolean>(false);
	const [historySearch, setHistorySearch] = useState("");
	const [historySearchBuffer, setHistorySearchBuffer] = useState("");
	const [historyPage, setHistoryPage] = useState<number>(0);
	const [historyRowsPerPage, setHistoryRowsPerPage] = useState<number>(5);
	const [historyCount, setHistoryCount] = useState<number>(-1);
	const { adminMode } = useSettings();

	const getJobs = () => {
		setJobsLoading(true);
		const pixel = "META|ListAllJobs()";
		monolithStore
			.runQuery<[Record<string, PixelReturnJob>]>(pixel)
			.then((response) => {
				const type = response.pixelReturn[0].operationType[0];

				if (type.indexOf("ERROR") > -1) {
					toast.error(
						"Something went wrong. Jobs could not be retrieved.",
					);
				} else {
					const pixelJobs: Record<string, PixelReturnJob> =
						response.pixelReturn[0].output;
					const loadedJobs: Job[] = [];
					Object.values(pixelJobs).forEach((job) => {
						if (!job.jobGroup || job.jobGroup === "undefined")
							return;
						let uiState: JobUIState;
						try {
							if (job.uiState) uiState = JSON.parse(job.uiState);
						} catch (e) {
							console.log(e);
						}
						let sendEmailJob: SendEmailJob;
						if (job.recipe)
							sendEmailJob = convertSendEmailRecipeToJob(
								job.recipe,
							);
						loadedJobs.push({
							id: job.jobId,
							name: job.jobName,
							type: "Custom",
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
							smtpHost: sendEmailJob?.smtpHost,
							smtpPort: sendEmailJob?.smtpPort,
							subject: sendEmailJob?.subject,
							jobType: uiState?.jobType,
							to: (sendEmailJob?.to ?? "")
								.split(",")
								.filter(Boolean),
							cc: (sendEmailJob?.cc ?? "")
								.split(",")
								.filter(Boolean),
							bcc: (sendEmailJob?.bcc ?? "")
								.split(",")
								.filter(Boolean),
							from: sendEmailJob?.from,
							message: sendEmailJob?.message,
							username: sendEmailJob?.username,
							password: sendEmailJob?.password,
						});
					});
					setJobs(loadedJobs);
				}
			})
			.finally(() => setJobsLoading(false));
	};

	const deleteJob = (jobId: string[], jobGroup: string[]) => {
		let pixel: string;
		if (jobId.length > 1 && jobGroup.length > 1) {
			pixel = `META | RemoveJobFromDB(jobId=${JSON.stringify(jobId)}, jobGroup=${JSON.stringify(jobGroup)}) `;
		} else {
			pixel = `META | RemoveJobFromDB(jobId=["${jobId[0]}"], jobGroup=["${jobGroup[0]}"]) `;
		}
		monolithStore
			.runQuery(pixel)
			.then((response) => {
				const type = response.pixelReturn[0].operationType;
				const output = response.pixelReturn[0].output;
				const failedIds = output?.failed || [];

				if (type.indexOf("ERROR") === -1) {
					if (failedIds.length === 0) {
						toast.success("Successfully deleted all selected jobs");
					} else {
						const failedJobNames = jobs
							.filter((job) => failedIds.includes(job.id))
							.map((job) => job.name)
							.join(", ");
						toast.error(
							`Some jobs could not be deleted: ${failedJobNames}`,
						);
					}
					if (jobId.length > 1 && jobGroup.length > 1) {
						setJobsToDelete([]);
						setDeleteMultiple(false);
					} else {
						setJobToDelete(null);
					}
					getJobs();
				} else {
					throw new Error(response.errors[0]);
				}
			})
			.catch((error) => toast.error(error.message));
	};

	const pauseJobs = async () => {
		let pixel = "";
		for (const job of selectedActiveJobs) {
			pixel += `PauseJobTrigger(jobId=["${job.id}"], jobGroup=["${job.group}"]);`;
		}
		try {
			await runPixel(pixel);
		} catch {
			toast.error("Unable to pause jobs.");
		} finally {
			getJobs();
		}
	};

	const resumeJobs = async () => {
		let pixel = "";
		for (const job of selectedPausedJobs) {
			pixel += `ResumeJobTrigger(jobId=["${job.id}"], jobGroup=["${job.group}"]);`;
		}
		try {
			await runPixel(pixel);
		} catch {
			toast.error("Unable to resume jobs.");
		} finally {
			getJobs();
		}
	};

	const loadHistory = async (
		page: number,
		rowsPerPage: number,
		search: string,
	) => {
		setHistoryLoading(true);
		let pixel = "META|SchedulerHistory(";
		if (search) {
			pixel += `filters=[Filter(SMSS_JOB_RECIPES__JOB_NAME ?like "${search}")],`;
		}
		pixel += `limit=${rowsPerPage},offset=${page * rowsPerPage} )`;

		return monolithStore
			.runQuery<[{ data: { values: string[][]; headers: string[] } }]>(
				pixel,
			)
			.then((response) => {
				const type = response.pixelReturn[0].operationType[0];
				if (type.indexOf("ERROR") > -1) {
					toast.error(
						"Something went wrong. Job history could not be retrieved.",
					);
					return;
				}
				const historyData: HistoryJob[] = [];
				const output = response.pixelReturn[0].output;
				const headers: Record<string, number> = {};
				for (let i = 0; i < output.data.headers.length; i++) {
					headers[output.data.headers[i]] = i;
				}
				for (const row of output.data.values) {
					if (row[headers.SUCCESS] !== null) {
						historyData.push({
							jobId:
								headers.JOB_ID !== undefined
									? row[headers.JOB_ID]
									: "",
							jobName:
								headers.JOB_NAME !== undefined
									? row[headers.JOB_NAME]
									: "",
							jobGroup:
								headers.JOB_GROUP !== undefined
									? row[headers.JOB_GROUP]
									: "",
							execStart:
								headers.EXECUTION_START !== undefined &&
								row[headers.EXECUTION_START]
									? convertTimetoDate(
											row[headers.EXECUTION_START],
										)
									: "",
							execEnd:
								headers.EXECUTION_END !== undefined
									? row[headers.EXECUTION_END]
									: "",
							execDelta:
								headers.EXECUTION_DELTA !== undefined
									? convertDeltaToRuntimeString(
											row[headers.EXECUTION_DELTA],
										)
									: "",
							success:
								headers.SUCCESS !== undefined
									? JSON.stringify(row[headers.SUCCESS]) ===
										"true"
									: false,
							jobTags:
								headers.JOB_TAG !== undefined
									? row[headers.JOB_TAG].split(",")
									: [],
							isLatest:
								headers.IS_LATEST !== undefined
									? JSON.stringify(row[headers.IS_LATEST]) ===
										"true"
									: false,
							schedulerOutput:
								headers.SCHEDULER_OUTPUT !== undefined
									? row[headers.SCHEDULER_OUTPUT]
									: "No Output.",
						});
					}
				}
				return historyData;
			})
			.finally(() => setHistoryLoading(false));
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

	const getFailedJobCount = () => {
		const pixel =
			'META|SchedulerHistory(filters=[Filter(SMSS_AUDIT_TRAIL__SUCCESS == "false")])';
		monolithStore
			.runQuery<[{ data: { values: string[][]; headers: string[] } }]>(
				pixel,
			)
			.then((response) => {
				const type = response.pixelReturn[0].operationType[0];
				if (type.indexOf("ERROR") > -1) {
					toast.error(
						"Something went wrong. Failed job history could not be retrieved.",
					);
				} else {
					const output = response.pixelReturn[0].output;
					setFailedJobCount(output.data.values.length);
				}
			});
	};

	const filteredJobs = useMemo(() => {
		const searchJobs = jobs.filter((job) => job.name.includes(searchValue));
		if (selectedTab === "Active")
			return searchJobs.filter((j) => j.isActive);
		if (selectedTab === "Inactive")
			return searchJobs.filter((j) => !j.isActive);
		return searchJobs;
	}, [jobs, searchValue, selectedTab]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional - rowSelectionModel is the only trigger
	const selectedPausedJobs = useMemo(
		() =>
			jobs.filter((j) => !j.isActive && rowSelectionModel.includes(j.id)),
		[rowSelectionModel],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional - rowSelectionModel is the only trigger
	const selectedActiveJobs = useMemo(
		() =>
			jobs.filter((j) => j.isActive && rowSelectionModel.includes(j.id)),
		[rowSelectionModel],
	);

	const debouncedGetHistory = debounced(() => {
		getHistory({ search: historySearchBuffer });
	}, 400);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only
	useEffect(() => {
		getJobs();
		getHistory({ reload: true });
		getFailedJobCount();
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional - debounced fn is stable
	useEffect(() => {
		debouncedGetHistory();
	}, [historySearchBuffer, debouncedGetHistory]);

	const deleteMutlipleJobs = () => {
		setDeleteMultiple(true);
		const rowsToBeDeleted = jobs.filter((job) =>
			rowSelectionModel.includes(job.id),
		);
		setJobsToDelete(rowsToBeDeleted);
	};

	if (!adminMode) {
		return <Navigate to={"/settings"} />;
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-row gap-6">
				<JobCard
					title="Active Jobs"
					icon={<Timer />}
					count={jobs.filter((j) => j.isActive).length}
					avatarColor="#E2F2FF"
					iconColor="#0471F0"
				/>
				<JobCard
					title="Inactive Jobs"
					icon={<Moon />}
					count={jobs.filter((j) => !j.isActive).length}
					avatarColor="#F1E9FB"
					iconColor="#8340DE"
				/>
				<JobCard
					title="Failed Jobs"
					icon={<AlertCircle />}
					count={failedJobCount}
					avatarColor="#DEF4F3"
					iconColor="#00A593"
				/>
			</div>
			<div className="flex w-full flex-row items-center justify-between gap-4">
				<Tabs
					value={selectedTab}
					onValueChange={(val) => setSelectedTab(val)}
				>
					<TabsList>
						<TabsTrigger value="All">All</TabsTrigger>
						<TabsTrigger value="Active">Active</TabsTrigger>
						<TabsTrigger value="Inactive">Inactive</TabsTrigger>
					</TabsList>
				</Tabs>
				<div className="flex flex-row items-center gap-2">
					<InputGroup className="w-[160px]">
						<InputGroupAddon>
							<Search className="size-4" />
						</InputGroupAddon>
						<InputGroupInput
							value={searchValue}
							onChange={(e) => setSearchValue(e.target.value)}
							placeholder="Search jobs..."
						/>
					</InputGroup>
					<Button
						variant="outline"
						disabled={selectedActiveJobs.length === 0}
						onClick={() => pauseJobs()}
						data-testid={"jobsPage-pause-btn"}
					>
						<Pause className="mr-2 size-4" />
						Pause
					</Button>
					<Button
						variant="outline"
						disabled={selectedPausedJobs.length === 0}
						onClick={() => resumeJobs()}
						data-testid={"jobsPage-resume-btn"}
					>
						<Play className="mr-2 size-4" />
						Resume
					</Button>
					<Button
						onClick={() =>
							setInitialBuilderState({
								id: null,
								name: "",
								pixel: "",
								tags: [],
								cronExpression: "0 0 12 * * *",
								cronTz: "US/Eastern",
								smtpHost: "",
								smtpPort: "",
								subject: "",
								jobType: "",
								to: [],
								cc: [],
								bcc: [],
								from: "",
								message: "",
								username: "",
								password: "",
							})
						}
						data-testid={"jobsPage-add-btn"}
					>
						<Plus className="mr-2 size-4" />
						Add
					</Button>
					{rowSelectionModel.length > 1 && (
						<Button
							variant="destructive"
							onClick={() => deleteMutlipleJobs()}
						>
							<Trash2 className="mr-2 size-4" />
							Delete Selected
						</Button>
					)}
				</div>
			</div>
			<JobsTable
				jobs={filteredJobs}
				jobsLoading={jobsLoading}
				rowSelectionModel={rowSelectionModel}
				setRowSelectionModel={setRowSelectionModel}
				getHistory={() => getHistory({ reload: true })}
				setInitialBuilderState={setInitialBuilderState}
				showDeleteJobModal={(job: Job) => setJobToDelete(job)}
			/>
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
				onSearchChange={setHistorySearchBuffer}
			/>
			<DeleteJobModal
				job={deleteMutliple ? jobsToDelete : [jobToDelete]}
				isOpen={
					deleteMutliple
						? jobsToDelete && jobsToDelete.length !== 0
						: jobToDelete !== null
				}
				close={
					deleteMutliple
						? () => {
								setJobsToDelete([]);
								setDeleteMultiple(false);
							}
						: () => setJobToDelete(null)
				}
				deleteJob={deleteJob}
			/>
			<JobBuilderModal
				isOpen={initalBuilderState !== null}
				initialBuilder={initalBuilderState}
				close={() => setInitialBuilderState(null)}
				getJobs={getJobs}
				jobs={jobs}
			/>
		</div>
	);
}
