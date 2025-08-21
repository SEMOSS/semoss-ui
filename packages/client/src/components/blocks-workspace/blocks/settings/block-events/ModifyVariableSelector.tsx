import { Controller } from "react-hook-form";
import { Select, TextField } from "@semoss/ui";
import { useEffect } from "react";

interface ModifyVariableSelectorProps {
	id: string;
	control: any;
	setValue: any;
}

export const ModifyVariableSelector = ({
	id,
	control,
	setValue,
}: ModifyVariableSelectorProps) => {
	useEffect(() => {
		setValue('payload.blockId', id)
	}, [id])
	
	return (
		<>
			Send hidden block id with event so it can parse iterator
			<Controller
				name="payload.variable"
				control={control}
				render={({ field }) => (
					<Select
						label="Variable"
						value={field.value || ""}
						onChange={(value) => {
							setValue("payload.variable", "");
							field.onChange(value);
						}}
					>
						{["variable 1", "Internal"].map((type, index) => (
							<Select.Item key={`${type}-${index}`} value={type}>
								{type}
							</Select.Item>
						))}
					</Select>
				)}
			/>
				<Controller
					name="payload.value"
					control={control}
					render={({ field }) => (
						<>
							<TextField 
								label={"Update Value"}
								onChange={(value) => {
									field.onChange(value);
								}}
							/>
						</>
					)}
				/>
		</>
	);
};
