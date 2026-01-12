import { Maximize2, Minimize2, Plus, Save } from "lucide-react";
import type React from "react";
import { Badge, Button } from "@semoss/ui/next";
import { SearchBar } from "./search-bar";
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
	handleAddEngineMCPTools,
	saveShortcut = "Ctrl+S / Cmd+S",
}) => {
	return (
		<div className="sticky top-0 z-50 mb-6 rounded-lg border border-gray-200 bg-white/95 p-4 backdrop-blur-sm">
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
						<span className="text-gray-500 text-xs">
							(filtered)
						</span>
					)}
				</div>
				<div className="flex items-center gap-2">
					{handleAddEngineMCPTools && (
						<Button
							variant="ghost"
							size="sm"
							className="text-primary hover:bg-primary/10 hover:text-primary"
							onClick={handleAddEngineMCPTools}
						>
							<Plus />
							<span>Add</span>
						</Button>
					)}
					{showExpandAll && onExpandAll && (
						<Button
							variant="outline"
							size="sm"
							onClick={onExpandAll}
							className="flex items-center gap-1.5"
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
							className="flex items-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
						>
							<Save size={14} />
							<span>Save</span>
						</Button>
					)}
				</div>
			</div>

			{/* Search Bar */}
			{showSearch && (
				<SearchBar
					value={searchQuery}
					onChange={onSearchChange}
					onClear={onSearchClear}
				/>
			)}
		</div>
	);
};
