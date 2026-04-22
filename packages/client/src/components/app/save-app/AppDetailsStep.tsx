import { useId } from "react";
import { type Control, Controller } from "react-hook-form";
import { Input, Label, Textarea } from "@semoss/ui/next";
import {
	ADD_APP_FORM_FIELD_DESCRIPTION,
	ADD_APP_FORM_FIELD_NAME,
} from "./save-app.constants";

export const AppDetailsStep = (props: {
	// biome-ignore lint/suspicious/noExplicitAny: react-hook-form generic
	control: Control<any, any>;
	showNameField?: boolean;
}) => {
	const { control, showNameField = false } = props;
	const nameId = useId();
	const descId = useId();
	return (
		<div className="flex flex-col gap-3">
			{showNameField && (
				<Controller
					name={ADD_APP_FORM_FIELD_NAME}
					control={control}
					rules={{ required: true }}
					render={({ field }) => (
						<div className="flex flex-col gap-1.5">
							<Label htmlFor={nameId}>Name</Label>
							<Input
								id={nameId}
								value={field.value ?? ""}
								onChange={(e) => field.onChange(e.target.value)}
							/>
						</div>
					)}
				/>
			)}
			<Controller
				name={ADD_APP_FORM_FIELD_DESCRIPTION}
				control={control}
				render={({ field }) => (
					<div className="flex flex-col gap-1.5">
						<Label htmlFor={descId}>Description</Label>
						<Textarea
							id={descId}
							value={field.value ?? ""}
							onChange={(e) => field.onChange(e.target.value)}
							rows={3}
						/>
					</div>
				)}
			/>
		</div>
	);
};
