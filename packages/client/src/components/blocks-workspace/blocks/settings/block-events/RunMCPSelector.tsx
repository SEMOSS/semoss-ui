import React, { useEffect, useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import { useBlocks } from "@semoss/renderer";
import { Select, TextField, Typography, useNotification } from "@semoss/ui";
import { runPixel } from "@semoss/sdk";
import { useWorkspace } from "@/hooks";
import { json } from "react-router-dom";

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
	const [tools, setTools] = useState([]);
	const { workspace } = useWorkspace()
	const notification = useNotification()

	useEffect(() => {
		getAppTools()		
	}, []);

	/**
	 * Params in order for the tool to execute
	 */
	const params = useMemo(() => {
		return tools.find((t) => t.name === name)?.inputSchema.required || [];
	}, [name]);

	/**
	 * Gets tools specific to the app
	 */
	const getAppTools = async () => {

		try {
			const {errors, pixelReturn} = await runPixel(`GetAppAssets(project="${workspace.appId}", filePath=["mcp/py_mcp.json"])`)

			if(errors.length) {
				throw new Error(errors.join(","))
			}

			const protocol = JSON.parse(pixelReturn[0].output as string)

			if (!protocol.tools) {
				throw new Error("No tools present in 'mcp/py_mcp.json'")
			}

			setTools(protocol.tools)
		 } catch (e) {
			notification.add({
				color: "error",
				message: e
			})
		 }
	}
	
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
