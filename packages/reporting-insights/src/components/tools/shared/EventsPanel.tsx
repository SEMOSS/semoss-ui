import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Edit2,
	Lock,
	Plus,
	Search,
	Trash2,
	X,
} from "lucide-react";
import { useState } from "react";
import { useVizNames } from "@/contexts/vizNamesContext";
import type {
	EventAction,
	EventTrigger,
	KeyModifier,
	VizEvent,
} from "@/types/dashboard";
import { useWorkspace } from "@/workspace/WorkspaceProvider";

// Constants
const TRIGGER_LABELS: Record<EventTrigger, string> = {
	click: "Click",
	dblclick: "Double Click",
	hover: "Hover",
	mouseout: "Mouse Out",
	keypress: "Key Press",
};

const ACTION_LABELS: Record<EventAction, string> = {
	filter: "Filter Visualization",
	unfilter: "Unfilter Visualization",
	open_url: "Open URL",
	open_app: "Open App",
	custom_query: "Custom Query",
};

const KEY_MODIFIER_LABELS: Record<KeyModifier, string> = {
	ctrl: "Control",
	shift: "Shift",
	alt: "Alt",
};

const EMPTY_EVENT: Omit<VizEvent, "id"> = {
	name: "",
	enabled: true,
	trigger: "click",
	applyTo: "all",
	action: "filter",
};

// Shared viz entry type used throughout this file
type VizEntry = {
	id: string;
	name: string;
	eventParams?: string[];
	sheetName?: string;
};

// Props

interface EventsPanelProps {
	events: VizEvent[];
	onChange: (events: VizEvent[]) => void;
	columns?: string[];
	/** Active drop-zone columns from the source viz — used as the column picker for custom_query mapping. */
	dropZoneColumns?: string[];
	allVisualizations?: VizEntry[];
	/** ID of the visualization that owns this Events panel — pinned as always-selected in specific targeting. */
	hostVizId?: string;
}

// Component
export function EventsPanel({
	events,
	onChange,
	columns = [],
	dropZoneColumns,
	allVisualizations = [],
	hostVizId,
}: EventsPanelProps) {
	const [view, setView] = useState<"list" | "form">("list");
	const [draft, setDraft] = useState<VizEvent>({ id: "", ...EMPTY_EVENT });
	const ws = useWorkspace();
	const workspaceDashboards = ws.dashboards.map(
		(d: { id: string; name: string }) => ({ id: d.id, name: d.name }),
	);

	// Prefer the context (always fresh from sheets state) over the prop chain.
	const contextVizNames = useVizNames();
	const effectiveVizList: VizEntry[] =
		contextVizNames.length > 0 ? contextVizNames : allVisualizations;

	const patch = (updates: Partial<VizEvent>) =>
		setDraft((prev) => ({ ...prev, ...updates }));

	const startAdd = () => {
		setDraft({ id: "", ...EMPTY_EVENT });
		setView("form");
	};

	const startEdit = (ev: VizEvent) => {
		setDraft({ ...ev });
		setView("form");
	};

	const save = () => {
		const id = draft.id || crypto.randomUUID();
		const updated = { ...draft, id };
		if (draft.id) {
			onChange(events.map((e) => (e.id === draft.id ? updated : e)));
		} else {
			onChange([...events, updated]);
		}
		setView("list");
	};

	const toggle = (id: string) =>
		onChange(
			events.map((e) =>
				e.id === id ? { ...e, enabled: !e.enabled } : e,
			),
		);

	const remove = (id: string) => onChange(events.filter((e) => e.id !== id));

	if (view === "form") {
		return (
			<EventForm
				draft={draft}
				patch={patch}
				columns={columns}
				dropZoneColumns={dropZoneColumns}
				allVisualizations={effectiveVizList}
				workspaceDashboards={workspaceDashboards}
				hostVizId={hostVizId}
				onSave={save}
				onCancel={() => setView("list")}
			/>
		);
	}

	return (
		<EventList
			events={events}
			allVisualizations={effectiveVizList}
			onAdd={startAdd}
			onEdit={startEdit}
			onToggle={toggle}
			onRemove={remove}
		/>
	);
}

