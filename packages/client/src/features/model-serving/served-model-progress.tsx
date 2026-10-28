import type { ReactElement } from "react";
import { Muted, Progress } from "@semoss/ui/next";
import type { ServedModel } from "@/api/model-serving";
import {
	formatEta,
	SERVED_MODEL_PHASE_LABELS,
	servingLabel,
} from "./model-serving-labels";

export interface ServedModelProgressProps {
	/** A starting model */
	model: ServedModel;
}

/**
 * How far a start has come: a bar, the step it is on and the time it may still
 * take. The bar's value text says the same for screen readers.
 */
export function ServedModelProgress({
	model,
}: ServedModelProgressProps): ReactElement {
	const percent =
		model.progress === null ? null : Math.round(model.progress * 100);
	const step = model.phase
		? servingLabel(SERVED_MODEL_PHASE_LABELS, model.phase)
		: null;
	const eta = formatEta(model.etaSeconds);
	const valueText = [percent === null ? null : `${percent}%`, step, eta]
		.filter(Boolean)
		.join(", ");
	return (
		<div className="flex min-w-0 flex-col gap-1">
			<Progress
				value={percent ?? undefined}
				aria-label={`Start of ${model.servedModel}`}
				aria-valuetext={valueText || undefined}
				className="h-1.5"
			/>
			<Muted className="text-xs">
				{[step, eta].filter(Boolean).join(" · ") || "Starting"}
			</Muted>
		</div>
	);
}
