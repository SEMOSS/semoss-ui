import { runPixel } from "@semoss/sdk/react";
import type {
	CreateWorkflowResponse,
	RunWorkflowResponse,
	Workflow,
	WorkflowStatusResponse,
} from "@/types/workflow";

// ─── Create ──────────────────────────────────────────────────────
export async function createWorkflow(
	name: string,
): Promise<CreateWorkflowResponse> {
	const { pixelReturn, errors } = await runPixel<[CreateWorkflowResponse]>(
		`CreateProject(project=["${name}"], projectType=["WORKFLOW"]);`,
	);

	if (errors.length) {
		throw new Error(errors.join("\n"));
	}

	return pixelReturn[0].output;
}

// ─── Load ────────────────────────────────────────────────────────
export async function getWorkflowStatus(
	projectId: string,
): Promise<WorkflowStatusResponse> {
	const { pixelReturn, errors } = await runPixel<[WorkflowStatusResponse]>(
		`GetWorkflowStatus(project=["${projectId}"]);`,
	);

	if (errors.length) {
		throw new Error(errors.join("\n"));
	}

	return pixelReturn[0].output;
}

// ─── Save ────────────────────────────────────────────────────────
export async function saveWorkflow(
	projectId: string,
	workflow: Workflow,
	comment?: string,
): Promise<boolean> {
	const jsonStr = JSON.stringify(workflow);
	const commentClause = comment
		? `, comment=["${comment.replace(/"/g, '\\"')}"]`
		: "";

	const { pixelReturn, errors } = await runPixel<[boolean]>(
		`SaveWorkflow(project=["${projectId}"], json=[${jsonStr}]${commentClause});`,
	);

	if (errors.length) {
		throw new Error(errors.join("\n"));
	}

	return pixelReturn[0].output;
}

// ─── Run ─────────────────────────────────────────────────────────
export async function runWorkflow(
	projectId: string,
	variables?: Record<string, unknown>,
	trigger = "manual",
): Promise<RunWorkflowResponse> {
	const varClause = variables
		? `, variables=[${JSON.stringify(variables)}]`
		: "";

	const { pixelReturn, errors } = await runPixel<[RunWorkflowResponse]>(
		`RunWorkflow(project=["${projectId}"]${varClause}, trigger=["${trigger}"]);`,
	);

	if (errors.length) {
		throw new Error(errors.join("\n"));
	}

	return pixelReturn[0].output;
}

// ─── Delete ──────────────────────────────────────────────────────
export async function deleteWorkflow(projectId: string): Promise<boolean> {
	const { pixelReturn, errors } = await runPixel<[boolean]>(
		`DeleteProject(project=["${projectId}"]);`,
	);

	if (errors.length) {
		throw new Error(errors.join("\n"));
	}

	return pixelReturn[0].output;
}

// ─── Schedule ────────────────────────────────────────────────────
export async function scheduleWorkflow(
	projectId: string,
	jobName: string,
	cronExpression: string,
): Promise<boolean> {
	const recipe = `RunWorkflow(project=[\\"${projectId}\\"], trigger=[\\"schedule\\"]);`;

	const { pixelReturn, errors } = await runPixel<[boolean]>(
		`ScheduleJob(jobName=["${jobName}"], jobGroup=["${projectId}"], cronExpression=["${cronExpression}"], recipe=["${recipe}"]);`,
	);

	if (errors.length) {
		throw new Error(errors.join("\n"));
	}

	return pixelReturn[0].output;
}
