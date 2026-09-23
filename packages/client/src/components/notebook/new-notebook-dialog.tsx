import { Notebook } from "lucide-react";
import type React from "react";
import { useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActionMessages, useBlocks } from "@semoss/renderer";
import { useSession } from "@semoss/sdk/react";
import {
	Button,
	DialogDescription,
	DialogTitle,
	Input,
	Label,
} from "@semoss/ui/next";

type NewQueryForm = {
	ID: string;
};

interface NewNotebookDialogProps {
	/**
	 * Method called to close dialog
	 * @param newQueryId - new query id if successful
	 */
	onClose: (newQueryId?: string) => void;
}

/**
 * Edit or create a new query
 */
export const NewNotebookDialog = (
	props: NewNotebookDialogProps,
): React.JSX.Element => {
	const { onClose = () => null } = props;

	const { state } = useBlocks();
	const python = useSession((state) => state.config.data?.python) ?? false;
	const r = useSession((state) => state.config.data?.r) ?? false;
	const fieldId = useId();

	const {
		watch,
		control,
		handleSubmit,
		clearErrors,
		setError,
		formState: { errors },
	} = useForm<NewQueryForm>({
		defaultValues: {
			ID: "",
		},
	});

	const isFormValid = !!watch("ID");

	const onSubmit = handleSubmit((data: NewQueryForm) => {
		clearErrors();
		if (!data.ID) {
			setError("ID", {
				type: "manual",
				message: "Notebook Id is required",
			});
			return;
		}

		if (state.notebooks[data.ID] || state.blocks[data.ID]) {
			setError("ID", {
				type: "manual",
				message: `Notebook Id ${data.ID} already exists`,
			});
			return;
		}

		const defaultCells = [];
		if (python) {
			defaultCells.push({
				widget: "code",
				parameters: {
					code: "",
					type: "py",
				},
			});
		} else if (r) {
			defaultCells.push({
				widget: "code",
				parameters: {
					code: "",
					type: "r",
				},
			});
		} else {
			defaultCells.push({
				widget: "code",
				parameters: {
					code: "",
					type: "pixel",
				},
			});
		}

		state.dispatch({
			message: ActionMessages.NEW_NOTEBOOK,
			payload: {
				queryId: data.ID,
				config: {
					cells: defaultCells,
				},
			},
		});

		onClose(data.ID);
	});

	return (
		<>
			<div className="flex items-start gap-3 px-6 pt-6 pr-12 pb-2">
				<Notebook className="mt-1 size-5 shrink-0 text-foreground/70" />
				<div className="flex flex-col">
					<DialogTitle className="font-medium text-base leading-6">
						New Notebook
					</DialogTitle>
					<DialogDescription>
						Give your notebook a name to get started.
					</DialogDescription>
				</div>
			</div>
			<div className="px-6 py-2">
				<div className="mt-1 flex flex-col gap-1.5">
					<Controller
						name={"ID"}
						control={control}
						render={({ field }) => {
							return (
								<div className="flex flex-col gap-1">
									<Label htmlFor={fieldId}>
										Notebook Name
									</Label>
									<Input
										id={fieldId}
										value={field.value ?? ""}
										onChange={(e) => {
											clearErrors();
											field.onChange(e);
										}}
										aria-invalid={!!errors?.ID?.message}
									/>
									{errors?.ID?.message && (
										<span className="text-destructive text-xs">
											{errors.ID.message}
										</span>
									)}
								</div>
							);
						}}
					/>
				</div>
			</div>
			<div className="flex justify-end gap-2 px-6 pt-2 pb-6">
				<Button variant="outline" onClick={() => onClose()}>
					Cancel
				</Button>
				<Button
					disabled={!!errors?.ID?.message || !isFormValid}
					onClick={() => onSubmit()}
				>
					Create
				</Button>
			</div>
		</>
	);
};