// List view
function EventList({
	events,
	allVisualizations,
	onAdd,
	onEdit,
	onToggle,
	onRemove,
}: {
	events: VizEvent[];
	allVisualizations: VizEntry[];
	onAdd: () => void;
	onEdit: (ev: VizEvent) => void;
	onToggle: (id: string) => void;
	onRemove: (id: string) => void;
}) {
	// Group by trigger
	const groups = new Map<EventTrigger, VizEvent[]>();
	events.forEach((ev) => {
		if (!groups.has(ev.trigger)) groups.set(ev.trigger, []);
		groups.get(ev.trigger)?.push(ev);
	});

	return (
		<div className="space-y-3 px-1 py-1">
			<p className="text-[10px] text-stone-400 leading-snug">
				Create custom events (trigger and action) and enable / disable
				events.
			</p>

			<button
				type="button"
				onClick={onAdd}
				className="flex w-full items-center justify-center gap-1.5 rounded border border-stone-300 border-dashed px-3 py-1.5 text-stone-500 text-xs transition-colors hover:border-indigo-400 hover:text-indigo-600"
			>
				<Plus className="h-3.5 w-3.5" />
				Add Custom Event
			</button>

			{events.length === 0 && (
				<p className="py-2 text-center text-stone-400 text-xs">
					No events configured
				</p>
			)}

			{([...groups.entries()] as [EventTrigger, VizEvent[]][]).map(
				([trigger, evs]) => (
					<div key={trigger}>
						<p className="mb-1 font-semibold text-[10px] text-stone-400 uppercase tracking-wide">
							{TRIGGER_LABELS[trigger]}
						</p>
						<div className="space-y-1">
							{evs.map((ev) => {
								const targetLabel =
									ev.applyTo === "specific" &&
									ev.targetVizIds?.length
										? ev.targetVizIds
												.map(
													(id) =>
														allVisualizations.find(
															(v) => v.id === id,
														)?.name ?? id,
												)
												.join(", ")
										: "All Visualizations";
								return (
									<div
										key={ev.id}
										className="rounded bg-stone-100 px-2 py-1.5"
									>
										<div className="flex items-center gap-1.5">
											<span
												className={`flex-1 truncate text-xs ${ev.enabled ? "text-stone-700" : "text-stone-400 line-through"}`}
											>
												{ev.name || (
													<span className="text-stone-400 italic">
														(unnamed)
													</span>
												)}
											</span>
											<span className="shrink-0 text-[10px] text-stone-400">
												{ACTION_LABELS[ev.action]}
											</span>
											<button
												type="button"
												title="Edit"
												onClick={() => onEdit(ev)}
												className="p-0.5 text-stone-400 hover:text-indigo-600"
											>
												<Edit2 className="h-3 w-3" />
											</button>
											<button
												type="button"
												title={
													ev.enabled
														? "Disable"
														: "Enable"
												}
												onClick={() => onToggle(ev.id)}
												className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${ev.enabled ? "bg-indigo-500" : "bg-stone-300"}`}
											>
												<span
													className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform ${ev.enabled ? "translate-x-[14px]" : "translate-x-[2px]"}`}
												/>
											</button>
											<button
												type="button"
												title="Delete"
												onClick={() => onRemove(ev.id)}
												className="p-0.5 text-stone-400 hover:text-red-500"
											>
												<Trash2 className="h-3 w-3" />
											</button>
										</div>
										<p className="mt-0.5 truncate text-[10px] text-stone-400">
											→ {targetLabel}
										</p>
									</div>
								);
							})}
						</div>
					</div>
				),
			)}
		</div>
	);
}

