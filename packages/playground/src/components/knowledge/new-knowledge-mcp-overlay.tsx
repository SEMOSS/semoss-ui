import { observer } from "mobx-react-lite";
import { useId, useState } from "react";
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

/**
 * Standalone Dialog wrapper around NewKnowledgeFormBody. Used by callers that
 * are not themselves inside a modal (e.g. WorkspaceForm). Callers that are
 * already inside a modal should host the form body directly to avoid stacking
 * Dialogs.
 */
export const NewKnowledgeOverlay: React.FC<NewKnowledgeMCPOverlayProps> =
	observer(({ open, onClose }) => {
		const { t } = useTranslation(["knowledge", "common"]);
		const formId = useId();
		const [isLoading, setIsLoading] = useState(false);

		return (
			<Dialog
				open={open}
				onOpenChange={(next) => {
					if (!next && !isLoading) {
						onClose();
					}
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
						formId={formId}
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
							type="submit"
							form={formId}
							variant="default"
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
