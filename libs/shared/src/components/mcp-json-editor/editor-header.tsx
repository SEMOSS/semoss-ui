import { Maximize2, Minimize2, Save, Search, X } from "lucide-react";
import type React from "react";
import {
	Badge,
	Button,
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
	InputGroupText,
} from "@semoss/ui/next";
import type { EditorHeaderProps } from "./types";

export const EditorHeader: React.FC<EditorHeaderProps> = ({
	functionCount,
	deletedCount = 0,
	searchQuery,
	debouncedSearch = "",
	showExpandAll = true,
	showSave = true,
	showSearch = true,
	expandAll = false,
	hasChanges = false,
	onExpandAll,
	onSave,
	onSearchChange,
	onSearchClear,
	saveShortcut = "Ctrl+S / Cmd+S",
}) => {
	return (
		<div className="sticky top-0 z-50 mb-6 rounded-lg border bg-card/95 p-4 shadow-sm backdrop-blur-sm">
			{/* Top Row: Function Count, Actions */}
			<div className="mb-3 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Badge color="info" className="px-2 py-1 text-xs">
						{functionCount}{" "}
						{functionCount === 1 ? "Function" : "Functions"}
					</Badge>
					{deletedCount > 0 && (
						<Badge color="error" className="px-2 py-1 text-xs">
							{deletedCount} Pending Deletion
						</Badge>
					)}
					{debouncedSearch && (
						<span className="text-muted-foreground text-xs">
							(filtered)
						</span>
					)}
				</div>
				<div className="flex items-center gap-2">
					{showExpandAll && onExpandAll && (
						<Button
							variant="outline"
							size="sm"
							onClick={onExpandAll}
							className="flex items-center gap-1.5 border-border bg-background text-foreground hover:bg-accent hover:text-foreground"
						>
							{expandAll ? (
								<Minimize2 size={14} />
							) : (
								<Maximize2 size={14} />
							)}
							<span className="hidden sm:inline">
								{expandAll ? "Collapse All" : "Expand All"}
							</span>
						</Button>
					)}
					{showSave && onSave && (
						<Button
							size="sm"
							color="primary"
							onClick={onSave}
							disabled={!hasChanges}
							title={saveShortcut}
							className="flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
						>
							<Save size={14} />
							<span>Save</span>
						</Button>
					)}
				</div>
			</div>

			{/* Search Bar */}
			{showSearch && (
				<InputGroup>
					<InputGroupAddon align="inline-start">
						<InputGroupText>
							<Search
								size={18}
								className="text-muted-foreground"
							/>
						</InputGroupText>
					</InputGroupAddon>
					<InputGroupInput
						value={searchQuery}
						onChange={(e) => onSearchChange?.(e.target.value)}
						placeholder="Search functions by name, title, or description..."
						className="text-foreground text-sm"
					/>
					{searchQuery && (
						<InputGroupAddon align="inline-end">
							<InputGroupButton
								size="icon-xs"
								variant="ghost"
								onClick={onSearchClear}
								className="text-muted-foreground transition-colors hover:text-foreground"
							>
								<X size={18} />
							</InputGroupButton>
						</InputGroupAddon>
					)}
				</InputGroup>
			)}
		</div>
	);
};
