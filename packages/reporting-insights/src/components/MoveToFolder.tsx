import { Folder, FolderPlus, Search } from "lucide-react";
import { useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@semoss/ui/next";
import { Input } from "@/components/ui";
import type { WorkspaceFolder } from "@/services/workspaceStore";

/**
 * Single-folder picker shown on dashboard cards. A dashboard lives in exactly
 * one folder at a time. Selecting a folder replaces the previous one; a new
 * folder can be created inline and becomes the selected folder immediately.
 */
export function MoveToFolder({
	folders,
	selected,
	onSelect,
	className,
	disabled,
	disabledTooltip,
}: {
	folders: WorkspaceFolder[];
	/** Tags currently on this dashboard. */
	selected: string[];
	/** Select a folder (replaces current) or pass null to deselect. */
	onSelect: (folderId: string | null) => void;
	className?: string;
	/** When true, the trigger button is non-interactive and shows disabledTooltip on hover. */
	disabled?: boolean;
	disabledTooltip?: string;
}) {
	const [open, setOpen] = useState(false);
	const [draft, setDraft] = useState("");
	const [search, setSearch] = useState("");
	const searchRef = useRef<HTMLInputElement>(null);
	const selectedSet = new Set(selected);

	const filteredFolders = search.trim()
		? folders.filter((f) =>
				f.name.toLowerCase().includes(search.trim().toLowerCase()),
			)
		: folders;

	const addNew = () => {
		const name = draft.trim();
		if (!name) return;
		onSelect(name);
		setDraft("");
	};

	return (
		<Popover
			open={open}
			onOpenChange={(v) => {
				setOpen(v);
				if (!v) setSearch("");
			}}
		>
			<PopoverTrigger asChild>
				<button
					title={
						disabled ? (disabledTooltip ?? "Disabled") : "Folders"
					}
					onClick={
						disabled
							? undefined
							: (e) => {
									e.stopPropagation();
									e.preventDefault();
								}
					}
					disabled={disabled}
					className={
						disabled
							? "cursor-not-allowed rounded-md p-1.5 text-stone-300"
							: (className ??
								"rounded-md p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700")
					}
				>
					<Folder className="h-3.5 w-3.5" />
				</button>
			</PopoverTrigger>
			<PopoverContent
				align="end"
				className="w-52 overflow-hidden p-0 py-1"
				onClick={(e) => {
					e.stopPropagation();
					e.preventDefault();
				}}
			>
				<p className="px-3 py-1 font-semibold text-[10px] text-stone-400 uppercase tracking-widest">
					Folders
				</p>
				{folders.length > 5 && (
					<div className="mx-2 mb-1 flex items-center gap-1.5 rounded-md border border-stone-200 bg-stone-50 px-2 py-1">
						<Search className="h-3 w-3 flex-shrink-0 text-stone-400" />
						<input
							ref={searchRef}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							onMouseDown={(e) => e.stopPropagation()}
							onKeyDown={(e) => {
								if (e.key === "Escape") {
									e.stopPropagation();
									setOpen(false);
									setSearch("");
								}
							}}
							placeholder="Search folders…"
							className="min-w-0 flex-1 bg-transparent text-[12px] text-stone-700 placeholder:text-stone-300 focus:outline-none"
						/>
					</div>
				)}
				<div className="max-h-48 overflow-y-auto">
					{filteredFolders.length === 0 && (
						<p className="px-3 py-1.5 text-stone-400 text-xs">
							{folders.length === 0
								? "No folders yet"
								: "No matches"}
						</p>
					)}
					{filteredFolders.map((f) => {
						const on = selectedSet.has(f.id);
						return (
							<button
								key={f.id}
								onClick={(e) => {
									e.stopPropagation();
									e.preventDefault();
									onSelect(on ? null : f.id);
								}}
								className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] transition-colors hover:bg-stone-50 ${on ? "font-semibold text-indigo-600" : "text-stone-700"}`}
							>
								<span
									className={`grid h-4 w-4 flex-shrink-0 place-items-center rounded-full border ${on ? "border-indigo-500 bg-indigo-500" : "border-stone-300"}`}
								>
									{on && (
										<span className="h-2 w-2 rounded-full bg-white" />
									)}
								</span>
								<span className="min-w-0 flex-1 truncate">
									{f.name}
								</span>
							</button>
						);
					})}
				</div>
				{/* Create a new folder inline */}
				<div className="mt-1 flex items-center gap-1 border-stone-100 border-t px-2 py-1.5">
					<FolderPlus className="h-3.5 w-3.5 flex-shrink-0 text-stone-400" />
					<Input
						value={draft}
						onChange={(e) => setDraft(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								addNew();
							}
							if (e.key === "Escape") setOpen(false);
						}}
						placeholder="New folder…"
						className="min-w-0 flex-1 bg-transparent px-1 py-0.5 text-[13px] text-stone-700 placeholder:text-stone-300 focus:outline-none"
					/>
					{draft.trim() && (
						<button
							onClick={(e) => {
								e.stopPropagation();
								e.preventDefault();
								addNew();
							}}
							className="rounded px-1.5 py-0.5 font-semibold text-[11px] text-indigo-600 hover:bg-indigo-50"
						>
							Add
						</button>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
