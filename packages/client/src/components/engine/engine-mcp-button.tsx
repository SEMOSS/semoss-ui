import { Bot, Loader2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useNotification } from "@semoss/ui";
import {
	Button,
	Checkbox,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	ScrollArea,
} from "@semoss/ui/next";
import { useEngine, useRootStore } from "@/hooks";

type MCPTool = {
	className: string;
	generated: boolean;
	name: string;
	package: string;
};

export const EngineMCPButton = () => {
	const { monolithStore } = useRootStore();
	const navigate = useNavigate();
	const { active } = useEngine();
	const notification = useNotification();
	const [searchParams, setSearchParams] = useSearchParams();

	const [openGenerateMCP, setOpenGenerateMCP] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [tools, setTools] = useState<MCPTool[]>([]);
	const [selectedTools, setSelectedTools] = useState<string[]>([]);
	// Keep track of tools that were ALREADY generated to disable them
	const [previouslyGeneratedTools, setPreviouslyGeneratedTools] = useState<
		string[]
	>([]);
	const [isLoading, setIsLoading] = useState(false);

	// Reset state when dialog opens/closes
	const handleOpenChange = (open: boolean) => {
		setOpenGenerateMCP(open);
		if (!open) {
			setSearchQuery("");
			setTools([]);
			setSelectedTools([]);
			setPreviouslyGeneratedTools([]);
		}
	};

	const toggleTool = (name: string, isChecked: boolean) => {
		// 1. Update the UI state of the list
		setTools((prevTools) =>
			prevTools.map((tool) =>
				tool.name === name ? { ...tool, generated: isChecked } : tool,
			),
		);

		// 2. Track newly selected tools for the API call
		if (isChecked) {
			setSelectedTools((prev) => [...prev, name]);
		} else {
			setSelectedTools((prev) =>
				prev.filter((toolName) => toolName !== name),
			);
		}
	};

	const handleGenerateMCP = async () => {
		try {
			// Combine previously generated tools with newly selected ones if needed,
			// or just send the ones that need generation.
			// Based on typical logic, we likely want to send everything that IS currently active.
			// However, your original logic sent [...generatedTools, ...selectedTools].
			// Since 'selectedTools' only tracks *new* selections in this updated logic,
			// we merge them.
			const allActiveTools = [
				...previouslyGeneratedTools,
				...selectedTools,
			].map((t) => `"${t}"`); // Quote the strings for the pixel query

			const response = await monolithStore.runQuery(
				`MakePixelMCP(project="${active.id}", reactor=[${allActiveTools.join(
					",",
				)}]);`,
			);

			const { output } = response.pixelReturn[0];
			if (!output) {
				throw new Error("No output from MCP generation");
			}

			notification.add({
				color: "success",
				message: "MCP generation initiated successfully.",
			});

			active.updateCanGenerateMCP(false);
			navigate("files?mcp=generate_mcp");
		} catch (e) {
			notification.add({
				color: "error",
				message: (e as Error)?.message ?? String(e),
			});
		} finally {
			handleOpenChange(false);
		}
	};

	const getTools = async () => {
		if (!active?.id) {
			console.warn("No active engine ID found.");
			return;
		}

		setIsLoading(true);
		try {
			const response = await monolithStore.runQuery(
				`GetEngineReactors(engine=["${active.id}"])`,
			);

			const pixelReturn = response?.pixelReturn?.[0];

			if (!pixelReturn) {
				throw new Error("Invalid response structure from monolith");
			}

			const { output } = pixelReturn;

			if (Array.isArray(output)) {
				console.log("MCP Tools fetched:", output);
				const fetchedTools = output as MCPTool[];
				setTools(fetchedTools);

				// Identify which tools were ALREADY generated from the backend
				const preGenerated = fetchedTools
					.filter((tool) => tool.generated)
					.map((tool) => tool.name);
				setPreviouslyGeneratedTools(preGenerated);
			} else {
				console.warn("MCP Tools output is not an array:", output);
				setTools([]);
			}
		} catch (e) {
			console.error("Failed to fetch MCP tools:", e);
			setTools([]);
		} finally {
			setIsLoading(false);
		}
	};
	// triggered from the child MCP UI editor component
	const mcpInternalAction = searchParams.get("addMCPTools");

	useEffect(() => {
		if (mcpInternalAction) {
			setOpenGenerateMCP(true);
			searchParams.delete("addMCPTools");
			setSearchParams(searchParams);
		}
		if (openGenerateMCP) {
			getTools();
		}
	}, [openGenerateMCP, active?.id, mcpInternalAction]);

	const filteredTools = tools.filter((tool) =>
		tool.name.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const isGenerateMode = active.canGenerateMCP;

	return (
		<>
			{isGenerateMode ? (
				<Button
					variant="outline"
					size="lg"
                    onClick={() => setOpenGenerateMCP(true)}
                    data-testid="generate-mcp-btn"
				>
					<div className="flex flex-row items-center">
						<Bot className="mr-2" />
						Generate MCP
					</div>
				</Button>
			) : (
				<Button
					variant="outline"
					size="lg"
					onClick={() => navigate("files?mcp=revert_mcp")}
					data-testid="revert-mcp-btn"
				>
					<div className="flex items-center">
						<Bot className="mr-2" />
						Revert MCP
					</div>
				</Button>
			)}
			<Dialog open={openGenerateMCP} onOpenChange={handleOpenChange}>
				<DialogContent
					className="gap-3 p-6 sm:max-w-[800px]"
					data-testid="mcp-dialog-content"
				>
					<DialogHeader>
						<DialogTitle className="font-semibold text-xl">
							Select Tool
						</DialogTitle>
					</DialogHeader>

					<div className="overflow-hidden rounded-lg border border-border bg-background">
						<div className="mx-2 mt-2 flex items-center rounded-md border border-border bg-background px-3 py-3">
							<Search className="mr-2 h-5 w-5 text-muted-foreground" />
							<input
								className="flex h-5 w-full bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
								placeholder="Search"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								data-testid="mcp-tool-search-input"
							/>
						</div>

						<ScrollArea className="h-[200px] bg-background p-1">
							<div
								className="flex flex-col gap-0.5 p-1"
								data-testid="mcp-tools-list"
							>
								{isLoading ? (
									<div
										className="flex h-[150px] w-full items-center justify-center text-muted-foreground"
										data-testid="mcp-loading-state"
									>
										<Loader2 className="mr-2 h-6 w-6 animate-spin" />
										<span>Loading tools...</span>
									</div>
								) : filteredTools.length > 0 ? (
									filteredTools.map((tool) => {
										const isPreGenerated =
											previouslyGeneratedTools.includes(
												tool.name,
											);
										return (
											<label
												key={tool.name}
												htmlFor={tool.name}
												className="flex cursor-pointer items-center space-x-3 rounded-md p-2.5 transition-colors focus-within:bg-accent focus-within:text-accent-foreground hover:bg-accent hover:text-accent-foreground"
												data-testid={`mcp-tool-row-${tool.name}`}
											>
												<Checkbox
													id={tool.name}
													checked={tool.generated}
													onCheckedChange={(value) =>
														toggleTool(
															tool.name,
															value as boolean,
														)
													}
													className="h-5 w-5 border-2 border-input data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
													disabled={isPreGenerated}
													data-testid={`mcp-tool-checkbox-${tool.name}`}
												/>
												<span className="font-medium text-foreground text-sm leading-none">
													{tool.name}
												</span>
											</label>
										);
									})
								) : (
									<div
										className="p-4 text-center text-muted-foreground text-sm"
										data-testid="mcp-empty-state"
									>
										No tools found.
									</div>
								)}
							</div>
						</ScrollArea>
					</div>

					<DialogFooter className="gap-2 sm:gap-2">
						<Button
							variant="outline"
							onClick={() => handleOpenChange(false)}
							className="h-10 border-border px-4 text-foreground hover:bg-accent hover:text-accent-foreground"
							data-testid="mcp-cancel-btn"
						>
							Cancel
						</Button>

						<Button
							type="submit"
							disabled={isLoading || selectedTools.length === 0}
							className="h-10 bg-primary px-4 text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
							onClick={handleGenerateMCP}
							data-testid="mcp-submit-btn"
						>
							Generate MCP
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};
