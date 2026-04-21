import dayjs from "dayjs";
import { Pencil, Play, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { runPixel } from "@semoss/sdk/react";
import { Badge, Button, Checkbox, Spinner, toast } from "@semoss/ui/next";
import type { Job, JobBuilder } from "./job.types";
import { getHumanReadableCronExpression } from "./job.utils";

export const JobsTable = (props: {
	jobs: Job[];
	jobsLoading: boolean;
	rowSelectionModel: string[];
	setRowSelectionModel: (value: string[]) => void;
	getHistory: () => void;
	setInitialBuilderState: (builder: JobBuilder) => void;
	showDeleteJobModal: (job: Job) => void;
}) => {
	const {
		jobs,
		jobsLoading,
		rowSelectionModel,
		setRowSelectionModel,
		getHistory,
		setInitialBuilderState,
		showDeleteJobModal,
	} = props;

	const [runJobLoading, setRunJobLoading] = useState<boolean>(false);

	const runJob = async (job: Job) => {
		setRunJobLoading(true);
		try {
			await runPixel(
				`META | ExecuteScheduledJob ( jobId = [ "${job.id}" ] , jobGroup = [ "${job.group}" ] ) ;`,
			);
		} catch {
			toast.error("Job could not be executed.");
		}
		try {
			await getHistory();
		} catch {
			toast.error("Could not retrieve job history.");
		}
		setRunJobLoading(false);
	};

	// reset selections when jobs change
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional - jobs array is the trigger
	useEffect(() => {
		setRowSelectionModel([]);
	}, [jobs]);

	const allSelected =
		jobs.length > 0 && rowSelectionModel.length === jobs.length;
	const someSelected =
		rowSelectionModel.length > 0 && rowSelectionModel.length < jobs.length;

	const toggleAll = () => {
		if (allSelected) {
			setRowSelectionModel([]);
		} else {
			setRowSelectionModel(jobs.map((j) => j.id));
		}
	};

	const toggleRow = (id: string) => {
		if (rowSelectionModel.includes(id)) {
			setRowSelectionModel(rowSelectionModel.filter((r) => r !== id));
		} else {
			setRowSelectionModel([...rowSelectionModel, id]);
		}
	};

	return (
		<div className="overflow-auto rounded-md border">
			<table className="w-full text-sm">
				<thead className="bg-muted/50">
					<tr>
						<th className="w-10 px-3 py-2">
							<Checkbox
								checked={
									allSelected ||
									(someSelected ? "indeterminate" : false)
								}
								onCheckedChange={toggleAll}
							/>
						</th>
						{[
							"Name",
							"Frequency",
							"Time Zone",
							"Tags",
							"Last Run",
							"Status",
							"Modified By",
							"Actions",
						].map((h) => (
							<th
								key={h}
								className="px-3 py-2 text-left font-medium text-muted-foreground"
							>
								{h}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{jobsLoading && (
						<tr>
							<td colSpan={9} className="py-6 text-center">
								<Spinner className="mx-auto size-5" />
							</td>
						</tr>
					)}
					{!jobsLoading && jobs.length === 0 && (
						<tr>
							<td
								colSpan={9}
								className="py-8 text-center text-muted-foreground"
							>
								No jobs found
							</td>
						</tr>
					)}
					{!jobsLoading &&
						jobs.map((job) => {
							let lastRunDisplay = "";
							if (
								job.lastRun &&
								job.lastRun !== "N/A" &&
								job.lastRun !== "INACTIVE"
							) {
								lastRunDisplay = dayjs(job.lastRun).format(
									"MM/DD/YYYY h:MM A",
								);
							}
							return (
								<tr
									key={job.id}
									className="border-t hover:bg-muted/30"
								>
									<td className="px-3 py-2">
										<Checkbox
											checked={rowSelectionModel.includes(
												job.id,
											)}
											onCheckedChange={() =>
												toggleRow(job.id)
											}
										/>
									</td>
									<td
										className="max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap px-3 py-2"
										title={job.name}
									>
										{job.name}
									</td>
									<td className="px-3 py-2">
										{getHumanReadableCronExpression(
											job.cronExpression.replaceAll(
												"?",
												"*",
											),
										)}
									</td>
									<td className="px-3 py-2">
										{job.timeZone}
									</td>
									<td className="px-3 py-2">
										<div className="flex flex-wrap gap-1">
											{job.tags
												.filter(Boolean)
												.map((tag) => (
													<Badge
														key={`${job.id}-${tag}`}
														variant="outline"
													>
														{tag}
													</Badge>
												))}
										</div>
									</td>
									<td className="px-3 py-2">
										{lastRunDisplay}
									</td>
									<td className="px-3 py-2">
										{job.isActive ? "Active" : "Paused"}
									</td>
									<td className="px-3 py-2">{job.ownerId}</td>
									<td className="px-3 py-2">
										<div className="flex items-center gap-1">
											<Button
												variant="ghost"
												size="icon"
												disabled={runJobLoading}
												onClick={() => runJob(job)}
												data-testid={
													"jobsTable-play-btn"
												}
											>
												{runJobLoading ? (
													<Spinner className="size-4" />
												) : (
													<Play className="size-4" />
												)}
											</Button>
											<Button
												variant="ghost"
												size="icon"
												disabled={runJobLoading}
												onClick={() =>
													setInitialBuilderState({
														id: job.id,
														name: job.name,
														pixel: job.pixel,
														tags: job.tags,
														cronExpression:
															job.cronExpression.replaceAll(
																"?",
																"*",
															),
														cronTz: job.timeZone,
														smtpHost: job.smtpHost,
														smtpPort: job.smtpPort,
														subject: job.subject,
														jobType: job.jobType,
														to: job.to,
														cc: job.cc,
														bcc: job.bcc,
														from: job.from,
														message: job.message,
														username: job.username,
														password: job.password,
													})
												}
												data-testid={
													"jobsTable-edit-btn"
												}
											>
												<Pencil className="size-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												disabled={runJobLoading}
												className="text-destructive hover:text-destructive"
												onClick={() =>
													showDeleteJobModal(job)
												}
												data-testid={
													"jobsTable-delete-btn"
												}
											>
												<Trash2 className="size-4" />
											</Button>
										</div>
									</td>
								</tr>
							);
						})}
				</tbody>
			</table>
		</div>
	);
};
