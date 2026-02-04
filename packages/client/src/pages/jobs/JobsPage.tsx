import {
	Add,
	Bedtime,
	Delete,
	DeleteOutline,
	ErrorRounded,
	Pause,
	PlayArrowSharp,
} from "@mui/icons-material";
import AlarmOnIcon from "@mui/icons-material/AlarmOn";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import SearchIcon from "@mui/icons-material/Search";
import type { GridRowSelectionModel } from "@mui/x-data-grid";
import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { debounced, runPixel } from "@semoss/sdk/react";
import {
	Box,
	Button,
	Search,
	Stack,
	styled,
	Tabs,
	ToggleTabsGroup,
	useNotification,
} from "@semoss/ui";
import { useRootStore, useSettings } from "@/hooks";
import { DeleteJobModal } from "./DeleteJobModal";
import { JobCard } from "./JobCard";
import { JobHistory } from "./JobHistory";
import { JobsTable } from "./JobsTable";
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

const StyledBox = styled(Box)(({ theme }) => ({
	borderRadius: theme.spacing(1),
	backgroundColor: theme.palette.background.paper,
	padding: theme.spacing(2),
}));

const StyledToggleTabsGroup = styled(ToggleTabsGroup)(({ theme }) => ({
	border: "1px",
	minHeight: "42px",
	borderRadius: theme.shape.borderRadius,
	alignItems: "center",
	padding: "0px 3px",
}));

const StyledToggleTabsGroupItem = styled(ToggleTabsGroup.Item)(({ theme }) => ({
	height: "38px",
	padding: "8px 11px",
}));

