import { BookOpenIcon, HammerIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { Badge, DropdownMenuItem } from "@semoss/ui/next";
import { MCPOverlay } from "@/components";
import type { RoomStore } from "@/stores";
import type { MCPConfig } from "@/types";

interface RoomInputMenuMCPProps {
	/** Type of MCP to manage */
	type: "KNOWLEDGE" | "TOOLBOX";

	/** Options */
	options: RoomStore["options"];

	/** Callback when an MCP is selected/deselected */
	onSelect: (mcp: MCPConfig) => void;

	/** Callback when the overlay closes */
	onOverlayClose?: () => void;
}

const RoomInputMenuMCPInner: React.FC<RoomInputMenuMCPProps> = ({
	type,
	options,
	onSelect,
	onOverlayClose,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const { t } = useTranslation("room");

	// Filter MCPs based on type
	const items =
		type === "KNOWLEDGE"
			? options.mcp.filter((mcp) => mcp.type === "VECTOR")
			: options.mcp.filter((mcp) => mcp.type !== "VECTOR");

	// Select icon and labels based on type
	const Icon = type === "KNOWLEDGE" ? BookOpenIcon : HammerIcon;
	const labelKey =
		type === "KNOWLEDGE"
			? "menuKnowledge.addKnowledge"
			: "menuToolbox.addToolbox";

	return (
		<>
			<DropdownMenuItem
				onSelect={(e) => {
					e.preventDefault();
					setIsOpen(true);
				}}
			>
				<Icon />
				<span className="flex-1">{t(labelKey)}</span>
				<Badge variant="outline">{items.length}</Badge>
			</DropdownMenuItem>

			<MCPOverlay
				open={isOpen}
				type={type}
				values={items}
				onClose={(updatedMcp) => {
					setIsOpen(false);
					onOverlayClose?.();
					if (updatedMcp) {
						// Calculate changes and call onSelect for each
						const oldIds = new Set(items.map((item) => item.id));
						const newIds = new Set(
							updatedMcp.map((item) => item.id),
						);

						// Add new items
						for (const mcp of updatedMcp) {
							if (!oldIds.has(mcp.id)) {
								onSelect(mcp);
							}
						}

						// Remove deleted items
						for (const mcp of items) {
							if (!newIds.has(mcp.id)) {
								onSelect(mcp);
							}
						}
					}
				}}
			/>
		</>
	);
};

export const RoomInputMenuMCP = observer(RoomInputMenuMCPInner);
