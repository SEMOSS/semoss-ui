import type React from "react";
import { useEffect, useState } from "react";
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
					type === "TOOLBOX" ? "Edit Toolbox" : "Edit Knowledge"
				}
			>
				<DialogHeader>
					<DialogTitle>
						{type === "TOOLBOX" ? "Edit Toolbox" : "Edit Knowledge"}
					</DialogTitle>
					<DialogDescription>
						{type === "TOOLBOX"
							? "Add capabilities to your agent and extend what it can do"
							: "Edit the knowledge sources your agent can access"}
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
						Cancel
					</Button>
					<Button
						variant="default"
						onClick={() => {
							onClose(updated);
						}}
					>
						Save
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
