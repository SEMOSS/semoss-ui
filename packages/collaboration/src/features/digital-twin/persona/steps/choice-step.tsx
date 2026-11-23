import { Check, Plus, X } from "lucide-react";
import { useId, useState } from "react";
import {
	Button,
	Input,
	Label,
	ToggleGroup,
	ToggleGroupItem,
	z,
} from "@semoss/ui/next";
import type { ChoiceStep as ChoiceStepData } from "../api/persona-interview";
import { PRESSED_CLASS } from "./pressed";

const chosenSchema = z.object({
	picked: z.array(z.string()),
	own: z.array(z.string()),
});

interface ChoiceStepProps {
	step: ChoiceStepData;
	/** What the owner picked and added here before, as this step sent it; anything else is ignored. */
	initial?: unknown;
	/** Told what is picked, in the order it was picked, and what the owner added, each time either changes. */
	onChange: (answer: { picked: string[]; own: string[] }) => void;
}

/**
 * Things to pick from, any number of them, and room for the owner's own. A
 * step that asks for an order numbers the picks as they are made.
 */
export function ChoiceStep({ step, initial, onChange }: ChoiceStepProps) {
	// only what is still offered counts as picked
	const [picked, setPicked] = useState<string[]>(
		() =>
			chosenSchema
				.safeParse(initial)
				.data?.picked.filter((option) =>
					step.options.includes(option),
				) ?? [],
	);
	const [own, setOwn] = useState<string[]>(
		() => chosenSchema.safeParse(initial).data?.own ?? [],
	);
	const [draft, setDraft] = useState("");
	const draftId = useId();

	const handleAdd = (): void => {
		const text = draft.trim();
		if (!text || own.includes(text)) return;
		const added = [...own, text];
		setOwn(added);
		setDraft("");
		onChange({ picked, own: added });
	};

	return (
		<div className="flex min-w-0 flex-col gap-4">
			<ToggleGroup
				type="multiple"
				variant="outline"
				spacing={2}
				aria-label={step.title}
				value={picked}
				className="w-full flex-wrap"
				// a press is added to the end, so the order kept is the order picked
				onValueChange={(next) => {
					setPicked(next);
					onChange({ picked: next, own });
				}}
			>
				{step.options.map((option) => {
					const rank = picked.indexOf(option) + 1;
					return (
						<ToggleGroupItem
							key={option}
							value={option}
							className={PRESSED_CLASS}
						>
							{rank > 0 &&
								(step.ordered ? (
									<span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground text-xs">
										{rank}
									</span>
								) : (
									<Check
										aria-hidden="true"
										className="text-primary"
									/>
								))}
							{option}
						</ToggleGroupItem>
					);
				})}
			</ToggleGroup>
			{own.length > 0 && (
				<ul
					aria-label="What you added"
					className="flex flex-wrap gap-2"
				>
					{own.map((text) => (
						<li
							key={text}
							className="wrap-anywhere flex min-w-0 items-center gap-1 rounded-md border border-primary bg-primary/10 py-1 ps-3 pe-1 text-sm"
						>
							{text}
							<Button
								type="button"
								variant="ghost"
								size="icon"
								aria-label={`Remove ${text}`}
								className="pointer-coarse:size-11 size-6 shrink-0"
								onClick={() => {
									const left = own.filter(
										(entry) => entry !== text,
									);
									setOwn(left);
									onChange({ picked, own: left });
								}}
							>
								<X aria-hidden="true" />
							</Button>
						</li>
					))}
				</ul>
			)}
			<div className="flex min-w-0 flex-col gap-2">
				<Label htmlFor={draftId}>Add your own</Label>
				<div className="flex min-w-0 gap-2">
					<Input
						id={draftId}
						value={draft}
						className="min-w-0 flex-1"
						onChange={(event) => setDraft(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								event.preventDefault();
								handleAdd();
							}
						}}
					/>
					<Button
						type="button"
						variant="outline"
						disabled={!draft.trim()}
						onClick={handleAdd}
					>
						<Plus aria-hidden="true" />
						Add
					</Button>
				</div>
			</div>
		</div>
	);
}
