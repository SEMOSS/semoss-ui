import { Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { type Control, Controller, useFieldArray } from "react-hook-form";
import { usePixel } from "@semoss/sdk/react";
import type { Project } from "@semoss/shared";
import {
	Button,
	Muted,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import type { AgentFormValues } from "./types";

export interface AgentSubagentsFieldProps {
	control: Control<AgentFormValues>;
	/** Workspace id to exclude from the target-agent picker - the agent's own id, if it already exists (a new, unsaved agent has none to exclude). */
	excludeWorkspaceId?: string;
}

export const AgentSubagentsField = ({
	control,
	excludeWorkspaceId,
}: AgentSubagentsFieldProps) => {
	const {
		fields: subagentFields,
		append: appendSubagent,
		remove: removeSubagent,
	} = useFieldArray({ control, name: "subagents" });

	const agentWorkspaces = usePixel<Project[]>(
		`MyProjects(projectType=["WORKSPACE"]);`,
	);
	const subagentWorkspaceOptions = useMemo(
		() =>
			(agentWorkspaces.data ?? []).filter(
				(p) => p.project_id !== excludeWorkspaceId,
			),
		[agentWorkspaces.data, excludeWorkspaceId],
	);

	return (
		<>
			<div className="flex max-h-80 flex-col gap-3 overflow-y-auto rounded-md border border-border p-3">
				{subagentFields.length === 0 && (
					<Muted className="text-muted-foreground text-sm">
						No subagents added yet.
					</Muted>
				)}
				{subagentFields.map((subagentField, index) => (
					<div
						key={subagentField.id}
						className="flex flex-col gap-2 border-border border-b pb-3 last:border-b-0 last:pb-0"
					>
						<div className="flex items-center gap-2">
							<Controller
								name={`subagents.${index}.workspaceId`}
								control={control}
								render={({ field }) => (
									<Select
										value={field.value}
										onValueChange={field.onChange}
										disabled={
											agentWorkspaces.status === "LOADING"
										}
									>
										<SelectTrigger
											aria-label="Target agent"
											className="flex-1"
										>
											<SelectValue
												placeholder={
													agentWorkspaces.status ===
													"LOADING"
														? "Loading..."
														: "Select an agent"
												}
											/>
										</SelectTrigger>
										<SelectContent>
											{subagentWorkspaceOptions.map(
												(p) => (
													<SelectItem
														key={p.project_id}
														value={p.project_id}
													>
														{p.project_name}
													</SelectItem>
												),
											)}
										</SelectContent>
									</Select>
								)}
							/>
							<Button
								variant="ghost"
								size="icon"
								type="button"
								className="shrink-0"
								onClick={() => removeSubagent(index)}
							>
								<Trash2 className="size-4" />
							</Button>
						</div>
					</div>
				))}
			</div>
			<Button
				variant="outline"
				size="sm"
				type="button"
				className="w-fit"
				onClick={() =>
					appendSubagent({
						workspaceId: "",
					})
				}
			>
				<Plus className="size-4" />
				Add subagent
			</Button>
		</>
	);
};
