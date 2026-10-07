import { Button, P, Small } from "@semoss/ui/next";
import type { WorkspaceFact } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { Section } from "./section";

/** Confirmed facts and reviewable suggestions retain their original identity. */
export function ThreadKeyFacts({
	threadId,
	facts,
}: {
	threadId: string;
	facts: WorkspaceFact[];
}) {
	const { dispatch } = useCollaborationSession();
	if (!facts.length) return null;
	const renderFact = (fact: WorkspaceFact) => (
		<div key={fact.id} className="space-y-2 border-b pb-3 last:border-0">
			<P className="break-words">{fact.text}</P>
			<Small className="text-muted-foreground">{fact.from}</Small>
			<div className="flex flex-wrap gap-2">
				{fact.status === "draft" && (
					<Button
						type="button"
						size="sm"
						variant="outline"
						onClick={() =>
							dispatch({
								type: "workspace.fact",
								threadId,
								operation: "save",
								fact: { id: fact.id, status: "confirmed" },
							})
						}
					>
						Confirm
					</Button>
				)}
				<Button
					type="button"
					size="sm"
					variant="ghost"
					aria-label={`Remove fact: ${fact.text}`}
					onClick={() =>
						dispatch({
							type: "workspace.fact",
							threadId,
							operation: "remove",
							fact: { id: fact.id },
						})
					}
				>
					Remove
				</Button>
			</div>
		</div>
	);
	const pending = facts.filter((fact) => fact.status === "draft");
	return (
		<Section title="Key facts" variant="widget">
			{facts
				.filter((fact) => fact.status === "confirmed")
				.map(renderFact)}
			{pending.length > 0 && (
				<details className="space-y-3">
					<summary className="min-h-9 cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-ring">
						Needs review · {pending.length}
					</summary>
					{pending.map(renderFact)}
				</details>
			)}
		</Section>
	);
}
