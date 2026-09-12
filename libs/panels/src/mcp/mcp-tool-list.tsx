import { Plus, RotateCcw, Search, X } from "lucide-react";
import {
	Badge,
	Button,
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
	InputGroupText,
	ScrollArea,
} from "@semoss/ui/next";
import {
	getExecutionMode,
	getParamCount,
	getRequiredCount,
} from "./mcp-json-utils";
import type { EditorTool } from "./types";

const EXECUTION_LABELS: Record<string, string> = {
	auto: "auto",
	ask: "ask",
	disabled: "off",
};

export interface MCPToolListProps {
	/** Tools after the search filter has been applied */
	tools: EditorTool[];

	/** Total tool count before filtering, used for the empty state copy */
	totalCount: number;

	selectedId: string | null;

	/** Ids of tools that differ from the last saved state */
	dirtyIds: Set<string>;

	searchQuery: string;

	readOnly?: boolean;

	onSelect: (id: string) => void;
	onSearchChange: (value: string) => void;
	onAddTool: () => void;
	onRestore: (id: string) => void;
}

/**
 * Left rail of the editor. Every tool is visible at a glance with its parameter
 * count, execution mode, and unsaved state, so nothing is hidden behind an
 * accordion the user has to open one at a time.
 */
export const MCPToolList = ({
	tools,
	totalCount,
	selectedId,
	dirtyIds,
	searchQuery,
	readOnly = false,
	onSelect,
	onSearchChange,
	onAddTool,
	onRestore,
}: MCPToolListProps) => (
	<div className="flex h-full min-h-0 flex-col border-r">
		<div className="flex flex-col gap-2 border-b p-3">
			<InputGroup>
				<InputGroupAddon align="inline-start">
					<InputGroupText>
						<Search size={16} className="text-muted-foreground" />
					</InputGroupText>
				</InputGroupAddon>
				<InputGroupInput
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
					placeholder="Search tools and parameters..."
					className="text-foreground text-sm"
				/>
				{searchQuery && (
					<InputGroupAddon align="inline-end">
						<InputGroupButton
							size="icon-xs"
							variant="ghost"
							onClick={() => onSearchChange("")}
							aria-label="Clear search"
							className="text-muted-foreground hover:text-foreground"
						>
							<X size={16} />
						</InputGroupButton>
					</InputGroupAddon>
				)}
			</InputGroup>

			{!readOnly && (
				<Button
					size="sm"
					variant="outline"
					onClick={onAddTool}
					className="flex w-full items-center justify-center gap-1.5"
				>
					<Plus size={14} />
					<span>Add tool</span>
				</Button>
			)}
		</div>

		<ScrollArea className="min-h-0 flex-1">
			<div className="flex flex-col gap-1 p-2">
				{tools.length === 0 && (
					<p className="px-2 py-6 text-center text-muted-foreground text-sm">
						{totalCount === 0
							? "No tools in this file yet."
							: "No tools match your search."}
					</p>
				)}

				{tools.map((entry) => {
					const { tool, id, isDeleted, isNew } = entry;
					const isSelected = id === selectedId;
					const paramCount = getParamCount(tool);
					const requiredCount = getRequiredCount(tool);
					const execution = getExecutionMode(tool);

					return (
						<div
							key={id}
							className={`group flex items-start gap-1 rounded-md border transition-colors ${
								isSelected
									? "border-primary/40 bg-accent"
									: "border-transparent hover:bg-accent/60"
							}`}
						>
							<button
								type="button"
								onClick={() => onSelect(id)}
								className="flex min-w-0 flex-1 cursor-pointer flex-col gap-1 p-2 text-left"
							>
								<span className="flex min-w-0 items-center gap-1.5">
									<span
										className={`truncate font-medium text-sm ${
											isDeleted
												? "text-muted-foreground line-through"
												: "text-foreground"
										}`}
									>
										{tool.title ||
											tool.name ||
											"Untitled tool"}
									</span>
									{dirtyIds.has(id) && !isDeleted && (
										<span
											role="img"
											aria-label="Unsaved changes"
											title="Unsaved changes"
											className="size-1.5 flex-shrink-0 rounded-full bg-primary"
										/>
									)}
								</span>

								<code className="truncate font-mono text-[11px] text-muted-foreground">
									{tool.name || "unnamed"}
								</code>

								<span className="flex flex-wrap items-center gap-1">
									{isNew && (
										<Badge
											variant="secondary"
											className="text-[10px]"
										>
											New
										</Badge>
									)}
									{isDeleted && (
										<Badge
											variant="destructive"
											className="text-[10px]"
										>
											Deleting
										</Badge>
									)}
									<Badge
										variant="outline"
										className="text-[10px]"
									>
										{paramCount}{" "}
										{paramCount === 1 ? "param" : "params"}
									</Badge>
									{requiredCount > 0 && (
										<Badge
											variant="outline"
											className="text-[10px]"
										>
											{requiredCount} req
										</Badge>
									)}
									<Badge
										variant="outline"
										className="text-[10px]"
									>
										{EXECUTION_LABELS[execution] ??
											execution}
									</Badge>
								</span>
							</button>

							{isDeleted && !readOnly && (
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={() => onRestore(id)}
									aria-label={`Restore ${tool.name}`}
									className="mt-2 mr-1 text-muted-foreground hover:text-foreground"
								>
									<RotateCcw size={14} />
								</Button>
							)}
						</div>
					);
				})}
			</div>
		</ScrollArea>
	</div>
);
