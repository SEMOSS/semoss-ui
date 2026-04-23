import { type Control, Controller } from "react-hook-form";
import { Switch } from "@semoss/ui/next";
import { ADD_APP_FORM_FIELD_IS_GLOBAL } from "./save-app.constants";

export const AppAccessStep = (props: {
	// biome-ignore lint/suspicious/noExplicitAny: react-hook-form generic
	control: Control<any, any>;
	disabled: boolean;
}) => {
	return (
		<Controller
			name={ADD_APP_FORM_FIELD_IS_GLOBAL}
			control={props.control}
			rules={{}}
			render={({ field }) => {
				return (
					<div className="mb-2 flex items-center justify-start">
						<Switch
							disabled={props.disabled}
							checked={field.value}
							onCheckedChange={(checked) => {
								field.onChange(checked);
							}}
						/>
						<div className="ml-3 flex flex-col">
							<span className="font-medium text-sm">
								Make Public
							</span>
							<span className="text-muted-foreground text-sm">
								Show app to all users and automatically give
								them read-only access. Users can request
								elevated access.
							</span>
						</div>
					</div>
				);
			}}
		/>
	);
};
