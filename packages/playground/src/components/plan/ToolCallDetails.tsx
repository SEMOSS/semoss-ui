import type React from "react";
import { useId, useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	Field,
	FieldGroup,
	FieldLabel,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { getToolbox } from "@/components";
import type { App, Engine, MCP, PlanStep, Toolbox } from "@/types";

type ToolCallDetails = Extract<PlanStep["details"], { stepType: "tool_call" }>;

interface ToolCallDetailsProps {
	/** Detail state */
	details: ToolCallDetails;

	/** Update the details state */
	onDetailsChange: (details: ToolCallDetails) => void;
}

export const ToolCallDetails: React.FC<ToolCallDetailsProps> = (props) => {
	const { details, onDetailsChange } = props;

	const toolboxId = useId();
	const toolId = useId();

	const [toolbox, setToolbox] = useState<Toolbox | null>(null);

	/**
	 * Get all of the groups
	 */
	const getApps = usePixel<(Engine | App)[]>(
		`MyEngineProject (metaKeys = ["tag", "description"], metaFilters=[{"tag":["MCP"]}], type=["PROJECT", "STORAGE", "DATABASE", "FUNCTION"])`,
		{
			data: [],
		},
	);

	/**
	 * Get all of the groups
	 */
	const getMCP = usePixel<MCP>(
		toolbox ? `GetMCPTools("${toolbox.id}")` : null,
		{
			data: {
				_meta: {
					SMSS_PROJECT_NAME: "",
					SMSS_PROJECT_ID: "",
				},
				tools: [],
			},
		},
	);

	const toolboxOptions = getApps.data.map((item) => getToolbox(item));

	return (
		<FieldGroup>
			<Field>
				<FieldLabel htmlFor={toolboxId}>Toolbox</FieldLabel>
				<Select
					value={toolbox?.id || ""}
					onValueChange={(value) => {
						const selectedToolbox = toolboxOptions.find(
							(option) => option.id === value,
						);
						setToolbox(selectedToolbox || null);
					}}
				>
					<SelectTrigger id={toolboxId}>
						<SelectValue placeholder="Select Toolbox" />
					</SelectTrigger>
					<SelectContent>
						{getApps.status === "LOADING" ? (
							<SelectItem value="" disabled>
								Loading...
							</SelectItem>
						) : (
							toolboxOptions.map((option) => (
								<SelectItem key={option.id} value={option.id}>
									{option.name}
								</SelectItem>
							))
						)}
					</SelectContent>
				</Select>
			</Field>
			<Field>
				<FieldLabel htmlFor={toolId}>Tool</FieldLabel>

				<Select
					value={details.tool_name}
					onValueChange={(value) => {
						onDetailsChange({
							...details,
							tool_name: value,
							title: toolbox.name,
							_meta: {
								map: {
									SMSS_PROJECT_ID: toolbox.id,
									SMSS_PROJECT_NAME: toolbox.name,
								},
							},
						});
					}}
				>
					<SelectTrigger id={toolId}>
						<SelectValue placeholder="Tool" />
					</SelectTrigger>
					<SelectContent>
						{getMCP.data.tools.map((tool) => (
							<SelectItem key={tool.name} value={tool.name}>
								{tool.title}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</Field>
		</FieldGroup>
	);
};
