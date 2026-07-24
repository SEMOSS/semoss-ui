/**
 * StepHeader — the Data → Visualize step indicator shared by the main app editor
 * and the portal EditMode so the two stay pixel-identical.
 */

import { Check } from "lucide-react";
import { Fragment } from "react";
import { cx } from "@/components/ui";

export interface EditorStep {
	id: number;
	label: string;
}

interface StepHeaderProps {
	steps: EditorStep[];
	current: number;
	onStep: (id: number) => void;
	/** Whether a step is clickable. Defaults to always reachable. */
	isReachable?: (id: number) => boolean;
}

export function StepHeader({
	steps,
	current,
	onStep,
	isReachable,
}: StepHeaderProps) {
	return (
		<div className="flex flex-shrink-0 items-center gap-0 border-stone-100 border-b bg-white px-5 py-3">
			{steps.map((s, i) => {
				const done = current > s.id;
				const isCurrent = current === s.id;
				const reachable = isReachable ? isReachable(s.id) : true;
				return (
					<Fragment key={s.id}>
						{i > 0 && (
							<div
								className={cx(
									"mx-3 h-px flex-1 transition-colors",
									done ? "bg-blue-400" : "bg-stone-200",
								)}
							/>
						)}
						<button
							type="button"
							onClick={() => reachable && onStep(s.id)}
							disabled={!reachable}
							className="flex items-center gap-2 transition-colors disabled:cursor-not-allowed"
						>
							<span
								className={cx(
									"flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full font-bold text-xs transition-all",
									done
										? "bg-blue-500 text-white"
										: isCurrent
											? "bg-blue-600 text-white ring-2 ring-blue-200"
											: "bg-stone-100 text-stone-400",
								)}
							>
								{done ? (
									<Check className="h-3 w-3" />
								) : (
									s.id + 1
								)}
							</span>
							<span
								className={cx(
									"font-semibold text-sm transition-colors",
									isCurrent
										? "text-blue-700"
										: done
											? "text-stone-500"
											: "text-stone-300",
								)}
							>
								{s.label}
							</span>
						</button>
					</Fragment>
				);
			})}
		</div>
	);
}
