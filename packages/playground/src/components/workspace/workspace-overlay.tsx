import { useEffect, useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useDebouncedValue, usePixel } from "@semoss/sdk/react";
import {
	Button,
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
	MultiSelect,
	Textarea,
	toast,
} from "@semoss/ui/next";
import { engineProjectToMCP } from "@/components";
import { useChat } from "@/hooks";
import type { App, Engine, MCP, MCPConfig, Workspace } from "@/types";

export interface WorkspaceOverlayProps {
	/** Track if the overlay is open */
	open: boolean;

	/** WorkspaceId to view */
	workspaceId: string | null;

	/** On close */
	onClose: (newWorkspaceId?: string) => void;
}

export const WorkspaceOverlay: React.FC<WorkspaceOverlayProps> = ({
	open,
	workspaceId,
	onClose,
}) => {
	/**
	 * IDs
	 */
	const nameId = useId();
	const descriptionId = useId();
	const contextId = useId();

	/**
	 * State
	 */
	const [isLoadingSubmit, setIsLoadingSubmit] = useState<boolean>(false);
	const { handleSubmit, control, watch, reset } = useForm<
		Pick<Workspace, "name" | "system_prompt" | "description" | "mcp">
	>({
		defaultValues: {
			name: "",
			system_prompt: "",
			description: "",
			mcp: [],
		},
	});
	const [searchWord, setSearchWord] = useState<string>("");
	const debouncedSearchWord = useDebouncedValue(searchWord);

	/**
	 * Library Hooks
	 */
	const { chat } = useChat();
	const getWorkspace = usePixel<Workspace>(
		workspaceId ? `GetWorkspace(${JSON.stringify(workspaceId)});` : null,
		{ data: null },
	);
	const getMcps = usePixel<(Engine | App)[]>(
		`MyEngineProject (limit = 20, metaKeys = ["tag", "description"], metaFilters=[{"tag":["MCP"]}], type=["PROJECT", "STORAGE", "DATABASE", "FUNCTION"]${debouncedSearchWord ? `, filterWord=${JSON.stringify(debouncedSearchWord)}` : ""})`,
		{
			data: [],
		},
	);

	/**
	 * Method that is called to create the app
	 */
	const onSubmit = handleSubmit(async (data) => {
		try {
			// start the loading screen
			setIsLoadingSubmit(true);

			const output = await (isCreatingNew
				? chat.addWorkspace(data)
				: chat.editWorkspace(workspaceId, data));

			// get new app id and return in the onclose
			onClose(output);
		} catch (e) {
			console.error(e);

			toast.error(e.message);
		} finally {
			// stop the loading screen
			setIsLoadingSubmit(false);
		}
	});

	/**
	 * Effects
	 */
	useEffect(() => {
		if (getWorkspace.data) {
			const workspace = getWorkspace.data;
			reset({
				name: workspace.name,
				system_prompt: workspace.system_prompt,
				description: workspace.description,
				mcp: workspace.mcp,
			});
		} else {
			reset({
				name: "",
				system_prompt: "",
				description: "",
				mcp: [],
			});
		}
	}, [getWorkspace.data, reset]);

	/**
	 * Constants
	 */
	const isCreatingNew = workspaceId === null;
	const isFormValid = !!watch("name");
	const mcpArray: MCP[] = getMcps.data.map(engineProjectToMCP);
	const isLoadingMcps =
		searchWord !== debouncedSearchWord || getMcps.status !== "SUCCESS";
	const isLoading =
		isLoadingMcps ||
		isLoadingSubmit ||
		(workspaceId && getWorkspace.status !== "SUCCESS");

	return (
		<Dialog open={open} onOpenChange={() => onClose()}>
			<DialogContent
				aria-describedby="Edit the workspace"
				className="sm:max-w-lg"
			>
				<DialogHeader>
					<DialogTitle>
						{isCreatingNew ? "Create Workspace" : "Edit Workspace"}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={onSubmit}>
					<FieldSet>
						<FieldGroup>
							<Controller
								name={"name"}
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
												data-testid="newWorkspaceModal-textField-name"
											/>
										</Field>
									);
								}}
							/>
							<Controller
								name={"description"}
								control={control}
								rules={{ required: false }}
								render={({ field }) => {
									return (
										<Field>
											<FieldLabel htmlFor={descriptionId}>
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
												data-testid="newWorkspaceModal-description-txt"
											/>
										</Field>
									);
								}}
							/>
							<Controller
								name={"system_prompt"}
								control={control}
								rules={{}}
								render={({ field }) => {
									return (
										<Field>
											<FieldLabel htmlFor={contextId}>
												Instructions
											</FieldLabel>
											<Textarea
												id={contextId}
												placeholder="Instructons"
												value={field.value || ""}
												onChange={(e) =>
													field.onChange(
														e.target.value,
													)
												}
												rows={4}
												data-testid="newWorkspaceModal-system_prompt-txt"
											/>
										</Field>
									);
								}}
							/>
							<Controller
								name={"mcp"}
								control={control}
								rules={{}}
								render={({ field }) => {
									const selectedMCPIds =
										field.value?.map((mcp) => mcp.id) || [];
									const optionsMap: Record<
										string,
										MCPConfig
									> = {};
									mcpArray.forEach((mcp) => {
										optionsMap[mcp.id] = mcp;
									});
									field.value.forEach((mcp) => {
										if (!optionsMap[mcp.id]) {
											optionsMap[mcp.id] = mcp;
										}
									});

									return (
										<Field>
											<FieldLabel>
												Use These MCPs
											</FieldLabel>
											<MultiSelect
												options={Object.values(
													optionsMap,
												).map((mcp) => ({
													label: mcp.name,
													value: mcp.id,
												}))}
												onValueChange={(newVals) => {
													field.onChange(
														newVals.map((id) =>
															mcpArray.find(
																(mcp) =>
																	mcp.id ===
																	id,
															),
														),
													);
												}}
												value={selectedMCPIds}
												placeholder="Select MCPs"
												hideSelectAll
												searchValue={searchWord}
												setSearchValue={setSearchWord}
											/>
										</Field>
									);
								}}
							/>
						</FieldGroup>
					</FieldSet>
					<DialogFooter>
						<Button variant="ghost" onClick={() => onClose()}>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isLoading || !isFormValid}
							data-testid="newWorkspaceModal-create-btn"
						>
							{isCreatingNew ? "Add" : "Save"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};