// Two-pane viz picker sheet group (left pane)
function SheetGroup({
	sheetName,
	vizzes,
	onAdd,
}: {
	sheetName: string;
	vizzes: VizEntry[];
	onAdd: (id: string) => void;
}) {
	const [expanded, setExpanded] = useState(true);

	return (
		<div>
			<button
				type="button"
				onClick={() => setExpanded((p) => !p)}
				className="flex w-full items-center gap-1 border-stone-100 border-b bg-stone-50 px-2 py-1 transition-colors hover:bg-stone-100"
			>
				{expanded ? (
					<ChevronDown className="h-3 w-3 shrink-0 text-stone-400" />
				) : (
					<ChevronRight className="h-3 w-3 shrink-0 text-stone-400" />
				)}
				<span className="flex-1 truncate text-left font-semibold text-[10px] text-stone-500 uppercase tracking-wide">
					{sheetName}
				</span>
			</button>
			{expanded &&
				vizzes.map((v) => (
					<button
						key={v.id}
						type="button"
						onClick={() => onAdd(v.id)}
						className="flex w-full items-center gap-1.5 border-stone-50 border-b px-3 py-1 text-left transition-colors hover:bg-indigo-50 hover:text-indigo-700"
					>
						<span className="flex-1 truncate text-stone-600 text-xs">
							{v.name}
						</span>
						<Plus className="h-3 w-3 shrink-0 text-stone-300" />
					</button>
				))}
		</div>
	);
}

