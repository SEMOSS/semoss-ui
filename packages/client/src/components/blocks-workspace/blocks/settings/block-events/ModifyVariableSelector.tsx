import { useEffect } from "react";
import { Controller } from "react-hook-form";
import { useBlocks } from "@semoss/renderer";
import { Select, Stack, TextField } from "@semoss/ui";

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

	useEffect(() => {
		setValue("payload.blockId", id);
	}, [id]);

	// get all primitive variables from state
	const primitiveVarTypes = [
		"string",
		"number",
		"boolean",
		"array",
		"object",
		"json",
	];
	const primitiveVariables = Object.entries(state.variables)
		?.filter(([_, v]) => primitiveVarTypes.includes(v.type))
		?.map(([k]) => k);

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
						{primitiveVariables?.map((type) => (
							<Select.Item
								key={`update-var--${type}`}
								value={type}
							>
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
							value={field.value || ""}
							onChange={(value) => {
								field.onChange(value);
							}}
						/>
					</>
				)}
			/>
		</Stack>
	);
};
