import type React from "react";
import { useState } from "react";
import { useDebouncedValue, usePixel } from "@semoss/sdk/react";
import { Autocomplete, Grid, Select, TextField } from "@semoss/ui";
import { engineProjectToToolbox } from "@/components";
import type { App, Engine, MCPTool, MCPToolbox, PlanStep } from "@/types";

type ToolCallDetails = Extract<PlanStep["details"], { stepType: "tool_call" }>;

interface ToolCallDetailsProps {
	/** Detail state */
	details: ToolCallDetails;

	/** Update the details state */
	onDetailsChange: (details: ToolCallDetails) => void;
}

export const ToolCallDetails: React.FC<ToolCallDetailsProps> = (props) => {
	const { details, onDetailsChange } = props;

	const [toolbox, setToolbox] = useState<MCPToolbox | null>(null);
	const [search, setSearch] = useState("");

	// debounce the input
	const debouncedSearch = useDebouncedValue(search);

	/**
	 * Get all of the groups
	 */
	const getApps = usePixel<(Engine | App)[]>(
		`MyEngineProject (metaKeys = ["tag", "description"], metaFilters=[{"tag":["MCP"]}], type=["PROJECT", "STORAGE", "DATABASE", "FUNCTION"], filterWord=["${debouncedSearch}"])`,
		{
			data: [],
		},
	);

	/**
	 * Get all of the groups
	 */
	const getMCP = usePixel<{
		tools: MCPTool[];
	}>(toolbox ? `GetMCPTools("${toolbox.id}")` : null, {
		data: {
			tools: [],
		},
	});

	const toolboxOptions = getApps.data.map(engineProjectToToolbox);

	return (
		<>
			<Grid item xs={12}>
				<Autocomplete<MCPToolbox, false, false, false>
					loading={getApps.status === "LOADING"}
					options={toolboxOptions}
					value={toolbox || null}
					inputValue={search}
					getOptionLabel={(option) => {
						if (typeof option === "string") {
							return option;
						}
						return option.name;
					}}
					isOptionEqualToValue={(option, value) => {
						if (
							typeof option === "string" ||
							typeof value === "string"
						) {
							return false;
						}
						return option.id === value.id;
					}}
					onInputChange={(_event, newValue) => {
						setSearch(newValue);
					}}
					onChange={(_event, newValue) => {
						// set the toolbox (only if it's a Toolbox object, not a string)
						if (newValue && typeof newValue !== "string") {
							setToolbox(newValue);
						} else {
							setToolbox(null);
						}
					}}
					renderInput={(params) => (
						<TextField
							{...params}
							label="Select Toolbox"
							variant="outlined"
							placeholder="Search Toolbox"
							InputProps={{
								...params.InputProps,
								startAdornment: null,
							}}
						/>
					)}
				/>
			</Grid>
			<Grid item xs={12}>
				<Select
					value={details.tool_name}
					label="Select Tool"
					onChange={(e) => {
						onDetailsChange({
							...details,
							tool_name: e.target.value,
							title: toolbox.name,
							_meta: {
								map: {
									SMSS_PROJECT_ID: toolbox.id,
									SMSS_PROJECT_NAME: toolbox.name,
								},
							},
						});
					}}
					fullWidth
				>
					{getMCP.data.tools.map((tool) => (
						<Select.Item key={tool.name} value={tool.name}>
							{tool.title}
						</Select.Item>
					))}
				</Select>
			</Grid>
		</>
	);
};
