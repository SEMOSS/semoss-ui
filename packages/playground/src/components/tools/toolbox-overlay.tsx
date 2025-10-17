import { XIcon } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useDebouncedValue, usePixel } from "@semoss/sdk/react";
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
} from "@semoss/ui/next";
import type { App, Engine, Toolbox } from "@/types";
import { getToolbox } from "./utility";

const PLATFORM_URL = import.meta.env.VITE_PLATFORM_URL
	? import.meta.env.VITE_PLATFORM_URL
	: "";

// Styled components removed - using Tailwind CSS classes

interface ToolboxOverlayProps {
	/** Tools loaded into the room */
	tools: Toolbox[];

	/** Open */
	open: boolean;

	/** Triggered */
	onOpenChange: (open: boolean) => void;

	/** Callback triggered when the tool model is closed */
	onSubmit: (tools?: Toolbox[]) => Promise<void>;
}

export const ToolboxOverlay: React.FC<ToolboxOverlayProps> = (props) => {
	const { tools, open, onOpenChange, onSubmit = () => null } = props;

	const [updatedTools, setUpdatedTools] = useState<Record<string, Toolbox>>(
		() => {
			return tools.reduce((acc, val) => {
				acc[val.id] = val;

				return acc;
			}, {});
		},
	);

	const updatedToolsArray = Object.values(updatedTools);

	// update when tools change
	useEffect(() => {
		const toolsMap = tools.reduce((acc, val) => {
			acc[val.id] = val;

			return acc;
		}, {});

		setUpdatedTools(toolsMap);
	}, [tools]);

	const [search, setSearch] = useState<string>("");

	// debounce the input
	const debouncedSearch = useDebouncedValue(search);

	/**
	 * Get all of the groups
	 */
	const getApps = usePixel<(Engine | App)[]>(
		open
			? `MyEngineProject (metaKeys = ["tag", "description"], metaFilters=[{"tag":["MCP"]}], type=["PROJECT", "STORAGE", "DATABASE", "FUNCTION"], filterWord=["${debouncedSearch}"])`
			: "",
		{
			data: [],
		},
	);

	/**
	 * Track if the tool is selected
	 */
	const isToolSelected = (toolId: string): boolean => {
		return Object.hasOwn(updatedTools, toolId);
	};

	/**
	 * Select a tool and update the arraw
	 */
	const onToolSelect = (tool: Toolbox) => {
		// copy for react
		const updated = { ...updatedTools };

		if (isToolSelected(tool.id)) {
			// remove it
			delete updated[tool.id];
		} else {
			// add it
			updated[tool.id] = tool;
		}

		setUpdatedTools(updated);
	};

	/**
	 * Select a tool and update the arraw
	 */
	const onToolDelete = (t: Toolbox) => {
		// copy for react
		const updated = { ...updatedTools };

		// remove it
		delete updated[t.id];

		setUpdatedTools(updated);
	};

	return (
		<Dialog open={open} onOpenChange={(o) => onOpenChange(o)}>
			<DialogContent
				className="sm:max-w-lg"
				aria-describedby="Add a Toolbox"
			>
				<DialogHeader>
					<DialogTitle>Add Toolbox</DialogTitle>
					<DialogDescription>
						Add existing or create{" "}
						<a
							className="text-inherit underline"
							target="_blank"
							href={`${PLATFORM_URL}/#/app/new`}
						>
							new
						</a>{" "}
						tools for the agent. The agent will use tools to
						interact with external sources to help perform actions
						and answer questions.
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
											{getApps.data.map((item) => {
												const tool = getToolbox(item);

												return (
													<Label
														key={tool.id}
														className="flex w-full items-start gap-3 rounded-lg border p-3 hover:bg-accent/50 has-[[aria-checked=true]]:border-primary has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-primary dark:has-[[aria-checked=true]]:bg-secondary"
													>
														<Checkbox
															checked={isToolSelected(
																tool.id,
															)}
															onCheckedChange={() => {
																onToolSelect(
																	tool,
																);
															}}
															className="data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-white dark:data-[state=checked]:border-primary dark:data-[state=checked]:bg-primary"
														/>
														<div className="grid gap-1.5 font-normal">
															<p className="font-medium text-sm leading-none">
																{tool.name}
															</p>
															<p className="min-h-8 text-muted-foreground text-sm">
																{
																	tool.description
																}
															</p>
														</div>
													</Label>
												);
											})}
										</div>
									)}
								</ScrollArea>
							</Field>
							{updatedToolsArray.length > 0 && (
								<Field>
									<FieldLabel>Selected Tools</FieldLabel>
									<ScrollArea>
										{updatedToolsArray.map((t) => (
											<Badge
												key={t.id}
												variant="secondary"
												className="mr-2 text-sm"
											>
												{t.name}
												<Button
													className="ml-1"
													type="button"
													variant="ghost"
													size="icon-sm"
													onClick={() => {
														// should delete since it is selected
														onToolDelete(t);
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
						<Button
							variant="ghost"
							onClick={() => {
								// get the new keys
								const updated = Object.values(updatedTools);

								onSubmit(updated);
							}}
						>
							Cancel
						</Button>
					</DialogClose>
					<DialogClose asChild>
						<Button
							variant="default"
							onClick={() => {
								// get the new keys
								const updated = Object.values(updatedTools);

								onSubmit(updated);
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
