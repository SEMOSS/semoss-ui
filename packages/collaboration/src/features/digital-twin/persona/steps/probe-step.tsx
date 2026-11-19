import { useId, useState } from "react";
import { Input, Label, P, RadioGroup, RadioGroupItem } from "@semoss/ui/next";
import type { ProbeStep as ProbeStepData } from "../api/persona-interview";

interface ProbeAnswer {
	pick: "a" | "b" | "both";
	note?: string;
}

interface ProbeStepProps {
	step: ProbeStepData;
	/** Told how each settled point was settled, by its id, each time one changes. */
	onChange: (answer: { probes: Record<string, ProbeAnswer> }) => void;
}

/**
 * Where two of the owner's answers do not add up: which of the two readings
 * is them, or that it depends, with room to say on what.
 */
export function ProbeStep({ step, onChange }: ProbeStepProps) {
	const [answers, setAnswers] = useState<Record<string, ProbeAnswer>>({});
	const id = useId();

	const settle = (probeId: string, next: ProbeAnswer): void => {
		const changed = { ...answers, [probeId]: next };
		setAnswers(changed);
		onChange({ probes: changed });
	};

	return (
		<div className="flex min-w-0 flex-col gap-6">
			{step.probes.map((probe) => {
				const given = answers[probe.id];
				const choices = [
					{ pick: "a" as const, label: probe.a },
					{ pick: "b" as const, label: probe.b },
					{ pick: "both" as const, label: "It depends" },
				];
				return (
					<div
						key={probe.id}
						className="flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4"
					>
						<P
							id={`${id}-${probe.id}`}
							className="wrap-anywhere font-medium text-sm"
						>
							{probe.question}
						</P>
						<RadioGroup
							aria-labelledby={`${id}-${probe.id}`}
							value={given?.pick ?? ""}
							className="gap-2"
							onValueChange={(next) => {
								const pick = choices.find(
									(choice) => choice.pick === next,
								)?.pick;
								if (pick)
									settle(probe.id, {
										pick,
										note: given?.note,
									});
							}}
						>
							{choices.map((choice) => (
								<Label
									key={choice.pick}
									htmlFor={`${id}-${probe.id}-${choice.pick}`}
									className="wrap-anywhere flex min-w-0 cursor-pointer items-center gap-3 rounded-lg border p-3 font-normal text-sm has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/10"
								>
									<RadioGroupItem
										id={`${id}-${probe.id}-${choice.pick}`}
										value={choice.pick}
									/>
									{choice.label}
								</Label>
							))}
						</RadioGroup>
						{given?.pick === "both" && (
							<div className="flex min-w-0 flex-col gap-2">
								<Label htmlFor={`${id}-${probe.id}-note`}>
									What does it depend on?
								</Label>
								<Input
									id={`${id}-${probe.id}-note`}
									value={given.note ?? ""}
									onChange={(event) =>
										settle(probe.id, {
											pick: "both",
											note: event.target.value,
										})
									}
								/>
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}
