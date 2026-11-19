import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Button, Input } from "@semoss/ui/next";
import type { HandoffStep as HandoffStepData } from "../api/persona-interview";

interface HandoffRow {
	id: number;
	topic: string;
	person: string;
}

interface HandoffStepProps {
	step: HandoffStepData;
	/** Told every row that names both a topic and a person, each time one changes. */
	onChange: (answer: { rows: { topic: string; person: string }[] }) => void;
}

/**
 * Who a twin sends people to, topic by topic. It opens with a row for each
 * thing the owner said to leave to them, and takes rows for anything else.
 */
// shortcut: a person is typed as a name, so a twin can only name them; pick them from the directory if it should also give their address
export function HandoffStep({ step, onChange }: HandoffStepProps) {
	const [rows, setRows] = useState<HandoffRow[]>(() =>
		(step.topics.length > 0 ? step.topics : [""]).map((topic, id) => ({
			id,
			topic,
			person: "",
		})),
	);
	const [nextId, setNextId] = useState(rows.length);

	const change = (next: HandoffRow[]): void => {
		setRows(next);
		onChange({
			rows: next
				.filter((row) => row.topic.trim() && row.person.trim())
				.map(({ topic, person }) => ({
					topic: topic.trim(),
					person: person.trim(),
				})),
		});
	};
	const edit = (id: number, field: "topic" | "person", value: string) =>
		change(
			rows.map((row) =>
				row.id === id ? { ...row, [field]: value } : row,
			),
		);

	return (
		<div className="flex min-w-0 flex-col gap-3">
			<ul className="flex min-w-0 flex-col gap-3">
				{rows.map((row, index) => (
					<li
						key={row.id}
						className="flex min-w-0 flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-center"
					>
						<Input
							aria-label={`Topic ${index + 1}`}
							placeholder="For questions about…"
							value={row.topic}
							className="min-w-0 sm:flex-1"
							onChange={(event) =>
								edit(row.id, "topic", event.target.value)
							}
						/>
						<span className="shrink-0 text-muted-foreground text-sm">
							send people to
						</span>
						<Input
							aria-label={`Who to ask about ${row.topic.trim() || `topic ${index + 1}`}`}
							placeholder="A name"
							value={row.person}
							className="min-w-0 sm:flex-1"
							onChange={(event) =>
								edit(row.id, "person", event.target.value)
							}
						/>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							aria-label={`Remove ${row.topic.trim() || `topic ${index + 1}`}`}
							className="pointer-coarse:size-11 shrink-0 self-end sm:self-auto"
							onClick={() =>
								change(
									rows.filter((entry) => entry.id !== row.id),
								)
							}
						>
							<X aria-hidden="true" />
						</Button>
					</li>
				))}
			</ul>
			<Button
				type="button"
				variant="outline"
				className="self-start"
				onClick={() => {
					setNextId(nextId + 1);
					setRows([...rows, { id: nextId, topic: "", person: "" }]);
				}}
			>
				<Plus aria-hidden="true" />
				Add another
			</Button>
		</div>
	);
}
