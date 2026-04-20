import { type Control, Controller } from "react-hook-form";
import type { ListenerActions } from "@semoss/renderer";
import { Input } from "@semoss/ui/next";

interface BlockEventNameSelectorProps {
	control: Control<ListenerActions>;
}

export const BlockEventNameSelector = ({
	control,
}: BlockEventNameSelectorProps) => {
	return (
		<Controller
			name="payload.name"
			control={control}
			render={({ field }) => (
				<Input
					placeholder="Name"
					value={field.value || ""}
					onChange={field.onChange}
				/>
			)}
		/>
	);
};
