/** biome-ignore-all lint/correctness/useUniqueElementIds: <explanation> */
import {
	ArrowLeft,
	ChevronDown,
	ChevronUp,
	Loader2,
	Sparkles,
	X,
} from "lucide-react";
import {
	type Dispatch,
	type SetStateAction,
	useCallback,
	useMemo,
	useState,
} from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Switch,
	Textarea,
	toast,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";

// ─── Types ────────────────────────────────────────────────────────────────────

type CatalogType =
	| "DATABASE"
	| "MODEL"
	| "VECTOR"
	| "STORAGE"
	| "FUNCTION"
	| "UNKNOWN";

type FieldType = "switch" | "number" | "text" | "textarea" | "select";

interface SelectOption {
	value: string;
	label: string;
}

interface FieldConfig {
	key: string;
	type: FieldType;
	label?: string;
	defaultValue: boolean | number | string;
	placeholder?: string;
	min?: number;
	selectOptions?: SelectOption[];
	showWhen?: string;
	excludeFromPayload?: boolean;
	topLevel?: boolean;
}

interface GenerateWithAIModalProps {
	open: boolean;
	engineId: string;
	engineType: string;
	modelId?: string;
	onBack: () => void;
	onGenerated: (data: { description?: string; tags?: string[] }) => void;
}

