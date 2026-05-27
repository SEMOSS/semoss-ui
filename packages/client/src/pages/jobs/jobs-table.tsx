type GridRowSelectionModel = (string | number)[];

import dayjs from "dayjs";
import {
	ChevronDown,
	ChevronUp,
	Copy,
	Maximize2,
	Pencil,
	Play,
	Trash2,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { runPixel } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Badge,
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
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
import { useNavigate } from "@/hooks/useNavigate";
import { copyTextToClipboard, getTagBadgeStyle } from "@/utility";
import type { Job } from "./job.types";
import { getHumanReadableCronExpression } from "./job.utils";

export const JobsTable = (props: {
	jobs: Job[];
	jobsLoading: boolean;
	rowSelectionModel: GridRowSelectionModel;
	setRowSelectionModel: (value: GridRowSelectionModel) => void;
	getHistory: () => void;
	showDeleteJobModal: (job: Job) => void;
	refreshStats: () => void;
	expandedRows: Set<string>;
	onToggleExpanded: (id: string) => void;
}) => {
	const {
		jobs,
		jobsLoading,
		rowSelectionModel,
		setRowSelectionModel,
		getHistory,
		showDeleteJobModal,
		refreshStats,
		expandedRows,
		onToggleExpanded,
	} = props;

	const navigate = useNavigate();

	const [runJobLoading, setRunJobLoading] = useState<Set<string>>(new Set());
	const [notification, setNotification] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);
	const [viewPixelJob, setViewPixelJob] = useState<Job | null>(null);

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

		await refreshStats();
		await getHistory();

		setRunJobLoading((prev) => {
			const newSet = new Set(prev);
			newSet.delete(job.id);
			return newSet;
		});
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: clear selection when the jobs list reloads
	useEffect(() => {
		setRowSelectionModel([]);
	}, [jobs]);

	return (
		<>
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
									<TableHead className="hidden md:table-cell">
										Frequency
									</TableHead>
									<TableHead className="hidden lg:table-cell">
										Time Zone
									</TableHead>
									<TableHead className="hidden lg:table-cell">
										Tags
									</TableHead>
									<TableHead className="hidden md:table-cell">
										Last Run
									</TableHead>
									<TableHead className="hidden xl:table-cell">
										Modified By
									</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>

							<TableBody>
								{jobsLoading && (
									<TableRow>
										<TableCell colSpan={8}>
											<div className="flex justify-center py-4">
												<Spinner />
											</div>
										</TableCell>
									</TableRow>
								)}

								{!jobsLoading && jobs.length === 0 && (
									<TableRow>
										<TableCell
											colSpan={8}
											className="py-4 text-center"
										>
											No jobs found
										</TableCell>
									</TableRow>
								)}

								{jobs.map((job) => {
									const isRunning = runJobLoading.has(job.id);
									const isExpanded = expandedRows.has(job.id);

									return (
										<React.Fragment key={job.id}>
											<TableRow>
												<TableCell>
													<div className="-mx-1 flex items-center">
														<Button
															type="button"
															size="icon-sm"
															variant="ghost"
															onClick={() =>
																onToggleExpanded(
																	job.id,
																)
															}
															title={
																isExpanded
																	? "Collapse"
																	: "Expand pixel"
															}
														>
															{isExpanded ? (
																<ChevronUp className="size-3.5" />
															) : (
																<ChevronDown className="size-3.5" />
															)}
														</Button>
														<input
															type="checkbox"
															checked={rowSelectionModel.includes(
																job.id,
															)}
															onChange={() =>
																toggleRow(
																	job.id,
																)
															}
														/>
													</div>
												</TableCell>

												<TableCell className="max-w-[240px]">
													<div className="flex items-center gap-2.5">
														<span
															role="img"
															aria-label={
																job.isActive
																	? "Active"
																	: "Inactive"
															}
															title={
																job.isActive
																	? "Active"
																	: "Inactive"
															}
															className={`inline-block size-2.5 shrink-0 rounded-full ${
																job.isActive
																	? "bg-success ring-2 ring-success/25"
																	: "border border-muted-foreground/50"
															}`}
														/>
														<div className="flex min-w-0 flex-col">
															<div className="group flex min-w-0 items-center gap-1">
																<span className="truncate">
																	{job.name}
																</span>
																<button
																	type="button"
																	onClick={(
																		e,
																	) => {
																		e.stopPropagation();
																		copyTextToClipboard(
																			job.name,
																		);
																	}}
																	className="shrink-0 opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
																	title="Copy name"
																	aria-label="Copy name"
																>
																	<Copy className="size-3 text-muted-foreground" />
																</button>
															</div>
															<div className="group flex min-w-0 items-center gap-1">
																<span
																	className="truncate text-muted-foreground text-xs"
																	title={
																		job.id
																	}
																>
																	jobId:{" "}
																	{job.id}
																</span>
																<button
																	type="button"
																	onClick={(
																		e,
																	) => {
																		e.stopPropagation();
																		copyTextToClipboard(
																			job.id,
																		);
																	}}
																	className="shrink-0 opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
																	title="Copy job ID"
																	aria-label="Copy job ID"
																>
																	<Copy className="size-3 text-muted-foreground" />
																</button>
															</div>
														</div>
													</div>
												</TableCell>

												<TableCell className="hidden md:table-cell">
													{getHumanReadableCronExpression(
														job.cronExpression.replaceAll(
															"?",
															"*",
														),
													)}
												</TableCell>

												<TableCell className="hidden lg:table-cell">
													{job.timeZone}
												</TableCell>

												<TableCell className="hidden lg:table-cell">
													<div className="flex flex-wrap gap-1">
														{job.tags.map((tag) => (
															<Badge
																key={tag}
																variant="secondary"
																style={getTagBadgeStyle(
																	tag,
																)}
															>
																{tag}
															</Badge>
														))}
													</div>
												</TableCell>

												<TableCell className="hidden md:table-cell">
													{job.lastRun &&
													job.lastRun !==
														"INACTIVE" &&
													job.lastRun !== "N/A"
														? dayjs(
																job.lastRun,
															).format(
																"MM/DD/YYYY h:mm A",
															)
														: ""}
												</TableCell>

												<TableCell className="hidden xl:table-cell">
													<div className="flex items-center gap-2">
														{job.ownerId}
													</div>
												</TableCell>

												<TableCell>
													<div className="-mx-1 flex items-center">
														<Button
															size="icon-sm"
															variant="ghost"
															disabled={isRunning}
															title="Run now"
															onClick={() => {
																job &&
																	runJob(job);
															}}
														>
															{isRunning ? (
																<Spinner className="size-3.5" />
															) : (
																<Play className="size-3.5" />
															)}
														</Button>

														<Button
															size="icon-sm"
															variant="ghost"
															disabled={isRunning}
															title="Edit"
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
																					cronExpression:
																						job.cronExpression,
																					cronTz: job.timeZone,
																					triggerOnLoad:
																						job.triggerOnLoad,
																				},
																		},
																	},
																);
															}}
														>
															<Pencil className="size-3.5" />
														</Button>

														<Button
															size="icon-sm"
															variant="ghost"
															className="text-destructive hover:text-destructive"
															disabled={isRunning}
															title="Delete"
															onClick={() =>
																showDeleteJobModal(
																	job,
																)
															}
														>
															<Trash2 className="size-3.5" />
														</Button>
													</div>
												</TableCell>
											</TableRow>

											{isExpanded && (
												<TableRow>
													<TableCell
														colSpan={8}
														className="bg-muted/20 p-0"
													>
														<div className="flex w-full min-w-0 max-w-full flex-col gap-2 p-4">
															<div className="flex items-center justify-between">
																<span className="text-muted-foreground text-xs">
																	Pixel recipe
																</span>
																<div className="flex items-center gap-1">
																	<Button
																		type="button"
																		variant="ghost"
																		size="sm"
																		className="h-7 px-2 text-muted-foreground text-xs"
																		onClick={() =>
																			setViewPixelJob(
																				job,
																			)
																		}
																		title="Expand"
																	>
																		<Maximize2 className="size-3" />{" "}
																		Expand
																	</Button>
																	<Button
																		type="button"
																		variant="ghost"
																		size="sm"
																		className="h-7 px-2 text-muted-foreground text-xs"
																		onClick={() =>
																			copyTextToClipboard(
																				job.pixel ??
																					"",
																			)
																		}
																	>
																		<Copy className="size-3" />{" "}
																		Copy
																	</Button>
																</div>
															</div>
															<pre className="max-h-[300px] w-full min-w-0 max-w-full overflow-y-auto whitespace-pre-wrap break-all rounded bg-muted/30 px-2 py-1 font-mono text-xs">
																{job.pixel ??
																	""}
															</pre>
														</div>
													</TableCell>
												</TableRow>
											)}
										</React.Fragment>
									);
								})}
							</TableBody>
						</Table>
					</div>
				</FieldContent>
			</Field>

			<Dialog
				open={viewPixelJob !== null}
				onOpenChange={(open) => !open && setViewPixelJob(null)}
			>
				<DialogContent className="flex h-[85vh] w-[90vw] max-w-[90vw] flex-col gap-3 p-6 sm:max-w-[90vw]">
					<DialogHeader className="shrink-0">
						<DialogTitle className="flex items-center gap-2 pr-8">
							<span className="truncate">
								{viewPixelJob?.name}
							</span>
							<span
								className="truncate font-normal text-muted-foreground text-xs"
								title={viewPixelJob?.id}
							>
								jobId: {viewPixelJob?.id}
							</span>
						</DialogTitle>
					</DialogHeader>
					<div className="flex shrink-0 items-center justify-between">
						<span className="text-muted-foreground text-xs">
							Pixel recipe
						</span>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-7 px-2 text-muted-foreground text-xs"
							onClick={() =>
								viewPixelJob &&
								copyTextToClipboard(viewPixelJob.pixel ?? "")
							}
						>
							<Copy className="size-3" /> Copy
						</Button>
					</div>
					<pre className="min-h-0 w-full max-w-full flex-1 overflow-auto whitespace-pre-wrap break-all rounded bg-muted/30 p-3 font-mono text-xs">
						{viewPixelJob?.pixel ?? ""}
					</pre>
				</DialogContent>
			</Dialog>
		</>
	);
};
