import { Folder, Inbox, LayoutGrid, Pencil, Trash2 } from "lucide-react";
import { type ElementType, useState } from "react";
import { Input } from "@/components/ui";
import type { WorkspaceFolder } from "@/services/workspaceStore";

export type FolderSel = "all" | "unfiled" | string;

/**
 * Left-rail folder navigator. Folders ARE tags — they appear automatically when a
 * dashboard is tagged, so there's no "create empty folder" here. Select / rename /
 * delete are handled here; the parent owns persistence (rename/delete map to tag
 * operations across every dashboard carrying that tag).
 */
export function FolderRail({
	folders,
	counts,
	total,
	selected,
	onSelect,
	onRename,
	onDelete,
	allLabel = "All",
	allIcon = LayoutGrid,
}: {
	folders: WorkspaceFolder[];
	counts: { map: Map<string, number>; unfiled: number };
	total: number;
	selected: FolderSel;
	onSelect: (s: FolderSel) => void;
	onRename: (id: string, name: string) => void;
	onDelete: (id: string) => void;
	allLabel?: string;
	allIcon?: ElementType;
}) {
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editName, setEditName] = useState("");

	const nameTaken = (name: string, exceptId?: string) =>
		folders.some(
			(f) =>
				f.id !== exceptId &&
				f.name.trim().toLowerCase() === name.trim().toLowerCase(),
		);

	const commitRename = () => {
		if (editingId && editName.trim() && !nameTaken(editName, editingId))
			onRename(editingId, editName.trim());
		setEditingId(null);
		setEditName("");
	};

	return (
		<aside className="hidden w-56 flex-shrink-0 flex-col gap-0.5 self-start rounded-xl border border-stone-200 bg-white p-2 shadow-soft sm:flex">
			<RailItem
				icon={allIcon}
				label={allLabel}
				count={total}
				active={selected === "all"}
				onClick={() => onSelect("all")}
			/>
			<RailItem
				icon={Inbox}
				label="Unfiled"
				count={counts.unfiled}
				active={selected === "unfiled"}
				onClick={() => onSelect("unfiled")}
			/>

			<div className="px-2.5 pt-3 pb-1">
				<p className="font-semibold text-[10px] text-stone-400 uppercase tracking-widest">
					Folders (tags)
				</p>
			</div>

			{/* Folder list — scrolls internally if tall */}
			<div className="max-h-[55vh] overflow-y-auto">
				{folders.length === 0 && (
					<p className="px-2.5 py-1.5 text-[11px] text-stone-400">
						Tag a dashboard to create a folder.
					</p>
				)}
				{folders.map((f) =>
					editingId === f.id ? (
						<Input
							key={f.id}
							autoFocus
							value={editName}
							onChange={(e) => setEditName(e.target.value)}
							onBlur={commitRename}
							onKeyDown={(e) => {
								if (e.key === "Enter") commitRename();
								if (e.key === "Escape") setEditingId(null);
							}}
							className="mx-0.5 my-0.5 w-[calc(100%-4px)] rounded-md border border-indigo-300 bg-white px-2 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
						/>
					) : (
						<div
							key={f.id}
							className={`group flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 font-medium text-[13px] transition-colors ${
								selected === f.id
									? "bg-indigo-50 text-indigo-700"
									: "text-stone-600 hover:bg-stone-100"
							}`}
							onClick={() => onSelect(f.id)}
						>
							<Folder
								className={`h-4 w-4 flex-shrink-0 ${selected === f.id ? "text-indigo-500" : "text-stone-400"}`}
							/>
							<span className="min-w-0 flex-1 truncate">
								{f.name}
							</span>
							<span className="flex-shrink-0 text-[11px] text-stone-400 tabular-nums group-hover:hidden">
								{counts.map.get(f.id) ?? 0}
							</span>
							<span className="hidden flex-shrink-0 items-center gap-0.5 group-hover:flex">
								<button
									onClick={(e) => {
										e.stopPropagation();
										setEditingId(f.id);
										setEditName(f.name);
									}}
									title="Rename"
									className="rounded p-0.5 text-stone-400 hover:text-indigo-600"
								>
									<Pencil className="h-3 w-3" />
								</button>
								<button
									onClick={(e) => {
										e.stopPropagation();
										onDelete(f.id);
									}}
									title="Delete folder"
									className="rounded p-0.5 text-stone-400 hover:text-red-500"
								>
									<Trash2 className="h-3 w-3" />
								</button>
							</span>
						</div>
					),
				)}
			</div>
		</aside>
	);
}

function RailItem({
	icon: Icon,
	label,
	count,
	active,
	onClick,
}: {
	icon: ElementType;
	label: string;
	count: number;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			onClick={onClick}
			className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 font-medium text-[13px] transition-colors ${
				active
					? "bg-indigo-50 text-indigo-700"
					: "text-stone-600 hover:bg-stone-100"
			}`}
		>
			<Icon
				className={`h-4 w-4 flex-shrink-0 ${active ? "text-indigo-500" : "text-stone-400"}`}
			/>
			<span className="min-w-0 flex-1 truncate text-left">{label}</span>
			<span className="flex-shrink-0 text-[11px] text-stone-400 tabular-nums">
				{count}
			</span>
		</button>
	);
}
