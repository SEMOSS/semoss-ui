import { Check, Folder, FolderPlus } from "lucide-react";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@semoss/ui/next";
import { Input } from "@/components/ui";
import type { WorkspaceFolder } from "@/services/workspaceStore";

/**
 * Multi-folder picker shown on dashboard cards. A dashboard can live in many
 * folders at once (folders are tags). Toggling a folder adds/removes that tag;
 * a new folder can be created inline (it's just a new tag).
 */
export function MoveToFolder({
	folders,
	selected,
	onToggle,
	className,
}: {
	folders: WorkspaceFolder[];
	/** Tags currently on this dashboard. */
	selected: string[];
	/** Add (on=true) or remove (on=false) a folder tag. */
	onToggle: (folderId: string, on: boolean) => void;
	className?: string;
}) {
	const [open, setOpen] = useState(false);
	const [draft, setDraft] = useState("");
	const selectedSet = new Set(selected);

	const addNew = () => {
		const name = draft.trim();
		if (!name) return;
		onToggle(name, true);
		setDraft("");
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					title="Folders"
					onClick={(e) => {
						e.stopPropagation();
						e.preventDefault();
					}}
					className={
						className ??
						"rounded-md p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
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
				<div className="max-h-52 overflow-y-auto">
					{folders.length === 0 && (
						<p className="px-3 py-1.5 text-stone-400 text-xs">
							No folders yet
						</p>
					)}
					{folders.map((f) => {
						const on = selectedSet.has(f.id);
						return (
							<button
								key={f.id}
								onClick={(e) => {
									e.stopPropagation();
									e.preventDefault();
									onToggle(f.id, !on);
								}}
								className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] transition-colors hover:bg-stone-50 ${on ? "font-semibold text-indigo-600" : "text-stone-700"}`}
							>
								<span
									className={`grid h-4 w-4 flex-shrink-0 place-items-center rounded border ${on ? "border-indigo-500 bg-indigo-500 text-white" : "border-stone-300"}`}
								>
									{on && <Check className="h-3 w-3" />}
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
