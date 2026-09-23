import { useEffect, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import { toast } from "@semoss/ui/next";
import { toError } from "@/lib/pixel";
import { type Delegation, listAssignedDelegations } from "../api/delegations";

const OUTCOME: Record<string, string> = {
	PENDING:
		"Work on it here with your agent. When you're ready, ask it to send your answer; you'll confirm exactly what goes back.",
	RESPONDED: "Your response was sent.",
	DECLINED: "You declined this request.",
	CANCELLED: "The requester cancelled this request.",
};

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

	// biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey only re-triggers the read.
	useEffect(() => {
		let cancelled = false;
		listAssignedDelegations(actions)
			.then((rows) => {
				if (cancelled) return;
				setDelegation(
					rows.find((row) => row.actionId === actionId) ?? null,
				);
			})
			.catch((cause) => toast.error(toError(cause).message));
		return () => {
			cancelled = true;
		};
	}, [actions, actionId, refreshKey]);

	if (!delegation) return null;

	return (
		<section
			aria-label="Delegated request"
			className="shrink-0 border-b bg-accent px-5 py-3"
		>
			<p className="wrap-break-word text-sm">
				<span className="font-medium text-link">
					Request from {delegation.requesterName ?? "a teammate"}
					{delegation.dueAt && `, due ${delegation.dueAt}`}:
				</span>{" "}
				<span className="font-semibold">{delegation.question}</span>
			</p>
			<p className="mt-1 text-muted-foreground text-xs">
				{OUTCOME[delegation.status] ?? delegation.status}
			</p>
		</section>
	);
}
