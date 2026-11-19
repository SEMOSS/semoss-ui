import { Check, RefreshCw, X } from "lucide-react";
import { useId, useState } from "react";
import {
	Button,
	cn,
	Input,
	Label,
	P,
	ToggleGroup,
	ToggleGroupItem,
} from "@semoss/ui/next";
import type { MirrorStep as MirrorStepData } from "../api/persona-interview";
import { PRESSED_CLASS } from "./pressed";

// an answer is written again at most this many times; the server holds the same limit
const MAX_TRIES = 2;

type Verdict = "yes" | "close" | "no";
const VERDICTS: { verdict: Verdict; label: string }[] = [
	{ verdict: "yes", label: "That's me" },
	{ verdict: "close", label: "Close" },
	{ verdict: "no", label: "Not me" },
];

interface Mark {
	verdict?: Verdict;
	flagged: string[];
	note: string;
}

interface MirrorAnswer {
	verdict: Verdict;
	flagged: string[];
	note: string;
}

interface MirrorStepProps {
	step: MirrorStepData;
	/** Which answer is on screen, counted from 0. */
	part: number;
	/** Told what the owner said of each answer they gave a verdict on, by its id, each time one changes. */
	onChange: (answer: { rounds: Record<string, MirrorAnswer> }) => void;
	/** Ask for an answer to be written again from what the owner marked in it. */
	onRewrite: (roundId: string, flagged: string[], note: string) => void;
}

/**
 * The owner's twin answering as them, for the owner to judge: they tap the
 * sentences that are not how they would put it, say how close the whole
 * answer is, and can have it written again from that.
 */
export function MirrorStep({
	step,
	part,
	onChange,
	onRewrite,
}: MirrorStepProps) {
	// by answer and by how often it was written: a new wording starts unmarked
	const [marks, setMarks] = useState<Record<string, Mark>>({});
	const id = useId();
	const round = step.rounds[part];
	if (!round) return null;

	const key = `${round.id}:${round.tries}`;
	const mark = marks[key] ?? { flagged: [], note: "" };
	const change = (next: Mark): void => {
		const changed = { ...marks, [key]: next };
		setMarks(changed);
		const rounds: Record<string, MirrorAnswer> = {};
		for (const entry of step.rounds) {
			const given = changed[`${entry.id}:${entry.tries}`];
			if (given?.verdict)
				rounds[entry.id] = {
					verdict: given.verdict,
					flagged: given.flagged,
					note: given.note.trim(),
				};
		}
		onChange({ rounds });
	};
	// one sentence at a time, each with what ends it
	const sentences = round.reply.match(/[^.!?]+[.!?]*\s*/g) ?? [round.reply];
	const canRewrite =
		round.tries < MAX_TRIES &&
		(mark.flagged.length > 0 || mark.note.trim() !== "");

	return (
		<div className="flex min-w-0 flex-col gap-4">
			<P className="wrap-anywhere rounded-2xl rounded-ss-sm bg-muted px-4 py-3 text-sm">
				<span className="text-muted-foreground">Asked: </span>
				{round.ask}
			</P>
			<fieldset className="flex min-w-0 flex-col gap-2 rounded-xl border bg-card p-4">
				<legend className="px-1 text-muted-foreground text-xs">
					Your twin, as you. Tap what is not you.
				</legend>
				<div className="flex min-w-0 flex-wrap gap-1.5">
					{sentences.map((sentence, index) => {
						const text = sentence.trim();
						const isFlagged = mark.flagged.includes(text);
						return (
							<Button
								// a reply can say the same sentence twice
								// biome-ignore lint/suspicious/noArrayIndexKey: the sentences of one reply never reorder
								key={index}
								type="button"
								variant="ghost"
								aria-pressed={isFlagged}
								className={cn(
									"wrap-anywhere h-auto min-h-8 pointer-coarse:min-h-11 whitespace-normal rounded-md px-2 py-1 text-start font-normal text-sm",
									isFlagged &&
										"bg-destructive/10 text-destructive line-through hover:bg-destructive/15 hover:text-destructive",
								)}
								onClick={() =>
									change({
										...mark,
										flagged: isFlagged
											? mark.flagged.filter(
													(entry) => entry !== text,
												)
											: [...mark.flagged, text],
									})
								}
							>
								{isFlagged && (
									<X
										aria-hidden="true"
										className="no-underline"
									/>
								)}
								{text}
								{isFlagged && (
									<span className="sr-only"> (not me)</span>
								)}
							</Button>
						);
					})}
				</div>
			</fieldset>
			<ToggleGroup
				type="single"
				variant="outline"
				spacing={2}
				aria-label="How close is this to you?"
				value={mark.verdict ?? ""}
				className="flex-wrap"
				onValueChange={(next) =>
					change({
						...mark,
						verdict: VERDICTS.find(
							(entry) => entry.verdict === next,
						)?.verdict,
					})
				}
			>
				{VERDICTS.map(({ verdict, label }) => (
					<ToggleGroupItem
						key={verdict}
						value={verdict}
						className={PRESSED_CLASS}
					>
						{mark.verdict === verdict && (
							<Check
								aria-hidden="true"
								className="text-primary"
							/>
						)}
						{label}
					</ToggleGroupItem>
				))}
			</ToggleGroup>
			<div className="flex min-w-0 flex-col gap-2">
				<Label htmlFor={`${id}-note`}>What is off? (optional)</Label>
				<div className="flex min-w-0 flex-col gap-2 sm:flex-row">
					<Input
						id={`${id}-note`}
						value={mark.note}
						className="min-w-0 sm:flex-1"
						placeholder="Too chatty, I would never offer a call"
						onChange={(event) =>
							change({ ...mark, note: event.target.value })
						}
					/>
					<Button
						type="button"
						variant="outline"
						disabled={!canRewrite}
						className="pointer-coarse:min-h-11"
						onClick={() =>
							onRewrite(round.id, mark.flagged, mark.note.trim())
						}
					>
						<RefreshCw aria-hidden="true" />
						Try again
					</Button>
				</div>
				{round.tries >= MAX_TRIES && (
					<P className="text-muted-foreground text-xs">
						This one was written again twice. Mark what is still off
						and go on: your marks are kept.
					</P>
				)}
			</div>
		</div>
	);
}
