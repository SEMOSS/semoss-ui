import type { ReactElement } from "react";
import { Link as RouterLink } from "react-router";
import { Button, Muted } from "@semoss/ui/next";
import {
	engineSettingsPath,
	type ServedModelEngineGroup,
} from "./use-served-model-engines";

export interface ServedModelEnginesCellProps {
	/** The model's engines */
	group: ServedModelEngineGroup;
	/** The engines are not read yet, or could not be */
	isUnknown: boolean;
}

/**
 * A served model's engines in its row: each linked engine as a link to its
 * settings, and how many call the model without the link.
 */
export function ServedModelEnginesCell({
	group,
	isUnknown,
}: ServedModelEnginesCellProps): ReactElement {
	if (isUnknown) {
		return <Muted className="text-xs">Unknown</Muted>;
	}
	const { linked, unlinked } = group;
	if (linked.length === 0 && unlinked.length === 0) {
		return <Muted className="text-xs">None</Muted>;
	}
	return (
		<div className="flex min-w-0 flex-col items-start gap-1">
			{linked.map((engine) => (
				<Button
					key={engine.engineId}
					asChild
					variant="link"
					className="h-auto whitespace-normal break-words p-0 text-left text-sm"
				>
					<RouterLink to={engineSettingsPath(engine.engineId)}>
						{engine.engineName}
					</RouterLink>
				</Button>
			))}
			{unlinked.length > 0 ? (
				<Muted className="text-xs">
					{unlinked.length === 1
						? `${unlinked[0].engineName} calls it without the link`
						: `${unlinked.length} more call it without the link`}
				</Muted>
			) : null}
		</div>
	);
}
