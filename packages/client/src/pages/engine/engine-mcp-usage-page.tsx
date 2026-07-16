import { Hammer, Wrench } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
	Badge,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	H4,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { McpUsage } from "@/components/shared/mcp-usage";
import { useEngine, useRootStore } from "@/hooks";

interface MCPToolInputProperty {
	title?: string;
	description?: string;
	type?: string;
}

interface MCPToolDefinition {
	name: string;
	title?: string;
	description?: string;
	inputSchema?: {
		properties?: Record<string, MCPToolInputProperty>;
		required?: string[];
	};
}

interface MCPToolsPixelResponse {
	pixelReturn?: {
		operationType?: string[] | string;
		output?:
			| {
					tools?: MCPToolDefinition[];
			  }
			| string;
	}[];
}

const hasPixelError = (operationType?: string[] | string): boolean => {
	if (Array.isArray(operationType)) {
		return operationType.includes("ERROR");
	}

	if (typeof operationType === "string") {
		return operationType.includes("ERROR");
	}

	return false;
};

/**
 * Render MCP tool listing and connection instructions for an engine.
 */
export const EngineMcpUsagePage = () => {
	const { active } = useEngine();
	const { monolithStore } = useRootStore();
	const [mcpTools, setMcpTools] = useState<MCPToolDefinition[]>([]);
	const [mcpToolsLoading, setMcpToolsLoading] = useState(false);
	const [mcpToolsError, setMcpToolsError] = useState("");
	const [generatingMCP, setGeneratingMCP] = useState(false);
	const [openGenerateMcpDialog, setOpenGenerateMcpDialog] = useState(false);
	const canGenerateMCP = active.role === "OWNER" || active.role === "EDIT";

	const fetchMcpTools = useCallback(
		async (engineId: string) => {
			setMcpToolsLoading(true);
			setMcpToolsError("");

			try {
				const response = (await monolithStore.runQuery(
					`GetMCPTools(engine=["${engineId}"]);`,
				)) as MCPToolsPixelResponse;

				const result = response?.pixelReturn?.[0];
				if (hasPixelError(result?.operationType)) {
					const errorMessage =
						typeof result?.output === "string"
							? result.output
							: "Unable to load MCP tools for this engine.";
					setMcpTools([]);
					setMcpToolsError(errorMessage);
					return;
				}

				const output = result?.output;
				const tools =
					typeof output === "object" && output !== null
						? output.tools
						: undefined;
				setMcpTools(Array.isArray(tools) ? tools : []);
			} catch (error) {
				const message =
					error instanceof Error
						? error.message
						: "Unable to load MCP tools for this engine.";
				setMcpTools([]);
				setMcpToolsError(message);
			} finally {
				setMcpToolsLoading(false);
			}
		},
		[monolithStore],
	);

	useEffect(() => {
		if (!active.id) {
			return;
		}

		fetchMcpTools(active.id);
	}, [active.id, fetchMcpTools]);

	const handleMCPClick = async () => {
		setGeneratingMCP(true);
		try {
			const pixel = `MakeEngineMCP(engine="${active.id}");`;
			const { pixelReturn } = await monolithStore.runQuery(pixel);

			if (pixelReturn[0].operationType.includes("ERROR")) {
				throw pixelReturn[0].output as string;
			}

			const existingTags = Array.isArray(active.metadata.tag)
				? (active.metadata.tag as string[])
				: [];
			if (!existingTags.includes("MCP")) {
				active.metadata.tag = [...existingTags, "MCP"];
			}

			toast.success("MCP generated");
			fetchMcpTools(active.id);
		} catch (error) {
			toast.error(error as string);
		} finally {
			setGeneratingMCP(false);
		}
	};

	return (
		<div className="space-y-6">
			{canGenerateMCP && (
				<div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-base p-4 shadow-xs">
					<div>
						<H4>MCP Generation</H4>
						<p className="text-muted-foreground text-sm">
							Generate default tools and connect to this engine as
							an MCP server.
						</p>
					</div>
					<Button
						variant="outline"
						size="lg"
						onClick={() => setOpenGenerateMcpDialog(true)}
						data-testid="make-mcp-btn"
						disabled={generatingMCP}
					>
						<div className="flex flex-row items-center">
							{generatingMCP ? (
								<Spinner className="mr-2 size-4" />
							) : (
								<Hammer className="mr-2 size-4" />
							)}
							{generatingMCP ? "Processing..." : "Generate MCP"}
						</div>
					</Button>
				</div>
			)}

			{canGenerateMCP && (
				<Dialog
					open={openGenerateMcpDialog}
					onOpenChange={setOpenGenerateMcpDialog}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Generate MCP</DialogTitle>
							<DialogDescription>
								This will generate a default MCP for this
								engine. Current MCP Tools will be replaced. Do
								you want to proceed?
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setOpenGenerateMcpDialog(false)}
								disabled={generatingMCP}
							>
								No
							</Button>
							<Button
								onClick={async () => {
									await handleMCPClick();
									setOpenGenerateMcpDialog(false);
								}}
								disabled={generatingMCP}
							>
								Yes
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}

			<div className="rounded-2xl border border-base p-6 shadow-xs">
				<div className="mb-4">
					<H4>Available Tools</H4>
					<p className="text-muted-foreground text-sm">
						These MCP tools are currently exposed by this engine.
					</p>
				</div>

				{mcpToolsLoading && (
					<div className="flex items-center gap-2 text-muted-foreground text-sm">
						<Spinner className="size-4" />
						Loading tools...
					</div>
				)}

				{!mcpToolsLoading && !!mcpToolsError && (
					<div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
						<p className="font-medium text-destructive text-sm">
							Unable to load tools
						</p>
						<p className="mt-1 text-muted-foreground text-sm">
							{mcpToolsError}
						</p>
					</div>
				)}

				{!mcpToolsLoading &&
					!mcpToolsError &&
					mcpTools.length === 0 && (
						<div className="rounded-xl border border-base/70 border-dashed bg-muted/20 p-8 text-center">
							<div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
								<Wrench className="size-5 text-muted-foreground" />
							</div>
							<p className="font-medium text-sm">
								No tools available
							</p>
							<p className="mt-1 text-muted-foreground text-sm">
								This engine does not currently expose MCP tools.
							</p>
						</div>
					)}

				{!mcpToolsLoading && !mcpToolsError && mcpTools.length > 0 && (
					<div className="space-y-3">
						{mcpTools.map((tool) => {
							const toolTitle = tool.title || tool.name;
							const inputProperties =
								tool.inputSchema?.properties || {};
							const requiredInputs =
								tool.inputSchema?.required || [];
							const inputEntries =
								Object.entries(inputProperties);

							return (
								<div
									key={`${tool.name}-${toolTitle}`}
									className="rounded-xl border border-base/80 p-4"
								>
									<div className="flex items-start gap-3">
										<Wrench className="mt-1 size-4 shrink-0 text-muted-foreground" />
										<div className="min-w-0 flex-1">
											<H4 className="leading-tight">
												{toolTitle}
											</H4>
											<p className="mt-1 whitespace-pre-line text-muted-foreground text-sm">
												{tool.description ||
													"No description available."}
											</p>
										</div>
									</div>

									{inputEntries.length > 0 && (
										<details className="mt-3 rounded-lg border border-base/70 border-dashed bg-muted/20 p-3">
											<summary className="cursor-pointer font-medium text-sm">
												View input parameters (
												{inputEntries.length})
											</summary>
											<div className="mt-3 space-y-2">
												{inputEntries.map(
													([
														inputName,
														inputConfig,
													]) => (
														<div
															key={`${tool.name}-${inputName}`}
															className="rounded-md bg-background p-3"
														>
															<div className="flex flex-wrap items-center gap-2">
																<code className="rounded bg-muted px-1.5 py-0.5 text-xs">
																	{inputName}
																</code>
																{inputConfig.type && (
																	<Badge variant="outline">
																		{
																			inputConfig.type
																		}
																	</Badge>
																)}
																{requiredInputs.includes(
																	inputName,
																) && (
																	<Badge variant="secondary">
																		Required
																	</Badge>
																)}
															</div>
															{inputConfig.description && (
																<p className="mt-1 text-muted-foreground text-sm">
																	{
																		inputConfig.description
																	}
																</p>
															)}
														</div>
													),
												)}
											</div>
										</details>
									)}
								</div>
							);
						})}
					</div>
				)}
			</div>

			<McpUsage id={active.id} name={active.name} />
		</div>
	);
};
