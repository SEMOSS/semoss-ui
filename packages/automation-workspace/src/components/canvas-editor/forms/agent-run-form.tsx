import { Field, FieldLabel } from "@semoss/ui/next";
import type { AgentRunConfig } from "../../../domain/automation.types";
import { BoundInput } from "./pill-input";
import { AutomationProjectSelect } from "./project-select";

export interface AgentRunFormProps {
	config: AgentRunConfig;
	upstreamVars: string[];
	onChange: (config: AgentRunConfig) => void;
}

/** Authors a RunAgent call against an agent workspace the current user can access. */
export function AgentRunForm({
	config,
	upstreamVars,
	onChange,
}: AgentRunFormProps) {
	return (
		<div className="flex flex-col gap-4">
			<Field>
				<FieldLabel>
					Agent
					<span className="ml-1 text-destructive" aria-hidden>
						*
					</span>
				</FieldLabel>
				<AutomationProjectSelect
					name={config.workspaceName ?? ""}
					value={config.workspaceId}
					projectTypes={["WORKSPACE"]}
					placeholder="Select an agent…"
					searchPlaceholder="Search agents…"
					emptyText="No accessible agents found"
					clearable={false}
					onChange={(workspaceId, workspaceName) =>
						onChange({
							...config,
							workspaceId,
							workspaceName,
						})
					}
				/>
				<p className="mt-1 text-[11px] text-muted-foreground">
					Only SEMOSS agents you can access are shown.
				</p>
			</Field>
			<BoundInput
				label="Instruction"
				required
				value={config.command}
				placeholder="Create a prototype for: ${rfi}"
				onChange={(command) => onChange({ ...config, command })}
				upstreamVars={upstreamVars}
				mono
				minRows={4}
			/>
		</div>
	);
}
