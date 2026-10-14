import { runPixel } from "@semoss/sdk";

/** Scheduler job scoped to one Automation project. */
export interface AutomationSchedule {
	jobId: string;
	jobName: string;
	jobGroup: string;
	cronExpression: string;
	cronTz: string;
	nextFireTime: string;
	previousFireTime: string;
	isActive: boolean;
}

interface SchedulerJobResponse {
	jobId?: string;
	jobName?: string;
	jobGroup?: string;
	cronExpression?: string;
	cronTz?: string;
	NEXT_FIRE_TIME?: string;
	PREV_FIRE_TIME?: string;
}

interface ProjectSchedulerJob extends SchedulerJobResponse {
	jobId: string;
	jobName: string;
	jobGroup: string;
}

function getPixelError(response: { errors: string[] }): string | null {
	return response.errors.length > 0 ? response.errors.join("\n") : null;
}

function isProjectSchedulerJob(
	job: SchedulerJobResponse,
	projectId: string,
): job is ProjectSchedulerJob {
	return (
		job.jobGroup === projectId &&
		typeof job.jobId === "string" &&
		typeof job.jobName === "string"
	);
}

/** Returns the scheduler jobs owned by the supplied Automation project. */
export async function listAutomationSchedules(
	projectId: string,
): Promise<AutomationSchedule[]> {
	const response = await runPixel(
		`ListAllJobs(project=${JSON.stringify([projectId])});`,
	);
	const error = getPixelError(response);
	if (error) throw new Error(error);
	const output = response.pixelReturn?.[0]?.output;
	if (!output || typeof output !== "object") return [];

	return Object.values(output as Record<string, SchedulerJobResponse>)
		.filter((job) => isProjectSchedulerJob(job, projectId))
		.map((job) => ({
			jobId: job.jobId,
			jobName: job.jobName,
			jobGroup: projectId,
			cronExpression: job.cronExpression ?? "",
			cronTz: job.cronTz ?? "",
			nextFireTime: job.NEXT_FIRE_TIME ?? "N/A",
			previousFireTime: job.PREV_FIRE_TIME ?? "N/A",
			isActive: job.NEXT_FIRE_TIME !== "INACTIVE",
		}));
}

/** Creates a scheduler job which invokes this Automation as a scheduled run. */
export async function createAutomationSchedule(
	projectId: string,
	values: {
		name: string;
		cronExpression: string;
		timezone: string;
	},
): Promise<void> {
	const recipe = `TriggerAutomation(project=${JSON.stringify([projectId])}, triggerType=${JSON.stringify(["SCHEDULED"])});`;
	const response = await runPixel(
		`META|ScheduleJob(jobName=${JSON.stringify([values.name])}, jobGroup=${JSON.stringify([projectId])}, cronExpression=${JSON.stringify([values.cronExpression])}, cronTz=${JSON.stringify([values.timezone])}, recipe=${JSON.stringify([`<encode>${recipe}</encode>`])}, recipeParameters=[""], triggerOnLoad=[false], triggerNow=[false]);`,
	);
	const error = getPixelError(response);
	if (error) throw new Error(error);
}

/** Pauses one project-owned Automation schedule without deleting its definition. */
export async function pauseAutomationSchedule(
	schedule: AutomationSchedule,
): Promise<void> {
	const response = await runPixel(
		`PauseJobTrigger(jobId=${JSON.stringify([schedule.jobId])}, jobGroup=${JSON.stringify([schedule.jobGroup])});`,
	);
	const error = getPixelError(response);
	if (error) throw new Error(error);
}

/** Resumes one project-owned Automation schedule. */
export async function resumeAutomationSchedule(
	schedule: AutomationSchedule,
): Promise<void> {
	const response = await runPixel(
		`ResumeJobTrigger(jobId=${JSON.stringify([schedule.jobId])}, jobGroup=${JSON.stringify([schedule.jobGroup])});`,
	);
	const error = getPixelError(response);
	if (error) throw new Error(error);
}

/** Deletes one project-owned Automation schedule and its stored recipe. */
export async function removeAutomationSchedule(
	schedule: AutomationSchedule,
): Promise<void> {
	const response = await runPixel(
		`META|RemoveJobFromDB(jobId=${JSON.stringify([schedule.jobId])}, jobGroup=${JSON.stringify([schedule.jobGroup])});`,
	);
	const error = getPixelError(response);
	if (error) throw new Error(error);
	const output = response.pixelReturn?.[0]?.output as
		| { failed?: string[] }
		| undefined;
	if (output?.failed?.includes(schedule.jobId)) {
		throw new Error("Unable to remove the automation schedule.");
	}
}
