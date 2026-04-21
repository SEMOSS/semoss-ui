import type { GridRowSelectionModel } from "@mui/x-data-grid";
import {
	AlarmClock,
	AlertCircle,
	Filter,
	Moon,
	Pause,
	Play,
	Plus,
	Search,
	Trash,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { debounced, runPixel } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Field,
	FieldContent,
	Input,
	Tabs,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import { useRootStore, useSettings } from "@/hooks";
import { DeleteJobModal } from "./delete-job-modal";
import type {
	HistoryJob,
	HistoryPaginationProps,
	Job,
	JobUIState,
	PixelReturnJob,
	SendEmailJob,
} from "./job.types";
import {
	convertDeltaToRuntimeString,
	convertSendEmailRecipeToJob,
	convertTimetoDate,
} from "./job.utils";
import { JobCard } from "./job-card";
import { JobHistory } from "./job-history";
import { JobsTable } from "./jobs-table";

type OutputType = {
	failed?: string[];
	success?: string[];
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
	const [selectedTable, setSelectedTable] = useState("Jobs");
	const [selectedJobTab, setSelectedJobTab] = useState("All");
	const [selectedHistoryTab, setSelectedHistoryTab] = useState("All");
	const [historyPage, setHistoryPage] = useState<number>(0);
	const [historyRowsPerPage, setHistoryRowsPerPage] = useState<number>(5);
	const [historyCount, setHistoryCount] = useState<number>(-1);
	const [historySearchBuffer, setHistorySearchBuffer] = useState("");
	const [historySearch, setHistorySearch] = useState("");

	const [searchOpen, setSearchOpen] = useState(false);
	const [filterOpen, setFilterOpen] = useState(false);

	const searchRef = useRef(null);

	const [jobs, setJobs] = useState<any[]>([]);
	const [history, setHistory] = useState<any[]>([]);
	const [jobsLoading, setJobsLoading] = useState(false);
	const [historyLoading, setHistoryLoading] = useState(false);

	const [failedJobCount, setFailedJobCount] = useState(0);
	const [rowSelectionModel, setRowSelectionModel] =
		useState<GridRowSelectionModel>([]);

	const [jobToDelete, setJobToDelete] = useState(null);
	const [jobsToDelete, setJobsToDelete] = useState<any[]>([]);
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
						let uiState: JobUIState;
						try {
							if (job.uiState) {
								uiState = JSON.parse(job.uiState);
							}
						} catch (e) {
							console.log(e);
						}

						let sendEmailJob: SendEmailJob;
						if (job.recipe) {
							sendEmailJob = convertSendEmailRecipeToJob(
								job.recipe,
							);
						}
						jobs.push({
							id: job.jobId,
							name: job.jobName,
							type: "Custom",
							cronExpression: job.cronExpression,
							timeZone: job.cronTz,
							basicTz: job.cronTz ?? "", // Add basicTz property
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
								.filter((to) => !!to),
							cc: (sendEmailJob?.cc ?? "")
								.split(",")
								.filter((cc) => !!cc),
							bcc: (sendEmailJob?.bcc ?? "")
								.split(",")
								.filter((bcc) => !!bcc),
							from: sendEmailJob?.from,
							message: sendEmailJob?.message,
							username: sendEmailJob?.username,
							password: sendEmailJob?.password,
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
			pixel += 'jobId=["' + jobId[0] + '"], ';
			pixel += 'jobGroup=["' + jobGroup[0] + '"]) ';
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
					getFailedJobCount();
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
	) => {
		setHistoryLoading(true);
		let pixel = "META|SchedulerHistory(";
		if (search) {
			pixel += 'filters=[Filter(SMSS_JOB_RECIPES__JOB_NAME ?like "';
			pixel += search;
			pixel += '")],';
		}
		pixel += "limit=" + rowsPerPage + ",";
		pixel += "offset=" + page * rowsPerPage + " ";
		pixel += ")";

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
							headerLen = output["data"].headers.length;
						headerIdx < headerLen;
						headerIdx++
					) {
						headers[output["data"].headers[headerIdx]] = headerIdx;
					}

					for (
						let valueIdx = 0,
							valueLen = output["data"].values.length;
						valueIdx < valueLen;
						valueIdx++
					) {
						if (
							output["data"].values[valueIdx][
								headers["SUCCESS"]
							] !== null
						) {
							const job = {
								jobId: Object.hasOwn(headers, "JOB_ID")
									? output["data"].values[valueIdx][
											headers["JOB_ID"]
										]
									: "",
								jobName: Object.hasOwn(headers, "JOB_NAME")
									? output["data"].values[valueIdx][
											headers["JOB_NAME"]
										]
									: "",
								jobGroup: Object.hasOwn(headers, "JOB_GROUP")
									? output["data"].values[valueIdx][
											headers["JOB_GROUP"]
										]
									: "",
								execStart:
									Object.hasOwn(headers, "EXECUTION_START") &&
									output["data"].values[valueIdx][
										headers["EXECUTION_START"]
									]
										? convertTimetoDate(
												output["data"].values[valueIdx][
													headers["EXECUTION_START"]
												],
											)
										: "",
								execEnd: Object.hasOwn(headers, "EXECUTION_END")
									? output["data"].values[valueIdx][
											headers["EXECUTION_END"]
										]
									: "",
								execDelta: Object.hasOwn(
									headers,
									"EXECUTION_DELTA",
								)
									? convertDeltaToRuntimeString(
											output["data"].values[valueIdx][
												headers["EXECUTION_DELTA"]
											],
										)
									: "",
								success: Object.hasOwn(headers, "SUCCESS")
									? JSON.stringify(
											output["data"].values[valueIdx][
												headers["SUCCESS"]
											],
										) === "true"
									: false,
								jobTags: Object.hasOwn(headers, "JOB_TAG")
									? output["data"].values[valueIdx][
											headers["JOB_TAG"]
										].split(",")
									: [],
								isLatest: Object.hasOwn(headers, "IS_LATEST")
									? JSON.stringify(
											output["data"].values[valueIdx][
												headers["IS_LATEST"]
											],
										) === "true"
									: false,
								schedulerOutput: Object.hasOwn(
									headers,
									"SCHEDULER_OUTPUT",
								)
									? output["data"].values[valueIdx][
											headers["SCHEDULER_OUTPUT"]
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
			);

			if (newHistoryData && newHistoryData.length) {
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
							"Something went wrong. Failed job history could not be retrieved.",
					});
				} else {
					const output = response.pixelReturn[0].output;
					setFailedJobCount(output["data"].values.length);
				}
			});
	};

	const filteredJobs = useMemo(() => {
		const searchJobs = jobs.filter((job) => job.name.includes(searchValue));
		if (selectedJobTab === "Active") {
			return searchJobs.filter((job) => job.isActive);
		} else if (selectedJobTab === "Inactive") {
			return searchJobs.filter((job) => !job.isActive);
		}
		return searchJobs;
	}, [jobs, searchValue, selectedJobTab]);

	const selectedPausedJobs = useMemo(() => {
		return jobs.filter((job) => {
			return !job.isActive && rowSelectionModel.includes(job.id);
		});
	}, [rowSelectionModel]);

	const selectedActiveJobs = useMemo(() => {
		return jobs.filter((job) => {
			return job.isActive && rowSelectionModel.includes(job.id);
		});
	}, [rowSelectionModel]);

	const filteredHistory = useMemo(() => {
		const searchedHistory = history.filter((job) =>
			job.jobName.includes(searchValue),
		);
		if (selectedHistoryTab === "Success") {
			return searchedHistory.filter((job) => job.success === true);
		} else if (selectedHistoryTab === "Failed") {
			return searchedHistory.filter((job) => job.success === false);
		}
		return searchedHistory;
	}, [history, searchValue, selectedHistoryTab]);

	const debouncedGetHistory = debounced(() => {
		getHistory({ search: historySearchBuffer });
	}, 400);

	useEffect(() => {
		getJobs();
		getHistory({ reload: true });
		getFailedJobCount();
	}, []);

	useEffect(() => {
		debouncedGetHistory();
	}, [historySearchBuffer, debouncedGetHistory]);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (
				searchRef.current &&
				!searchRef.current.contains(event.target)
			) {
				setSearchOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [searchRef]);

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

			<hr className="border-gray-200" />

			<div className="flex w-1/2 gap-4">
				<JobCard
					title="Active Jobs"
					icon={<AlarmClock />}
					count={jobs.filter((j) => j.isActive).length}
					avatarColor={["#C6E4BF", "#66BB6A", "#6D7E6A"]}
					iconColor="#fff"
				/>

				<JobCard
					title="Inactive Jobs"
					icon={<Moon />}
					count={jobs.filter((j) => !j.isActive).length}
					avatarColor={["#FFF59D", "#FBC02D"]}
					iconColor="#fff"
				/>

				<JobCard
					title="Failed"
					icon={<AlertCircle />}
					count={failedJobCount}
					avatarColor={["#FFCCBC", "#E64A19"]}
					iconColor="#fff"
				/>
			</div>

			<Field className="rounded-lg border p-4">
				<FieldContent className="flex flex-col gap-4">
					<div className="flex items-center justify-between">
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

						<div className="flex items-center gap-2">
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

									<Button
										size="sm"
										onClick={() =>
											navigate("/settings/jobs/add-new-job")
										}
									>
										<Plus className="mr-1 h-4 w-4" /> Add
										New
									</Button>
								</>
							)}
						</div>
					</div>

					<div className="relative flex w-full items-center justify-between rounded-t-lg p-2">
						{selectedTable === "Jobs" && (
							<Tabs
								value={selectedJobTab}
								onValueChange={setSelectedJobTab}
								className="w-full"
							>
								<TabsList className="w-full flex-nowrap justify-start gap-10 overflow-x-auto rounded-none bg-transparent p-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
									<TabsTrigger
										value="All"
										className={`!flex-none !border-0 !bg-transparent !shadow-none hover:!bg-transparent data-[state=active]:!bg-transparent data-[state=active]:!shadow-none data-[state=active]:!text-primary after:-bottom-[1px] relative whitespace-nowrap rounded-none px-1 pb-3 text-sm after:absolute after:right-0 after:left-0 after:h-0.5 after:bg-primary after:opacity-0 ${
											selectedJobTab === "All" ? "data-[state=active]:after:opacity-100" : ""
										}`}
									>
										All
									</TabsTrigger>
									<TabsTrigger
										value="Active"
										className={`!flex-none !border-0 !bg-transparent !shadow-none hover:!bg-transparent data-[state=active]:!bg-transparent data-[state=active]:!shadow-none data-[state=active]:!text-primary after:-bottom-[1px] relative whitespace-nowrap rounded-none px-1 pb-3 text-sm after:absolute after:right-0 after:left-0 after:h-0.5 after:bg-primary after:opacity-0 ${
											selectedJobTab === "Active" ? "data-[state=active]:after:opacity-100" : ""
										}`}
									>
										Active
									</TabsTrigger>
									<TabsTrigger
										value="Inactive"
										className={`!flex-none !border-0 !bg-transparent !shadow-none hover:!bg-transparent data-[state=active]:!bg-transparent data-[state=active]:!shadow-none data-[state=active]:!text-primary after:-bottom-[1px] relative whitespace-nowrap rounded-none px-1 pb-3 text-sm after:absolute after:right-0 after:left-0 after:h-0.5 after:bg-primary after:opacity-0 ${
											selectedJobTab === "Inactive" ? "data-[state=active]:after:opacity-100" : ""
										}`}
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
								className="w-full"
							>
								<TabsList className="w-full flex-nowrap justify-start gap-10 overflow-x-auto rounded-none bg-transparent p-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
									<TabsTrigger
										value="All"
										className={`!flex-none !border-0 !bg-transparent !shadow-none hover:!bg-transparent data-[state=active]:!bg-transparent data-[state=active]:!shadow-none data-[state=active]:!text-primary after:-bottom-[1px] relative whitespace-nowrap rounded-none px-1 pb-3 text-sm after:absolute after:right-0 after:left-0 after:h-0.5 after:bg-primary after:opacity-0 ${
											selectedHistoryTab === "All" ? "data-[state=active]:after:opacity-100" : ""
										}`}
									>
										All
									</TabsTrigger>
									<TabsTrigger
										value="Success"
										className={`!flex-none !border-0 !bg-transparent !shadow-none hover:!bg-transparent data-[state=active]:!bg-transparent data-[state=active]:!shadow-none data-[state=active]:!text-primary after:-bottom-[1px] relative whitespace-nowrap rounded-none px-1 pb-3 text-sm after:absolute after:right-0 after:left-0 after:h-0.5 after:bg-primary after:opacity-0 ${
											selectedHistoryTab === "Success" ? "data-[state=active]:after:opacity-100" : ""
										}`}
									>
										Success
									</TabsTrigger>
									<TabsTrigger
										value="Failed"
										className={`!flex-none !border-0 !bg-transparent !shadow-none hover:!bg-transparent data-[state=active]:!bg-transparent data-[state=active]:!shadow-none data-[state=active]:!text-primary after:-bottom-[1px] relative whitespace-nowrap rounded-none px-1 pb-3 text-sm after:absolute after:right-0 after:left-0 after:h-0.5 after:bg-primary after:opacity-0 ${
											selectedHistoryTab === "Failed" ? "data-[state=active]:after:opacity-100" : ""
										}`}
									>
										Failed
									</TabsTrigger>
								</TabsList>
							</Tabs>
						)}

						<div className="flex items-center gap-2">
							{!searchOpen && (
								<Search
									className="h-4 w-4 cursor-pointer"
									onClick={() => setSearchOpen(true)}
								/>
							)}

							{searchOpen && (
								<div ref={searchRef}>
									<Input
										value={searchValue}
										onChange={(e) =>
											setSearchValue(e.target.value)
										}
										placeholder="Search..."
										className="w-48"
									/>
								</div>
							)}

							<Filter
								className="h-4 w-4 cursor-pointer"
								onClick={() => setFilterOpen(!filterOpen)}
							/>

							{filterOpen && (
								<div className="absolute top-full right-0 z-50 mt-2 w-52 rounded-md border bg-white p-2 shadow-md">
									<Button
										variant="outline"
										size="sm"
										className="w-full justify-start"
										onClick={() => {
											setSelectedTable("Jobs");
											setSelectedJobTab("Active");
											setFilterOpen(false);
										}}
									>
										<AlarmClock className="mr-2 h-4 w-4" />
										Active Jobs
									</Button>

									<Button
										variant="outline"
										size="sm"
										className="mt-1 w-full justify-start"
										onClick={() => {
											setSelectedTable("Jobs");
											setSelectedJobTab("Inactive");
											setFilterOpen(false);
										}}
									>
										<Moon className="mr-2 h-4 w-4" />
										Inactive Jobs
									</Button>

									<Button
										variant="outline"
										size="sm"
										className="mt-1 w-full justify-start"
										onClick={() => {
											setSelectedTable("History");
											setSelectedHistoryTab("Failed");
											setFilterOpen(false);
										}}
									>
										<AlertCircle className="mr-2 h-4 w-4" />
										Failed Jobs ({failedJobCount})
									</Button>
								</div>
							)}
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
							getFailedJobCount={getFailedJobCount}
						/>
					)}

					{selectedTable === "History" && (
						<JobHistory
							history={filteredHistory}
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
