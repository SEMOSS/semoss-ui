import type { ChangeEvent } from "react";
import {
	type Control,
	Controller,
	type UseFormSetValue,
} from "react-hook-form";
import { ACTIONS_DISPLAY, ActionMessages } from "@semoss/renderer";
import { Select } from "@semoss/ui";
import { getDefaultFormValues } from "./utils";

interface ActionTypeSelectorProps {
	control: Control<any>;
	setValue: UseFormSetValue<any>;
}

export const ActionTypeSelector = ({
	control,
	setValue,
}: ActionTypeSelectorProps) => {
	return (
		<Controller
			name="message"
			control={control}
			render={({ field }) => (
				<Select
					label="Type"
					value={field.value || ""}
					onChange={(value: ChangeEvent<HTMLInputElement>) => {
						const newMessage = value.target.value as ActionMessages;
						const defaultValues = getDefaultFormValues(newMessage);
						setValue("payload", defaultValues.payload);
						field.onChange(value);
					}}
				>
					{[
						ActionMessages.RUN_QUERY,
						ActionMessages.RUN_CELL,
						ActionMessages.DISPATCH_EVENT,
						ActionMessages.DISPATCH_OUTPUTS_EVENT,
						ActionMessages.DISPATCH_OPEN_EVENT,
						ActionMessages.COPY_TO_CLIPBOARD,
					].map((action, index) => (
						<Select.Item key={index} value={action}>
							{ACTIONS_DISPLAY[action]}
						</Select.Item>
					))}
				</Select>
			)}
		/>
	);
};
