const STATUS_LABELS: Record<string, string> = {
	ACQUIRED: "Starting",
	BLOCKED: "In progress",
	COMPLETE: "Completed",
	COMPLETED: "Completed",
	ERROR: "Failed",
	FAILED: "Failed",
	INPUT_REQUIRED: "Needs attention",
	NONE: "Not scheduled",
	NORMAL: "Scheduled",
	PAUSED: "Paused",
	RUNNING: "In progress",
	SKIPPED: "Skipped",
	SUBMITTED: "Starting",
	WAITING: "Waiting",
};

/** Converts scheduler and agent status codes into business-friendly labels. */
export const formatAgentScheduleStatus = (status?: string | null) => {
	if (!status) return "Not started";
	return STATUS_LABELS[status] ?? "Status unavailable";
};
