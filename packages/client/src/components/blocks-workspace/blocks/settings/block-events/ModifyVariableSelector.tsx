import { useEffect } from "react";
import { Controller } from "react-hook-form";
import { Select, TextField } from "@semoss/ui";
import { useBlocks } from "@semoss/renderer";

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
	const acceptedTypes = ["string", "number", "boolean", "array", "object"];
	// get the variables from state and filter by accepted types
	const conventionalVariables = Object.entries(state.variables)
		?.filter(([_, v]) => acceptedTypes.includes(v.type))
		?.map(([k]) => k);
	console.log("CONVENTIONAL VARIABLES >>", conventionalVariables);
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
						{conventionalVariables?.map((type, index) => (
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
