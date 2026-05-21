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
	Spinner,
} from "@semoss/ui/next";
import { NewKnowledgeFormBody } from "@/components";
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

const FORM_ID = "mcp-overlay-new-knowledge-form";

type View = "list" | "create";

export const MCPOverlay: React.FC<MCPOverlayProps> = (props) => {
	const { open, type, values, onClose } = props;
	const { t } = useTranslation(["mcp", "knowledge", "common"]);

	const [updated, setUpdated] = useState<MCPConfig[]>(values);
	const [view, setView] = useState<View>("list");
	const [createIsLoading, setCreateIsLoading] = useState(false);

	// update when mcps change
	useEffect(() => {
		setUpdated(values);
	}, [values]);

	// reset to list view when the overlay is opened/closed
	useEffect(() => {
		if (!open) {
			setView("list");
			setCreateIsLoading(false);
		}
	}, [open]);

	const isCreate = view === "create";

	return (
		<Dialog
			open={open}
			onOpenChange={() => {
				if (createIsLoading) return;
				onClose();
			}}
		>
			<DialogContent
				className="flex h-[68vh] w-full flex-col overflow-hidden sm:max-w-[58rem]"
				aria-describedby={
					isCreate
						? t("knowledge:newSource.title")
						: type === "TOOLBOX"
							? t("mcp:overlay.editToolbox")
							: t("mcp:overlay.editKnowledge")
				}
				onOpenAutoFocus={(e) => e.preventDefault()}
				onCloseAutoFocus={(e) => e.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle>
						{isCreate
							? t("knowledge:newSource.title")
							: type === "TOOLBOX"
								? t("mcp:overlay.editToolbox")
								: t("mcp:overlay.editKnowledge")}
					</DialogTitle>
					<DialogDescription>
						{isCreate
							? t("knowledge:newSource.description")
							: type === "TOOLBOX"
								? t("mcp:overlay.toolboxDescription")
								: t("mcp:overlay.knowledgeDescription")}
					</DialogDescription>
				</DialogHeader>

				{isCreate ? (
					<div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
						<NewKnowledgeFormBody
							formId={FORM_ID}
							onLoadingChange={setCreateIsLoading}
							onSuccess={(knowledge) => {
								setUpdated((prev) => [...prev, knowledge]);
								setView("list");
							}}
						/>
					</div>
				) : (
					<form className="flex min-h-0 flex-1 flex-col overflow-hidden">
						<FieldGroup className="flex min-h-0 flex-1 flex-col">
							<MCPSelector
								type={type}
								values={updated}
								onChange={(values) => setUpdated(values)}
								onRequestCreateKnowledge={
									type === "KNOWLEDGE"
										? () => setView("create")
										: undefined
								}
							/>
						</FieldGroup>
					</form>
				)}

				<DialogFooter>
					{isCreate ? (
						<>
							<Button
								variant="ghost"
								disabled={createIsLoading}
								onClick={() => setView("list")}
							>
								{t("common:buttons.back")}
							</Button>
							<Button
								variant="default"
								type="submit"
								form={FORM_ID}
								disabled={createIsLoading}
							>
								{createIsLoading ? (
									<Spinner />
								) : (
									t("common:buttons.create")
								)}
							</Button>
						</>
					) : (
						<>
							<Button variant="ghost" onClick={() => onClose()}>
								{t("mcp:buttons.cancel")}
							</Button>
							<Button
								variant="default"
								onClick={() => {
									onClose(updated);
								}}
							>
								{t("mcp:buttons.save")}
							</Button>
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