// Form view
function EventForm({
	draft,
	patch,
	columns,
	dropZoneColumns,
	allVisualizations,
	workspaceDashboards,
	hostVizId,
	onSave,
	onCancel,
}: {
	draft: VizEvent;
	patch: (updates: Partial<VizEvent>) => void;
	columns: string[];
	dropZoneColumns?: string[];
	allVisualizations: VizEntry[];
	workspaceDashboards: Array<{ id: string; name: string }>;
	hostVizId?: string;
	onSave: () => void;
	onCancel: () => void;
}) {
	const [vizSearch, setVizSearch] = useState("");

	const selectCls =
		"w-full rounded border border-stone-200 px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400";
	const inputCls =
		"w-full rounded border border-stone-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400";
	const labelCls = "block text-xs font-semibold text-stone-600 mb-1";
	const checkRow = "flex items-center gap-2 text-xs text-stone-600";

	// allVisualizations here is already the effective list (effectiveVizList passed from EventsPanel).
	const eventParamVizzes = allVisualizations.filter(
		(v) => (v.eventParams?.length ?? 0) > 0,
	);
	const selectedTargetViz = eventParamVizzes.find(
		(v) => v.id === draft.targetVizId,
	);
	// Prefer active drop-zone columns for the mapping picker; fall back to all query columns.
	const columnChoices = dropZoneColumns?.length ? dropZoneColumns : columns;

	// Save-guard: custom_query requires a target viz + at least one param mapping.
	const customQueryIncomplete =
		draft.action === "custom_query" &&
		(!draft.targetVizId || !draft.columnParamMap?.length);

	// Two-pane viz picker
	const hostViz = hostVizId
		? allVisualizations.find((v) => v.id === hostVizId)
		: undefined;
	const selectedIds = new Set(draft.targetVizIds ?? []);

	const searchLower = vizSearch.toLowerCase();
	const matchesSearch = (v: VizEntry) =>
		!searchLower || v.name.toLowerCase().includes(searchLower);

	// Left pane: not selected and not the host viz
	const availableVizzes = allVisualizations.filter(
		(v) => v.id !== hostVizId && !selectedIds.has(v.id) && matchesSearch(v),
	);

	// Group available by sheet
	const availableBySheet: { sheetName: string; vizzes: VizEntry[] }[] = [];
	for (const v of availableVizzes) {
		const key = v.sheetName ?? "Visualizations";
		const existing = availableBySheet.find((g) => g.sheetName === key);
		if (existing) existing.vizzes.push(v);
		else availableBySheet.push({ sheetName: key, vizzes: [v] });
	}

	// Right pane: selected (excluding host which is pinned separately)
	const selectedVizzes = allVisualizations.filter(
		(v) => v.id !== hostVizId && selectedIds.has(v.id) && matchesSearch(v),
	);

	const addViz = (id: string) =>
		patch({ targetVizIds: [...(draft.targetVizIds ?? []), id] });

	const removeViz = (id: string) =>
		patch({
			targetVizIds: (draft.targetVizIds ?? []).filter((x) => x !== id),
		});

	return (
		<div className="space-y-3 px-1 py-1">
			{/* Back */}
			<button
				type="button"
				onClick={onCancel}
				className="flex items-center gap-1 text-stone-500 text-xs hover:text-stone-700"
			>
				<ChevronLeft className="h-3.5 w-3.5" />
				Back
			</button>

			{/* Event Name */}
			<div>
				<label className={labelCls}>Event Name</label>
				<input
					type="text"
					value={draft.name}
					onChange={(e) => patch({ name: e.target.value })}
					placeholder="e.g. Filter by Region"
					className={inputCls}
				/>
			</div>

			{/* Trigger */}
			<div>
				<label className={labelCls}>Trigger</label>
				<select
					value={draft.trigger}
					onChange={(e) =>
						patch({ trigger: e.target.value as EventTrigger })
					}
					className={selectCls}
				>
					{(
						Object.entries(TRIGGER_LABELS) as [
							EventTrigger,
							string,
						][]
					).map(([v, l]) => (
						<option key={v} value={v}>
							{l}
						</option>
					))}
				</select>
			</div>

			{/* Click / dblclick: optional modifier key */}
			{(draft.trigger === "click" || draft.trigger === "dblclick") && (
				<>
					<label className={checkRow}>
						<input
							type="checkbox"
							checked={!!draft.clickModifier}
							onChange={(e) =>
								patch({
									clickModifier: e.target.checked
										? "ctrl"
										: undefined,
								})
							}
							className="h-3.5 w-3.5 rounded text-indigo-600"
						/>
						Require modifier key
					</label>
					{draft.clickModifier && (
						<div>
							<label className={labelCls}>Modifier Key</label>
							<select
								value={draft.clickModifier}
								onChange={(e) =>
									patch({
										clickModifier: e.target
											.value as KeyModifier,
									})
								}
								className={selectCls}
							>
								{(
									Object.entries(KEY_MODIFIER_LABELS) as [
										KeyModifier,
										string,
									][]
								).map(([v, l]) => (
									<option key={v} value={v}>
										{l}
									</option>
								))}
							</select>
						</div>
					)}
				</>
			)}

			{/* Keypress: capture the key to bind */}
			{draft.trigger === "keypress" && (
				<div>
					<label className={labelCls}>Key Bind</label>
					<input
						type="text"
						readOnly
						placeholder="Click here and press a key…"
						value={draft.keyBind ?? ""}
						onKeyDown={(e) => {
							e.preventDefault();
							patch({ keyBind: e.key });
						}}
						className={`${inputCls} cursor-pointer select-none`}
					/>
					{draft.keyBind && (
						<p className="mt-1 text-[10px] text-stone-400">
							Fires when{" "}
							<kbd className="rounded border border-stone-300 bg-stone-100 px-1 py-0.5 font-mono">
								{draft.keyBind}
							</kbd>{" "}
							is pressed while hovering a data point.
						</p>
					)}
				</div>
			)}

			{/* Apply to */}
			<div>
				<label className={labelCls}>Apply Trigger to</label>
				<select
					value={draft.applyTo}
					onChange={(e) =>
						patch({
							applyTo: e.target.value as "all" | "specific",
							targetVizIds: [],
						})
					}
					className={selectCls}
				>
					<option value="all">All Visualizations</option>
					<option value="specific">Specific Visualizations</option>
				</select>
			</div>

			{/* Two-pane viz picker (specific mode) */}
			{draft.applyTo === "specific" && (
				<div>
					<label className={labelCls}>Select Visualizations</label>
					{/* Search */}
					<div className="relative mb-2">
						<Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-2 h-3 w-3 text-stone-400" />
						<input
							type="text"
							value={vizSearch}
							onChange={(e) => setVizSearch(e.target.value)}
							placeholder="Search visualizations…"
							className="w-full rounded border border-stone-200 py-1 pr-2 pl-6 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
						/>
					</div>
					<div className="flex gap-2">
						{/* Left pane: Available */}
						<div className="min-w-0 flex-1">
							<p className="mb-1 font-semibold text-[10px] text-stone-400 uppercase tracking-wide">
								Available
							</p>
							<div className="max-h-44 overflow-y-auto rounded border border-stone-200">
								{availableBySheet.length > 0 ? (
									availableBySheet.map((g) => (
										<SheetGroup
											key={g.sheetName}
											sheetName={g.sheetName}
											vizzes={g.vizzes}
											onAdd={addViz}
										/>
									))
								) : (
									<p className="py-3 text-center text-[10px] text-stone-400">
										{availableVizzes.length === 0 &&
										!vizSearch
											? "All added"
											: "No matches"}
									</p>
								)}
							</div>
						</div>

						{/* Right pane:Selected */}
						<div className="min-w-0 flex-1">
							<p className="mb-1 font-semibold text-[10px] text-stone-400 uppercase tracking-wide">
								Selected
							</p>
							<div className="max-h-44 overflow-y-auto rounded border border-stone-200">
								{/* Host viz: always pinned */}
								{hostViz &&
									(!searchLower ||
										hostViz.name
											.toLowerCase()
											.includes(searchLower)) && (
										<div className="flex items-center gap-1.5 border-stone-100 border-b bg-stone-50 px-2 py-1.5">
											<Lock className="h-3 w-3 shrink-0 text-stone-400" />
											<span className="flex-1 truncate text-stone-600 text-xs">
												{hostViz.name}
											</span>
										</div>
									)}
								{/* Selected vizzes */}
								{selectedVizzes.map((v) => (
									<div
										key={v.id}
										className="flex items-center gap-1.5 border-stone-50 border-b px-2 py-1.5 hover:bg-stone-50"
									>
										<span className="flex-1 truncate text-stone-600 text-xs">
											{v.name}
										</span>
										<button
											type="button"
											onClick={() => removeViz(v.id)}
											className="p-0.5 text-stone-300 transition-colors hover:text-red-500"
										>
											<X className="h-3 w-3" />
										</button>
									</div>
								))}
								{selectedVizzes.length === 0 &&
									(!hostViz ||
										(searchLower &&
											!hostViz.name
												.toLowerCase()
												.includes(searchLower))) && (
										<p className="py-3 text-center text-[10px] text-stone-400">
											None selected
										</p>
									)}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Event action */}
			<div>
				<label className={labelCls}>Event</label>
				<select
					value={draft.action}
					onChange={(e) =>
						patch({
							action: e.target.value as EventAction,
							targetVizId: undefined,
							columnParamMap: [],
						})
					}
					className={selectCls}
				>
					{(
						Object.entries(ACTION_LABELS) as [EventAction, string][]
					).map(([v, l]) => (
						<option key={v} value={v}>
							{l}
						</option>
					))}
				</select>
			</div>

			{/* Custom Query */}
			{draft.action === "custom_query" && (
				<>
					<div>
						<label className={labelCls}>Target Visualization</label>
						{eventParamVizzes.length === 0 ? (
							<p className="text-stone-400 text-xs italic">
								No visualizations have Event-type parameters.
								Add an Event param to a viz's query first.
							</p>
						) : (
							<select
								value={draft.targetVizId ?? ""}
								onChange={(e) =>
									patch({
										targetVizId:
											e.target.value || undefined,
										columnParamMap: [],
									})
								}
								className={selectCls}
							>
								<option value="">— select target viz —</option>
								{eventParamVizzes.map((v) => (
									<option key={v.id} value={v.id}>
										{v.name}
									</option>
								))}
							</select>
						)}
					</div>

					{selectedTargetViz?.eventParams &&
						selectedTargetViz.eventParams.length > 0 && (
							<div>
								<label className={labelCls}>
									Parameter Mapping
								</label>
								<p className="mb-1.5 text-[10px] text-stone-400">
									Map each event param to a column from the
									clicked row.
								</p>
								<div className="space-y-1.5">
									{selectedTargetViz.eventParams.map(
										(paramName) => {
											const mapping = (
												draft.columnParamMap ?? []
											).find(
												(m) =>
													m.paramName === paramName,
											);
											return (
												<div
													key={paramName}
													className="flex items-center gap-2"
												>
													<span className="min-w-[80px] shrink-0 truncate font-mono text-indigo-600 text-xs">
														{`{{${paramName}}}`}
													</span>
													<span className="shrink-0 text-stone-400 text-xs">
														←
													</span>
													<select
														value={
															mapping?.column ??
															""
														}
														onChange={(e) => {
															const col =
																e.target.value;
															const curr = (
																draft.columnParamMap ??
																[]
															).filter(
																(m) =>
																	m.paramName !==
																	paramName,
															);
															patch({
																columnParamMap:
																	col
																		? [
																				...curr,
																				{
																					paramName,
																					column: col,
																				},
																			]
																		: curr,
															});
														}}
														className={selectCls}
													>
														<option value="">
															— select column —
														</option>
														{columnChoices.map(
															(c) => (
																<option
																	key={c}
																	value={c}
																>
																	{c}
																</option>
															),
														)}
													</select>
												</div>
											);
										},
									)}
								</div>
							</div>
						)}

					{/* Validation hint */}
					{customQueryIncomplete && (
						<p className="text-[11px] text-red-500 leading-snug">
							A target visualization and at least one parameter
							mapping are required before saving.
						</p>
					)}
				</>
			)}

			{/* Open URL */}
			{draft.action === "open_url" && (
				<>
					<div>
						<label className={labelCls}>Open as</label>
						<select
							value={draft.urlTarget ?? "tab"}
							onChange={(e) =>
								patch({
									urlTarget: e.target.value as
										| "tab"
										| "window",
								})
							}
							className={selectCls}
						>
							<option value="tab">New Tab</option>
							<option value="window">New Window</option>
						</select>
					</div>
					<div>
						<label className={labelCls}>URL</label>
						<input
							type="url"
							value={draft.url ?? ""}
							onChange={(e) =>
								patch({ url: e.target.value || undefined })
							}
							placeholder="https://..."
							className={inputCls}
						/>
					</div>
				</>
			)}

			{/* Open App */}
			{draft.action === "open_app" && (
				<div>
					<label className={labelCls}>App</label>
					{workspaceDashboards.length > 0 ? (
						<select
							value={draft.appId ?? ""}
							onChange={(e) => {
								const found = workspaceDashboards.find(
									(d) => d.id === e.target.value,
								);
								patch({
									appId: e.target.value || undefined,
									appName: found?.name,
								});
							}}
							className={selectCls}
						>
							<option value="">— select app —</option>
							{workspaceDashboards.map((d) => (
								<option key={d.id} value={d.id}>
									{d.name}
								</option>
							))}
						</select>
					) : (
						<p className="text-stone-400 text-xs italic">
							No apps available
						</p>
					)}
				</div>
			)}

			{/* Actions */}
			<div className="flex gap-2 pt-1">
				<button
					type="button"
					onClick={onSave}
					disabled={!draft.name.trim() || customQueryIncomplete}
					className="flex-1 rounded bg-indigo-500 px-3 py-1.5 font-medium text-white text-xs transition-colors hover:bg-indigo-600 disabled:opacity-40"
				>
					Save Event
				</button>
				<button
					type="button"
					onClick={onCancel}
					className="flex-1 rounded border border-stone-200 px-3 py-1.5 font-medium text-stone-600 text-xs transition-colors hover:bg-stone-50"
				>
					Cancel
				</button>
			</div>
		</div>
	);
}
