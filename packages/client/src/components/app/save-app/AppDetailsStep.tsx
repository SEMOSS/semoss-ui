import { type Control, Controller } from "react-hook-form";
import { TextArea, TextField } from "@semoss/ui";
import {
	ADD_APP_FORM_FIELD_DESCRIPTION,
	ADD_APP_FORM_FIELD_NAME,
} from "./save-app.constants";

export const AppDetailsStep = (props: { control: Control<any, any>; showNameField?: boolean; }) => {
	const { control, showNameField = false } = props;
	return (
		<>
			{showNameField && (
                <Controller
                    name={ADD_APP_FORM_FIELD_NAME}
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => {
                        return (
                            <TextField
                                label="Name"
                                variant="outlined"
                                value={field.value ? field.value : ""}
                                onChange={(value) => field.onChange(value)}
                            />
                        );
                    }}
                />
            )}

			<Controller
				name={ADD_APP_FORM_FIELD_DESCRIPTION}
				control={control}
				rules={{ required: true }}
				render={({ field }) => {
					return (
						<TextArea
							label="Description"
							variant="outlined"
							value={field.value ? field.value : ""}
							onChange={(value) => field.onChange(value)}
							rows={3}
						/>
					);
				}}
			/>
		</>
	);
};
