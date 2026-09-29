import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { usePixel } from "@semoss/sdk/react";
import {
	Button,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	type Control,
	Controller,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Spinner,
} from "@semoss/ui/next";
import type { Project } from "../../../types";
import { AppCatalogAvatar } from "../../app-catalog-avatar";
import type { AgentLinks } from "../agent.types";
import { AgentResourceList } from "../agent-resource-list";
import type { AgentFormValues } from "./types";

const getAgentName = (agent: Project) =>
	agent.project_display_name || agent.project_name;

export interface AgentSubagentsFieldProps {
	/** React Hook Form control for the shared agent form. */
	control: Control<AgentFormValues>;
	/** Locks the picker while its owning form is saving. */
	disabled?: boolean;
	/** Workspace id to exclude from the target-agent picker - the agent's own id, if it already exists (a new, unsaved agent has none to exclude). */
	excludeWorkspaceId?: string;
	/** Link for each subagent. */
	getAgentUrl?: AgentLinks["getAgentUrl"];
}

/** Lists the agents this agent can delegate to, with a searchable agent picker. */
export const AgentSubagentsField = ({
	control,
	disabled,
	excludeWorkspaceId,
	getAgentUrl,
}: AgentSubagentsFieldProps) => {
	const { t } = useTranslation("agent");
	const [open, setOpen] = useState(false);

	const agentWorkspaces = usePixel<Project[]>(
		`META | MyProjects(metaKeys=["description"], projectType=["WORKSPACE"]);`,
	);
	const isLoading = agentWorkspaces.status === "LOADING";
	const agentsById = useMemo(
		() =>
			new Map((agentWorkspaces.data ?? []).map((p) => [p.project_id, p])),
		[agentWorkspaces.data],
	);

	return (
		<Controller
			name="subagents"
			control={control}
			render={({ field }) => {
				const values: AgentFormValues["subagents"] = (
					field.value ?? []
				).filter((s) => s.workspaceId);
				const addedIds = new Set(values.map((s) => s.workspaceId));
				const options = (agentWorkspaces.data ?? []).filter(
					(p) =>
						p.project_id !== excludeWorkspaceId &&
						!addedIds.has(p.project_id),
				);

				return (
					<div className="flex flex-col gap-3">
						<AgentResourceList
							emptyLabel={t("empty.subagents")}
							items={values.map(({ workspaceId }) => {
								const agent = agentsById.get(workspaceId);
								return {
									id: workspaceId,
									title: agent
										? getAgentName(agent)
										: isLoading
											? t("about.loading")
											: t("resource.unavailableAgent"),
									description: agent
										? agent.description
										: workspaceId,
									href: agent
										? getAgentUrl?.(workspaceId)
										: undefined,
								};
							})}
							onRemove={(id) =>
								field.onChange(
									values.filter((s) => s.workspaceId !== id),
								)
							}
						/>
						<Popover
							open={open && !disabled}
							onOpenChange={setOpen}
						>
							<PopoverTrigger asChild>
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="w-fit"
									disabled={disabled}
									aria-expanded={open && !disabled}
								>
									<Plus aria-hidden="true" />
									{t("form.subagents.add")}
								</Button>
							</PopoverTrigger>
							<PopoverContent align="start" className="w-80 p-0">
								<Command>
									<CommandInput
										placeholder={t(
											"form.subagents.searchPlaceholder",
										)}
									/>
									<CommandList>
										{isLoading ? (
											<div className="flex justify-center py-6">
												<Spinner />
											</div>
										) : (
											<>
												<CommandEmpty>
													{options.length === 0
														? t(
																"form.subagents.noneToAdd",
															)
														: t(
																"form.subagents.noMatch",
															)}
												</CommandEmpty>
												<CommandGroup>
													{options.map((agent) => {
														const name =
															getAgentName(agent);
														return (
															<CommandItem
																key={
																	agent.project_id
																}
																value={
																	agent.project_id
																}
																keywords={[
																	name,
																	agent.description ??
																		"",
																]}
																disabled={
																	disabled
																}
																onSelect={() => {
																	if (
																		disabled
																	)
																		return;
																	field.onChange(
																		[
																			...values,
																			{
																				workspaceId:
																					agent.project_id,
																			},
																		],
																	);
																	setOpen(
																		false,
																	);
																}}
															>
																<AppCatalogAvatar
																	name={name}
																	aria-hidden="true"
																	className="size-6 shrink-0 rounded-sm text-xs"
																/>
																<div className="flex min-w-0 flex-col">
																	<span className="truncate">
																		{name}
																	</span>
																	{agent.description && (
																		<span className="truncate text-muted-foreground text-xs">
																			{
																				agent.description
																			}
																		</span>
																	)}
																</div>
															</CommandItem>
														);
													})}
												</CommandGroup>
											</>
										)}
									</CommandList>
								</Command>
							</PopoverContent>
						</Popover>
					</div>
				);
			}}
		/>
	);
};
