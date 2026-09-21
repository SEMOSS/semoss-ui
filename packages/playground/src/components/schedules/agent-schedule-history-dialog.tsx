import { Link } from "react-router";
import { usePixel } from "@semoss/sdk/react";
import {
	Badge,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	Muted,
	Spinner,
} from "@semoss/ui/next";
import type { AgentSchedule, AgentScheduleInvocation } from "@/api";
import { formatAgentScheduleStatus } from "@/utility";

interface AgentScheduleHistoryDialogProps {
	schedule: AgentSchedule | null;
	onClose: () => void;
}

/** Displays existing SMSS_AUDIT_TRAIL entries for one schedule. */
export const AgentScheduleHistoryDialog = ({
	schedule,
	onClose,
}: AgentScheduleHistoryDialogProps) => {
	const history = usePixel<AgentScheduleInvocation[]>(
		schedule
			? `GetAgentScheduleHistory(scheduleId=[${JSON.stringify(schedule.scheduleId)}], limit=[100]);`
			: "",
		{ data: [] },
	);

	return (
		<Dialog
			open={Boolean(schedule)}
			onOpenChange={(open) => !open && onClose()}
		>
			<DialogContent className="max-h-[80dvh] overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>{schedule?.name} history</DialogTitle>
					<DialogDescription>
						Review when this task ran and what happened.
					</DialogDescription>
				</DialogHeader>
				{history.status === "LOADING" ? (
					<div className="flex justify-center py-8">
						<Spinner />
					</div>
				) : history.status === "ERROR" ? (
					<Muted className="text-destructive">
						Unable to load schedule history.
					</Muted>
				) : (history.data ?? []).length === 0 ? (
					<Muted>This task has not run yet.</Muted>
				) : (
					<div className="flex flex-col gap-3">
						{(history.data ?? []).map((invocation, index) => (
							<div
								key={`${invocation.executionStart}-${index}`}
								className="flex flex-col gap-2 rounded-lg border border-border p-4"
							>
								<div className="flex flex-wrap items-center justify-between gap-2">
									<span className="text-sm">
										{invocation.executionStart
											? new Date(
													invocation.executionStart,
												).toLocaleString()
											: "Time unavailable"}
									</span>
									<Badge
										variant={
											invocation.status === "FAILED" ||
											!invocation.success
												? "destructive"
												: "outline"
										}
									>
										{formatAgentScheduleStatus(
											invocation.status ||
												(invocation.success
													? "SUBMITTED"
													: "FAILED"),
										)}
									</Badge>
								</div>
								{invocation.skipReason && (
									<Muted>
										This run was skipped because another run
										was still in progress.
									</Muted>
								)}
								{invocation.error && (
									<Muted className="text-destructive">
										{invocation.error}
									</Muted>
								)}
								{invocation.roomId && (
									<Link
										className="w-fit text-primary text-sm underline-offset-4 hover:underline"
										to={`/room/${invocation.roomId}`}
									>
										Open chat
									</Link>
								)}
							</div>
						))}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};
