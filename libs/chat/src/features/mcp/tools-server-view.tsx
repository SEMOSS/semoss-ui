import { observer } from "mobx-react-lite";
import type { ToolStore } from "../messages/tool.store";
import { ToolInspector } from "../tool-inspector/tool-inspector";

/** Read-only parameters, results, and metadata for provider-executed tools. */
export const ToolsServerView = observer(({ tool }: { tool: ToolStore }) => (
	<ToolInspector tool={tool} />
));
