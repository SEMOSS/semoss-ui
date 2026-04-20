import { observer } from "mobx-react-lite";
import type React from "react";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActionMessages, useBlocks } from "@semoss/renderer";
import { Button, Input, Label } from "@semoss/ui/next";
import { useRootStore } from "@/hooks";

type NewQueryForm = {
	ID: string;
};

interface NewQueryOverlayProps {
	/**
	 * Method called to close overlay
	 * @param newQueryId - new query id if successful
	 */
	onClose: (newQueryId?: string) => void;
}

/**
 * Edit or create a new query
 */
export const NewQueryOverlay = observer(
	(props: NewQueryOverlayProps): React.JSX.Element => {
		const { onClose = () => null } = props;

		const { state } = useBlocks();
		const { configStore } = useRootStore();

		// create a new form
		const {
			getValues,
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

		const watchAll = watch();

		const isFormValid = useMemo(() => {
			return !!getValues("ID");
		}, [watchAll]);

		/**
		 * Allow the user to login
		 */
		const onSubmit = handleSubmit((data: NewQueryForm) => {
			clearErrors();
			if (!data.ID) {
				setError("ID", {
					type: "manual",
					message: `Notebook Id is required`,
				});
				return;
			}

			// validate the name if it is new
			if (state.queries[data.ID] || state.blocks[data.ID]) {
				setError("ID", {
					type: "manual",
					message: `Notebook Id ${data.ID} already exists`,
				});
				return;
			}

			// create the default based on what is there
			const defaultCells = [];
			if (configStore.store.config.python) {
				defaultCells.push({
					widget: "code",
					parameters: {
						code: "",
						type: "py",
					},
				});
			} else if (configStore.store.config.r) {
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
				message: ActionMessages.NEW_QUERY,
				payload: {
					queryId: data.ID,
					config: {
						cells: defaultCells,
					},
				},
			});

			// close the overlay
			onClose(data.ID);
		});

		return (
			<>
				<div className="px-6 py-4 text-lg font-semibold">New Query</div>
				<div className="px-6 py-2">
					<div className="mt-2">
						<Controller
							name={"ID"}
							control={control}
							render={({ field }) => {
								return (
									<div className="flex flex-col gap-1">
										<Label htmlFor="query-id-input">Id</Label>
										<Input
											id="query-id-input"
											aria-invalid={!!errors?.ID?.message}
											value={field.value ? field.value : ""}
											onChange={(value) => {
												clearErrors();
												field.onChange(value);
											}}
											className={errors?.ID?.message ? "border-destructive" : ""}
										/>
										{errors?.ID?.message && (
											<p className="text-xs text-destructive">{errors.ID.message}</p>
										)}
									</div>
								);
							}}
						/>
					</div>
				</div>
				<div className="flex flex-row justify-end gap-2 px-4 pb-4">
					<Button
						variant="ghost"
						onClick={() => onClose()}
					>
						Cancel
					</Button>
					<Button
						variant="default"
						disabled={!!errors?.ID?.message || !isFormValid}
						onClick={() => onSubmit()}
					>
						Submit
					</Button>
				</div>
			</>
		);
	},
);
