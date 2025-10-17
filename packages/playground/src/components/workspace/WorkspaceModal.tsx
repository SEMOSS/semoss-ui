import { Close } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import type { Toolbox, Workspace } from "@/types";

export interface WorkspaceModalProps {
	open: boolean;
	onClose: (newWorkspaceId?: string) => void;
	workspaceInfo: Workspace | null;
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
 * Renders a modal to create a new Workspace
 *
 * @component
 */
export const WorkspaceModal = ({
	open,
	onClose,
	workspaceInfo,
}: WorkspaceModalProps) => {
	/**
	 * Library Hooks
	 */
	const notification = useNotification();
	const { chat } = useChat();

	/**
	 * State
	 */
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [toolMap, setToolMap] = useState<
		Record<string, Record<string, Toolbox>>
	>({});
	const { handleSubmit, control, watch } = useForm<
		Pick<Workspace, "name" | "system_prompt" | "description" | "tools">
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
		const fetchTools = async () => {
			setIsLoading(true);
			try {
				const toolMap = await chat.getToolMap();
				setToolMap(toolMap);
			} catch (e) {
				console.error(e);

				notification.add({
					color: "error",
					message: e.message,
				});
			} finally {
				setIsLoading(false);
			}
		};
		fetchTools();
	}, [chat.getToolMap, notification.add]);

	/**
	 * Constants
	 */
	const isCreatingNew = workspaceInfo === null;
	const isFormValid = !!watch("name");
	const toolsArray = Object.values(toolMap).flatMap(Object.values);

	/**
	 * Types
	 */
	type ToolboxWithAll = Toolbox & { all?: boolean };
	type ToolBoxKeys = Workspace["tools"][number];

	return (
		<StyledModal open={open} fullWidth>
			<StyledTitle>
				<Stack direction="row" justifyContent="space-between">
					<Typography variant="h6">
						{isCreatingNew ? "Create Workspace" : "View Workspace"}
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
												"newWorkspaceModal-textField-name"
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
												"newWorkspaceModal-description-txt"
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
												"newWorkspaceModal-context-txt"
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
											options={toolsArray}
											isOptionEqualToValue={(
												option: Toolbox,
												value: ToolBoxKeys,
											) =>
												option.id === value.id &&
												option.type === value.type
											}
											filterOptions={() => {
												return [
													{
														name: "Select All",
														all: true,
														type: "Select All",
													},
													...toolsArray,
												] as ToolboxWithAll[];
											}}
											value={field.value || []}
											onChange={(
												_,
												val: ToolboxWithAll[],
											) => {
												let newVal = val;
												if (
													val.find(
														(option) => option.all,
													)
												)
													newVal =
														toolsArray.length ===
														field?.value?.length
															? []
															: toolsArray;

												field.onChange(
													newVal.map((tool) => ({
														id: tool.id,
														type: tool.type,
													})),
												); // only send id and type to backend
											}}
											getOptionLabel={(
												option: ToolBoxKeys,
											) =>
												toolMap[option.type]?.[
													option.id
												].name || ""
											}
											getOptionKey={(
												option: ToolBoxKeys,
											) =>
												JSON.stringify({
													id: option.id,
													type: option.type,
												})
											}
											renderOption={(
												props,
												option: ToolboxWithAll,
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
																			toolsArray?.length
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
								value={workspaceInfo.name}
							/>
							<TextField
								variant="outlined"
								label="ID"
								disabled
								value={workspaceInfo.workspace_id}
							/>
							<TextField
								variant="outlined"
								label="Description"
								disabled
								value={workspaceInfo.description}
							/>
							<TextField
								variant="outlined"
								label="Context"
								disabled
								value={workspaceInfo.system_prompt}
							/>
							<TextField
								variant="outlined"
								label="Date Created"
								disabled
								value={workspaceInfo.date_created}
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
							data-testid={"newWorkspaceModal-create-btn"}
						>
							Add
						</Button>
					)}
				</Modal.Actions>
			</form>
		</StyledModal>
	);
};
