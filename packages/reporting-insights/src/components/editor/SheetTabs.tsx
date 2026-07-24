/**
 * SheetTabs — the bottom sheet tab bar shared by the main app editor and the
 * portal EditMode. Double-click a tab to rename, click the swatch to recolor,
 * hover to delete (when more than one sheet). Rename state is managed locally so
 * call sites only supply data + callbacks.
 */
import { Pencil, Plus, SlidersHorizontal, X } from "lucide-react";
import { useRef, useState } from "react";
import { Input } from "@/components/ui";

export interface SheetTabItem {
	id: string;
	name: string;
	color?: string;
	/** When true, this is the auto-managed Parameters sheet — styled differently and not deletable/renameable. */
	isParamSheet?: boolean;
}

interface SheetTabsProps {
	sheets: SheetTabItem[];
	activeId: string;
	onSelect: (id: string) => void;
	onRename: (id: string, name: string) => void;
	onColorChange: (id: string, color: string) => void;
	onAdd: () => void;
	onDelete: (id: string) => void;
}

export function SheetTabs({
	sheets,
	activeId,
	onSelect,
	onRename,
	onColorChange,
	onAdd,
	onDelete,
}: SheetTabsProps) {
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editName, setEditName] = useState("");

	const startRename = (s: SheetTabItem) => {
		setEditName(s.name);
		setEditingId(s.id);
	};
	const commitRename = () => {
		if (editingId && editName.trim()) onRename(editingId, editName.trim());
		setEditingId(null);
	};

	return (
		<div className="flex-shrink-0 border-stone-200 border-t bg-white shadow-[0_-2px_6px_rgba(0,0,0,0.06)]">
			<div className="flex items-stretch overflow-x-auto">
				{sheets.map((sheet) => (
					<SheetTab
						key={sheet.id}
						sheet={sheet}
						active={sheet.id === activeId}
						editing={editingId === sheet.id}
						editName={editName}
						canDelete={sheets.length > 1}
						onSelect={() => onSelect(sheet.id)}
						onDoubleClick={() => startRename(sheet)}
						onStartRename={() => startRename(sheet)}
						onEditNameChange={setEditName}
						onEditCommit={commitRename}
						onEditCancel={() => setEditingId(null)}
						onDelete={() => onDelete(sheet.id)}
						onColorChange={(color) =>
							onColorChange(sheet.id, color)
						}
					/>
				))}
				<button
					onClick={onAdd}
					className="flex flex-shrink-0 items-center border-stone-200 border-r px-3 py-2.5 text-stone-400 transition-colors hover:bg-stone-50 hover:text-stone-600"
					title="Add new sheet"
				>
					<Plus className="h-4 w-4" />
				</button>
			</div>
		</div>
	);
}

interface SheetTabProps {
	sheet: SheetTabItem;
	active: boolean;
	editing: boolean;
	editName: string;
	canDelete: boolean;
	onSelect: () => void;
	onDoubleClick: () => void;
	onStartRename: () => void;
	onEditNameChange: (name: string) => void;
	onEditCommit: () => void;
	onEditCancel: () => void;
	onDelete: () => void;
	onColorChange: (color: string) => void;
}

function SheetTab({
	sheet,
	active,
	editing,
	editName,
	canDelete,
	onSelect,
	onDoubleClick,
	onStartRename,
	onEditNameChange,
	onEditCommit,
	onEditCancel,
	onDelete,
	onColorChange,
}: SheetTabProps) {
	const colorInputRef = useRef<HTMLInputElement>(null);
	const tabColor = sheet.isParamSheet
		? "#6366f1"
		: (sheet.color ?? "#3b82f6");

	return (
		<div
			className={`group -mt-px relative flex flex-shrink-0 cursor-pointer select-none items-center gap-1.5 border-stone-200 border-t-2 border-r px-4 py-2.5 transition-colors ${
				active
					? "font-semibold text-stone-900"
					: "border-t-transparent text-stone-500 hover:text-stone-700"
			}`}
			style={
				active
					? {
							borderTopColor: tabColor,
							backgroundColor: tabColor + "26",
						}
					: { backgroundColor: tabColor + "14" }
			}
			onClick={onSelect}
			onDoubleClick={onDoubleClick}
		>
			{sheet.isParamSheet ? (
				// Param sheet: fixed indigo icon instead of color-picker dot
				<SlidersHorizontal className="h-3 w-3 flex-shrink-0 text-indigo-500" />
			) : (
				<>
					<button
						onClick={(e) => {
							e.stopPropagation();
							colorInputRef.current?.click();
						}}
						title="Change tab color"
						className="h-3 w-3 flex-shrink-0 rounded-full ring-1 ring-white ring-offset-0 transition-transform hover:scale-125"
						style={{ backgroundColor: tabColor }}
					/>
					<input
						ref={colorInputRef}
						type="color"
						value={tabColor}
						onChange={(e) => {
							e.stopPropagation();
							onColorChange(e.target.value);
						}}
						onClick={(e) => e.stopPropagation()}
						className="sr-only"
					/>
				</>
			)}

			{editing ? (
				<Input
					autoFocus
					value={editName}
					onChange={(e) => onEditNameChange(e.target.value)}
					onBlur={onEditCommit}
					onKeyDown={(e) => {
						if (e.key === "Enter") onEditCommit();
						if (e.key === "Escape") onEditCancel();
					}}
					onClick={(e) => e.stopPropagation()}
					className="w-24 rounded border border-blue-400 bg-white px-1 py-0 text-sm outline-none"
				/>
			) : (
				<span className="whitespace-nowrap text-sm">{sheet.name}</span>
			)}
			{/* Pencil rename icon — visible for all sheets on hover */}
			{!editing && (
				<button
					onClick={(e) => {
						e.stopPropagation();
						onStartRename();
					}}
					className="rounded p-0.5 text-stone-400 opacity-0 transition-all hover:text-stone-700 group-hover:opacity-100"
					title="Rename sheet"
				>
					<Pencil className="h-3 w-3" />
				</button>
			)}
			{/* Delete — hidden for param sheet and when only one non-param sheet remains */}
			{canDelete && !editing && !sheet.isParamSheet && (
				<button
					onClick={(e) => {
						e.stopPropagation();
						onDelete();
					}}
					className="rounded p-0.5 text-stone-400 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100"
					title="Delete sheet"
				>
					<X className="h-3 w-3" />
				</button>
			)}
		</div>
	);
}
