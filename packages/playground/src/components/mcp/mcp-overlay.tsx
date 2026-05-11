import type React from "react";
import { useEffect, useState } from "react";
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
} from "@semoss/ui/next";
import type { MCPConfig } from "@/types";
import { MCPSelector } from "./mcp-selector";

interface MCPOverlayProps {
	/** Open */
	open: boolean;

	/** Type of mcp */
	type: "TOOLBOX" | "KNOWLEDGE";

	/** Tools loaded into the room */
	values: MCPConfig[];

	/** Callback triggered when the tool model is closed */
	onClose: (mcp?: MCPConfig[]) => void;
}

export const MCPOverlay: React.FC<MCPOverlayProps> = (props) => {
	const { open, type, values, onClose } = props;
	const { t } = useTranslation("mcp");

	const [updated, setUpdated] = useState<MCPConfig[]>(values);

	// update when mcps change
	useEffect(() => {
		setUpdated(values);
	}, [values]);

	return (
		<Dialog open={open} onOpenChange={() => onClose()}>
			<DialogContent
				className="w-full sm:max-w-4xl"
				aria-describedby={
					type === "TOOLBOX"
						? t("overlay.editToolbox")
						: t("overlay.editKnowledge")
				}
				onOpenAutoFocus={(e) => e.preventDefault()}
				onCloseAutoFocus={(e) => e.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle>
						{type === "TOOLBOX"
							? t("overlay.editToolbox")
							: t("overlay.editKnowledge")}
					</DialogTitle>
					<DialogDescription>
						{type === "TOOLBOX"
							? t("overlay.toolboxDescription")
							: t("overlay.knowledgeDescription")}
					</DialogDescription>
				</DialogHeader>

				<form>
					<FieldGroup>
						<MCPSelector
							type={type}
							values={updated}
							onChange={(values) => setUpdated(values)}
						/>
					</FieldGroup>
				</form>
				<DialogFooter>
					<Button variant="ghost" onClick={() => onClose()}>
						{t("buttons.cancel")}
					</Button>
					<Button
						variant="default"
						onClick={() => {
							onClose(updated);
						}}
					>
						{t("buttons.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
