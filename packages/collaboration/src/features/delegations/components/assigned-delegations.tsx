import { useCallback, useEffect, useId, useState } from "react";
import { useNavigate } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import {
	Button,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
	toast,
} from "@semoss/ui/next";
import { useMain } from "@/app/main.context";
import { roomsKey } from "@/features/agents/api/refresh-keys";
import { toError } from "@/lib/pixel";
import { roomPath } from "@/lib/workspace-paths";
import {
	attachRoomToAgent,
	type Delegation,
	declineDelegation,
	listAssignedDelegations,
} from "../api/delegations";

/** Requests other people's agents sent to this user, waiting on an answer. */
export function AssignedDelegations() {
	const { actions } = useInsight();
	const { agents, sessions, refresh } = useMain();
	const navigate = useNavigate();
	const headingId = useId();
	const [delegations, setDelegations] = useState<Delegation[]>([]);
	const [agentId, setAgentId] = useState("");
	const [openingId, setOpeningId] = useState<string | null>(null);
	const [decliningId, setDecliningId] = useState<string | null>(null);
	const [reason, setReason] = useState("");
	const [sendingDecline, setSendingDecline] = useState(false);

	useEffect(() => {
		let cancelled = false;
		listAssignedDelegations(actions, "PENDING")
			.then((rows) => !cancelled && setDelegations(rows))
			// Optional section: backends without delegation just show nothing.
			.catch(() => !cancelled && setDelegations([]));
		return () => {
			cancelled = true;
		};
	}, [actions]);

	useEffect(() => {
		if (!agentId && agents[0]) setAgentId(agents[0].id);
	}, [agentId, agents]);

	const open = useCallback(
		async (delegation: Delegation) => {
			const roomId = delegation.roomId;
			if (!roomId) return;
			// Reopen under the agent it was already filed with.
			const filed = sessions.find((session) => session.id === roomId);
			if (filed?.agentId) {
				navigate(roomPath(filed.agentId, roomId));
				return;
			}
			if (!agentId) {
				toast.error("Create an agent first to work on this request.");
				return;
			}
			setOpeningId(delegation.actionId);
			try {
				await attachRoomToAgent(actions, roomId, agentId);
				refresh(roomsKey(agentId));
				navigate(roomPath(agentId, roomId));
			} catch (cause) {
				toast.error(toError(cause).message);
			} finally {
				setOpeningId(null);
			}
		},
		[actions, agentId, navigate, refresh, sessions],
	);

	const decline = useCallback(
		async (delegation: Delegation) => {
			setSendingDecline(true);
			try {
				await declineDelegation(
					actions,
					delegation.actionId,
					reason.trim() || undefined,
				);
				setDelegations((rows) =>
					rows.filter((row) => row.actionId !== delegation.actionId),
				);
				setDecliningId(null);
				toast.success(
					`Declined. ${delegation.requesterName ?? "The requester"} has been told.`,
				);
			} catch (cause) {
				toast.error(toError(cause).message);
			} finally {
				setSendingDecline(false);
			}
		},
		[actions, reason],
	);

	if (!delegations.length) return null;

	return (
		<section aria-labelledby={headingId} className="mt-8">
			<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
				<h2
					id={headingId}
					className="flex items-center gap-2 font-semibold text-lg"
				>
					Assigned to you
					<span className="rounded-sm bg-chart-4/10 px-2 py-0.5 font-medium text-chart-4 text-xs">
						{delegations.length}
					</span>
				</h2>
				{agents.length > 1 && (
					<div className="flex items-center gap-2 text-sm">
						<span className="text-muted-foreground">Work in</span>
						<Select value={agentId} onValueChange={setAgentId}>
							<SelectTrigger aria-label="Agent to work in">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{agents.map((agent) => (
									<SelectItem key={agent.id} value={agent.id}>
										{agent.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}
			</div>
			<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
				{delegations.map((delegation) => (
					<article
						key={delegation.actionId}
						className="flex flex-col rounded-lg border bg-card p-4 text-card-foreground"
					>
						<p className="font-medium text-link text-xs">
							From {delegation.requesterName ?? "a teammate"}
							{delegation.dueAt && `, due ${delegation.dueAt}`}
						</p>
						<h3 className="wrap-break-word mt-2 font-semibold text-base leading-6">
							{delegation.question}
						</h3>
						{delegation.context && (
							<p className="wrap-break-word mt-2 line-clamp-3 text-muted-foreground text-sm leading-5">
								{delegation.context}
							</p>
						)}
						{decliningId === delegation.actionId ? (
							<div className="mt-auto flex flex-col gap-2 pt-4">
								<Textarea
									aria-label="Decline reason"
									placeholder={`Reason for ${delegation.requesterName ?? "the requester"} (optional)`}
									className="min-h-16 text-sm"
									value={reason}
									disabled={sendingDecline}
									onChange={(event) =>
										setReason(event.target.value)
									}
								/>
								<div className="flex flex-wrap gap-2">
									<Button
										size="sm"
										variant="destructive"
										disabled={sendingDecline}
										onClick={() => void decline(delegation)}
									>
										Send decline
									</Button>
									<Button
										size="sm"
										variant="ghost"
										disabled={sendingDecline}
										onClick={() => setDecliningId(null)}
									>
										Cancel
									</Button>
								</div>
							</div>
						) : (
							<div className="mt-auto flex flex-wrap gap-2 pt-4">
								<Button
									size="sm"
									disabled={openingId === delegation.actionId}
									onClick={() => void open(delegation)}
								>
									Open request
								</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={() => {
										setReason("");
										setDecliningId(delegation.actionId);
									}}
								>
									Decline
								</Button>
							</div>
						)}
					</article>
				))}
			</div>
		</section>
	);
}
