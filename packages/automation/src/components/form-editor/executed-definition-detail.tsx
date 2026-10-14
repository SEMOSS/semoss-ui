import { useState } from "react";
import { Button } from "@semoss/ui/next";
import type { AutomationExecutedDefinition } from "../../domain/automation.types";

/** Immutable automation definition captured for the run containing the start node. */
export function ExecutedDefinitionDetail({
	definition,
}: {
	definition: AutomationExecutedDefinition;
}) {
	const [showDefinition, setShowDefinition] = useState(false);

	if (!definition.hash && !definition.snapshot) return null;

	return (
		<div className="rounded-md border bg-muted/30 px-3 py-2 text-[11px]">
			<div className="flex items-center justify-between gap-3">
				<span className="text-muted-foreground">
					Executed definition
					{definition.version != null
						? ` v${definition.version}`
						: ""}
				</span>
				{definition.snapshot && (
					<Button
						size="sm"
						variant="ghost"
						className="h-7 px-2 text-[11px]"
						onClick={() => setShowDefinition((current) => !current)}
					>
						{showDefinition ? "Hide definition" : "View definition"}
					</Button>
				)}
			</div>
			{definition.hash && (
				<p className="mt-1 break-all font-mono text-muted-foreground">
					SHA-256: {definition.hash}
				</p>
			)}
			{showDefinition && definition.snapshot && (
				<pre className="mt-2 max-h-80 overflow-auto rounded-md bg-muted p-3 text-[10px] leading-relaxed">
					{definition.snapshot}
				</pre>
			)}
		</div>
	);
}
