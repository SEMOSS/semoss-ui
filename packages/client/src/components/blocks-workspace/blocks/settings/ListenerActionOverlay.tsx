import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	ACTIONS_DISPLAY,
	ActionMessages,
	type BlockDef,
	type ListenerActions,
} from "@semoss/renderer";
import { Button, Modal, Select, Stack, styled } from "@semoss/ui";
import { useBlockSettings } from "@/hooks";
import {
	BlockEventNameSelector,
	CellIdSelector,
	getDefaultFormValues,
	QueryIdSelector,
	RedirectDestinationSelector,
	useEventActionData,
	validateForm,
} from "./block-events";
import { ModifyVariableSelector } from "./block-events/ModifyVariableSelector";

const StyledSpacer = styled("div")(() => ({
	flex: 1,
}));

interface ActionOverlayProps<D extends BlockDef = BlockDef> {
	id: string;
	type: "sync" | "async";
	listener: Extract<keyof D["listeners"], string>;
	actionIdx: number;
	onClose: () => void;
}

type ListenerActionForm = ListenerActions;

export const ListenerActionOverlay = observer(
	<D extends BlockDef = BlockDef>(props: ActionOverlayProps<D>) => {
		const { id, type, listener, actionIdx = -1, onClose } = props;
		const { listeners, setListener } = useBlockSettings(id);

		const isNewAction = actionIdx === -1;
		const existingAction =
			actionIdx !== -1 ? listeners[listener].order[actionIdx] : null;

		// Form setup
		const defaultValues = existingAction
			? getDefaultFormValues(existingAction.message)
			: getDefaultFormValues(ActionMessages.RUN_QUERY);

		const { control, handleSubmit, reset, watch, setValue } =
			useForm<ListenerActionForm>({
				defaultValues,
			});

		const message = watch("message");
		const payload = watch("payload");
		const queryId = watch("payload.queryId");
		const destinationType = watch("payload.destinationType");

		// Data fetching
		const { queries, cells, pages } = useEventActionData(queryId);

		// Form validation
		const isFormValid = validateForm(message, payload);

		// Reset form when action index changes
		useEffect(() => {
			const formData =
				existingAction ||
				getDefaultFormValues(ActionMessages.RUN_QUERY);
			reset(formData);
		}, [actionIdx, existingAction, reset]);

		// Reset payload when message type changes
		useEffect(() => {
			if (existingAction?.message !== message) {
				const newDefaults = getDefaultFormValues(message);
				setValue("payload", newDefaults.payload);
			}
		}, [message, existingAction, setValue]);

		const handleFormSubmit = handleSubmit(
			(formData: ListenerActionForm) => {
				const updatedActions = listeners[listener].order
					? [...listeners[listener].order]
					: [];

				if (isNewAction) {
					updatedActions.push(formData);
				} else {
					updatedActions[actionIdx] = formData;
				}

				setListener(listener, updatedActions, type);
				onClose();
			},
		);

		return (
			<>
				<Modal.Title>
					{`${isNewAction ? "Add" : "Edit"} ${listener}`}
				</Modal.Title>

				<Modal.Content>
					<Stack padding={2}>
						<Controller
							name="message"
							control={control}
							render={({ field }) => (
								<Select
									label="Type"
									value={field.value || ""}
									onChange={(
										value: React.ChangeEvent<HTMLInputElement>,
									) => {
										const newMessage = value.target
											.value as ActionMessages;
										const defaultValues =
											getDefaultFormValues(newMessage);
										setValue(
											"payload",
											defaultValues.payload,
										);
										field.onChange(value);
									}}
								>
									{[
										ActionMessages.RUN_QUERY,
										ActionMessages.RUN_CELL,
										ActionMessages.DISPATCH_EVENT,
										ActionMessages.DISPATCH_OPEN_EVENT,
										ActionMessages.MODIFY_VARIABLE,
									].map((action) => (
										<Select.Item
											key={action}
											value={action}
										>
											{ACTIONS_DISPLAY[action]}
										</Select.Item>
									))}
								</Select>
							)}
						/>
						{message === ActionMessages.RUN_QUERY && (
							<QueryIdSelector
								control={control}
								queries={queries}
							/>
						)}
						{message === ActionMessages.RUN_CELL && (
							<>
								<QueryIdSelector
									control={control}
									queries={queries}
									label="Notebook"
								/>
								<CellIdSelector
									control={control}
									cells={cells}
									queryId={queryId}
								/>
							</>
						)}
						{message === ActionMessages.DISPATCH_EVENT && (
							<BlockEventNameSelector control={control} />
						)}
						{message === ActionMessages.DISPATCH_OPEN_EVENT && (
							<RedirectDestinationSelector
								control={control}
								setValue={setValue}
								destinationType={destinationType}
								pages={pages}
							/>
						)}
						{message === ActionMessages.MODIFY_VARIABLE && (
							<ModifyVariableSelector
								id={id}
								control={control}
								setValue={setValue}
							/>
						)}
					</Stack>
				</Modal.Content>

				<Modal.Actions>
					<StyledSpacer />
					<Button type="button" variant="text" onClick={onClose}>
						Cancel
					</Button>
					<Button onClick={handleFormSubmit} disabled={!isFormValid}>
						Save
					</Button>
				</Modal.Actions>
			</>
		);
	},
);
