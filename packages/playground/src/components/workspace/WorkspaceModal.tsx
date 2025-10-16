import { Close } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { usePixel } from "@semoss/sdk/react";
import {
	Autocomplete,
	Button,
	Checkbox,
	IconButton,
	Modal,
	Stack,
	styled,
	TextField,
	Typography,
	useNotification,
} from "@semoss/ui";
import { useChat } from "@/hooks";
import type { Agent, App, Engine, Toolbox } from "@/types";

export interface WorkspaceModalProps {
	open: boolean;
	onClose: (newAgentId?: string) => void;
	agentInfo: Agent | null;
}

const StyledModal = styled(Modal)(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(2),
	borderRadius: "12px !important",
	padding: `${theme.spacing(2)} ${theme.spacing(1)}`,
}));

const StyledModalContent = styled(Modal.Content)(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(1),
	padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
}));

const StyledTitle = styled(Modal.Content)(({ theme }) => ({
	padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
}));

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

/**
 * Renders a modal to create a new agent
 *
 * @component
 */
export const WorkspaceModal = ({
	open,
	onClose,
	agentInfo,
}: WorkspaceModalProps) => {
	/**
	 * Library Hooks
	 */
	const notification = useNotification();
	const { chat } = useChat();
	const getApps = usePixel<(Engine | App)[]>(
		`MyEngineProject (metaKeys = ["tag", "description"], metaFilters=[{"tag":["MCP"]}], type=["PROJECT", "STORAGE", "DATABASE", "FUNCTION"], filterWord=[""])`,
		{
			data: [],
		},
	);

	/**
	 * State
	 */
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [tools, setTools] = useState([]);
	const { handleSubmit, control, watch } = useForm<
		Pick<Agent, "name" | "system_prompt" | "description"> & {
			tools: Toolbox[];
		}
	>({
		defaultValues: {
			name: "",
			system_prompt: "",
			description: "",
			tools: [],
		},
	});

	/**
	 * Method that is called to create the app
	 */
	const onSubmit = handleSubmit(async (data) => {
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

	/**
	 * Effects
	 */
	useEffect(() => {
		if (getApps.status !== "SUCCESS") {
			setIsLoading(true);
			return;
		}

		const tools = getApps.data.map((tool) => getTool(tool));
		setTools(tools);
		setIsLoading(false);
	}, [getApps.status, getApps.data]);

	/**
	 * Constants
	 */
	const isCreatingNew = agentInfo === null;
	const isFormValid = !!watch("name");

	return (
		<StyledModal open={open} fullWidth>
			<StyledTitle>
				<Stack direction="row" justifyContent="space-between">
					<Typography variant="h6">
						{isCreatingNew ? "Create Agent" : "View Agent"}
					</Typography>
					<IconButton size="small" onClick={() => onClose()}>
						<Close />
					</IconButton>
				</Stack>
			</StyledTitle>
			<form onSubmit={onSubmit}>
				<StyledModalContent>
					{isCreatingNew ? (
						<Stack direction="column" spacing={1.5}>
							<Controller
								name={"name"}
								control={control}
								rules={{ required: true }}
								render={({ field }) => {
									return (
										<TextField
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
								name={"description"}
								control={control}
								rules={{ required: false }}
								render={({ field }) => {
									return (
										<TextField
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
								name={"system_prompt"}
								control={control}
								rules={{}}
								render={({ field }) => {
									return (
										<TextField
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
								name={"tools"}
								control={control}
								rules={{}}
								render={({ field }) => {
									return (
										<Autocomplete
											fullWidth
											multiple
											disableCloseOnSelect
											disabled={isLoading}
											options={tools}
											isOptionEqualToValue={(
												option,
												value,
											) => option.id === value.id}
											filterOptions={() => {
												return [
													{
														name: "Select All",
														all: true,
													},
													...tools,
												];
											}}
											value={field.value || []}
											onChange={(_, val) => {
												let newVal = val;
												if (
													val.find(
														(option) => option.all,
													)
												)
													newVal =
														tools.length ===
														field?.value?.length
															? []
															: tools;

												field.onChange(newVal);
											}}
											getOptionLabel={(option) =>
												option.name
											}
											renderOption={(
												props,
												option,
												{ selected },
											) => {
												const { key, ...optionProps } =
													props;
												return (
													<li
														key={key}
														{...optionProps}
													>
														<Checkbox
															checked={
																option.all
																	? !!(
																			field
																				?.value
																				?.length ===
																			tools?.length
																		)
																	: selected
															}
														/>
														{option.name}
													</li>
												);
											}}
											renderInput={(params) => (
												<TextField
													{...params}
													label="Use These Tools"
													placeholder="Tools"
												/>
											)}
										/>
									);
								}}
							/>
						</Stack>
					) : (
						<Stack direction="column" spacing={1}>
							<TextField
								variant="outlined"
								label="Name"
								disabled
								value={agentInfo.name}
							/>
							<TextField
								variant="outlined"
								label="ID"
								disabled
								value={agentInfo.workspace_id}
							/>
							<TextField
								variant="outlined"
								label="Description"
								disabled
								value={agentInfo.description}
							/>
							<TextField
								variant="outlined"
								label="Context"
								disabled
								value={agentInfo.system_prompt}
							/>
							<TextField
								variant="outlined"
								label="Date Created"
								disabled
								value={agentInfo.date_created}
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
		</StyledModal>
	);
};
