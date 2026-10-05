import { type Control, Controller } from "react-hook-form";
import { useTranslation } from "@semoss/i18n";
import type { MCP, MCPConfig } from "../../../types";
import { MCPSelector } from "../../mcp/mcp-selector";
import { getMcpTypeIcon } from "../../mcp/mcp-utils";
import type { AgentLinks } from "../agent.types";
import { AgentResourceList } from "../agent-resource-list";
import {
	AgentResourcePickerDialog,
	EMBEDDED_SELECTOR_CLASS_NAME,
} from "./agent-resource-picker-dialog";
import type { AgentFormValues } from "./types";

/**
 * Attached MCPs carry a description at runtime: `GetWorkspace` returns one,
 * and the picker stores the full catalog entry.
 */
type AttachedMcp = MCPConfig & Partial<Pick<MCP, "description">>;

export interface AgentMcpFieldProps {
	/** React Hook Form control for the shared agent form. */
	control: Control<AgentFormValues>;
	/** Which MCP list this field edits. */
	type: "KNOWLEDGE" | "TOOLBOX";
	/** Workspace id, so the picker can surface attached MCPs the user cannot access. */
	workspaceId?: string;
	/** Link for each attached MCP. */
	getMcpUrl?: AgentLinks["getMcpUrl"];
	/** Applies the MCP tag filter to knowledge sources. */
	enableKnowledgeMCP?: boolean;
	/** Lists SYSTEM-tagged toolboxes in the picker. */
	showSystemTools?: boolean;
}

/** Lists an agent's knowledge sources or toolboxes, with a catalog picker dialog. */
export const AgentMcpField = ({
	control,
	type,
	workspaceId,
	getMcpUrl,
	enableKnowledgeMCP = true,
	showSystemTools = true,
}: AgentMcpFieldProps) => {
	const { t } = useTranslation("agent");
	const key = type === "KNOWLEDGE" ? "knowledge" : "toolboxes";

	return (
		<Controller
			name={key}
			control={control}
			render={({ field }) => {
				const values: AttachedMcp[] = field.value ?? [];
				return (
					<div className="flex flex-col gap-3">
						<AgentResourceList
							emptyLabel={t(`empty.${key}`)}
							items={values.map((m) => ({
								id: m.id,
								projectId:
									m.type === "PROJECT" ? m.id : undefined,
								title: m.name,
								description:
									m.description ||
									(type === "TOOLBOX"
										? t(`mcpType.${m.type}`)
										: undefined),
								icon:
									m.type === "PROJECT"
										? undefined
										: getMcpTypeIcon(m.type),
								href: getMcpUrl?.(m),
							}))}
							onRemove={(id) =>
								field.onChange(
									values.filter((m) => m.id !== id),
								)
							}
						/>
						<AgentResourcePickerDialog
							triggerLabel={t(`form.${key}.add`)}
							title={t(`sections.${key}.title`)}
							description={t(`form.${key}.description`)}
							value={values}
							onApply={field.onChange}
						>
							{(draft, setDraft) => (
								<MCPSelector
									type={type}
									values={draft}
									onChange={setDraft}
									className={EMBEDDED_SELECTOR_CLASS_NAME}
									enableKnowledgeMCP={enableKnowledgeMCP}
									showSystemTools={showSystemTools}
									getPlatformUrl={
										getMcpUrl
											? (m) => getMcpUrl(m) ?? ""
											: undefined
									}
									workspaceId={workspaceId}
									autoFocus
								/>
							)}
						</AgentResourcePickerDialog>
					</div>
				);
			}}
		/>
	);
};
