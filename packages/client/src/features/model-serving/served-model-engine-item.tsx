import type { ReactElement, ReactNode } from "react";
import { Link as RouterLink } from "react-router";
import { Button, Muted } from "@semoss/ui/next";
import type { ServedModelEngineLink } from "@/api/model-serving";
import { engineSettingsPath } from "./use-served-model-engines";

export interface ServedModelEngineItemProps {
	engine: ServedModelEngineLink;
	/** The action beside it, such as Link or Unlink */
	action: ReactNode;
}

/** An engine in a list: its name, linking to its settings, what it calls, and an action. */
export function ServedModelEngineItem({
	engine,
	action,
}: ServedModelEngineItemProps): ReactElement {
	return (
		<li className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2">
			<div className="flex min-w-0 flex-col gap-0.5">
				<Button
					asChild
					variant="link"
					className="h-auto self-start whitespace-normal break-words p-0 text-left"
				>
					<RouterLink to={engineSettingsPath(engine.engineId)}>
						{engine.engineName}
					</RouterLink>
				</Button>
				<Muted className="break-all text-xs">
					{[
						engine.model ? `Model ${engine.model}` : null,
						engine.endpoint,
					]
						.filter(Boolean)
						.join(" at ")}
				</Muted>
			</div>
			{action}
		</li>
	);
}
