import { useId, useState } from "react";
import { NewKnowledgeForm } from "@semoss/chat";
import { useTranslation } from "@semoss/i18n";
import type { MCPConfig } from "@semoss/shared";
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

/** Props for {@link NewKnowledgeOverlay}. */
interface NewKnowledgeOverlayProps {
	/** Whether the dialog is open. */
	open: boolean;

	/**
	 * Called when the dialog closes: with the new knowledge source once it is
	 * created, or with nothing when the user cancels.
	 */
	onClose: (knowledge?: MCPConfig) => void;
}

/**
 * A dialog around the chat's `NewKnowledgeForm`, for the knowledge pages,
 * which are not themselves inside a modal. A caller already inside a modal
 * should host the form directly rather than stack dialogs. The dialog cannot
 * close while the form is creating the source.
 */
export const NewKnowledgeOverlay: React.FC<NewKnowledgeOverlayProps> = ({
	open,
	onClose,
}) => {
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
			<DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>{t("knowledge:newSource.title")}</DialogTitle>
					<DialogDescription>
						{t("knowledge:newSource.description")}
					</DialogDescription>
				</DialogHeader>

				<NewKnowledgeForm
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
						{isLoading ? <Spinner /> : t("common:buttons.create")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
