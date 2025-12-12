import { XIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";
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

interface WorkspaceOverlayProps {
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
	const instructionId = useId();

	/**
	 * State
	 */
	const [name, setName] = useState<string>("");
	const [description, setDescription] = useState<string>("");
	const [instructions, setInstructions] = useState<string>("");
	const [selectedMCPMap, setSelectedMCPMap] = useState<
		Record<string, MCPConfig>
	>({});

	const [isLoadingSubmit, setIsLoadingSubmit] = useState<boolean>(false);
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

	// reset on open
	useEffect(() => {
		if (!open) {
			return;
		}

		if (workspaceId && getWorkspace.data) {
			setName(getWorkspace.data.name);
			setDescription(getWorkspace.data.description || "");
			setInstructions(getWorkspace.data.system_prompt || "");
			const initialMCPMap = getWorkspace.data.mcp.reduce(
				(acc, val) => {
					acc[val.id] = val;
					return acc;
				},
				{} as Record<string, MCPConfig>,
			);
			setSelectedMCPMap(initialMCPMap);
			return;
		} else {
			setName("");
			setDescription("");
			setInstructions("");
			setSelectedMCPMap({});
		}
	}, [open, workspaceId, getWorkspace.data]);

	/**
	 * Constants
	 */
	const isCreatingNew = workspaceId === null;
	const mcpMap = getMcps.data.reduce(
		(acc, engineProject) => {
			const mcp = engineProjectToMCP(engineProject);
			acc[mcp.id] = mcp;
			return acc;
		},
		{} as Record<string, MCP>,
	);

	const isLoading =
		getMcps.status === "LOADING" ||
		isLoadingSubmit ||
		(workspaceId && getWorkspace.status !== "SUCCESS");

	const onMCPSelect = (mcp: MCPConfig) => {
		const updatedSelectedMCPMap = { ...selectedMCPMap };
		if (updatedSelectedMCPMap[mcp.id]) {
			delete updatedSelectedMCPMap[mcp.id];
		} else {
			updatedSelectedMCPMap[mcp.id] = mcp;
		}
		setSelectedMCPMap(updatedSelectedMCPMap);
	};

	/**
	 * Method that is called to create the app
	 */
	const onSubmit = async () => {
		try {
			// start the loading screen
			setIsLoadingSubmit(true);

			const data = {
				name: name,
				system_prompt: instructions,
				description: description,
				mcp: Object.values(selectedMCPMap).map((mcp) => ({
					id: mcp.id,
					type: mcp.type,
					name: mcp.name,
				})),
			};

			let output = "";
			if (isCreatingNew) {
				output = await chat.addWorkspace(data);
			} else {
				output = await chat.editWorkspace(workspaceId, data);
			}

			// get new app id and return in the onclose
			onClose(output);
		} catch (e) {
			console.error(e);

			toast.error(e.message);
		} finally {
			// stop the loading screen
			setIsLoadingSubmit(false);
		}
	};

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
							<Field>
								<FieldLabel htmlFor={nameId}>Name</FieldLabel>
								<Input
									id={nameId}
									placeholder="Add Name"
									value={name}
									disabled={isLoading}
									onChange={(e) => setName(e.target.value)}
									data-testid="newWorkspaceModal-textField-name"
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor={descriptionId}>
									Description
								</FieldLabel>
								<Input
									id={descriptionId}
									placeholder="Description"
									value={description}
									disabled={isLoading}
									onChange={(e) =>
										setDescription(e.target.value)
									}
									data-testid="newWorkspaceModal-description-txt"
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor={instructionId}>
									Instructions
								</FieldLabel>
								<Textarea
									id={instructionId}
									placeholder="Instructons"
									value={instructions}
									onChange={(e) =>
										setInstructions(e.target.value)
									}
									rows={4}
									data-testid="newWorkspaceModal-system_prompt-txt"
								/>
							</Field>

							<Field>
								<FieldLabel>Use These MCPs</FieldLabel>
								<Input
									placeholder="Search"
									value={searchWord}
									onChange={(e) => {
										setSearchWord(e.target.value);
									}}
								/>
								<ScrollArea className="flex h-[300px] max-h-[250px] flex-col items-center justify-center overflow-auto">
									{getMcps.status === "LOADING" ? (
										<div className="flex h-full w-full items-center justify-center">
											<Spinner />
										</div>
									) : (
										<div className="grid h-full w-full grid-cols-2 gap-2">
											{Object.values(mcpMap).map(
												(mcp) => (
													<Label
														key={mcp.id}
														className="flex w-full items-start gap-3 rounded-lg border p-3 hover:bg-accent/50 has-[[aria-checked=true]]:border-primary has-[[aria-checked=true]]:bg-secondary"
													>
														<Checkbox
															checked={
																!!selectedMCPMap[
																	mcp.id
																]
															}
															onCheckedChange={() =>
																onMCPSelect(mcp)
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
												),
											)}
										</div>
									)}
								</ScrollArea>
								{Object.keys(selectedMCPMap).length > 0 && (
									<>
										<FieldLabel>Selected Tools</FieldLabel>
										<ScrollArea>
											{Object.values(selectedMCPMap).map(
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
																onMCPSelect(mcp)
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
						</FieldGroup>
					</FieldSet>
					<DialogFooter>
						<Button variant="ghost" onClick={() => onClose()}>
							Cancel
						</Button>
						<Button
							disabled={isLoading || !name}
							data-testid="newWorkspaceModal-create-btn"
							onClick={() => {
								onSubmit();
							}}
						>
							{isCreatingNew ? "Add" : "Save"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};
