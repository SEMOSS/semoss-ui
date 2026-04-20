import { useEffect } from "react";
import {
	type Control,
	Controller,
	type UseFormSetValue,
} from "react-hook-form";
import { type ListenerActions, useBlocks } from "@semoss/renderer";
import {
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";

interface ModifyVariableSelectorProps {
	id: string;
	control: Control<ListenerActions>;
	setValue: UseFormSetValue<ListenerActions>;
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
	}, [id, setValue]);

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
		<div className="flex flex-col gap-2">
			<Controller
				name="payload.variable"
				control={control}
				render={({ field }) => (
					<Select
						value={field.value || ""}
						onValueChange={(value) => {
							setValue("payload.variable", "");
							field.onChange(value);
						}}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Variable" />
						</SelectTrigger>
						<SelectContent>
							{primitiveVariables?.map((type) => (
								<SelectItem
									key={`update-var--${type}`}
									value={type}
								>
									{type}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}
			/>
			<Controller
				name="payload.value"
				control={control}
				render={({ field }) => (
					<Input
						placeholder="Update Value"
						value={field.value || ""}
						onChange={(value) => {
							field.onChange(value);
						}}
					/>
				)}
			/>
		</div>
	);
};
