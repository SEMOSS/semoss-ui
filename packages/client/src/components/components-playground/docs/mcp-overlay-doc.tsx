import { useState } from "react";
import type { MCPConfig } from "@semoss/chat";
import { McpOverlay } from "@semoss/chat/components";
import { Button } from "@semoss/ui/next";
import { DemoSection } from "../demo-section";
import { DocPage } from "../doc-page";
import { type PropDoc, PropsTable } from "../props-table";

const PROPS: PropDoc[] = [
	{ name: "open", type: "boolean", required: true, description: "" },
	{
		name: "defaultTab",
		type: `"KNOWLEDGE" | "TOOLBOX"`,
		required: true,
		description: "",
	},
	{
		name: "values",
		type: "MCPConfig[]",
		required: true,
		description:
			"Current attachment list, split into Knowledge/Toolbox tabs on open.",
	},
	{
		name: "onSave",
		type: "(mcp: MCPConfig[]) => void",
		required: true,
		description: "Fired with the combined draft from both tabs.",
	},
	{
		name: "onOpenChange",
		type: "(open: boolean) => void",
		required: true,
		description: "",
	},
];

export const McpOverlayDoc = () => {
	const [open, setOpen] = useState(false);
	const [mcp, setMcp] = useState<MCPConfig[]>([]);

	return (
		<DocPage
			title="McpOverlay"
			description="A Dialog + Tabs (Knowledge | Toolbox) rendering @semoss/chat's own MCPSelector per tab — pure-props like PromptLibraryDialog, since MCPSelector already owns its own fetching. McpMenuButton is the composer trigger built on top of this; use McpOverlay directly for a custom trigger."
		>
			<DemoSection
				preview={
					<>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => setOpen(true)}
						>
							Open knowledge & tools
						</Button>
						<McpOverlay
							open={open}
							defaultTab="KNOWLEDGE"
							values={mcp}
							onSave={setMcp}
							onOpenChange={setOpen}
						/>
					</>
				}
				code={`import { McpOverlay } from "@semoss/chat/components";

<McpOverlay
  open={open}
  defaultTab="KNOWLEDGE"
  values={mcp}
  onSave={setMcp}
  onOpenChange={setOpen}
/>`}
			/>
			<PropsTable props={PROPS} />
		</DocPage>
	);
};
