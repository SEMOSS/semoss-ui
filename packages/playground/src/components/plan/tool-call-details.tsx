import type React from "react";
import { useId, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { usePixel } from "@semoss/sdk/react";
import {
	Field,
	FieldLabel,
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { engineProjectToMCP } from "@/components";
import type { App, Engine, MCP, MCPTool, PlanStep } from "@/types";

type ToolCallDetails = Extract<PlanStep["details"], { stepType: "tool_call" }>;

interface ToolCallDetailsProps {
	/** Detail state */
	details: ToolCallDetails;

	/** Update the details state */
	onDetailsChange: (details: ToolCallDetails) => void;
}

export const ToolCallDetails: React.FC<ToolCallDetailsProps> = (props) => {
	const { t } = useTranslation("common");
	const { details, onDetailsChange } = props;

	const toolboxId = useId();
	const toolId = useId();

	const [toolbox, setToolbox] = useState<MCP | null>(null);

	/**
	 * Get all of the groups
	 */
	const getApps = usePixel<(Engine | App)[]>(
		`META | MyEngineProject (metaKeys = ["tag", "description"], metaFilters=[{"tag":["MCP"]}], type=["PROJECT", "STORAGE", "DATABASE", "FUNCTION", "MODEL", "VECTOR"])`,
		{
			data: [],
		},
	);

	/**
	 * Get all of the groups
	 */
	const getMCP = usePixel<{
		tools: MCPTool[];
	}>(
		toolbox
			? `GetMCPTools(${
					toolbox.type === "PROJECT"
						? `project=["${toolbox.id}"]`
						: `engine=["${toolbox.id}"]`
				});`
			: "",
		{
			data: {
				tools: [],
			},
		},
	);

	const toolboxOptions = getApps.data.map(engineProjectToMCP);

	return (
		<>
			<Field>
				<FieldLabel htmlFor={toolboxId}>MCP</FieldLabel>
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
						<SelectValue placeholder={t("plan.selectMcp")} />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectLabel>MCP</SelectLabel>

							{toolboxOptions.map((option) => (
								<SelectItem key={option.id} value={option.id}>
									{option.name}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
			</Field>
			<Field>
				<FieldLabel htmlFor={toolId}>{t("plan.tool")}</FieldLabel>
				<Select
					value={details.tool_name}
					onValueChange={(value) => {
						onDetailsChange({
							...details,
							tool_name: value,
							title: toolbox.name,
							_meta: {
								SMSS_PROJECT_ID: toolbox.id,
								SMSS_PROJECT_NAME: toolbox.name,
							},
						});
					}}
				>
					<SelectTrigger id={toolId}>
						<SelectValue placeholder={t("plan.selectTool")} />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectLabel>{t("plan.tool")}</SelectLabel>
							{getMCP.data.tools.map((tool) => (
								<SelectItem key={tool.name} value={tool.name}>
									{tool.title}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
			</Field>
		</>
	);
};
