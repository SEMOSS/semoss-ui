import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	FieldGroup,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import type { MCPConfig } from "@/types";
import { MCPSelector } from "./mcp-selector";
import { splitMcpByType } from "./utility";

type MCPType = "TOOLBOX" | "KNOWLEDGE";

interface MCPOverlayProps {
	/** Open */
	open: boolean;

	/** Which tab is active when the overlay opens */
	defaultTab: MCPType;

	/** Full MCP list (any types). The overlay splits these into the two tabs. */
	values: MCPConfig[];

	/**
	 * Fired when the overlay closes. Receives the next full MCP list when the
	 * user saves, or `undefined` when they cancel.
	 */
	onClose: (mcp?: MCPConfig[]) => void;
}

export const MCPOverlay: React.FC<MCPOverlayProps> = ({
	open,
	defaultTab,
	values,
	onClose,
}) => {
	const { t } = useTranslation("mcp");

	const [knowledge, setKnowledge] = useState<MCPConfig[]>(
		() => splitMcpByType(values).knowledge,
	);
	const [toolbox, setToolbox] = useState<MCPConfig[]>(
		() => splitMcpByType(values).toolbox,
	);
	const [activeTab, setActiveTab] = useState<MCPType>(defaultTab);

	// Reset drafts on the closed → open transition only. Mutations to `values`
	// or `defaultTab` while the dialog is already open would otherwise discard
	// the user's in-progress edits.
	const wasOpen = useRef(open);
	useEffect(() => {
		if (open && !wasOpen.current) {
			const next = splitMcpByType(values);
			setKnowledge(next.knowledge);
			setToolbox(next.toolbox);
			setActiveTab(defaultTab);
		}
		wasOpen.current = open;
	}, [open, values, defaultTab]);

	return (
		<Dialog open={open} onOpenChange={() => onClose()}>
			<DialogContent
				className="w-full sm:max-w-4xl"
				onOpenAutoFocus={(e) => e.preventDefault()}
				onCloseAutoFocus={(e) => e.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle>
						{activeTab === "TOOLBOX"
							? t("overlay.editToolbox")
							: t("overlay.editKnowledge")}
					</DialogTitle>
					<DialogDescription>
						{activeTab === "TOOLBOX"
							? t("overlay.toolboxDescription")
							: t("overlay.knowledgeDescription")}
					</DialogDescription>
				</DialogHeader>

				<Tabs
					value={activeTab}
					onValueChange={(v) => setActiveTab(v as MCPType)}
				>
					<TabsList>
						<TabsTrigger value="KNOWLEDGE">Knowledge</TabsTrigger>
						<TabsTrigger value="TOOLBOX">Toolbox</TabsTrigger>
					</TabsList>
					<TabsContent value="KNOWLEDGE">
						{activeTab === "KNOWLEDGE" && (
							<FieldGroup>
								<MCPSelector
									type="KNOWLEDGE"
									values={knowledge}
									onChange={setKnowledge}
								/>
							</FieldGroup>
						)}
					</TabsContent>
					<TabsContent value="TOOLBOX">
						{activeTab === "TOOLBOX" && (
							<FieldGroup>
								<MCPSelector
									type="TOOLBOX"
									values={toolbox}
									onChange={setToolbox}
								/>
							</FieldGroup>
						)}
					</TabsContent>
				</Tabs>

				<DialogFooter>
					<Button variant="ghost" onClick={() => onClose()}>
						{t("buttons.cancel")}
					</Button>
					<Button
						variant="default"
						onClick={() => onClose([...knowledge, ...toolbox])}
					>
						{t("buttons.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