export function JobsPage() {
	const { monolithStore } = useRootStore();
	const notification = useNotification();

	const jobsTabs = ["All", "Active", "Inactive"];
	const historyTabs = ["All", "Success", "Failed"];
	const tables = ["Jobs", "History"];

	const [searchValue, setSearchValue] = useState("");

	const [selectedJobTab, setSelectedJobTab] = useState(jobsTabs[0]);
	const [selectedHistoryTab, setSelectedHistoryTab] = useState(
		historyTabs[0],
	);
	const [selectedTable, setSelectedTable] = useState(tables[0]);
	const [failedJobCount, setFailedJobCount] = useState<number>(0);

	const [jobs, setJobs] = useState<Job[]>([]);
	const [jobsLoading, setJobsLoading] = useState<boolean>(false);

	const [jobToDelete, setJobToDelete] = useState<Job>(null);

	const [jobsToDelete, setJobsToDelete] = useState<Job[]>([]);
	const [deleteMutliple, setDeleteMultiple] = useState<boolean>(false);

	const [rowSelectionModel, setRowSelectionModel] =
		useState<GridRowSelectionModel>([]);

	const [history, setHistory] = useState<HistoryJob[]>([]);
	const [historyLoading, setHistoryLoading] = useState<boolean>(false);
	const [historySearch, setHistorySearch] = useState("");
	const [historySearchBuffer, setHistorySearchBuffer] = useState("");
	const [historyPage, setHistoryPage] = useState<number>(0);
	const [historyRowsPerPage, setHistoryRowsPerPage] = useState<number>(5);
	const [historyCount, setHistoryCount] = useState<number>(-1);
	const { adminMode } = useSettings();
	const searchRef = useRef(null);
	const navigate = useNavigate();
	const [searchOpen, setSearchOpen] = useState(false);
	const [filterOpen, setFilterOpen] = useState(false);

	const getJobs = () => {
		setJobsLoading(true);
		const pixel = "META|ListAllJobs()";
		monolithStore
			.runQuery<[Record<string, PixelReturnJob>]>(pixel)
			.then((response) => {
				const type = response.pixelReturn[0].operationType[0];

				if (type.indexOf("ERROR") > -1) {
					notification.add({
						color: "error",
						message:
							"Something went wrong. Jobs could not be retrieved.",
					});
				} else {
					const pixelJobs: Record<string, PixelReturnJob> =
						response.pixelReturn[0].output;
					const jobs: Job[] = [];
					Object.values(pixelJobs).forEach((job) => {
						// Job group is undefined for jobs made in the old ui
						if (!job.jobGroup || job.jobGroup === "undefined") {
							// skip jobs made on the old ui since they aren't backwards compatable
							return;
						}
						// ui state is a legacy construct, this may not exist
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
				const output = response.pixelReturn[0].output;
				// Expecting output to have { success: string[], failed: string[] }
				const failedIds = output?.failed || [];

				if (type.indexOf("ERROR") === -1) {
					if (failedIds.length === 0) {
						notification.add({
							color: "success",
							message: `Successfully deleted all selected jobs`,
						});
					} else {
						// Map failed job IDs to job names
						const failedJobNames = jobs
							.filter((job) => failedIds.includes(job.id))
							.map((job) => job.name)
							.join(", ");
						notification.add({
							color: "warning",
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
				notification.add({
					color: "error",
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
			notification.add({
				color: "error",
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
			notification.add({
				color: "error",
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
					notification.add({
						color: "error",
						message:
							"Something went wrong. Job history could not be retrieved.",
					});
				} else {
					// map the headers
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
						// Excluding the jobs that have not ran even once from history
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
								// TODO: validate return type/value
								success: Object.hasOwn(headers, "SUCCESS")
									? JSON.stringify(
											output["data"].values[valueIdx][
												headers["SUCCESS"]
											],
										) === "true"
									: false,
								// appName: Object.prototype.hasOwnProperty.call(headers, 'APP_NAME') ? output['data'].values[valueIdx][headers.APP_NAME] : '',
								jobTags: Object.hasOwn(headers, "JOB_TAG")
									? output["data"].values[valueIdx][
											headers["JOB_TAG"]
										].split(",")
									: [],
								// capture the latest record based on the IS_LATEST field stored
								isLatest: Object.hasOwn(headers, "IS_LATEST")
									? JSON.stringify(
											output["data"].values[valueIdx][
												headers["IS_LATEST"]
											],
										) === "true"
									: false,
								//capture scheduler output
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
					notification.add({
						color: "error",
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
		return searchedHistory; // "All" case
	}, [history, searchValue, selectedHistoryTab]);

	// Create debounced version of getHistory function for search
	const debouncedGetHistory = debounced(() => {
		getHistory({ search: historySearchBuffer });
	}, 400);

	useEffect(() => {
		// initial render
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
		return <Navigate to={"/settings"} />;
	}

	return (
		<Stack spacing={2}>
			<hr style={{ border: "1px solid #E0E0E0" }} />
			<Stack direction="row" spacing={3}>
				<JobCard
					title="Active Jobs"
					icon={<AlarmOnIcon fontSize="medium" />}
					count={
						jobs.filter((job) => {
							return job.isActive;
						}).length
					}
					avatarColor={["#C6E4BF", "#66BB6A", "#6D7E6A"]}
					iconColor="#FFFFFF"
				/>
				<JobCard
					title="Inactive Jobs"
					icon={<AlarmOnIcon fontSize="medium" />}
					count={
						jobs.filter((job) => {
							return !job.isActive;
						}).length
					}
					avatarColor={["#FFF59D", "#FBC02D"]}
					iconColor="#FFFFFF"
				/>
				<JobCard
					title="Failed"
					icon={<AlarmOnIcon fontSize="medium" />}
					count={failedJobCount}
					avatarColor={["#FFCCBC", "#E64A19"]}
					iconColor="#FFFFFF"
				/>
			</Stack>
			<StyledBox>
				<Stack
					direction="row"
					width="100%"
					justifyContent="space-between"
				>
					<StyledToggleTabsGroup
						value={selectedTable}
						onChange={(_, value: string) => {
							setSelectedTable(value);
						}}
						color="primary"
					>
						<StyledToggleTabsGroupItem
							label="Jobs"
							value={"Jobs"}
							data-testid={`jobsSettingsPage-jobs-btn`}
						/>
						<StyledToggleTabsGroupItem
							label="History"
							value={"History"}
							data-testid={`jobsSettingsPage-history-btn`}
						/>
					</StyledToggleTabsGroup>
					<Stack direction="row" spacing={2}>
						{selectedTable === "Jobs" && (
							<>
								<span>
									<Button
										disabled={
											selectedActiveJobs.length === 0
										}
										variant="outlined"
										startIcon={<Pause />}
										size="medium"
										onClick={() => pauseJobs()}
										data-testid={"jobsPage-pause-btn"}
									>
										Pause
									</Button>
								</span>
								<span>
									<Button
										disabled={
											selectedPausedJobs.length === 0
										}
										variant="outlined"
										startIcon={<PlayArrowSharp />}
										size="medium"
										onClick={() => resumeJobs()}
										data-testid={"jobsPage-resume-btn"}
									>
										Resume
									</Button>
								</span>
								<span>
									<Button
										disabled={
											rowSelectionModel.length === 0
										}
										variant="outlined"
										startIcon={<DeleteOutline />}
										size="medium"
										onClick={() => deleteMutlipleJobs()}
										data-testid={"jobsPage-delete-btn"}
									>
										Delete
									</Button>
								</span>
								<span>
									<Button
										size="medium"
										variant="contained"
										startIcon={<Add />}
										onClick={() =>
											navigate("/settings/add-new-job")
										}
										data-testid={"jobsPage-add-btn"}
									>
										Add New
									</Button>
								</span>
							</>
						)}
						{rowSelectionModel.length > 1 ? (
							<span>
								<Button
									disabled={false}
									variant="contained"
									startIcon={<Delete />}
									size="medium"
									onClick={() => deleteMutlipleJobs()}
								>
									Delete Selected
								</Button>
							</span>
						) : (
							""
						)}
					</Stack>
				</Stack>
				<Stack
					border={"1px solid #E0E0E0"}
					borderRadius="8px 8px 0 0"
					mt={2}
					flex={1}
					direction="row"
					justifyContent="space-between"
					alignItems="center"
					spacing={2}
					padding={1}
					sx={{ position: "relative" }}
				>
					{selectedTable === "Jobs" && (
						<Tabs
							value={selectedJobTab}
							onChange={(_, value: string) => {
								setSelectedJobTab(value);
							}}
							color="primary"
						>
							<Tabs.Item value="All" label="All" />
							<Tabs.Item value="Active" label="Active" />
							<Tabs.Item value="Inactive" label="Inactive" />
						</Tabs>
					)}
					{selectedTable === "History" && (
						<Tabs
							value={selectedHistoryTab}
							onChange={(_, value: string) => {
								setSelectedHistoryTab(value);
							}}
							color="primary"
						>
							<Tabs.Item value="All" label="All" />
							<Tabs.Item value="Success" label="Success" />
							<Tabs.Item value="Failed" label="Failed" />
						</Tabs>
					)}
					<Stack direction="row" spacing={2} alignItems="center">
						{!searchOpen && (
							<SearchIcon
								color="action"
								onClick={() => {
									setSearchOpen(!searchOpen);
								}}
							/>
						)}
						{searchOpen && (
							<div ref={searchRef}>
								<Search
									size="small"
									value={searchValue}
									onChange={(e) =>
										setSearchValue(e.target.value)
									}
								/>
							</div>
						)}
						<FilterAltIcon
							color="action"
							onClick={() => {
								setFilterOpen(!filterOpen);
							}}
						/>
						{filterOpen && (
							<Box
								sx={{
									position: "absolute",
									top: "100%",
									right: 0,
									zIndex: 1000,
									backgroundColor: "background.paper",
									border: "1px solid #E0E0E0",
									borderRadius: 1,
									padding: 2,
									minWidth: 200,
									boxShadow: 2,
								}}
							>
								<Stack spacing={1}>
									<Button
										variant={
											selectedJobTab === "Active"
												? "contained"
												: "outlined"
										}
										size="small"
										fullWidth
										onClick={() => {
											setSelectedTable("Jobs");
											setSelectedJobTab("Active");
											setFilterOpen(false);
										}}
										startIcon={<AlarmOnIcon />}
									>
										Active Jobs (
										{
											jobs.filter((job) => job.isActive)
												.length
										}
										)
									</Button>
									<Button
										variant={
											selectedJobTab === "Inactive"
												? "contained"
												: "outlined"
										}
										size="small"
										fullWidth
										onClick={() => {
											setSelectedTable("Jobs");
											setSelectedJobTab("Inactive");
											setFilterOpen(false);
										}}
										startIcon={<Bedtime />}
									>
										Inactive Jobs (
										{
											jobs.filter((job) => !job.isActive)
												.length
										}
										)
									</Button>
									<Button
										variant="outlined"
										size="small"
										fullWidth
										onClick={() => {
											setSelectedTable("History");
											setSelectedHistoryTab("Failed");
											setFilterOpen(false);
										}}
										startIcon={<ErrorRounded />}
									>
										Failed Jobs ({failedJobCount})
									</Button>
								</Stack>
							</Box>
						)}
					</Stack>
				</Stack>
				{selectedTable === "Jobs" && (
					<JobsTable
						jobs={filteredJobs}
						jobsLoading={jobsLoading}
						rowSelectionModel={rowSelectionModel}
						setRowSelectionModel={setRowSelectionModel}
						getHistory={() => getHistory({ reload: true })}
						showDeleteJobModal={(job: Job) => setJobToDelete(job)}
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
			</StyledBox>
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
						: () => {
								setJobToDelete(null);
							}
				}
				deleteJob={deleteJob}
			/>
		</Stack>
	);
}
