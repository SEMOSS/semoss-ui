import { useState } from "react";
import { P, RadioGroup, RadioGroupItem, z } from "@semoss/ui/next";
import type { DialsStep as DialsStepData } from "../api/persona-interview";

const STOPS = [1, 2, 3, 4, 5];
const movedSchema = z.object({
	values: z.record(z.string(), z.number().int().min(1).max(5)),
});

interface DialsStepProps {
	step: DialsStepData;
	/** Where the owner left the dials before, as this step sent it; anything else is ignored. */
	initial?: unknown;
	/** Told where every dial stands each time one is moved. */
	onChange: (answer: { values: Record<string, number> }) => void;
}

/**
 * Four dials between two ways of writing, each with the same message said
 * the way its stop sounds, so moving a dial is heard and not guessed. They
 * open where the interview put them from what it read.
 */
// five named stops and not a slider: the shared slider's thumb cannot be given a name
export function DialsStep({ step, initial, onChange }: DialsStepProps) {
	const [values, setValues] = useState<Record<string, number>>(() => {
		const moved = movedSchema.safeParse(initial).data?.values;
		return Object.fromEntries(
			step.dials.map((dial) => [
				dial.key,
				moved?.[dial.key] ?? dial.value,
			]),
		);
	});

	return (
		<div className="flex min-w-0 flex-col gap-4">
			{step.dials.map((dial) => {
				const value = values[dial.key] ?? dial.value;
				return (
					<div
						key={dial.key}
						className="flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4"
					>
						<div className="flex items-center justify-between gap-4 font-medium text-sm">
							<span>{dial.left}</span>
							<span>{dial.right}</span>
						</div>
						<RadioGroup
							aria-label={`${dial.left} to ${dial.right}`}
							value={String(value)}
							className="relative flex items-center justify-between gap-0 before:absolute before:inset-x-3 before:h-px before:bg-border"
							onValueChange={(next) => {
								const moved = {
									...values,
									[dial.key]: Number(next),
								};
								setValues(moved);
								onChange({ values: moved });
							}}
						>
							{STOPS.map((stop) => (
								<RadioGroupItem
									key={stop}
									value={String(stop)}
									aria-label={`${stop} of 5, from ${dial.left} to ${dial.right}`}
									className="relative pointer-coarse:size-9 size-7 bg-background transition-transform data-[state=checked]:scale-110 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
								/>
							))}
						</RadioGroup>
						<div className="flex flex-col gap-1 rounded-lg bg-muted p-3">
							<span className="text-muted-foreground text-xs">
								{dial.about}
							</span>
							<P
								aria-live="polite"
								className="wrap-anywhere text-sm"
							>
								{dial.samples[value - 1]}
							</P>
						</div>
					</div>
				);
			})}
		</div>
	);
}
