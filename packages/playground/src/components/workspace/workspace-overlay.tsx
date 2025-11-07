import { XIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useDebouncedValue, usePixel } from "@semoss/sdk/react";
import {
	Badge,
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
	ScrollArea,
	Spinner,
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
		`MyEngineProject (limit = 20, metaKeys = ["tag", "description"], metaFilters=[{"tag":["MCP"]}], type=["PROJECT", "STORAGE", "DATABASE", "FUNCTION", "VECTOR"]${debouncedSearchWord ? `, filterWord=${JSON.stringify(debouncedSearchWord)}` : ""})`,
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
									const selectedMCPMap: Record<
										string,
										MCPConfig
									> = {};
									field.value?.forEach((mcp) => {
										selectedMCPMap[mcp.id] = mcp;
									});

									const onMCPChange = (mcp: MCPConfig) => {
										const updatedMap = {
											...selectedMCPMap,
										};
										if (updatedMap[mcp.id]) {
											delete updatedMap[mcp.id];
										} else {
											updatedMap[mcp.id] = mcp;
										}
										field.onChange(
											Object.values(updatedMap),
										);
									};

									return (
										<Field>
											<FieldLabel>
												Use These MCPs
											</FieldLabel>
											<Input
												placeholder="Search"
												value={searchWord}
												onChange={(e) => {
													setSearchWord(
														e.target.value,
													);
												}}
											/>
											<ScrollArea className="flex h-[300px] max-h-[250px] flex-col items-center justify-center overflow-auto">
												{isLoadingMcps && <Spinner />}
												<div className="grid h-full w-full grid-cols-2 gap-2">
													{mcpArray.map((mcp) => (
														<Label
															key={mcp.id}
															className="flex w-full items-start gap-3 rounded-lg border p-3 hover:bg-accent/50 has-[[aria-checked=true]]:border-primary has-[[aria-checked=true]]:bg-secondary"
														>
															<Checkbox
																checked={Boolean(
																	selectedMCPMap[
																		mcp.id
																	],
																)}
																onCheckedChange={() =>
																	onMCPChange(
																		mcp,
																	)
																}
																className="data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-white"
															/>
															<div className="grid gap-1.5 font-normal">
																<p className="font-medium text-sm leading-none">
																	{mcp.name}
																</p>
																<p className="min-h-8 text-muted-foreground text-sm">
																	{
																		mcp.description
																	}
																</p>
															</div>
														</Label>
													))}
												</div>
											</ScrollArea>
											{field.value.length > 0 && (
												<>
													<FieldLabel>
														Selected Tools
													</FieldLabel>
													<ScrollArea>
														{field.value.map(
															(mcp) => (
																<Badge
																	key={mcp.id}
																	variant="secondary"
																	className="mr-2 text-sm"
																>
																	{mcp.name}
																	<Button
																		className="ml-1"
																		type="button"
																		variant="ghost"
																		size="icon-sm"
																		onClick={() =>
																			onMCPChange(
																				mcp,
																			)
																		}
																	>
																		<XIcon />
																	</Button>
																</Badge>
															),
														)}
													</ScrollArea>
												</>
											)}
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
