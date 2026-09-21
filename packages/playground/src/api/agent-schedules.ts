import { runPixel } from "@semoss/sdk/react";

export interface AgentScheduleInvocation {
	executionStart?: string | null;
	executionEnd?: string | null;
	executionDelta?: string | null;
	success: boolean;
	latest: boolean;
	status?: string;
	runId?: string;
	roomId?: string;
	skipReason?: string;
	error?: string;
}

export interface AgentSchedule {
	scheduleId: string;
	name: string;
	prompt: string;
	agentId?: string | null;
	modelId?: string | null;
	scheduleType: "ONCE" | "RECURRING";
	runAt?: string | null;
	cronExpression: string;
	timezone: string;
	roomMode: "FRESH" | "CONTINUE";
	continuingRoomId?: string | null;
	activeRunId?: string | null;
	activeRunStartedAt?: string | null;
	activeRoomId?: string | null;
	paused: boolean;
	triggerState: string;
	nextExecution?: string | null;
	runStatus?: string | null;
	runError?: string | null;
	latestInvocation?: AgentScheduleInvocation | null;
}

export interface AgentScheduleInput {
	name?: string;
	prompt: string;
	agentId?: string;
	modelId?: string;
	scheduleType: "ONCE" | "RECURRING";
	runAt?: string;
	cronExpression?: string;
	timezone: string;
	roomMode: "FRESH" | "CONTINUE";
	continuingRoomId?: string;
}

type ManageAction = "UPDATE" | "PAUSE" | "RESUME" | "DELETE" | "RUN_NOW";

const pixelArgument = (name: string, value: string | undefined) => {
	if (value === undefined) return null;
	return `${name}=[${JSON.stringify(value)}]`;
};

const runSchedulePixel = async <T>(pixel: string): Promise<T> => {
	const response = await runPixel<[T]>(pixel, "new");
	if (response.errors.length > 0) {
		throw new Error(response.errors.join(" "));
	}
	const result = response.pixelReturn[0];
	if (!result) {
		throw new Error("No schedule response was returned");
	}
	return result.output;
};

/** Create an owner-scoped Playground agent schedule. */
export const createAgentSchedule = async (
	input: AgentScheduleInput,
): Promise<AgentSchedule> => {
	const args = Object.entries(input)
		.map(([name, value]) =>
			pixelArgument(name, typeof value === "string" ? value : undefined),
		)
		.filter((value): value is string => Boolean(value));
	return runSchedulePixel<AgentSchedule>(
		`CreateAgentSchedule(${args.join(", ")});`,
	);
};

/** Apply one owner-scoped management operation. */
export const manageAgentSchedule = async (
	scheduleId: string,
	action: ManageAction,
	updates?: Partial<AgentScheduleInput>,
): Promise<AgentSchedule | { scheduleId: string; status: "DELETED" }> => {
	const args = [
		pixelArgument("scheduleId", scheduleId),
		pixelArgument("action", action),
		...Object.entries(updates ?? {}).map(([name, value]) =>
			pixelArgument(name, typeof value === "string" ? value : undefined),
		),
	].filter((value): value is string => Boolean(value));
	return runSchedulePixel<
		AgentSchedule | { scheduleId: string; status: "DELETED" }
	>(`ManageAgentSchedule(${args.join(", ")});`);
};
