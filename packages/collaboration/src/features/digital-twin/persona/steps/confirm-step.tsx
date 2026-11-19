import { Check, Plus } from "lucide-react";
import { useId, useState } from "react";
import { Button, cn, Input, Label } from "@semoss/ui/next";
import type { ConfirmStep as ConfirmStepData } from "../api/persona-interview";

interface ConfirmStepProps {
	step: ConfirmStepData;
	/** Told what the owner keeps, as they left it, each time that changes. */
	onChange: (answer: { items: string[] }) => void;
}

/**
 * What the interview noticed in what it read, for the owner to keep, drop or
 * put right, with room for what it missed. Everything starts kept.
 */
export function ConfirmStep({ step, onChange }: ConfirmStepProps) {
	const [items, setItems] = useState(() =>
		step.items.map((text, index) => ({
			id: `noticed-${index}`,
			text,
			isKept: true,
		})),
	);
	const [missed, setMissed] = useState("");
	const missedId = useId();

	const change = (next: typeof items): void => {
		setItems(next);
		onChange({
			items: next
				.filter((item) => item.isKept && item.text.trim())
				.map((item) => item.text.trim()),
		});
	};
	const handleAdd = (): void => {
		const text = missed.trim();
		if (!text) return;
		change([...items, { id: `added-${items.length}`, text, isKept: true }]);
		setMissed("");
	};

	return (
		<div className="flex min-w-0 flex-col gap-4">
			<ul className="flex min-w-0 flex-col gap-2">
				{items.map((item, index) => (
					<li
						key={item.id}
						className={cn(
							"flex min-w-0 items-center gap-3 rounded-lg border p-2 transition-colors",
							item.isKept
								? "border-primary bg-primary/10"
								: "bg-muted/40",
						)}
					>
						<Button
							type="button"
							size="icon"
							variant={item.isKept ? "default" : "outline"}
							aria-pressed={item.isKept}
							aria-label={`Keep: ${item.text}`}
							className="pointer-coarse:size-11 size-8 shrink-0 rounded-full"
							onClick={() =>
								change(
									items.map((entry) =>
										entry.id === item.id
											? {
													...entry,
													isKept: !entry.isKept,
												}
											: entry,
									),
								)
							}
						>
							{item.isKept && <Check aria-hidden="true" />}
						</Button>
						<Input
							aria-label={`What I noticed, ${index + 1} of ${items.length}`}
							value={item.text}
							disabled={!item.isKept}
							className={cn(
								"min-w-0 flex-1 bg-background",
								!item.isKept && "line-through",
							)}
							onChange={(event) =>
								change(
									items.map((entry) =>
										entry.id === item.id
											? {
													...entry,
													text: event.target.value,
												}
											: entry,
									),
								)
							}
						/>
					</li>
				))}
			</ul>
			<div className="flex min-w-0 flex-col gap-2">
				<Label htmlFor={missedId}>Something I missed</Label>
				<div className="flex min-w-0 gap-2">
					<Input
						id={missedId}
						value={missed}
						className="min-w-0 flex-1"
						placeholder="You never open with small talk"
						onChange={(event) => setMissed(event.target.value)}
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
						disabled={!missed.trim()}
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
