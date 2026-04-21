import { Delete, Edit, PlayArrow } from "@mui/icons-material";
import type { GridRowSelectionModel } from "@mui/x-data-grid";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { runPixel } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Badge,
	Button,
	Field,
	FieldContent,
	Spinner,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@semoss/ui/next";
import type { Job } from "./job.types";
import { getHumanReadableCronExpression } from "./job.utils";

export const JobsTable = (props: {
	jobs: Job[];
	jobsLoading: boolean;
	rowSelectionModel: GridRowSelectionModel;
	setRowSelectionModel: (value: GridRowSelectionModel) => void;
	getHistory: () => void;
	showDeleteJobModal: (job: Job) => void;
	getFailedJobCount: () => void;
}) => {
	const {
		jobs,
		jobsLoading,
		rowSelectionModel,
		setRowSelectionModel,
		getHistory,
		showDeleteJobModal,
		getFailedJobCount,
	} = props;

	const navigate = useNavigate();

	const [runJobLoading, setRunJobLoading] = useState<Set<string>>(new Set());
	const [notification, setNotification] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	const toggleRow = (id: string) => {
		if (rowSelectionModel.includes(id)) {
			setRowSelectionModel(rowSelectionModel.filter((i) => i !== id));
		} else {
			setRowSelectionModel([...rowSelectionModel, id]);
		}
	};

	const runJob = async (job: Job) => {
		setRunJobLoading((prev) => new Set(prev).add(job.id));

		try {
			await runPixel(
				`META | ExecuteScheduledJob ( jobId = [ "${job.id}" ] , jobGroup = [ "${job.group}" ] ) ;`,
			);
		} catch {
			setNotification({
				type: "error",
				message: "Job could not be executed.",
			});
		}

		await getFailedJobCount();
		await getHistory();

		setRunJobLoading((prev) => {
			const newSet = new Set(prev);
			newSet.delete(job.id);
			return newSet;
		});
	};

	useEffect(() => {
		setRowSelectionModel([]);
	}, [jobs]);

	return (
		<Field>
			<FieldContent>
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
							{notification.type === "error"
								? "Error"
								: "Success"}
						</AlertTitle>
						<AlertDescription>
							{notification.message}
						</AlertDescription>
					</Alert>
				)}
				<div className="overflow-hidden rounded-lg border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead />
								<TableHead>Name</TableHead>
								<TableHead>Frequency</TableHead>
								<TableHead>Time Zone</TableHead>
								<TableHead>Tags</TableHead>
								<TableHead>Last Run</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Modified By</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							{jobsLoading && (
								<TableRow>
									<TableCell colSpan={9}>
										<div className="flex justify-center py-4">
											<Spinner />
										</div>
									</TableCell>
								</TableRow>
							)}

							{!jobsLoading && jobs.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={9}
										className="py-4 text-center"
									>
										No jobs found
									</TableCell>
								</TableRow>
							)}

							{jobs.map((job) => {
								const isRunning = runJobLoading.has(job.id);

								return (
									<TableRow key={job.id}>
										<TableCell>
											<input
												type="checkbox"
												checked={rowSelectionModel.includes(
													job.id,
												)}
												onChange={() =>
													toggleRow(job.id)
												}
											/>
										</TableCell>

										<TableCell className="max-w-[200px] truncate">
											{job.name}
										</TableCell>

										<TableCell>
											{getHumanReadableCronExpression(
												job.cronExpression.replaceAll(
													"?",
													"*",
												),
											)}
										</TableCell>

										<TableCell>{job.timeZone}</TableCell>

										<TableCell>
											<div className="flex flex-wrap gap-1">
												{job.tags.map((tag) => (
													<Badge
														key={tag}
														variant="secondary"
													>
														{tag}
													</Badge>
												))}
											</div>
										</TableCell>

										<TableCell>
											{job.lastRun &&
											job.lastRun !== "INACTIVE" &&
											job.lastRun !== "N/A"
												? dayjs(job.lastRun).format(
														"MM/DD/YYYY h:mm A",
													)
												: ""}
										</TableCell>

										<TableCell>
											<span
												className={`rounded-full px-4 py-2 font-semibold text-white text-xs ${
													job.isActive
														? "bg-green-600"
														: "bg-red-600"
												}`}
											>
												{job.isActive
													? "Active"
													: "Inactive"}
											</span>
										</TableCell>

										<TableCell>
											<div className="flex items-center gap-2">
												{job.ownerId}
											</div>
										</TableCell>

										<TableCell>
											<div className="flex gap-2">
												<Button
													size="icon"
													variant="ghost"
													disabled={isRunning}
													onClick={() => {
														job && runJob(job);
													}}
												>
													{isRunning ? (
														<Spinner className="h-4 w-4" />
													) : (
														<PlayArrow fontSize="small" />
													)}
												</Button>

												<Button
													size="icon"
													variant="ghost"
													disabled={isRunning}
													onClick={() => {
														navigate(
															`/settings/jobs/edit-job/${job?.id}`,
															{
																state: {
																	initialState:
																		{
																			formType:
																				"edit",
																			id: job.id,
																			name: job.name,
																			pixel: job.pixel,
																			tags: job.tags,
																			basicTz:
																				job.basicTz,
																			cronExpression:
																				job.cronExpression,
																			cronTz: job.timeZone,
																			smtpHost:
																				job.smtpHost,
																			smtpPort:
																				job.smtpPort,
																			subject:
																				job.subject,
																			jobType:
																				job.jobType,
																			to: job.to,
																			cc: job.cc,
																			bcc: job.bcc,
																			from: job.from,
																			message:
																				job.message,
																			username:
																				job.username,
																			password:
																				job.password,
																			timeZone:
																				job.timeZone,
																		},
																},
															},
														);
													}}
												>
													<Edit fontSize="small" />
												</Button>

												<Button
													size="icon"
													variant="ghost"
													className="text-red-500"
													disabled={isRunning}
													onClick={() =>
														showDeleteJobModal(job)
													}
												>
													<Delete fontSize="small" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</div>
			</FieldContent>
		</Field>
	);
};
