import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Button, Input, P, Textarea } from "@semoss/ui/next";
import type { StandsStep as StandsStepData } from "../api/persona-interview";

// the server keeps this many standing answers
const MAX_ANSWERS = 6;

interface StandsRow {
	id: number;
	question: string;
	answer: string;
}

interface StandsStepProps {
	step: StandsStepData;
	/** Told every question that has an answer, each time one changes. */
	onChange: (answer: {
		rows: { question: string; answer: string }[];
	}) => void;
}

/**
 * The questions the owner gets again and again, each with the answer they
 * always give. Suggested questions are added with a press, their own with
 * another, and a twin later gives these answers word for word.
 */
export function StandsStep({ step, onChange }: StandsStepProps) {
	const [rows, setRows] = useState<StandsRow[]>([]);
	const [nextId, setNextId] = useState(0);
	const isFull = rows.length >= MAX_ANSWERS;

	const change = (next: StandsRow[]): void => {
		setRows(next);
		onChange({
			rows: next
				.filter((row) => row.question.trim() && row.answer.trim())
				.map(({ question, answer }) => ({
					question: question.trim(),
					answer: answer.trim(),
				})),
		});
	};
	const add = (question: string): void => {
		setNextId(nextId + 1);
		change([...rows, { id: nextId, question, answer: "" }]);
	};
	const edit = (id: number, field: "question" | "answer", value: string) =>
		change(
			rows.map((row) =>
				row.id === id ? { ...row, [field]: value } : row,
			),
		);
	// a suggestion already taken is not offered again
	const offered = step.suggestions.filter(
		(question) => !rows.some((row) => row.question === question),
	);

	return (
		<div className="flex min-w-0 flex-col gap-4">
			<div className="flex min-w-0 flex-wrap gap-2">
				{offered.map((question) => (
					<Button
						key={question}
						type="button"
						variant="outline"
						size="sm"
						disabled={isFull}
						className="wrap-anywhere h-auto min-h-8 pointer-coarse:min-h-11 whitespace-normal py-1.5 text-start"
						onClick={() => add(question)}
					>
						<Plus aria-hidden="true" />
						{question}
					</Button>
				))}
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={isFull}
					className="pointer-coarse:min-h-11"
					onClick={() => add("")}
				>
					<Plus aria-hidden="true" />A question of your own
				</Button>
			</div>
			{rows.length === 0 ? (
				<P className="rounded-lg border border-dashed p-4 text-muted-foreground text-sm">
					Nothing yet. Pick a question above, or go on without any.
				</P>
			) : (
				<ul className="flex min-w-0 flex-col gap-3">
					{rows.map((row, index) => (
						<li
							key={row.id}
							className="flex min-w-0 flex-col gap-2 rounded-xl border bg-card p-4"
						>
							<div className="flex min-w-0 items-center gap-2">
								<Input
									aria-label={`Question ${index + 1}`}
									placeholder="What people ask you"
									value={row.question}
									className="min-w-0 flex-1 font-medium"
									onChange={(event) =>
										edit(
											row.id,
											"question",
											event.target.value,
										)
									}
								/>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									aria-label={`Remove ${row.question.trim() || `question ${index + 1}`}`}
									className="pointer-coarse:size-11 shrink-0"
									onClick={() =>
										change(
											rows.filter(
												(entry) => entry.id !== row.id,
											),
										)
									}
								>
									<X aria-hidden="true" />
								</Button>
							</div>
							<Textarea
								aria-label={`Your answer to ${row.question.trim() || `question ${index + 1}`}`}
								placeholder="What you always say"
								rows={2}
								value={row.answer}
								onChange={(event) =>
									edit(row.id, "answer", event.target.value)
								}
							/>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
