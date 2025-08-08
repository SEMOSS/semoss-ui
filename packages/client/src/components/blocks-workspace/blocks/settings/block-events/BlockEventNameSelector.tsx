import { Controller } from "react-hook-form";
import { TextField } from "@semoss/ui";

interface BlockEventNameSelectorProps {
	control: any;
}

export const BlockEventNameSelector = ({
	control,
}: BlockEventNameSelectorProps) => {
	return (
		<Controller
			name="payload.name"
			control={control}
			render={({ field }) => (
				<TextField
					label="Name"
					value={field.value || ""}
					onChange={field.onChange}
				/>
			)}
		/>
	);
};
