import { useState } from "react";
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
	open: boolean;
	type: VariableType;
	to: string;
	cellId?: string;
	onClose: () => void;
}

export const AddVariableModal = (props: AddVariableModalProps) => {
	const { open, type, to, cellId, onClose } = props;
	const { state } = useBlocks();

	const [newAlias, setNewAlias] = useState("");

	const hasError =
		Boolean(state.variables[newAlias]) || newAlias.includes(".");

	return (
		<Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add Variable</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-1 pt-2">
					<Label htmlFor="alias-input">Alias</Label>
					<Input
						id="alias-input"
						autoFocus
						aria-invalid={hasError}
						onChange={(e) => setNewAlias(e.target.value)}
						className={hasError ? "border-destructive" : ""}
					/>
					{hasError && (
						<p className="text-xs text-destructive">
							{newAlias.includes(".")
								? "Periods aren't acceptable characters"
								: "Please provide a unique alias"}
						</p>
					)}
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onClose()}>Cancel</Button>
					<Button
						variant="default"
						disabled={
							!newAlias ||
							Boolean(state.variables[newAlias]) ||
							newAlias.includes(".")
						}
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
								onClose();
							} else {
								toast.error(`Unable to add ${newAlias}, due to syntax or a duplicated alias`);
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
