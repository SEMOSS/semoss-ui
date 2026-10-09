import { CircleCheck, CircleSlash, Inbox } from "lucide-react";
import { useEffect, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import { cn, toast } from "@semoss/ui/next";
import { toError } from "@semoss/utility";
import { type Delegation, listAssignedDelegations } from "../api/delegations";

// The requester can withdraw at any time, so an open request is re-read.
const POLL_MS = 15_000;

function closedText(delegation: Delegation): string | null {
	const who = delegation.requesterName ?? "The requester";
	switch (delegation.status) {
		case "PENDING":
			return null;
		case "RESPONDED":
			return `Closed. Your answer was sent to ${who}.`;
		case "DECLINED":
			return `Closed. You declined this request from ${who}.`;
		case "CANCELLED":
			return `Closed. ${who} withdrew this request. Nothing you send from here will reach them.`;
		default:
			return `Closed (${delegation.status}).`;
	}
}

/**
 * Slim banner over a delegation room. Replies are drafted in the chat and sent
 * through the agent's SubmitDelegationResponse tool, which the user confirms.
 */
export function DelegationResponsePanel({
	actionId,
	refreshKey,
}: {
	actionId: string;
	/** Changes when the thread does, so a confirmed send shows up here. */
	refreshKey: number;
}) {
	const { actions } = useInsight();
	const [delegation, setDelegation] = useState<Delegation | null>(null);
	const open = !delegation || delegation.status === "PENDING";

	// biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey only re-triggers the read.
	useEffect(() => {
		let cancelled = false;
		let timer: ReturnType<typeof setTimeout> | undefined;
		const read = () =>
			listAssignedDelegations(actions)
				.then((rows) => {
					if (cancelled) return;
					const row =
						rows.find((item) => item.actionId === actionId) ?? null;
					setDelegation(row);
					if (row?.status === "PENDING")
						timer = setTimeout(read, POLL_MS);
				})
				.catch((cause) => toast.error(toError(cause).message));
		if (open) void read();
		return () => {
			cancelled = true;
			if (timer) clearTimeout(timer);
		};
	}, [actions, actionId, refreshKey, open]);

	if (!delegation) return null;
	const closed = closedText(delegation);
	const Icon = !closed
		? Inbox
		: delegation.status === "RESPONDED"
			? CircleCheck
			: CircleSlash;

	return (
		<section
			aria-label="Delegated request"
			className={cn(
				"flex shrink-0 items-start gap-2.5 border-b px-5 py-3",
				closed ? "bg-muted" : "bg-accent",
			)}
		>
			<Icon
				aria-hidden="true"
				className={cn(
					"mt-0.5 size-4 shrink-0",
					closed ? "text-muted-foreground" : "text-primary",
				)}
			/>
			<div className="min-w-0">
				{closed ? (
					<p className="wrap-break-word font-medium text-sm">
						{closed}
					</p>
				) : (
					<>
						<p className="wrap-break-word text-sm">
							<span className="font-medium text-primary">
								Open request from{" "}
								{delegation.requesterName ?? "a teammate"}
								{delegation.dueAt &&
									`, due ${delegation.dueAt}`}
							</span>
						</p>
						<p className="mt-1 text-muted-foreground text-xs">
							Work on it here with your agent. When you're ready,
							ask it to send your answer; you'll confirm exactly
							what goes back.
						</p>
					</>
				)}
			</div>
		</section>
	);
}
