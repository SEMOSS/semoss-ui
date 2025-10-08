import { Close } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { usePixel } from "@semoss/sdk/react";
import {
	Button,
	Checkbox,
	Chip,
	IconButton,
	Modal,
	SelectStack,
	Stack,
	styled,
	TextFieldStack,
	Typography,
	useNotification,
} from "@semoss/ui";
import { useChat } from "@/hooks";
import type { Agent, App, Engine, Tool } from "@/types";

const StyledModalContent = styled(Modal.Content)(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(2),
	paddingTop: `${theme.spacing(1)}!important`,
}));

export interface AgentModalProps {
	open: boolean;
	onClose: (newAgentId?: string) => void;
	agentInfo: Agent | null;
}

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
const getTool = (item: Engine | App): Tool => {
	let id = "";
	let name = "";
	let type: Tool["type"] = "DATABASE";

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

/**
 * Renders a modal to create a new agent
 *
 * @component
 */
export const AgentModal = (props: AgentModalProps) => {
	const { open, onClose, agentInfo } = props;
	const notification = useNotification();
	const { chat } = useChat();
	/**
	 * Constants
	 */
	const isCreatingNew = agentInfo === null;

	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [selectedTools, setSelectedTools] = useState([]);
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
	}, [getApps.status]);

	const { getValues, handleSubmit, control, watch } = useForm<NewAgentForm>({
		defaultValues: {
			AGENT_NAME: "",
			AGENT_DESCRIPTION: "",
			AGENT_CONTEXT: "",
			AGENT_TOOLS: null,
		},
	});

	const watchAll = watch();

	const isFormValid = useMemo(() => {
		return !!getValues("AGENT_NAME");
	}, [watchAll]);

	const handleToolChange = (event) => {
		const {
			target: { value },
		} = event;
		let newSelection = typeof value === "string" ? value.split(",") : value;
		if (value.includes("select-all")) {
			// if tools length doesn't match selected check all boxes. else deselect all
			newSelection =
				tools.length === selectedTools.length
					? []
					: tools.map((tool) => tool.id);
		}
		setSelectedTools(newSelection);
		return newSelection;
	};

	const onToolDelete = (toolId: string) => {
		const newTools = selectedTools.filter((tool) => tool !== toolId);
		setSelectedTools(newTools);
		return newTools;
	};
	/**
	 * Method that is called to create the app
	 */
	const onSubmit = handleSubmit(async (data: NewAgentForm) => {
		try {
			// start the loading screen
			setIsLoading(true);

			const output = await chat.addWorkspace(data);
			// get new app id and return in the onclose
			onClose(output);
		} catch (e) {
			console.error(e);

			notification.add({
				color: "error",
				message: e.message,
			});
		} finally {
			// stop the loading screen
			setIsLoading(false);
		}
	});

	return (
		<Modal open={open} onClose={onClose} fullWidth>
			<Modal.Title>
				<Stack direction="row" justifyContent="space-between">
					<Typography variant="h6">
						{isCreatingNew ? "Create Agent" : "View Agent"}
					</Typography>
					<IconButton size="small" onClick={() => onClose()}>
						<Close />
					</IconButton>
				</Stack>
			</Modal.Title>
			<form onSubmit={onSubmit}>
				<StyledModalContent>
					{isCreatingNew ? (
						<Stack direction="column" spacing={1}>
							<Controller
								name={"AGENT_NAME"}
								control={control}
								rules={{ required: true }}
								render={({ field }) => {
									return (
										<TextFieldStack
											variant="outlined"
											label="Name"
											placeholder="Add Name"
											value={
												field.value ? field.value : ""
											}
											disabled={isLoading}
											onChange={(value) =>
												field.onChange(value)
											}
											fullWidth
											data-testid={
												"newAgentModal-textField-name"
											}
										/>
									);
								}}
							/>
							<Controller
								name={"AGENT_DESCRIPTION"}
								control={control}
								rules={{ required: false }}
								render={({ field }) => {
									return (
										<TextFieldStack
											label="Description"
											variant="outlined"
											placeholder="Description"
											value={
												field.value ? field.value : ""
											}
											disabled={isLoading}
											onChange={(value) =>
												field.onChange(value)
											}
											data-testid={
												"newAgentModal-description-txt"
											}
										/>
									);
								}}
							/>
							<Controller
								name={"AGENT_CONTEXT"}
								control={control}
								rules={{}}
								render={({ field }) => {
									return (
										<TextFieldStack
											multiline
											label="Context"
											variant="outlined"
											placeholder="Context"
											value={
												field.value ? field.value : ""
											}
											onChange={(value) =>
												field.onChange(value)
											}
											sx={{
												"& .MuiInputBase-inputMultiline:focus":
													{
														border: "none !important",
														outline: "none",
													},
											}}
											data-testid={
												"newAgentModal-context-txt"
											}
										/>
									);
								}}
							/>
							<Controller
								name={"AGENT_TOOLS"}
								control={control}
								rules={{}}
								render={({ field }) => {
									return (
										<SelectStack
											label="Use These Tools"
											variant="outlined"
											disabled={isLoading}
											placeholder="Tools"
											size="small"
											data-testid={
												"newAgentModal-tool-select"
											}
											SelectProps={{
												multiple: true,
												value: selectedTools,
												onChange: (event) => {
													const value =
														handleToolChange(event);
													field.onChange(value);
												},
												renderValue: (
													selectedValue,
												) => {
													return Array.isArray(
														selectedValue,
													) ? (
														<Stack
															spacing={1}
															direction="row"
														>
															{selectedValue.map(
																(value) => {
																	const t =
																		tools.find(
																			(
																				tool,
																			) =>
																				tool.id ===
																				value,
																		);
																	return (
																		<span
																			key={
																				t.id
																			}
																			role="none"
																			onMouseDown={(
																				e,
																			) =>
																				e.stopPropagation()
																			}
																		>
																			<Chip
																				key={
																					t.id
																				}
																				label={
																					t.name
																				}
																				size={
																					"small"
																				}
																				onDelete={(
																					e,
																				) => {
																					e.stopPropagation();
																					const newTools =
																						onToolDelete(
																							t.id,
																						);
																					field.onChange(
																						newTools,
																					);
																				}}
																			/>
																		</span>
																	);
																},
															)}
														</Stack>
													) : null;
												},
											}}
										>
											<SelectStack.Item
												value={"select-all"}
												key={
													"newAgentModal-tool-select-all"
												}
											>
												<Checkbox
													checked={
														tools.length ===
														selectedTools.length
													}
												/>
												Select All
											</SelectStack.Item>
											{tools.map((tool, idx) => {
												return (
													<SelectStack.Item
														value={tool.id}
														key={`newAgentModal-tool-${idx + 1}`}
													>
														<Checkbox
															checked={selectedTools.includes(
																tool.id,
															)}
														/>
														{tool.name}
													</SelectStack.Item>
												);
											})}
										</SelectStack>
									);
								}}
							/>
						</Stack>
					) : (
						<Stack direction="column" spacing={1}>
							<TextFieldStack
								variant="outlined"
								label="Name"
								disabled
								value={agentInfo.project_name}
							/>
							<TextFieldStack
								variant="outlined"
								label="ID"
								disabled
								value={agentInfo.project_id}
							/>
							<TextFieldStack
								variant="outlined"
								label="Description"
								disabled
								value={agentInfo.description}
							/>
							<TextFieldStack
								variant="outlined"
								label="Date Created"
								disabled
								value={agentInfo.project_date_created}
							/>
						</Stack>
					)}
				</StyledModalContent>
				<Modal.Actions>
					<Button variant="text" onClick={() => onClose()}>
						Close
					</Button>
					{isCreatingNew && (
						<Button
							type="submit"
							variant={"contained"}
							disabled={isLoading || !isFormValid}
							data-testid={"newAgentModal-create-btn"}
						>
							Add
						</Button>
					)}
				</Modal.Actions>
			</form>
		</Modal>
	);
};
