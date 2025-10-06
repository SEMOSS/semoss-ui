import { Controller, useForm } from "react-hook-form";
import { Button, Stack, TextField } from "@semoss/ui";

/**
 * @deprecated
 */
export const CopyDatabaseForm = () => {
	const { control } = useForm();

	return (
		<form>
			<Stack rowGap={2}>
				<Controller
					name={"DATABASE_NAME"}
					control={control}
					rules={{ required: true }}
					render={({ field, fieldState }) => {
						const hasError = fieldState.error;
						return (
							<TextField
								fullWidth
								required
								label="Database Name"
								value={field.value ? field.value : ""}
								onChange={(value) => field.onChange(value)}
							></TextField>
						);
					}}
				/>
				<Controller
					name={"DATABASE_LOCATION"}
					control={control}
					rules={{ required: false }}
					render={({ field, fieldState }) => {
						const hasError = fieldState.error;
						return (
							<TextField
								fullWidth
								label="Database LOCATION"
								value={field.value ? field.value : ""}
								onChange={(value) => field.onChange(value)}
							></TextField>
						);
					}}
				/>
			</Stack>
		</form>
	);
};
