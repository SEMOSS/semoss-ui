import {
	CheckIcon,
	ChevronRightIcon,
	CircleAlertIcon,
	XIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
	Button,
	Code,
	CodeContainer,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { useWorkbench } from "@/hooks/use-workbench";
import type { BuildPendingAction, BuildRun } from "@/stores/workbench";
import { isRequestUserInputAction } from "@/stores/workbench";
import { actionDetails, friendlyToolName } from "./workbench-chat-tools";

/**
 * Extract a user-facing message from a thrown value.
 *
 * @name toErrorMessage
 * @param error - The thrown value, which may or may not be an Error.
 * @param fallback - Message used when the value carries no message.
 * @return The error's message, or the fallback.
 */
const toErrorMessage = (error: unknown, fallback: string): string =>
	error instanceof Error ? error.message : fallback;

interface ActionRequestDetailsProps {
	/** Pretty-printed request payload text */
	details: string;
}

/**
 * Collapsible request payload for one review action, closed by default
 * behind a "Request details" trigger and rendered as syntax-highlighted
 * JSON.
 *
 * @name ActionRequestDetails
 * @param details - Pretty-printed request payload text.
 * @return The collapsible request-details block.
 */
const ActionRequestDetails = ({ details }: ActionRequestDetailsProps) => {
	const [open, setOpen] = useState(false);

	return (
		<Collapsible
			open={open}
			onOpenChange={setOpen}
			className="mt-1 text-muted-foreground text-xs"
		>
			<CollapsibleTrigger className="flex cursor-pointer select-none items-center gap-1 font-medium">
				<ChevronRightIcon
					className={cn(
						"size-3 transition-transform",
						open && "rotate-90",
					)}
				/>
				Request details
			</CollapsibleTrigger>
			<CollapsibleContent>
				<CodeContainer className="mt-1 max-h-40 overflow-auto break-all rounded-md bg-muted p-2 font-mono">
					<Code code={details} language="json" className="text-xs" />
				</CodeContainer>
			</CollapsibleContent>
		</Collapsible>
	);
};

interface WorkbenchChatPendingActionsProps {
	/** The run whose pending review actions are shown */
	run: BuildRun;
}

/**
 * Review panel for pending tool actions that need an approve/reject decision.
 * Supports per-action decisions and a sequential "Approve all". While the run
 * is INPUT_REQUIRED it also polls `reconcileRun` every two seconds so
 * decisions made elsewhere (or a resumed run) are picked up. Renders nothing
 * when the run has no review actions.
 *
 * @name WorkbenchChatPendingActions
 * @param run - The run whose pending review actions are shown.
 * @return The pending-actions review panel, or null when there are none.
 */
export const WorkbenchChatPendingActions = ({
	run,
}: WorkbenchChatPendingActionsProps) => {
	const decideAction = useWorkbench((state) => state.chat.decideAction);
	const reconcileRun = useWorkbench((state) => state.chat.reconcileRun);
	const [busyActionId, setBusyActionId] = useState<string | null>(null);
	const [approvingAll, setApprovingAll] = useState(false);
	const [approveAllProgress, setApproveAllProgress] = useState(0);

	const reviewActions = run.pendingActions.filter(
		(action) => !isRequestUserInputAction(action),
	);
	const inputRequired = run.status.toUpperCase() === "INPUT_REQUIRED";

	useEffect(() => {
		if (!inputRequired || busyActionId || approvingAll) return;
		const interval = window.setInterval(() => {
			void reconcileRun(run.runId);
		}, 2_000);
		return () => window.clearInterval(interval);
	}, [approvingAll, busyActionId, inputRequired, reconcileRun, run.runId]);

	if (reviewActions.length === 0) return null;

	const decideOne = async (
		action: BuildPendingAction,
		decision: "approve" | "reject",
	) => {
		if (!action.actionId || busyActionId || approvingAll) return;
		setBusyActionId(action.actionId);
		try {
			await decideAction(run.runId, action.actionId, decision);
		} catch (error) {
			toast.error(
				toErrorMessage(error, `Unable to ${decision} this action.`),
			);
		} finally {
			setBusyActionId(null);
		}
	};

	const approveEveryAction = async () => {
		if (approvingAll || busyActionId) return;
		const actions = reviewActions.filter((action) => action.actionId);
		if (actions.length === 0) {
			toast.error("No actionable reviews were found.");
			return;
		}

		setApprovingAll(true);
		setApproveAllProgress(0);
		try {
			for (let index = 0; index < actions.length; index += 1) {
				setApproveAllProgress(index + 1);
				const actionId = actions[index].actionId;
				if (!actionId) continue;
				await decideAction(run.runId, actionId, "approve");
			}
		} catch (error) {
			toast.error(toErrorMessage(error, "Approve all did not finish."));
		} finally {
			setApprovingAll(false);
			setApproveAllProgress(0);
		}
	};

	return (
		<div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex min-w-0 items-center gap-2 font-medium text-sm">
					<CircleAlertIcon className="size-4 shrink-0 text-primary" />
					<span>
						{reviewActions.length} review{" "}
						{reviewActions.length === 1 ? "action" : "actions"}
					</span>
				</div>
				{reviewActions.length > 1 ? (
					<Button
						type="button"
						size="sm"
						disabled={Boolean(busyActionId) || approvingAll}
						onClick={() => void approveEveryAction()}
					>
						{approvingAll ? (
							<Spinner className="size-3.5" />
						) : (
							<CheckIcon className="size-3.5" />
						)}
						{approvingAll
							? `Approving ${approveAllProgress} of ${reviewActions.length}`
							: "Approve all"}
					</Button>
				) : null}
			</div>
			<p className="text-muted-foreground text-xs">
				The assistant will continue after every pending item is handled.
			</p>

			<div className="flex flex-col gap-2">
				{reviewActions.map((action, index) => {
					const id = action.actionId || `missing-${index}`;
					const loading = busyActionId === action.actionId;
					const details = actionDetails(action);
					return (
						<div
							key={id}
							className="rounded-md border border-border p-2"
						>
							<div className="flex flex-wrap items-start justify-between gap-2">
								<div className="min-w-0 flex-1">
									<p className="truncate font-medium text-sm">
										{friendlyToolName(
											String(
												action.toolName ||
													"Review action",
											),
											action.toolMeta ?? undefined,
										)}
									</p>
									{details ? (
										<ActionRequestDetails
											details={details}
										/>
									) : null}
								</div>

								<div className="flex flex-wrap items-center gap-1.5">
									<Button
										type="button"
										size="sm"
										disabled={
											!action.actionId ||
											Boolean(busyActionId) ||
											approvingAll
										}
										onClick={() =>
											void decideOne(action, "approve")
										}
									>
										{loading ? (
											<Spinner className="size-3.5" />
										) : (
											<CheckIcon className="size-3.5" />
										)}
										Approve
									</Button>
									<Button
										type="button"
										variant="outline"
										size="sm"
										disabled={
											!action.actionId ||
											Boolean(busyActionId) ||
											approvingAll
										}
										onClick={() =>
											void decideOne(action, "reject")
										}
									>
										{loading ? (
											<Spinner className="size-3.5" />
										) : (
											<XIcon className="size-3.5" />
										)}
										Reject
									</Button>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};
