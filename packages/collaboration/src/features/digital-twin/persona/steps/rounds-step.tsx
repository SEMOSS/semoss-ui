import { useId, useState } from "react";
import { cn, Label, P, Textarea } from "@semoss/ui/next";
import { AgentAvatar } from "@/components/common/agent-avatar";
import { SelectCard } from "@/features/onboarding/onboarding-ui";
import type { RoundsStep as RoundsStepData } from "../api/persona-interview";

interface RoundAnswer {
	pick: "a" | "b" | "own";
	text?: string;
}

interface RoundsStepProps {
	step: RoundsStepData;
	/** Which round is on screen, counted from 0. */
	part: number;
	/** Told every round answered so far, by the round's id, each time one changes. */
	onChange: (answer: { rounds: Record<string, RoundAnswer> }) => void;
}

/**
 * One message someone might send the owner, and how they would answer it:
 * one of two replies to choose between, or their own words. A round that
 * offers no replies is answered in their own words only.
 */
export function RoundsStep({ step, part, onChange }: RoundsStepProps) {
	const [answers, setAnswers] = useState<Record<string, RoundAnswer>>({});
	// what was typed for each round, kept while a reply is chosen instead
	const [typed, setTyped] = useState<Record<string, string>>({});
	const ownId = useId();
	const round = step.rounds[part];
	if (!round) return null;

	const answer = (next: RoundAnswer | undefined): void => {
		const changed = { ...answers };
		if (next) changed[round.id] = next;
		else delete changed[round.id];
		setAnswers(changed);
		onChange({ rounds: changed });
	};
	const replies = [
		{ pick: "a" as const, text: round.a },
		{ pick: "b" as const, text: round.b },
	].flatMap(({ pick, text }) => (text ? [{ pick, text }] : []));
	const given = answers[round.id];

	return (
		<div className="flex min-w-0 flex-col gap-4">
			<div className="flex min-w-0 items-start gap-3">
				<AgentAvatar agent={{ name: round.from }} size="md" />
				<div className="flex min-w-0 flex-col gap-1">
					<span className="text-muted-foreground text-xs">
						{round.from}
					</span>
					<P className="wrap-anywhere rounded-2xl rounded-ss-sm bg-muted px-4 py-3 text-sm">
						{round.message}
					</P>
				</div>
			</div>
			{replies.length === 2 && (
				<div className="grid min-w-0 gap-3 sm:grid-cols-2">
					{replies.map(({ pick, text }) => (
						<SelectCard
							key={pick}
							selected={given?.pick === pick}
							label={`Reply ${pick.toUpperCase()}: ${text}`}
							// chosen reads as chosen: a fill with the card's check, not its faint tint alone
							className={cn(
								"h-full",
								given?.pick === pick &&
									"bg-primary/10 ring-primary",
							)}
							onToggle={() =>
								answer(
									given?.pick === pick ? undefined : { pick },
								)
							}
						>
							<span className="wrap-anywhere min-w-0 text-sm">
								{text}
							</span>
						</SelectCard>
					))}
				</div>
			)}
			<div className="flex min-w-0 flex-col gap-2">
				<Label htmlFor={ownId}>
					{replies.length === 2
						? "Neither? Write what you would send"
						: "Write what you would send"}
				</Label>
				<Textarea
					id={ownId}
					rows={3}
					value={typed[round.id] ?? ""}
					onChange={(event) => {
						const text = event.target.value;
						setTyped({ ...typed, [round.id]: text });
						// their own words take the round; emptied, the round is unanswered again
						answer(text.trim() ? { pick: "own", text } : undefined);
					}}
				/>
			</div>
		</div>
	);
}
