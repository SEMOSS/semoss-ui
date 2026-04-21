import { useId, useState } from "react";
import { ActionMessages, useBlocks, type VariableType } from "@semoss/renderer";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	toast,
} from "@semoss/ui/next";

export interface AddVariableModalProps {
	/**
	 * Open modal
	 */
	open: boolean;

	/**
	 * What type of variable
	 */
	type: VariableType;

	/**
	 * reference pointer
	 */
	to: string;

	/**
	 * If its a cell we need extra meta
	 */
	cellId?: string;

	/**
	 * Closes Modal
	 */
	onClose: () => void;
}

export const AddVariableModal = (props: AddVariableModalProps) => {
	const { open, type, to, cellId, onClose } = props;
	const { state } = useBlocks();

	const aliasId = useId();
	const [newAlias, setNewAlias] = useState("");

	const hasError =
		Boolean(state.variables[newAlias]) || newAlias.includes(".");

	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>Add Variable</DialogTitle>
				</DialogHeader>
				<div className="add-variable-modal__content flex flex-col gap-1.5 pt-1">
					<Label htmlFor={aliasId}>Alias</Label>
					<Input
						id={aliasId}
						autoFocus
						aria-invalid={hasError}
						onChange={(e) => setNewAlias(e.target.value)}
					/>
					{hasError && (
						<span className="text-destructive text-xs">
							{newAlias.includes(".")
								? "Periods aren't acceptable characters"
								: "Please provide a unique alias"}
						</span>
					)}
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onClose()}>
						Cancel
					</Button>
					<Button
						disabled={!newAlias || hasError}
						onClick={() => {
							const success = state.dispatch({
								message: ActionMessages.ADD_VARIABLE,
								payload: {
									id: newAlias,
									to: to,
									cellId: cellId,
									type: type,
								},
							});

							if (success) {
								toast.success(`Successfully added ${newAlias}`);
							} else {
								toast.error(
									`Unable to add ${newAlias}, due to syntax or a duplicated alias`,
								);
							}

							if (success) {
								onClose();
							}
						}}
					>
						Add
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
