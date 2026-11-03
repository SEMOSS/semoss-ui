import { ToolViewProvider } from "@semoss/shared";
import { TOOL_VIEW_LIBRARIES } from "../views/tool-view-libraries";
import { ToolContentBody } from "./tool-content-body";

/** Inline and docked calls share the same registered native tool views. */
export function ToolContent({ toolId }: { toolId: string }) {
	return (
		<ToolViewProvider libraries={TOOL_VIEW_LIBRARIES}>
			<ToolContentBody key={toolId} toolId={toolId} />
		</ToolViewProvider>
	);
}
