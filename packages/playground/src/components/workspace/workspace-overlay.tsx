import { useEffect, useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useDebouncedValue } from "@semoss/sdk/react";
import { useNotification } from "@semoss/ui";
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
import { useChat } from "@/hooks";
import type { MCP, Workspace } from "@/types";

export interface WorkspaceOverlayProps {
	/** Track if the overlay is open */
	open: boolean;

	/** Workspace to edit */
	workspaceInfo: Workspace | null;

	/** On close */
	onClose: (newWorkspaceId?: string) => void;
}

export const WorkspaceOverlay: React.FC<WorkspaceOverlayProps> = ({
	open,
	workspaceInfo,
	onClose,
}) => {
	/**
	 * Library Hooks
	 */
	const notification = useNotification();
	const { chat } = useChat();

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
		const fetchMCPs = async () => {
			setIsLoading(true);
			try {
				const mcpMap = await chat.getMcpMap(debouncedSearchWord);
				setMcpMap(mcpMap);
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
		fetchMCPs();
	}, [chat.getMcpMap, notification.add, debouncedSearchWord]);

	/**
	 * Constants
	 */
	const isCreatingNew = workspaceInfo === null;
	const isFormValid = !!watch("name");
	const mcpArray: MCP[] = Object.values(mcpMap).flatMap(Object.values);

	return (
		<Dialog open={open} onOpenChange={() => onClose()}>
			<DialogContent
				aria-describedby="Edit the agent"
				className="sm:max-w-lg"
			>
				<DialogHeader>
					<DialogTitle>
						{isCreatingNew ? "Create Agent" : "View Agent"}
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
													data-testid="newAgentModal-textField-name"
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
													data-testid="newAgentModal-description-txt"
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
													data-testid="newAgentModal-system_prompt-txt"
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
										value={workspaceInfo.name}
									/>
								</Field>
								<Field>
									<FieldLabel>ID</FieldLabel>
									<Input
										disabled
										value={workspaceInfo.workspace_id}
									/>
								</Field>
								<Field>
									<FieldLabel>Description</FieldLabel>
									<Input
										disabled
										value={workspaceInfo.description}
									/>
								</Field>
								<Field>
									<FieldLabel>System prompt</FieldLabel>
									<Textarea
										disabled
										value={workspaceInfo.system_prompt}
										rows={4}
									/>
								</Field>
								<Field>
									<FieldLabel>Date Created</FieldLabel>
									<Input
										disabled
										value={workspaceInfo.date_created}
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
