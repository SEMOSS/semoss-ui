import React, { useEffect, useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import { useBlocks } from "@semoss/renderer";
import { Select, TextField, Typography } from "@semoss/ui";

interface RunMCPSelectorProps {
	control: any;
	setValue: any;
	name: string;
}

export const RunMCPSelector = ({
	control,
	setValue,
	name,
}: RunMCPSelectorProps) => {
	const { state } = useBlocks();
	const [tools, setTools] = useState([]);

	useEffect(() => {
		setTools(state.tools);
	}, []);

	const params = useMemo(() => {
		return tools.find((t) => t.name === name)?.inputSchema.required || [];
	}, [name]);

	console.log(params);

	return (
		<>
			<Controller
				name="payload.name"
				control={control}
				render={({ field }) => (
					<Select
						label="Tool Name"
						value={field.value || ""}
						onChange={(value) => {
							setValue("payload.parameters", {});
							field.onChange(value);
						}}
					>
						{tools.map((tool) => (
							<Select.Item
								key={`run-mcp-tool-${tool.name}`}
								value={tool.name}
							>
								{tool.name}
							</Select.Item>
						))}
					</Select>
				)}
			/>
			<Typography variant={"h6"}>Parameters</Typography>

			{params.map((p) => {
				return (
					<Controller
						key={`${name}-${p}`}
						name={`payload.parameters.${p}`}
						control={control}
						render={({ field }) => (
							<TextField
								label={p}
								value={field.value || ""}
								onChange={field.onChange}
							/>
						)}
					/>
				);
			})}
		</>
	);
};
