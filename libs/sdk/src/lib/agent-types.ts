/** Package-preservation evidence from `PptxEditSession.verify`. */
export interface AgentArtifactEditAssessment {
	status: "attention_required" | "passed";
	disposition: "proposal" | "revision";
	sourceHash: string;
	editType: "text" | "slides";
	slides: number[];
	affectedSlides: number[];
	outsideRequestedSlides: number[];
	reviewSlides: number[];
	changedParts: string[];
	contentChangedParts: string[];
	unassignedParts: string[];
	addedParts: string[];
	removedParts: string[];
	warnings: string[];
	unchangedParts: number;
}

/** Saved-artifact evidence from `PptxWorkflow.artifact`, independent of run status. */
export interface AgentWorkflowArtifact {
	status: "available" | "unavailable";
	filePath?: string;
	sourceHash?: string;
	slideCount: number;
	disposition: "proposal" | "revision";
	editAssessment?: AgentArtifactEditAssessment;
	structuralValidation: "passed" | "not_verified";
}

/** Review evidence from `PptxWorkflow.reviewOutcome`; reported fields describe the inspector's last report. */
export interface AgentWorkflowReviewOutcome {
	status: "complete" | "not_started" | "incomplete";
	verdict: "pass" | "needs_changes" | "inconclusive";
	reportedStatus?: string;
	reportedVerdict?: string;
	consistencyReview?: string;
	reviewedSlides?: number[];
	unreviewedSlides?: number[];
	inconclusiveSlides?: number[];
}

/** Workflow progress emitted by `PptxWorkflow.persist`. Missing strings have no value yet. */
export interface AgentWorkflowProgress {
	phase: string;
	filePath?: string;
	sourceHash?: string;
	builds: number;
	reviews: number;
	repairTurns: number;
	error?: string;
	lastBuildError?: string;
	finalBuildAttempted: boolean;
	finalBuildTimeMs: number;
	warning?: string;
	artifact: AgentWorkflowArtifact;
	reviewOutcome: AgentWorkflowReviewOutcome;
}

/** Measured run activity from `AgentRunProgress.snapshot`, shared by snapshots and progress events. */
export interface AgentRunProgress {
	phase: string;
	workflow?: AgentWorkflowProgress;
	activity: "idle" | "model" | "tool";
	currentTool?: string;
	maxTurns: number;
	turnsCompleted: number;
	turnsRemaining: number;
	modelCalls: number;
	modelTimeMs: number;
	toolTimeMs: number;
	toolWallTimeMs: number;
	elapsedMs: number;
	toolCalls: number;
	toolFailures: number;
	repeatedFailures: Array<{
		tool: string;
		target: string;
		count: number;
		error: string;
	}>;
}

/** Raw agent polling payload retained for the existing agent helpers. */
export type AgentStreamResponse = {
	run: {
		runId: string;
		roomId?: string;
		status:
			| "SUBMITTED"
			| "RUNNING"
			| "INPUT_REQUIRED"
			| "COMPLETED"
			| "FAILED"
			| "CANCELLED";
		inputMessageId?: string;
		finalOutputMessageId?: string;
		finalText?: string;
		errorMessage?: string;
		progress?: AgentRunProgress;
		artifacts: Array<AgentWorkflowArtifact & { status: "available" }>;
		reviewOutcome?: AgentWorkflowReviewOutcome;
		warnings?: string[];
		pendingActions: Array<{
			actionId: string;
			runId: string;
			roomId?: string;
			parentMessageId?: string;
			toolCallId?: string;
			toolName?: string;
			toolArgs?: Record<string, unknown>;
			editedArgs?: Record<string, unknown>;
			toolMeta?: Record<string, unknown>;
			hasUi: boolean;
			uiUrl?: string;
			status: "PENDING";
			result?: string;
			toolStatus?: string;
			dateCreated?: string;
			decidedAt?: string;
			userId?: string;
		}>;
	};
	events: Array<
		{
			version: 1;
			eventId: string;
			sequence: number;
			runId: string;
			timestamp: string;
		} & (
			| {
					type: "item.started" | "item.completed";
					item:
						| {
								id: string;
								kind: "message";
								role: "assistant";
								text: string;
								messageId?: string;
						  }
						| { id: string; kind: "reasoning"; summary: string }
						| {
								id: string;
								kind: "tool";
								name?: string;
								title?: string;
								description?: string;
								arguments?: Record<string, unknown>;
								metadata?: Record<string, unknown>;
								status:
									| "QUEUED"
									| "RUNNING"
									| "INPUT_REQUIRED"
									| "COMPLETED"
									| "FAILED"
									| "REJECTED"
									| "CANCELLED";
								output?: string;
								error?: string;
								durationMs?: number;
						  }
						| {
								id: string;
								kind: "subagent";
								childRunId: string;
								alias?: string;
								roomId: string;
								workspaceId?: string;
								status:
									| "SUBMITTED"
									| "RUNNING"
									| "INPUT_REQUIRED"
									| "COMPLETED"
									| "FAILED"
									| "CANCELLED";
								error?: string;
								resultPreview?: string;
						  }
						| (AgentRunProgress & {
								id: string;
								kind: "progress";
						  });
			  }
			| {
					type: "item.updated";
					itemId: string;
					kind: "message" | "reasoning" | "tool" | "subagent";
					delta?: string;
					patch?: Record<string, unknown>;
			  }
		)
	>;
	droppedEvents: number;
};
