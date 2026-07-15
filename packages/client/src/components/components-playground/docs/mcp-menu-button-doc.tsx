import { useState } from "react";
import type { MCPConfig } from "@semoss/chat";
import { McpMenuButton } from "@semoss/chat/components";
import { DemoSection } from "../demo-section";
import { DocPage } from "../doc-page";
import { type PropDoc, PropsTable } from "../props-table";

const PROPS: PropDoc[] = [
	{
		name: "mcp",
		type: "MCPConfig[]",
		required: true,
		description:
			"Full list (both Knowledge and Toolbox types) currently attached.",
	},
	{
		name: "onChange",
		type: "(mcp: MCPConfig[]) => void",
		required: true,
		description:
			"Fired with the combined next list once the user saves the overlay.",
	},
	{ name: "disabled", type: "boolean", description: "" },
];

export const McpMenuButtonDoc = () => {
	const [mcp, setMcp] = useState<MCPConfig[]>([]);

	return (
		<DocPage
			title="McpMenuButton"
			description="The composer's '+' trigger for knowledge/toolbox attachment — a small dropdown with live counts, opening McpOverlay on the right tab. Composed into ChatInput's trailingActions, same pattern as EngineSelect/PromptOptimizer. Fetches real Knowledge/Toolbox options from your workspace."
		>
			<DemoSection
				preview={<McpMenuButton mcp={mcp} onChange={setMcp} />}
				code={`import { McpMenuButton } from "@semoss/chat/components";
import { useChatContext } from "@semoss/chat";

// Inside a <ChatProvider options={{ engineId, roomId }}>
const { mcp, setMcp } = useChatContext();

<McpMenuButton mcp={mcp} onChange={setMcp} />`}
			/>
			<PropsTable props={PROPS} />
		</DocPage>
	);
};
