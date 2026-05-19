import { BookOpenIcon, HammerIcon } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Badge,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
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
				className="flex h-[80vh] max-h-[40rem] w-full flex-col gap-4 sm:max-w-4xl"
				onOpenAutoFocus={(e) => e.preventDefault()}
				onCloseAutoFocus={(e) => e.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle>{t("overlay.title")}</DialogTitle>
					<DialogDescription>
						{t("overlay.description")}
					</DialogDescription>
				</DialogHeader>

				<Tabs
					value={activeTab}
					onValueChange={(v) => setActiveTab(v as MCPType)}
					className="flex min-h-0 flex-1 flex-col gap-3"
				>
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="KNOWLEDGE" className="gap-2">
							<BookOpenIcon className="size-4" />
							{t("overlay.tabKnowledge")}
							<Badge variant="outline" className="ml-1">
								{knowledge.length}
							</Badge>
						</TabsTrigger>
						<TabsTrigger value="TOOLBOX" className="gap-2">
							<HammerIcon className="size-4" />
							{t("overlay.tabToolbox")}
							<Badge variant="outline" className="ml-1">
								{toolbox.length}
							</Badge>
						</TabsTrigger>
					</TabsList>
					<TabsContent
						value="KNOWLEDGE"
						className="flex min-h-0 flex-1 flex-col"
					>
						{activeTab === "KNOWLEDGE" && (
							<MCPSelector
								type="KNOWLEDGE"
								values={knowledge}
								onChange={setKnowledge}
							/>
						)}
					</TabsContent>
					<TabsContent
						value="TOOLBOX"
						className="flex min-h-0 flex-1 flex-col"
					>
						{activeTab === "TOOLBOX" && (
							<MCPSelector
								type="TOOLBOX"
								values={toolbox}
								onChange={setToolbox}
							/>
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
