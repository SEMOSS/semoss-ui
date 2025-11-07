import { useEffect, useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useDebouncedValue, usePixel } from "@semoss/sdk/react";
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
	toast,
} from "@semoss/ui/next";
import { useChat } from "@/hooks";
import type { MCP, Workspace } from "@/types";

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
	 * Library Hooks
	 */
	const { chat } = useChat();
	const getWorkspace = usePixel<Workspace>(
		workspaceId ? `GetWorkspace(${JSON.stringify(workspaceId)});` : null,
		{ data: null },
	);

	/**
	 * IDs
	 */
	const nameId = useId();
	const descriptionId = useId();
	const contextId = useId();

	/**
	 * State
	 */
	const [isLoadingMcps, setIsLoadingMcps] = useState<boolean>(false);
	const [isLoadingSubmit, setIsLoadingSubmit] = useState<boolean>(false);
	const [mcpMap, setMcpMap] = useState<Record<string, Record<string, MCP>>>(
		{},
	);
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
	const [searchWord] = useState<string>("");
	const debouncedSearchWord = useDebouncedValue(searchWord);

	/**
	 * Method that is called to create the app
	 */
	const onSubmit = handleSubmit(async (data) => {
		try {
			// start the loading screen
			setIsLoadingSubmit(true);

			const output = await (isCreatingNew
				? chat.addWorkspace(data)
				: null);

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
		const fetchMCPs = async () => {
			setIsLoadingMcps(true);
			try {
				const mcpMap = await chat.getMcpMap(debouncedSearchWord);
				setMcpMap(mcpMap);
			} catch (e) {
				console.error(e);

				toast.error(e.message);
			} finally {
				setIsLoadingMcps(false);
			}
		};
		fetchMCPs();
	}, [chat.getMcpMap, debouncedSearchWord]);

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
	const mcpArray: MCP[] = Object.values(mcpMap).flatMap(Object.values);
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

									return (
										<Field>
											<FieldLabel>
												Use These Tools
											</FieldLabel>
											<div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
												{/* Individual tool options */}
												{mcpArray.map((mcp) => (
													<div
														key={mcp.id}
														className="flex items-center space-x-2"
													>
														<Checkbox
															id={`tool-${mcp.id}`}
															checked={selectedMCPIds.includes(
																mcp.id,
															)}
															onCheckedChange={(
																checked,
															) => {
																if (checked) {
																	field.onChange(
																		[
																			...field.value,
																			mcp,
																		],
																	);
																} else {
																	field.onChange(
																		field.value.filter(
																			(
																				mcpInArr,
																			) =>
																				mcpInArr.id !==
																				mcp.id,
																		),
																	);
																}
															}}
															disabled={isLoading}
														/>
														<Label
															htmlFor={`tool-${mcp.id}`}
															className="cursor-pointer font-normal text-sm"
														>
															{mcp.name}
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
