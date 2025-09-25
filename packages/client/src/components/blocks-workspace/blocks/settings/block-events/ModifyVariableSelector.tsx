import { useEffect } from "react";
import { Controller } from "react-hook-form";
import { Select, Stack, TextField } from "@semoss/ui";
import {useBlocks} from "@semoss/renderer";
import { toJS } from "mobx";

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
	// TODO: FIX this blockId assign, inconsistent behavior

	const { state } = useBlocks();
	const variables = toJS(state.variables);

	useEffect(() => {
		setValue("payload.blockId", id);
	}, [id]);

	const variableEntries: [string, any][] = Object.entries(variables || {});

	// Only allow variables of type string, number, array, date, or json
	const allowedTypes = ["string", "number", "array", "date", "JSON"];
	const filteredVariableEntries = variableEntries.filter(([key, variable]) => {
		const type = variable?.type;
		return allowedTypes.includes(type);
	});

	return (
		<Stack>
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
						{filteredVariableEntries.map(([key, variable]) => (
							<Select.Item key={key} value={key}>
								{key}
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
		</ Stack>
	);
};
