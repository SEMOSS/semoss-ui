import { ToolContent } from "./tool-content";

/** Bounded transcript location for the same tool content used by the dock. */
export function ToolInline({ toolId }: { toolId: string }) {
	return (
		<div className="h-80 min-h-64 overflow-hidden border-t sm:h-96">
			<ToolContent toolId={toolId} />
		</div>
	);
}
