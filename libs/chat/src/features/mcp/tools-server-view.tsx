import { observer } from "mobx-react-lite";
import { ToolInspector } from "@/features/tool-inspector/tool-inspector";
import type { ToolStore } from "@/stores/tool/tool.store";

/** Read-only parameters, results, and metadata for provider-executed tools. */
export const ToolsServerView = observer(({ tool }: { tool: ToolStore }) => (
	<ToolInspector tool={tool} />
));
