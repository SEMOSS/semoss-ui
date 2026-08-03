export interface JobBuilder {
	formType: string;
	id: string | null;
	name: string;
	pixel: string;
	tags: string[];
	cronExpression: string;
	cronTz: string;
	triggerOnLoad: boolean;
}

export interface PixelReturnJob {
	jobName: string;
	cronExpression: string;
	jobId: string;
	PREV_FIRE_TIME: string;
	NEXT_FIRE_TIME: string;
	recipe: string;
	USER_ID: string;
	jobGroup: string;
	recipeParameters: string;
	jobTags: string;
	cronTz: string;
	TRIGGER_ON_LOAD?: boolean | string;
}

export interface Job {
	id: string;
	name: string;
	cronExpression: string;
	timeZone: string;
	tags: string[];
	lastRun: string;
	nextRun: string;
	ownerId: string;
	isActive: boolean;
	group: string;
	pixel: string;
	triggerOnLoad: boolean;
}

export interface HistoryJob {
	jobId: string;
	jobName: string;
	jobGroup: string;
	execStart: string;
	execEnd: string;
	execDelta: string;
	success: boolean;
	jobTags: string[];
	isLatest: boolean;
	schedulerOutput: string;
}

export interface HistoryPaginationProps {
	page?: number;
	rowsPerPage?: number;
	search?: string;
	reload?: boolean;
}

export type Frequencies = "Daily" | "Weekly" | "Monthly" | "Yearly";

type DayOfWeek =
	| "Sunday"
	| "Monday"
	| "Tuesday"
	| "Wednesday"
	| "Thursday"
	| "Friday"
	| "Saturday";

type Month =
	| "January"
	| "February"
	| "March"
	| "April"
	| "May"
	| "June"
	| "July"
	| "August"
	| "September"
	| "October"
	| "November"
	| "December";

export type MonthsDef = {
	month: Month;
	value: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
	days: 28 | 29 | 30 | 31;
};

export type DayOfWeekDef = {
	day: DayOfWeek;
	value: 0 | 1 | 2 | 3 | 4 | 5 | 6;
};

export interface SchedulerStats {
	activeJobs?: number;
	pausedJobs?: number;
	overdueJobs?: number;
	nextRunAt?: string | null;
	totalRuns?: number;
	failures?: number;
	successRate?: number;
	avgDurationMs?: number;
	p95DurationMs?: number;
	worstJob?: {
		jobId: string;
		name: string;
		consecutiveFailures: number;
	} | null;
}

type CronMode = "standard" | "dropdown" | "expression";

export interface ParsedCron {
	mode: CronMode;
	frequency?: Frequencies;
	minute: string;
	hour: string;
	dayOfMonth: string;
	month: string;
	dayOfWeek: string;
}
