import type { ToolCallStore } from "@semoss/sdk";
import { ToolInspector } from "../../features/tool-inspector/tool-inspector";

/** Read-only parameters, results, and metadata for provider-executed tools. */
export const ToolsServerView = ({ tool }: { tool: ToolCallStore }) => (
	<ToolInspector tool={tool} />
);