interface GenerateSelection {
	description: boolean;
	tags: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DETAILS_SECTION_LABEL = "Additional Details to include while Generating";

// ─── Static Field Configs ─────────────────────────────────────────────────────

const CATALOG_FIELD_CONFIG: Partial<Record<CatalogType, FieldConfig[]>> = {
	DATABASE: [
		{ key: "includeSchema", type: "switch", defaultValue: false },
		{
			key: "enableTableSchemaLimit",
			type: "switch",
			defaultValue: false,
			label: "Table Schema Limit",
			showWhen: "includeSchema",
			excludeFromPayload: true,
		},
		{
			key: "tableSchemaLimit",
			type: "number",
			defaultValue: 5,
			min: 1,
			label: "Set Max Tables",
			showWhen: "enableTableSchemaLimit",
		},
		{
			key: "enableColumnSchemaLimit",
			type: "switch",
			defaultValue: false,
			label: "Column Schema Limit",
			showWhen: "includeSchema",
			excludeFromPayload: true,
		},
		{
			key: "columnSchemaLimit",
			type: "number",
			defaultValue: 10,
			min: 1,
			label: "Set Max Columns",
			showWhen: "enableColumnSchemaLimit",
		},
	],
	VECTOR: [
		{ key: "includeVectorFileNames", type: "switch", defaultValue: false },
		{
			key: "vectorFileLimit",
			type: "number",
			defaultValue: 5,
			min: 1,
			label: "Vector File Limit",
			showWhen: "includeVectorFileNames",
		},
		{ key: "includeVectorChunks", type: "switch", defaultValue: false },
		{
			key: "vectorChunkLimit",
			type: "number",
			defaultValue: 3,
			min: 1,
			label: "Vector Chunk Limit",
			showWhen: "includeVectorChunks",
		},
	],
	STORAGE: [
		{
			key: "storagePath",
			type: "text",
			defaultValue: "",
			label: "Storage Path",
			placeholder: "/path/to/storage",
			topLevel: true,
		},
		{
			key: "filePath",
			type: "text",
			defaultValue: "",
			label: "File Path",
			placeholder: "/path/to/file",
			topLevel: true,
		},
		{ key: "includeStorageFileNames", type: "switch", defaultValue: false },
		{
			key: "storageFileNameLimit",
			type: "number",
			defaultValue: 5,
			min: 1,
			label: "Storage File Name Limit",
			showWhen: "includeStorageFileNames",
		},
		{
			key: "includeStorageFileContent",
			type: "switch",
			defaultValue: false,
		},
		{
			key: "storageFileLimit",
			type: "number",
			defaultValue: 3,
			min: 1,
			label: "Storage File Limit",
			showWhen: "includeStorageFileContent",
		},
		{
			key: "storageCharLimit",
			type: "number",
			defaultValue: 500,
			min: 1,
			label: "Storage Char Limit",
			showWhen: "includeStorageFileContent",
		},
	],
	MODEL: [
		{ key: "includeModelSmssInfo", type: "switch", defaultValue: false },
	],
	FUNCTION: [
		{ key: "includeFunctionSmssInfo", type: "switch", defaultValue: false },
	],
};

const USER_FIELD_CONFIG: FieldConfig[] = [
	{ key: "useExistingDescription", type: "switch", defaultValue: false },
	{
		key: "additionalContext",
		type: "textarea",
		defaultValue: "",
		label: "Additional Context",
		placeholder:
			"Provide additional context to guide metadata generation...",
	},
	{
		key: "tone",
		type: "select",
		defaultValue: "neutral",
		label: "Tone",
		selectOptions: [
			{ value: "neutral", label: "Neutral" },
			{ value: "business", label: "Business" },
			{ value: "scientific", label: "Scientific" },
		],
	},
];

// ─── Pure Helpers ─────────────────────────────────────────────────────────────

const normalizeCatalogType = (engineType: string): CatalogType => {
	const u = engineType.toUpperCase();
	if (u.includes("DATABASE") || u === "DB") return "DATABASE";
	return (
		(["MODEL", "VECTOR", "STORAGE", "FUNCTION"] as const).find((t) =>
			u.includes(t),
		) ?? "UNKNOWN"
	);
};

const camelToLabel = (key: string): string =>
	key
		.replace(/([A-Z])/g, " $1")
		.replace(/^./, (s) => s.toUpperCase())
		.trim();

const buildDefaultState = (fields: FieldConfig[]): Record<string, unknown> =>
	Object.fromEntries(fields.map((f) => [f.key, f.defaultValue]));

const isFieldVisible = (
	field: FieldConfig,
	state: Record<string, unknown>,
	allFields: FieldConfig[],
): boolean => {
	if (!field.showWhen) return true;
	if (!state[field.showWhen]) return false;
	const parent = allFields.find((f) => f.key === field.showWhen);
	return parent ? isFieldVisible(parent, state, allFields) : true;
};

// ─── Component ────────────────────────────────────────────────────────────────

export const GenerateWithAIModal = ({
	open,
	engineId,
	engineType,
	modelId,
	onBack,
	onGenerated,
}: GenerateWithAIModalProps) => {
	const { monolithStore } = useRootStore();

	const catalogType = useMemo(
		() => normalizeCatalogType(engineType),
		[engineType],
	);

	const catalogFields = useMemo(
		() => CATALOG_FIELD_CONFIG[catalogType] ?? [],
		[catalogType],
	);

	const sectionLabel =
		catalogType !== "UNKNOWN" ? DETAILS_SECTION_LABEL : undefined;

	// ── State ──────────────────────────────────────────────────────────────────

	const [selection, setSelection] = useState<GenerateSelection>({
		description: true,
		tags: true,
	});

	const [catalogState, setCatalogState] = useState<Record<string, unknown>>(
		() => buildDefaultState(catalogFields),
	);

	const [userState, setUserState] = useState<Record<string, unknown>>(() =>
		buildDefaultState(USER_FIELD_CONFIG),
	);

	const [catalogExpanded, setCatalogExpanded] = useState(true);
	const [userOptsExpanded, setUserOptsExpanded] = useState(false);
	const [loading, setLoading] = useState(false);

	// ── Reset ──────────────────────────────────────────────────────────────────

	const handleReset = useCallback(() => {
		setSelection({ description: true, tags: true });
		setCatalogState(buildDefaultState(catalogFields));
		setUserState(buildDefaultState(USER_FIELD_CONFIG));
		setCatalogExpanded(true);
		setUserOptsExpanded(false);
	}, [catalogFields]);

	// ── Close — resets all state and dismisses the modal ──────────────────────
	// Called by: X button, outside click, Escape key.
	// NOT called by: Back button (onBack directly) — per spec, back-navigation
	// must preserve state so the user can re-open the child with their options
	// intact after reviewing the parent form.
	const handleClose = useCallback(() => {
		handleReset();
		onBack();
	}, [handleReset, onBack]);

	// ── Pixel Query Builder ────────────────────────────────────────────────────

	const buildPixelQuery = useCallback((): string => {
		const metaKeys = (
			Object.keys(selection) as Array<keyof GenerateSelection>
		).filter((k) => selection[k]);

		const options: Record<string, unknown> = {};

		for (const field of catalogFields) {
			if (field.excludeFromPayload || field.topLevel) continue;
			if (!isFieldVisible(field, catalogState, catalogFields)) continue;
			const val = catalogState[field.key];
			if (field.type === "switch") {
				if (val === true) options[field.key] = true;
			} else if (field.type === "text" || field.type === "textarea") {
				if (String(val ?? "").trim()) options[field.key] = val;
			} else {
				options[field.key] = val;
			}
		}

		for (const field of USER_FIELD_CONFIG) {
			const val = userState[field.key];
			const isDefault =
				field.type === "text" || field.type === "textarea"
					? !String(val ?? "").trim()
					: val === field.defaultValue;
			if (!isDefault) options[field.key] = val;
		}

		let query = `GenerateEngineMetadata(engine=["${engineId}"]`;
		if (modelId) query += `, model=["${modelId}"]`;
		query += `, metaKeys=[${JSON.stringify(metaKeys)}]`;

		for (const field of catalogFields) {
			if (!field.topLevel) continue;
			const val = catalogState[field.key];
			if (val) query += `, ${field.key}=["${String(val)}"]`;
		}

		if (Object.keys(options).length > 0) {
			query += `, options=[${JSON.stringify(options)}]`;
		}

		query += `)`;
		return query;
	}, [catalogFields, catalogState, userState, selection, engineId, modelId]);

	// ── Generate ───────────────────────────────────────────────────────────────

	const handleGenerate = useCallback(async () => {
		const metaKeys = (
			Object.keys(selection) as Array<keyof GenerateSelection>
		).filter((k) => selection[k]);

		if (metaKeys.length === 0) {
			toast.info("Please select at least one field to generate.");
			return;
		}

		setLoading(true);
		try {
			const response = await monolithStore.runQuery(buildPixelQuery());
			const { output, operationType } = response.pixelReturn[0];

			if (operationType.indexOf("ERROR") > -1) {
				toast.error(output as string);
				return;
			}

			const generatedMetadata = (output as Record<string, unknown>)
				?.generated_metadata as Record<string, unknown> | undefined;

			if (!generatedMetadata) {
				toast.error("No metadata was returned by the API.");
				return;
			}

			const result: { description?: string; tags?: string[] } = {};

			if (selection.description && generatedMetadata.description) {
				result.description = String(generatedMetadata.description);
			}

			if (selection.tags && generatedMetadata.tags) {
				result.tags = Array.isArray(generatedMetadata.tags)
					? (generatedMetadata.tags as string[])
					: [String(generatedMetadata.tags)];
			}

			toast.success("Metadata generated successfully!");
			onGenerated(result);
		} catch (error: unknown) {
			toast.error(
				`Error generating ${engineType} metadata: ${(error as Error).message}`,
			);
		} finally {
			setLoading(false);
		}
	}, [selection, buildPixelQuery, monolithStore, engineType, onGenerated]);

	// ── Generic Field Renderer ─────────────────────────────────────────────────

	const renderFields = useCallback(
		(
			fields: FieldConfig[],
			state: Record<string, unknown>,
			setState: Dispatch<SetStateAction<Record<string, unknown>>>,
		) =>
			fields.map((field) => {
				if (!isFieldVisible(field, state, fields)) return null;

				const displayLabel = field.label ?? camelToLabel(field.key);
				const fieldId = `field-${field.key}`;
				const onChange = (
					e: React.ChangeEvent<
						HTMLInputElement | HTMLTextAreaElement
					>,
				) => setState((p) => ({ ...p, [field.key]: e.target.value }));

				switch (field.type) {
					case "switch":
						return (
							<div
								key={field.key}
								className="flex items-center gap-3"
							>
								<Switch
									id={fieldId}
									checked={Boolean(state[field.key])}
									onCheckedChange={(v) =>
										setState((p) => ({
											...p,
											[field.key]: v,
										}))
									}
								/>
								<Label
									htmlFor={fieldId}
									className="cursor-pointer font-normal text-foreground text-sm"
								>
									{displayLabel}
								</Label>
							</div>
						);

					case "number":
						return (
							<div key={field.key} className="space-y-1.5">
								<Label className="font-medium text-sm">
									{displayLabel}
								</Label>
								<Input
									type="number"
									min={field.min ?? 1}
									value={Number(state[field.key])}
									onChange={(e) =>
										setState((p) => ({
											...p,
											[field.key]: Math.max(
												field.min ?? 1,
												Number(e.target.value),
											),
										}))
									}
								/>
							</div>
						);

					case "text":
					case "textarea":
						return (
							<div key={field.key} className="space-y-1.5">
								<Label
									htmlFor={fieldId}
									className="font-medium text-sm"
								>
									{displayLabel}
								</Label>
								{field.type === "textarea" ? (
									<Textarea
										id={fieldId}
										value={String(state[field.key] ?? "")}
										onChange={onChange}
										placeholder={field.placeholder}
										className="min-h-[72px] resize-none"
									/>
								) : (
									<Input
										id={fieldId}
										type="text"
										value={String(state[field.key] ?? "")}
										onChange={onChange}
										placeholder={field.placeholder}
									/>
								)}
							</div>
						);

					case "select":
						return (
							<div key={field.key} className="space-y-1.5">
								<Label
									htmlFor={fieldId}
									className="font-medium text-sm"
								>
									{displayLabel}
								</Label>
								<Select
									value={String(state[field.key] ?? "")}
									onValueChange={(v) =>
										setState((p) => ({
											...p,
											[field.key]: v,
										}))
									}
								>
									<SelectTrigger
										id={fieldId}
										className="w-full"
									>
										<SelectValue
											placeholder={`Select ${displayLabel.toLowerCase()}`}
										/>
									</SelectTrigger>
									<SelectContent className="w-full">
										{field.selectOptions?.map((opt) => (
											<SelectItem
												key={opt.value}
												value={opt.value}
											>
												{opt.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						);

					default:
						return null;
				}
			}),
		[],
	);

	// ── Render ─────────────────────────────────────────────────────────────────

	return (
		<Dialog
			open={open}
			// onOpenChange fires for outside-click and Escape only —
			// NOT when parent programmatically sets open=false via onBack().
			onOpenChange={(isOpen) => !isOpen && handleClose()}
		>
			<DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-2xl [&>button.absolute]:hidden">
				<DialogHeader>
					<div className="flex items-center gap-1">
						{/* Back — intentionally calls onBack directly (no reset) */}
						<Button
							variant="ghost"
							size="icon"
							className="-ml-3 size-8 shrink-0 rounded-full"
							onClick={onBack}
							aria-label="Go back"
						>
							<ArrowLeft className="size-4" />
						</Button>
						<DialogTitle className="flex-1 font-semibold text-base">
							Generate with AI
						</DialogTitle>
						{/* X — calls handleClose (resets + dismisses) */}
						<Button
							variant="ghost"
							size="icon"
							className="-mr-2 size-8 shrink-0 rounded-full"
							onClick={handleClose}
							aria-label="Close"
						>
							<X className="size-5" />
						</Button>
					</div>
				</DialogHeader>

				<div className="flex-1 overflow-y-scroll">
					<div className="py-3 pt-0">
						<p className="mb-4 font-normal text-foreground text-sm">
							Select what you would like to generate
						</p>
						<div className="space-y-3">
							{(
								Object.keys(selection) as Array<
									keyof GenerateSelection
								>
							).map((key) => (
								<div
									key={key}
									className="flex items-center gap-2.5"
								>
									<input
										type="checkbox"
										id={`gen-${key}`}
										checked={selection[key]}
										onChange={(e) =>
											setSelection((prev) => ({
												...prev,
												[key]: e.target.checked,
											}))
										}
										className="size-4 cursor-pointer accent-primary"
									/>
									<Label
										htmlFor={`gen-${key}`}
										className="cursor-pointer font-normal text-sm"
									>
										{key.charAt(0).toUpperCase() +
											key.slice(1)}
									</Label>
								</div>
							))}
						</div>
					</div>

					{sectionLabel && (
						<>
							<div className="border-t" />
							<div className="py-3">
								<button
									type="button"
									className="flex w-full items-center justify-between font-normal text-foreground text-sm"
									onClick={() =>
										setCatalogExpanded((prev) => !prev)
									}
								>
									<span>{sectionLabel}</span>
									{catalogExpanded ? (
										<ChevronUp className="size-4 shrink-0 text-muted-foreground" />
									) : (
										<ChevronDown className="size-4 shrink-0 text-muted-foreground" />
									)}
								</button>
								{catalogExpanded && (
									<div className="mt-4 space-y-4">
										{renderFields(
											catalogFields,
											catalogState,
											setCatalogState,
										)}
									</div>
								)}
							</div>
						</>
					)}

					<div className="border-t" />

					<div className="py-3">
						<button
							type="button"
							className="flex w-full items-center justify-between font-normal text-foreground text-sm"
							onClick={() => setUserOptsExpanded((prev) => !prev)}
						>
							<span>
								User-Specific Options to include while
								Generating
							</span>
							{userOptsExpanded ? (
								<ChevronUp className="size-4 shrink-0 text-muted-foreground" />
							) : (
								<ChevronDown className="size-4 shrink-0 text-muted-foreground" />
							)}
						</button>
						{userOptsExpanded && (
							<div className="mt-4 space-y-4">
								{renderFields(
									USER_FIELD_CONFIG,
									userState,
									setUserState,
								)}
							</div>
						)}
					</div>
				</div>

				<DialogFooter className="border-t pt-4">
					<Button
						variant="outline"
						onClick={handleReset}
						disabled={loading}
					>
						Reset
					</Button>
					<Button
						variant="default"
						onClick={handleGenerate}
						disabled={
							loading || !Object.values(selection).some(Boolean)
						}
					>
						{loading ? (
							<>
								<Loader2 className="size-4 animate-spin" />
								Generating...
							</>
						) : (
							<>
								<Sparkles className="size-4" />
								Generate
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
