import { useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	toast,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";

interface PromptDeleteModalProps {
	isOpen: boolean;
	onClose(): void;
	promptId: string;
	onDelete?: () => void;
}

export const PromptDeleteModal = (props: PromptDeleteModalProps) => {
	const { isOpen, onClose, promptId, onDelete } = props;

	const { monolithStore } = useRootStore();

	const [loading, setLoading] = useState(false);

	const deletePrompt = async () => {
		try {
			setLoading(true);

			const response = await monolithStore.runQuery(
				`DeletePrompt(promptId='${promptId}');`,
			);

			const operationType = response.pixelReturn[0].operationType;
			const output = response.pixelReturn[0].output;

			if (operationType.indexOf("ERROR") === -1) {
				toast.success("Successfully deleted");
				onDelete?.();
			} else {
				toast.error(String(output));
			}
		} catch (e) {
			toast.error(String(e));
		} finally {
			setLoading(false);
			onClose();
		}
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent className="sm:max-w-[425px]" showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>Are you sure?</DialogTitle>
					<DialogDescription>
						This action is irreversible. This will permanently
						delete this prompt.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						variant="outline"
						disabled={loading}
						onClick={() => onClose()}
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						disabled={loading}
						onClick={() => deletePrompt()}
					>
						Delete
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
