import { observer } from "mobx-react-lite";
import type React from "react";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Spinner,
} from "@semoss/ui/next";
import type { MCPConfig } from "@/types";
import { NewKnowledgeFormBody } from "./new-knowledge-form-body";

interface NewKnowledgeMCPOverlayProps {
	/** Open */
	open: boolean;

	/** Callback triggered when the tool model is closed */
	onClose: (knowledge?: MCPConfig) => void;
}

const FORM_ID = "new-knowledge-mcp-form";

export const NewKnowledgeOverlay: React.FC<NewKnowledgeMCPOverlayProps> =
	observer((props) => {
		const { open, onClose } = props;
		const { t } = useTranslation(["knowledge", "common"]);

		const [isLoading, setIsLoading] = useState(false);

		return (
			<Dialog
				open={open}
				onOpenChange={() => {
					if (isLoading) return;
					onClose();
				}}
			>
				<DialogContent
					className="w-full sm:max-w-4xl"
					aria-describedby={t("knowledge:newSource.title")}
				>
					<DialogHeader>
						<DialogTitle>
							{t("knowledge:newSource.title")}
						</DialogTitle>
						<DialogDescription>
							{t("knowledge:newSource.description")}
						</DialogDescription>
					</DialogHeader>

					<NewKnowledgeFormBody
						formId={FORM_ID}
						onSuccess={(knowledge) => onClose(knowledge)}
						onLoadingChange={setIsLoading}
					/>

					<DialogFooter>
						<Button
							variant="ghost"
							disabled={isLoading}
							onClick={() => onClose()}
						>
							{t("common:buttons.cancel")}
						</Button>
						<Button
							variant="default"
							type="submit"
							form={FORM_ID}
							disabled={isLoading}
						>
							{isLoading ? (
								<Spinner />
							) : (
								t("common:buttons.create")
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	});
