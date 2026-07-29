import { ChevronDown, ChevronRight, Plus, X } from "lucide-react";
import { useState } from "react";
import { Checkbox, Input, Select } from "@/components/ui";
import type { TargetArea as TargetAreaType } from "@/types/dashboard";
import { ColorPicker } from "../shared/ColorPicker";
import { ResetButton } from "../shared/ResetButton";

interface TargetAreaProps {
	value?: TargetAreaType[];
	onChange: (areas: TargetAreaType[]) => void;
	onReset: () => void;
}

const NAME_POSITIONS = [
	{ value: "insideTop", label: "Inside top" },
	{ value: "insideBottom", label: "Inside bottom" },
	{ value: "insideLeft", label: "Inside left" },
	{ value: "insideRight", label: "Inside right" },
] as const;

const EMPTY_FORM = {
	y1: "",
	y2: "",
	name: "",
	showName: false,
	namePosition: "insideTop" as TargetAreaType["namePosition"],
	fontSize: 11,
	fontColor: "#64748b",
	color: "#6366f1",
	opacity: 0.85,
};

export function TargetArea({ value = [], onChange, onReset }: TargetAreaProps) {
	const [form, setForm] = useState(EMPTY_FORM);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [listOpen, setListOpen] = useState(true);

	const patch = (updates: Partial<typeof EMPTY_FORM>) =>
		setForm((f) => ({ ...f, ...updates }));

	const handleEditClick = (area: TargetAreaType) => {
		setEditingId(area.id);
		setForm({
			y1: area.y1 !== undefined ? String(area.y1) : "",
			y2: area.y2 !== undefined ? String(area.y2) : "",
			name: area.name ?? "",
			showName: area.showName ?? false,
			namePosition: area.namePosition ?? "insideTop",
			fontSize: area.fontSize ?? 11,
			fontColor: area.fontColor ?? "#64748b",
			color: area.color ?? "#6366f1",
			opacity: area.opacity ?? 0.85,
		});
	};

	const handleSubmit = () => {
		const entry: TargetAreaType = {
			id: editingId ?? crypto.randomUUID(),
			y1: form.y1 !== "" ? Number(form.y1) : undefined,
			y2: form.y2 !== "" ? Number(form.y2) : undefined,
			name: form.name || undefined,
			showName: form.showName || undefined,
			namePosition: form.showName ? form.namePosition : undefined,
			fontSize: form.fontSize !== 11 ? form.fontSize : undefined,
			fontColor:
				form.fontColor !== "#64748b" ? form.fontColor : undefined,
			color: form.color,
			opacity: form.opacity,
		};
		if (editingId) {
			onChange(value.map((a) => (a.id === editingId ? entry : a)));
		} else {
			onChange([...value, entry]);
		}
		setEditingId(null);
		setForm(EMPTY_FORM);
	};

	const handleRemove = (id: string) => {
		onChange(value.filter((a) => a.id !== id));
		if (editingId === id) {
			setEditingId(null);
			setForm(EMPTY_FORM);
		}
	};

	return (
		<div className="space-y-3">
			{/* Applied list — accordion, hidden when empty */}
			{value.length > 0 && (
				<div className="overflow-hidden rounded border border-stone-100">
					<button
						type="button"
						onClick={() => setListOpen((o) => !o)}
						className="flex w-full items-center justify-between bg-stone-50 px-2 py-1.5 transition-colors hover:bg-stone-100"
					>
						<span className="font-medium text-stone-600 text-xs">
							Applied ({value.length})
						</span>
						{listOpen ? (
							<ChevronDown className="h-3.5 w-3.5 text-stone-400" />
						) : (
							<ChevronRight className="h-3.5 w-3.5 text-stone-400" />
						)}
					</button>
					{listOpen && (
						<div className="max-h-40 divide-y divide-stone-50 overflow-y-auto">
							{value.map((area) => (
								<div
									key={area.id}
									className={`flex cursor-pointer items-center gap-2 px-2 py-1.5 text-xs hover:bg-stone-50 ${editingId === area.id ? "bg-indigo-50" : ""}`}
									onClick={() => handleEditClick(area)}
								>
									<div
										className="h-4 w-4 flex-shrink-0 rounded border border-stone-200"
										style={{
											backgroundColor:
												area.color ?? "#6366f1",
											opacity: area.opacity ?? 0.85,
										}}
									/>
									<span className="flex-1 truncate text-stone-600">
										Y = {area.y1 ?? "—"} – {area.y2 ?? "—"}
										{area.name ? ` · ${area.name}` : ""}
									</span>
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											handleRemove(area.id);
										}}
										className="flex-shrink-0 text-stone-400 hover:text-red-500"
									>
										<X className="h-3 w-3" />
									</button>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Form */}
			<div className="space-y-3 rounded border border-stone-100 bg-stone-50/50 p-3">
				<p className="font-semibold text-stone-600 text-xs">
					{editingId ? "Edit area" : "Add area"}
				</p>

				<div className="grid grid-cols-2 gap-2">
					<div>
						<label className="mb-1 block text-stone-500 text-xs">
							Y start
						</label>
						<Input
							type="number"
							value={form.y1}
							onChange={(e) => patch({ y1: e.target.value })}
							placeholder="0"
							className="w-full rounded border border-stone-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
						/>
					</div>
					<div>
						<label className="mb-1 block text-stone-500 text-xs">
							Y end
						</label>
						<Input
							type="number"
							value={form.y2}
							onChange={(e) => patch({ y2: e.target.value })}
							placeholder="100"
							className="w-full rounded border border-stone-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
						/>
					</div>
				</div>

				<div>
					<label className="mb-1 block text-stone-500 text-xs">
						Area name
					</label>
					<Input
						type="text"
						value={form.name}
						onChange={(e) => patch({ name: e.target.value })}
						placeholder="Optional label"
						className="w-full rounded border border-stone-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
					/>
				</div>

				<label className="flex cursor-pointer items-center gap-2">
					<Checkbox
						type="checkbox"
						checked={form.showName}
						onChange={(e) => patch({ showName: e.target.checked })}
						className="h-3.5 w-3.5 rounded border-stone-300 text-indigo-600"
					/>
					<span className="text-stone-600 text-xs">
						Show name on chart
					</span>
				</label>

				{form.showName && (
					<div>
						<label className="mb-1 block text-stone-500 text-xs">
							Name position
						</label>
						<Select
							value={form.namePosition}
							onChange={(e) =>
								patch({
									namePosition: e.target
										.value as TargetAreaType["namePosition"],
								})
							}
							className="w-full rounded border border-stone-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
						>
							{NAME_POSITIONS.map((p) => (
								<option key={p.value} value={p.value}>
									{p.label}
								</option>
							))}
						</Select>
					</div>
				)}

				<div className="grid grid-cols-2 gap-2">
					<div>
						<label className="mb-1 block text-stone-500 text-xs">
							Font size
						</label>
						<Input
							type="number"
							value={form.fontSize}
							onChange={(e) =>
								patch({ fontSize: Number(e.target.value) })
							}
							min={8}
							max={24}
							className="w-full rounded border border-stone-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
						/>
					</div>
					<div>
						<label className="mb-1 block text-stone-500 text-xs">
							Opacity
						</label>
						<Input
							type="range"
							value={form.opacity}
							onChange={(e) =>
								patch({ opacity: Number(e.target.value) })
							}
							min={0.01}
							max={1}
							step={0.01}
							className="mt-1 w-full"
						/>
						<span className="text-stone-400 text-xs">
							{Math.round(form.opacity * 100)}%
						</span>
					</div>
				</div>

				<ColorPicker
					label="Font color"
					value={form.fontColor}
					onChange={(c) => patch({ fontColor: c })}
					defaultColor="#64748b"
				/>
				<ColorPicker
					label="Area color"
					value={form.color}
					onChange={(c) => patch({ color: c })}
					defaultColor="#6366f1"
				/>

				<button
					type="button"
					onClick={handleSubmit}
					disabled={form.y1 === "" || form.y2 === ""}
					className="flex w-full items-center justify-center gap-1.5 rounded bg-indigo-600 px-3 py-1.5 font-medium text-white text-xs transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
				>
					<Plus className="h-3.5 w-3.5" />
					{editingId ? "Update area" : "Add area"}
				</button>
				{editingId && (
					<button
						type="button"
						onClick={() => {
							setEditingId(null);
							setForm(EMPTY_FORM);
						}}
						className="w-full rounded px-3 py-1.5 font-medium text-stone-600 text-xs transition-colors hover:bg-stone-100"
					>
						Cancel edit
					</button>
				)}
			</div>

			<div className="pt-1">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
