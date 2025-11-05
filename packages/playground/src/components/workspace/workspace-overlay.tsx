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
	console.log(workspaceId, getWorkspace.data);

	/**
	 * IDs
	 */
	const nameId = useId();
	const descriptionId = useId();
	const contextId = useId();

	/**
	 * State
	 */
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [mcpMap, setMcpMap] = useState<Record<string, Record<string, MCP>>>(
		{},
	);
	const { handleSubmit, control, watch } = useForm<
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
			setIsLoading(true);

			const output = await chat.addWorkspace(data);
			// get new app id and return in the onclose
			onClose(output);
		} catch (e) {
			console.error(e);

			toast.error(e.message);
		} finally {
			// stop the loading screen
			setIsLoading(false);
		}
	});

	/**
	 * Effects
	 */
	useEffect(() => {
		const fetchMCPs = async () => {
			setIsLoading(true);
			try {
				const mcpMap = await chat.getMcpMap(debouncedSearchWord);
				setMcpMap(mcpMap);
			} catch (e) {
				console.error(e);

				toast.error(e.message);
			} finally {
				setIsLoading(false);
			}
		};
		fetchMCPs();
	}, [chat.getMcpMap, debouncedSearchWord]);

	/**
	 * Constants
	 */
	const isCreatingNew = workspaceId === null;
	const isFormValid = !!watch("name");
	const mcpArray: MCP[] = Object.values(mcpMap).flatMap(Object.values);

	return (
		<Dialog open={open} onOpenChange={() => onClose()}>
			<DialogContent
				aria-describedby="Edit the workspace"
				className="sm:max-w-lg"
			>
				<DialogHeader>
					<DialogTitle>
						{isCreatingNew ? "Create Workspace" : "View Workspace"}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={onSubmit}>
					{isCreatingNew ? (
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
													System prompt
												</FieldLabel>
												<Textarea
													id={contextId}
													placeholder="Systemt prompt"
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
											field.value.map((mcp) => mcp.id) ||
											[];

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
																	if (
																		checked
																	) {
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
																disabled={
																	isLoading
																}
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
					) : (
						<FieldSet>
							<FieldGroup>
								<Field>
									<FieldLabel>Name</FieldLabel>
									<Input
										disabled
										value={getWorkspace.data?.name}
									/>
								</Field>
								<Field>
									<FieldLabel>ID</FieldLabel>
									<Input
										disabled
										value={getWorkspace.data?.workspace_id}
									/>
								</Field>
								<Field>
									<FieldLabel>Description</FieldLabel>
									<Input
										disabled
										value={getWorkspace.data?.description}
									/>
								</Field>
								<Field>
									<FieldLabel>System prompt</FieldLabel>
									<Textarea
										disabled
										value={getWorkspace.data?.system_prompt}
										rows={4}
									/>
								</Field>
								<Field>
									<FieldLabel>Date Created</FieldLabel>
									<Input
										disabled
										value={getWorkspace.data?.date_created}
									/>
								</Field>
							</FieldGroup>
						</FieldSet>
					)}
					<DialogFooter>
						<Button variant="ghost" onClick={() => onClose()}>
							Cancel
						</Button>
						{isCreatingNew && (
							<Button
								type="submit"
								disabled={isLoading || !isFormValid}
								data-testid="newWorkspaceModal-create-btn"
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
