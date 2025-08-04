import React from "react";
import { Controller } from "react-hook-form";
import { useBlocks } from "@semoss/renderer";
import { Select, TextField } from "@semoss/ui";

interface CopyTextProps {
	control: any;
}

export const CopyText = ({ control }: CopyTextProps) => {
	const { state } = useBlocks();
	return (
		<>
			<Controller
				name={"payload.text"}
				control={control}
				render={({ field }) => (
					<Select
						label="Variable"
						value={field.value ? field.value : ""}
						onChange={(value) =>
							// setValue
							field.onChange(value)
						}
					>
						{Object.keys(state.variables).map((variableName) => (
							<Select.Item
								key={variableName}
								value={variableName}
							>
								{variableName}
							</Select.Item>
						))}
					</Select>
				)}
			/>
		</>
	);
};
