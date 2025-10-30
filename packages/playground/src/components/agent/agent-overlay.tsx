import { useEffect, useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { usePixel } from "@semoss/sdk/react";
import {
	Button,
	Checkbox,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Field,
	FieldGroup,
	FieldLabel,
	FieldSet,
	Input,
	Label,
	Textarea,
} from "@semoss/ui/next";
import type { Agent, App, Engine, Toolbox } from "@/types";

type NewAgentForm = {
	AGENT_NAME: string;
	AGENT_DESCRIPTION: string;
	AGENT_CONTEXT: string;
	AGENT_TOOLS: string[] | null;
};

/**
 * Get a unique key for a tool
 * @param tool The tool to get the key for
 * @returns The unique key for the tool
 */
const getTool = (item: Engine | App): Toolbox => {
	let id = "";
	let name = "";
	let type: Toolbox["type"] = "DATABASE";

	// Type guard to check if item is App
	if ("project_id" in item && "project_name" in item) {
		id = item.project_id;
		type = "APP";
		name = item.project_name;
	} else if ("app_id" in item && "app_name" in item) {
		id = item.app_id;
		name = item.app_name;
		type = item.app_type;
	}

	return {
		id: id,
		type: type,
		name: name,
		description: "",
		tags: [],
	};
};

export interface AgentOverlayProps {
	/** Track if the overlay is open */
	open: boolean;

	/** Agent to edit */
	agentInfo: Agent | null;

	/** Update the state of the overlay */
	onOpenChange: (isOpen: boolean) => void;

	/** Callback triggered  */
	onSubmit: (data?: NewAgentForm) => Promise<void>;
}

export const AgentOverlay: React.FC<AgentOverlayProps> = ({
	open,
	onOpenChange,
	onSubmit,
	agentInfo,
}) => {
	const nameId = useId();
	const descriptionId = useId();
	const contextId = useId();
	const selectAllId = useId();
	/**
	 * Constants
	 */
	const isCreatingNew = agentInfo === null;

	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [tools, setTools] = useState([]);

	// pixel call to get all tools
	const getApps = usePixel<(Engine | App)[]>(
		`MyEngineProject (metaKeys = ["tag", "description"], metaFilters=[{"tag":["MCP"]}], type=["PROJECT", "STORAGE", "DATABASE", "FUNCTION"], filterWord=[""])`,
		{
			data: [],
		},
	);

	useEffect(() => {
		if (getApps.status !== "SUCCESS") {
			setIsLoading(true);
			return;
		}

		const tools = getApps.data.map((tool) => getTool(tool));
		setTools(tools);
		setIsLoading(false);
	}, [getApps.status, getApps.data]);

	const { handleSubmit, control, watch } = useForm<NewAgentForm>({
		defaultValues: {
			AGENT_NAME: "",
			AGENT_DESCRIPTION: "",
			AGENT_CONTEXT: "",
			AGENT_TOOLS: null,
		},
	});

	const isFormValid = !!watch("AGENT_NAME");

	return (
		<Dialog open={open} onOpenChange={(open) => onOpenChange(open)}>
			<DialogContent
				aria-describedby="Edit the agent"
				className="sm:max-w-lg"
			>
				<DialogHeader>
					<DialogTitle>
						{isCreatingNew ? "Create Agent" : "View Agent"}
					</DialogTitle>
				</DialogHeader>
				<form
					onSubmit={handleSubmit(async (data) => {
						await onSubmit(data);

						onOpenChange(false);
					})}
				>
					{isCreatingNew ? (
						<FieldSet>
							<FieldGroup>
								<Controller
									name={"AGENT_NAME"}
									control={control}
									rules={{ required: true }}
									render={({ field }) => {
										return (
											<Field>
												<FieldLabel htmlFor={nameId}>
													Name
												</FieldLabel>
												<Input
													id={nameId}
													placeholder="Add Name"
													value={field.value || ""}
													disabled={isLoading}
													onChange={(e) =>
														field.onChange(
															e.target.value,
														)
													}
													data-testid="newAgentModal-textField-name"
												/>
											</Field>
										);
									}}
								/>
								<Controller
									name={"AGENT_DESCRIPTION"}
									control={control}
									rules={{ required: false }}
									render={({ field }) => {
										return (
											<Field>
												<FieldLabel
													htmlFor={descriptionId}
												>
													Description
												</FieldLabel>
												<Input
													id={descriptionId}
													placeholder="Description"
													value={field.value || ""}
													disabled={isLoading}
													onChange={(e) =>
														field.onChange(
															e.target.value,
														)
													}
													data-testid="newAgentModal-description-txt"
												/>
											</Field>
										);
									}}
								/>
								<Controller
									name={"AGENT_CONTEXT"}
									control={control}
									rules={{}}
									render={({ field }) => {
										return (
											<Field>
												<FieldLabel htmlFor={contextId}>
													Context
												</FieldLabel>
												<Textarea
													id={contextId}
													placeholder="Context"
													value={field.value || ""}
													onChange={(e) =>
														field.onChange(
															e.target.value,
														)
													}
													rows={4}
													data-testid="newAgentModal-context-txt"
												/>
											</Field>
										);
									}}
								/>
								<Controller
									name={"AGENT_TOOLS"}
									control={control}
									rules={{}}
									render={({ field }) => {
										const selectedToolIds =
											field.value || [];
										const allSelected =
											selectedToolIds.length ===
											tools.length;

										return (
											<Field>
												<FieldLabel>
													Use These Tools
												</FieldLabel>
												<div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
													{/* Select All option */}
													<div className="flex items-center space-x-2 border-b pb-2">
														<Checkbox
															id={selectAllId}
															checked={
																allSelected
															}
															onCheckedChange={(
																checked,
															) => {
																if (checked) {
																	field.onChange(
																		tools.map(
																			(
																				t,
																			) =>
																				t.id,
																		),
																	);
																} else {
																	field.onChange(
																		[],
																	);
																}
															}}
															disabled={isLoading}
														/>
														<Label
															htmlFor={
																selectAllId
															}
															className="cursor-pointer font-medium text-sm"
														>
															Select All
														</Label>
													</div>
													{/* Individual tool options */}
													{tools.map((tool) => (
														<div
															key={tool.id}
															className="flex items-center space-x-2"
														>
															<Checkbox
																id={`tool-${tool.id}`}
																checked={selectedToolIds.includes(
																	tool.id,
																)}
																onCheckedChange={(
																	checked,
																) => {
																	if (
																		checked
																	) {
																		field.onChange(
																			[
																				...selectedToolIds,
																				tool.id,
																			],
																		);
																	} else {
																		field.onChange(
																			selectedToolIds.filter(
																				(
																					toolId: string,
																				) =>
																					toolId !==
																					tool.id,
																			),
																		);
																	}
																}}
																disabled={
																	isLoading
																}
															/>
															<Label
																htmlFor={`tool-${tool.id}`}
																className="cursor-pointer font-normal text-sm"
															>
																{tool.name}
															</Label>
														</div>
													))}
												</div>
											</Field>
										);
									}}
								/>
							</FieldGroup>
						</FieldSet>
					) : (
						<FieldSet>
							<FieldGroup>
								<Field>
									<FieldLabel>Name</FieldLabel>
									<Input disabled value={agentInfo.name} />
								</Field>
								<Field>
									<FieldLabel>ID</FieldLabel>
									<Input
										disabled
										value={agentInfo.workspace_id}
									/>
								</Field>
								<Field>
									<FieldLabel>Description</FieldLabel>
									<Input
										disabled
										value={agentInfo.description}
									/>
								</Field>
								<Field>
									<FieldLabel>Context</FieldLabel>
									<Textarea
										disabled
										value={agentInfo.system_prompt}
										rows={4}
									/>
								</Field>
								<Field>
									<FieldLabel>Date Created</FieldLabel>
									<Input
										disabled
										value={agentInfo.date_created}
									/>
								</Field>
							</FieldGroup>
						</FieldSet>
					)}
					<DialogFooter>
						<Button
							variant="ghost"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						{isCreatingNew && (
							<Button
								type="submit"
								disabled={isLoading || !isFormValid}
								data-testid="newAgentModal-create-btn"
							>
								Add
							</Button>
						)}
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};
