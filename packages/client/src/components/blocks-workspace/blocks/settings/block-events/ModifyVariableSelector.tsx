import { useEffect } from "react";
import { Controller } from "react-hook-form";
import { Select, TextField } from "@semoss/ui";
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

	let variableEntries: [string, any][] = [];
	if (Array.isArray(variables)) {
		variableEntries = variables.map((v, idx) => [v.id || v.name || `${idx}`, v]);
	} else if (variables && typeof variables === "object") {
		variableEntries = Object.entries(variables);
	}

	// Only allow variables of type string, number, array, date, or json
	const allowedTypes = ["string", "number", "array", "date", "JSON"];
	variableEntries = variableEntries.filter(([key, variable]) => {
		// Support both variable.type and variable.dataType
		const type = variable?.type || variable?.dataType;
		return allowedTypes.includes(type);
	});

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
						{variableEntries.map(([key, variable]) => (
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
		</>
	);
};
