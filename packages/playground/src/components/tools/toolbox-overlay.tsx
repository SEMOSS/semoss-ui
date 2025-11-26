import { XIcon } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	Checkbox,
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
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
	useDebouncedValue,
} from "@semoss/ui/next";
import type { App, Engine, MCP, MCPConfig } from "@/types";
import { engineProjectToMCP } from "./utility";

const PLATFORM_URL = import.meta.env.VITE_PLATFORM_URL
	? import.meta.env.VITE_PLATFORM_URL
	: "";

// Styled components removed - using Tailwind CSS classes

interface ToolboxOverlayProps {
	/** Tools loaded into the room */
	mcp: MCPConfig[];

	/** Callback triggered when the tool model is closed */
	onClose: (success: boolean, mcp?: MCP[]) => void;

	/** Open */
	open: boolean;
}

export const ToolboxOverlay: React.FC<ToolboxOverlayProps> = (props) => {
	const { mcp, open, onClose } = props;

	const [updatedMCP, setUpdatedMCP] = useState<Record<string, MCP>>(() => {
		return mcp.reduce((acc, val) => {
			acc[val.id] = val;

			return acc;
		}, {});
	});

	const updatedMCPArray = Object.values(updatedMCP);

	// update when mcps change
	useEffect(() => {
		const mcpMap = mcp.reduce((acc, val) => {
			acc[val.id] = val;

			return acc;
		}, {});

		setUpdatedMCP(mcpMap);
	}, [mcp]);

	const [search, setSearch] = useState<string>("");

	// debounce the input
	const debouncedSearch = useDebouncedValue(search);

	/**
	 * Get all of the available MCPs
	 */
	const getApps = usePixel<(Engine | App)[]>(
		open
			? `MyEngineProject (metaKeys = ["tag", "description"], metaFilters=[{"tag":["MCP"]}], type=["PROJECT", "STORAGE", "DATABASE", "FUNCTION", "VECTOR"], filterWord=["${debouncedSearch}"])`
			: null,
		{
			data: [],
		},
	);
	const availableMCPs = getApps.data.map(engineProjectToMCP);

	/**
	 * Track if the MCP is selected
	 */
	const isMCPSelected = (mcpId: string): boolean => {
		return Object.hasOwn(updatedMCP, mcpId);
	};

	/**
	 * Select a mcp and update the array
	 */
	const onMCPSelect = (mcp: MCP) => {
		// copy for react
		const updated = { ...updatedMCP };

		if (isMCPSelected(mcp.id)) {
			// remove it
			delete updated[mcp.id];
		} else {
			// add it
			updated[mcp.id] = mcp;
		}

		setUpdatedMCP(updated);
	};

	/**
	 * Select a mcp and update the array
	 */
	const onMCPDelete = (mcp: MCP) => {
		// copy for react
		const updated = { ...updatedMCP };

		// remove it
		delete updated[mcp.id];

		setUpdatedMCP(updated);
	};

	return (
		<Dialog open={open} onOpenChange={() => onClose(false)}>
			<DialogContent
				className="sm:max-w-lg"
				aria-describedby="Add an MCP"
			>
				<DialogHeader>
					<DialogTitle>Add MCP</DialogTitle>
					<DialogDescription>
						Add existing or create{" "}
						<a
							className="text-inherit underline"
							target="_blank"
							href={`${PLATFORM_URL}/#/app/new`}
						>
							new
						</a>{" "}
						MCPs for the agent. The agent will use tools to interact
						with external sources to help perform actions and answer
						questions.
					</DialogDescription>
				</DialogHeader>

				<form>
					<FieldGroup>
						<FieldSet>
							<Field>
								<Input
									placeholder="Search"
									value={search}
									onChange={(e) => {
										setSearch(e.target.value);
									}}
								/>
							</Field>
							<Field>
								<FieldLabel>Available Tools</FieldLabel>
								<ScrollArea className="flex h-[300px] max-h-[250px] flex-col items-center justify-center overflow-auto">
									{getApps.status === "LOADING" && (
										<Spinner />
									)}
									{getApps.status === "SUCCESS" && (
										<div className="grid h-full w-full grid-cols-2 gap-2">
											{availableMCPs.map((mcp) => (
												<Label
													key={mcp.id}
													className="flex w-full items-start gap-3 rounded-lg border p-3 hover:bg-accent/50 has-[[aria-checked=true]]:border-primary has-[[aria-checked=true]]:bg-secondary"
												>
													<Checkbox
														checked={isMCPSelected(
															mcp.id,
														)}
														onCheckedChange={() => {
															onMCPSelect(mcp);
														}}
														className="data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-white"
													/>
													<div className="grid gap-1.5 font-normal">
														<p className="font-medium text-sm leading-none">
															{mcp.name}
														</p>
														<p className="min-h-8 text-muted-foreground text-sm">
															{mcp.description}
														</p>
													</div>
												</Label>
											))}
										</div>
									)}
								</ScrollArea>
							</Field>
							{updatedMCPArray.length > 0 && (
								<Field>
									<FieldLabel>Selected Tools</FieldLabel>
									<ScrollArea>
										{updatedMCPArray.map((mcp) => (
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
													onClick={() => {
														// should delete since it is selected
														onMCPDelete(mcp);
													}}
												>
													<XIcon />
												</Button>
											</Badge>
										))}
									</ScrollArea>
								</Field>
							)}
						</FieldSet>
					</FieldGroup>
				</form>
				<DialogFooter>
					<DialogClose asChild>
						<Button variant="ghost" onClick={() => onClose(false)}>
							Cancel
						</Button>
					</DialogClose>
					<DialogClose asChild>
						<Button
							variant="default"
							onClick={() => {
								// get the new keys
								const updated = Object.values(updatedMCP);

								onClose(true, updated);
							}}
						>
							Save
						</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
