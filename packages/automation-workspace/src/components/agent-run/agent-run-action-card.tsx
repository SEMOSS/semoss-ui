import { Check, Pencil, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	isRequestUserInputAction,
	type PendingAgentAction,
	parseUserInputRequest,
} from "@semoss/sdk";
import {
	AgentUserInputCard,
	Button,
	Code,
	CodeContainer,
	Textarea,
} from "@semoss/ui/next";
import { agentToolLabel, formatAgentActionArguments } from "./agent-run.utils";

export type AgentRunActionDecision = "approve" | "edit" | "reject" | "respond";

interface AgentRunActionCardProps {
	action: PendingAgentAction;
	canResolve: boolean;
	resolving: boolean;
	resolved: boolean;
	onResolve: (
		action: PendingAgentAction,
		decision: AgentRunActionDecision,
		paramValues?: Record<string, unknown>,
	) => Promise<void>;
}

/** One pending tool decision or RequestUserInput action within an agent run. */
export function AgentRunActionCard({
	action,
	canResolve,
	resolving,
	resolved,
	onResolve,
}: AgentRunActionCardProps) {
	const [editing, setEditing] = useState(false);
	const [argumentDraft, setArgumentDraft] = useState(
		formatAgentActionArguments({
			toolArgs: action.editedArgs ?? action.toolArgs,
		}),
	);
	const [argumentError, setArgumentError] = useState<string | null>(null);
	const [resolutionError, setResolutionError] = useState<string | null>(null);
	const inputRequest = useMemo(() => parseUserInputRequest(action), [action]);
	const isUserInput = isRequestUserInputAction(action);
	const disabled =
		!canResolve || resolving || resolved || action.status !== "PENDING";

	useEffect(() => {
		setArgumentDraft(
			formatAgentActionArguments({
				toolArgs: action.editedArgs ?? action.toolArgs,
			}),
		);
		setArgumentError(null);
		setResolutionError(null);
		setEditing(false);
	}, [action]);

	const submitResolution = async (
		decision: AgentRunActionDecision,
		paramValues?: Record<string, unknown>,
	) => {
		setResolutionError(null);
		try {
			await onResolve(action, decision, paramValues);
		} catch (error) {
			setResolutionError(
				error instanceof Error
					? error.message
					: "Unable to submit this action.",
			);
		}
	};

	const resolveEdited = async () => {
		let paramValues: Record<string, unknown>;
		try {
			const parsed: unknown = JSON.parse(argumentDraft);
			if (
				!parsed ||
				typeof parsed !== "object" ||
				Array.isArray(parsed)
			) {
				throw new Error("Tool arguments must be a JSON object.");
			}
			paramValues = parsed as Record<string, unknown>;
		} catch (error) {
			setArgumentError(
				error instanceof Error
					? error.message
					: "Tool arguments must be valid JSON.",
			);
			return;
		}
		setArgumentError(null);
		await submitResolution("edit", paramValues);
	};

	if (isUserInput) {
		if (!inputRequest) {
			return (
				<p className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-destructive text-xs">
					This input request is invalid and cannot be displayed.
				</p>
			);
		}
		return (
			<div className="space-y-2">
				<AgentUserInputCard
					request={inputRequest}
					disabled={disabled}
					onSubmit={(answers) => submitResolution("respond", answers)}
				/>
				{resolving || resolved ? (
					<p
						className={
							resolving
								? "text-primary text-xs"
								: "text-success text-xs"
						}
					>
						{resolving
							? "Submitting answers…"
							: "Answers submitted. Waiting for the run to reconcile."}
					</p>
				) : null}
				{resolutionError ? (
					<p className="text-destructive text-xs">
						{resolutionError}
					</p>
				) : null}
				{!canResolve ? (
					<p className="text-muted-foreground text-xs">
						Only Automation project editors can resolve this action.
					</p>
				) : null}
			</div>
		);
	}

	return (
		<div className="rounded-lg border border-border bg-card p-3">
			<div className="flex flex-wrap items-start justify-between gap-2">
				<div className="min-w-0">
					<p className="truncate font-medium text-sm">
						{agentToolLabel(action.toolName, action.toolMeta)}
					</p>
					<p className="text-muted-foreground text-xs">
						{resolved
							? "Decision submitted. Waiting for the run to reconcile."
							: "Review this tool call before the agent continues."}
					</p>
				</div>
				{resolving ? (
					<span className="rounded-md border border-primary/50 bg-primary/10 px-2 py-0.5 text-primary text-xs">
						Resolving
					</span>
				) : resolved ? (
					<span className="rounded-md border border-success/50 bg-success/10 px-2 py-0.5 text-success text-xs">
						Resolved
					</span>
				) : null}
			</div>

			{editing ? (
				<div className="mt-3 space-y-2">
					<label
						htmlFor={`agent-run-action-${action.actionId}`}
						className="font-medium text-xs"
					>
						Tool arguments (JSON)
					</label>
					<Textarea
						id={`agent-run-action-${action.actionId}`}
						value={argumentDraft}
						onChange={(event) =>
							setArgumentDraft(event.target.value)
						}
						disabled={disabled}
						className="min-h-32 font-mono text-xs"
						aria-invalid={Boolean(argumentError)}
					/>
					{argumentError ? (
						<p className="text-destructive text-xs">
							{argumentError}
						</p>
					) : null}
					<div className="flex flex-wrap gap-2">
						<Button
							type="button"
							size="sm"
							disabled={disabled}
							onClick={() => void resolveEdited()}
						>
							<Check className="size-4" aria-hidden />
							Run with edits
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							disabled={disabled}
							onClick={() => {
								setEditing(false);
								setArgumentError(null);
							}}
						>
							Cancel edit
						</Button>
					</div>
				</div>
			) : (
				<>
					<CodeContainer className="mt-3 max-h-40 overflow-auto bg-muted">
						<Code
							code={formatAgentActionArguments(action)}
							language="json"
							className="text-xs"
						/>
					</CodeContainer>
					<div className="mt-3 flex flex-wrap gap-2">
						<Button
							type="button"
							size="sm"
							disabled={disabled}
							onClick={() => void submitResolution("approve")}
						>
							<Check className="size-4" aria-hidden />
							Approve
						</Button>
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={disabled}
							onClick={() => setEditing(true)}
						>
							<Pencil className="size-4" aria-hidden />
							Edit
						</Button>
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={disabled}
							onClick={() => void submitResolution("reject")}
						>
							<X className="size-4" aria-hidden />
							Reject
						</Button>
					</div>
				</>
			)}
			{resolutionError ? (
				<p className="mt-2 text-destructive text-xs">
					{resolutionError}
				</p>
			) : null}
		</div>
	);
}
