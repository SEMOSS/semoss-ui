import {
	ChevronDown,
	ChevronRight,
	CircleQuestionMark,
	Search,
	Sparkles,
	TriangleAlert,
	XIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import {
	useCallback,
	useEffect,
	useId,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";
import { Controller, useForm } from "react-hook-form";
import {
	Badge,
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Button,
	Checkbox,
	Input,
	Label,
	P,
	Separator,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { MarkdownEditor } from "@/components/common/MarkdownEditor";
import { GenerateWithAIModal } from "@/components/engine/generate-with-ai-modal";
import { useEngine, usePixel, useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";
import { formatToDataTestId } from "@/utility";

// ─── UnsavedChangesDialog ─────────────────────────────────────────────────────

interface UnsavedChangesDialogProps {
	open: boolean;
	onStay: () => void;
	onLeave: () => void;
	onSaveAndLeave: () => void;
}

const UnsavedChangesDialog = ({
	open,
	onStay,
	onLeave,
	onSaveAndLeave,
}: UnsavedChangesDialogProps) => {
	const titleId = useId();
	const descId = useId();

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && onStay();
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [open, onStay]);

	useEffect(() => {
		if (!open) return;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = "";
		};
	}, [open]);

	if (!open) return null;

	return createPortal(
		<div className="fixed inset-0 z-[9999] flex items-center justify-center">
			<div
				className="absolute inset-0 bg-black/50"
				onClick={onStay}
				aria-hidden="true"
			/>
			<div
				role="alertdialog"
				aria-modal="true"
				aria-labelledby={titleId}
				aria-describedby={descId}
				className="relative z-10 w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-xl"
			>
				<div className="mb-4 flex items-start gap-3">
					<span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10">
						<TriangleAlert className="size-5 text-destructive" />
					</span>
					<div className="flex-1">
						<P
							id={titleId}
							className="font-semibold text-base text-foreground"
						>
							Unsaved Changes
						</P>
						<P
							id={descId}
							className="mt-1 text-muted-foreground text-sm"
						>
							You have unsaved changes that will be lost if you
							leave. Would you like to save before leaving?
						</P>
					</div>
					<Button
						variant="ghost"
						size="icon"
						onClick={onStay}
						aria-label="Close"
						className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
					>
						<XIcon className="size-4" />
					</Button>
				</div>
				<Separator className="mb-4" />
				<div className="flex justify-end gap-2">
					<Button
						variant="outline"
						onClick={onLeave}
						data-testid="unsaved-dialog-leave-btn"
					>
						Leave Anyway
					</Button>
					<Button
						variant="default"
						onClick={onSaveAndLeave}
						data-testid="unsaved-dialog-save-leave-btn"
					>
						Save & Leave
					</Button>
				</div>
			</div>
		</div>,
		document.body,
	);
};

// ─── MultiTypeaheadField ──────────────────────────────────────────────────────

interface MultiTypeaheadFieldProps {
	id: string;
	value: string[];
	onChange: (value: string[]) => void;
	options?: string[];
	placeholder?: string;
	testId?: string;
}

const MultiTypeaheadField = ({
	id,
	value,
	onChange,
	options = [],
	placeholder = "Press enter to add",
	testId,
}: MultiTypeaheadFieldProps) => {
	const [inputValue, setInputValue] = useState("");
	const tags = (Array.isArray(value) ? value : []).filter(
		(t): t is string => typeof t === "string" && t.trim() !== "",
	);

	const addTag = (tag: string) => {
		const trimmed = tag.trim();
		if (trimmed && !tags.includes(trimmed)) {
			onChange([...tags, trimmed]);
			setInputValue("");
		}
	};

	return (
		<div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1.5">
			{tags.map((tag) => (
				<Badge
					key={tag}
					variant="secondary"
					className="flex items-center gap-0.5 px-2 py-0.5 text-sm"
				>
					{tag}
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="size-4 p-0 hover:bg-transparent hover:opacity-70"
						onClick={() => onChange(tags.filter((t) => t !== tag))}
						aria-label={`Remove ${tag}`}
					>
						<XIcon className="size-3" />
					</Button>
				</Badge>
			))}
			<Input
				id={id}
				type="text"
				value={inputValue}
				onChange={(e) => setInputValue(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						e.preventDefault();
						addTag(inputValue);
					}
				}}
				placeholder={tags.length === 0 ? placeholder : ""}
				className="h-auto min-w-[120px] flex-1 border-none bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
				list={options.length > 0 ? `${id}-list` : undefined}
				data-testid={testId}
			/>
			{options.length > 0 && (
				<datalist id={`${id}-list`}>
					{options.map((o) => (
						<option key={o} value={o} />
					))}
				</datalist>
			)}
		</div>
	);
};

// ─── SelectBoxField ───────────────────────────────────────────────────────────

interface SelectBoxFieldProps {
	id: string;
	value: string[];
	onChange: (value: string[]) => void;
	options: string[];
}

const DROPDOWN_MAX_HEIGHT = 260;

const SelectBoxField = ({
	id,
	value,
	onChange,
	options,
}: SelectBoxFieldProps) => {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [listMaxHeight, setListMaxHeight] = useState(192);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({
		visibility: "hidden",
	});

	const selected = (Array.isArray(value) ? value : []).filter(
		Boolean,
	) as string[];
	const filtered = options.filter((o) =>
		o.toLowerCase().includes(search.toLowerCase()),
	);

	const toggle = (option: string) =>
		onChange(
			selected.includes(option)
				? selected.filter((v) => v !== option)
				: [...selected, option],
		);

	const computePosition = useCallback(() => {
		if (!triggerRef.current) return;
		const rect = triggerRef.current.getBoundingClientRect();
		const spaceBelow = window.innerHeight - rect.bottom - 8;
		const spaceAbove = rect.top - 8;
		const up =
			spaceBelow < DROPDOWN_MAX_HEIGHT &&
			spaceAbove >= DROPDOWN_MAX_HEIGHT;
		setListMaxHeight(
			Math.min(192, Math.max(80, (up ? spaceAbove : spaceBelow) - 52)),
		);
		setDropdownStyle({
			position: "fixed",
			left: rect.left,
			width: rect.width,
			zIndex: 9999,
			visibility: "visible",
			...(up
				? { bottom: window.innerHeight - rect.top + 4 }
				: { top: rect.bottom + 4 }),
		});
	}, []);

	useLayoutEffect(() => {
		if (!open) {
			setDropdownStyle({ visibility: "hidden" });
			return;
		}
		computePosition();
	}, [open, computePosition]);

	useEffect(() => {
		if (!open) return;
		window.addEventListener("scroll", computePosition, true);
		window.addEventListener("resize", computePosition);
		return () => {
			window.removeEventListener("scroll", computePosition, true);
			window.removeEventListener("resize", computePosition);
		};
	}, [open, computePosition]);

	useEffect(() => {
		const onOutside = (e: MouseEvent) => {
			const t = e.target as Node;
			if (
				!triggerRef.current?.contains(t) &&
				!dropdownRef.current?.contains(t)
			) {
				setOpen(false);
				setSearch("");
			}
		};
		if (open) document.addEventListener("mousedown", onOutside);
		return () => document.removeEventListener("mousedown", onOutside);
	}, [open]);

	return (
		<div className="relative">
			<Button
				ref={triggerRef}
				type="button"
				id={id}
				variant="outline"
				className="h-auto min-h-10 w-full flex-wrap justify-start gap-1.5 px-2 py-1.5 font-normal"
				onClick={() => setOpen((p) => !p)}
			>
				<span className="flex flex-1 flex-wrap gap-1.5">
					{selected.length === 0 ? (
						<span className="text-muted-foreground text-sm">
							Select...
						</span>
					) : (
						selected.map((v) => (
							<Badge
								key={v}
								variant="secondary"
								className="flex items-center gap-0.5 px-2 py-0.5 text-sm"
							>
								{v}
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="size-4 p-0 hover:bg-transparent hover:opacity-70"
									onClick={(e) => {
										e.stopPropagation();
										onChange(
											selected.filter((sv) => sv !== v),
										);
									}}
									aria-label={`Remove ${v}`}
								>
									<XIcon className="size-3" />
								</Button>
							</Badge>
						))
					)}
				</span>
				<ChevronDown
					className={`size-4 shrink-0 text-muted-foreground transition-transform duration-150 ${
						open ? "rotate-180" : ""
					}`}
				/>
			</Button>

			{open &&
				createPortal(
					<div
						ref={dropdownRef}
						style={dropdownStyle}
						className="rounded-md border border-input bg-popover shadow-md"
					>
						<div className="flex items-center gap-2 border-b px-3 py-2">
							<Search className="size-4 shrink-0 text-muted-foreground" />
							<Input
								autoFocus
								type="text"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Search"
								className="h-auto flex-1 border-none bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
							/>
						</div>
						<div
							className="overflow-y-auto py-1"
							style={{ maxHeight: listMaxHeight }}
						>
							{filtered.length === 0 ? (
								<P className="px-3 py-2 text-muted-foreground text-sm">
									No options found
								</P>
							) : (
								filtered.map((option) => (
									<Label
										key={option}
										htmlFor={`${id}-opt-${option}`}
										className="flex cursor-pointer items-center gap-2.5 px-3 py-2 font-normal hover:bg-accent"
									>
										<Checkbox
											id={`${id}-opt-${option}`}
											checked={selected.includes(option)}
											onCheckedChange={() =>
												toggle(option)
											}
											className="size-4"
										/>
										<span className="text-sm">
											{option}
										</span>
									</Label>
								))
							)}
						</div>
					</div>,
					document.body,
				)}
		</div>
	);
};

// ─── EngineEditPage ───────────────────────────────────────────────────────────

export const EngineEditPage: React.FC = observer(() => {
	const { configStore, monolithStore, insightStore } = useRootStore();
	const { name, active, type } = useEngine();
	const { id, metadata, role, refresh } = active;
	const navigate = useNavigate();

	const canEdit = role === "OWNER" || role === "EDITOR";
	const engineMetaKeys = configStore.store.config.databaseMetaKeys.filter(
		(k) => Object.hasOwn(metadata, k.metakey),
	);

	const [generateOpen, setGenerateOpen] = useState(false);
	const [pendingNavPath, setPendingNavPath] = useState<string | null>(null);
	const [filterOptions, setFilterOptions] = useState<
		Record<string, string[]>
	>(() =>
		engineMetaKeys.reduce(
			(acc, k) => {
				acc[k.metakey] = [];
				return acc;
			},
			{} as Record<string, string[]>,
		),
	);

	const getEngineMetaValues = usePixel<
		{ METAKEY: string; METAVALUE: string; count: number }[]
	>(canEdit ? `META | GetDatabaseMetaValues ( metaKeys = ['tags'] ) ;` : "", {
		data: [],
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional - status is the trigger
	useEffect(() => {
		if (getEngineMetaValues.status !== "SUCCESS") return;
		const updated = getEngineMetaValues.data.reduce(
			(acc, { METAKEY, METAVALUE }) => {
				if (!acc[METAKEY]) acc[METAKEY] = [];
				acc[METAKEY].push(METAVALUE);
				return acc;
			},
			{} as Record<string, string[]>,
		);
		engineMetaKeys
			.filter((k) => k.display_options === "select-box")
			.forEach((k) => {
				if (k.display_values)
					updated[k.metakey] = k.display_values.split(",");
			});
		setFilterOptions(updated);
	}, [getEngineMetaValues.status, getEngineMetaValues.data]);

	const {
		handleSubmit,
		control,
		setValue,
		reset,
		formState: { isDirty },
	} = useForm<Record<string, unknown>>({ defaultValues: metadata || {} });

	// ── Shared save helper ─────────────────────────────────────────────────
	const runSave = (data: object, onSuccess: () => void) => {
		const meta = Object.fromEntries(
			Object.entries(data as Record<string, unknown>).filter(
				([, v]) => v !== undefined,
			),
		);
		if (Object.keys(meta).length === 0) {
			onSuccess();
			return;
		}
		monolithStore
			.runQuery(
				`SetEngineMetadata(engine=["${id}"], meta=[${JSON.stringify(meta)}])`,
			)
			.then(
				({
					pixelReturn: [{ output, additionalOutput, operationType }],
				}) => {
					if (operationType.includes("ERROR")) {
						toast.error(output as string);
						return;
					}
					toast.success(additionalOutput[0].output);
					refresh();
					onSuccess();
				},
			)
			.catch((e: Error) =>
				toast.error(`Error updating ${type} details: ${e.message}`),
			);
	};

	// ── Navigation helpers ─────────────────────────────────────────────────
	const safeNavigate = (path: string) =>
		isDirty ? setPendingNavPath(path) : navigate(path);
	const handleCancelLeave = () => setPendingNavPath(null);
	const handleConfirmLeave = () => {
		reset(metadata || {});
		// biome-ignore lint/style/noNonNullAssertion: only called when pendingNavPath is set
		navigate(pendingNavPath!);
		setPendingNavPath(null);
	};
	const handleSaveAndLeave = handleSubmit((data) =>
		runSave(data, () => {
			// biome-ignore lint/style/noNonNullAssertion: only called when pendingNavPath is set
			navigate(pendingNavPath!);
			setPendingNavPath(null);
		}),
	);
	const handleCancel = () => {
		reset(metadata || {});
		navigate("..");
	};
	const onSubmit = handleSubmit((data) =>
		runSave(data, () => navigate("..")),
	);

	const handleGenerated = ({
		description,
		tags,
	}: {
		description?: string;
		tags?: string[];
	}) => {
		if (description !== undefined)
			setValue("description", description, { shouldDirty: true });
		if (tags !== undefined) {
			const tagKey = engineMetaKeys.find((k) =>
				["tag", "tags"].includes(k.metakey.toLowerCase()),
			)?.metakey;
			if (tagKey) setValue(tagKey, tags, { shouldDirty: true });
		}
		setGenerateOpen(false);
	};

	// ── Field renderer ─────────────────────────────────────────────────────
	const renderField = (key: (typeof engineMetaKeys)[number]) => {
		const { metakey, display_options } = key;
		const label = metakey.charAt(0).toUpperCase() + metakey.slice(1);
		const labelEl = (
			<Label htmlFor={metakey} className="font-semibold text-sm">
				{label}
			</Label>
		);

		const wrap = (children: React.ReactNode) => (
			<div key={metakey} className="space-y-1.5">
				{labelEl}
				{children}
			</div>
		);

		if (display_options === "markdown")
			return (
				<div key={metakey} className="space-y-1.5">
					<Label className="font-semibold text-sm">{label}</Label>
					<Controller
						name={metakey}
						control={control}
						render={({ field }) => (
							<MarkdownEditor
								value={(field.value as string) || ""}
								onChange={field.onChange}
							/>
						)}
					/>
				</div>
			);

		if (display_options === "textarea")
			return (
				<Controller
					key={metakey}
					name={metakey}
					control={control}
					render={({ field }) =>
						wrap(
							<Textarea
								id={metakey}
								value={(field.value as string) || ""}
								onChange={(e) => field.onChange(e.target.value)}
								className="max-h-[100px] min-h-[72px] resize-none overflow-y-auto focus-visible:ring-0 focus-visible:ring-offset-0"
								placeholder={
									metakey === "description"
										? `Please provide a description for this ${type.toLocaleLowerCase()} to help others find it and understand how to use it.`
										: undefined
								}
								data-testid={formatToDataTestId(
									`editEngineDetails-${label}-txtArea`,
								)}
							/>,
						)
					}
				/>
			);

		if (display_options === "single-typeahead")
			return (
				<Controller
					key={metakey}
					name={metakey}
					control={control}
					render={({ field }) =>
						wrap(
							<>
								<Input
									id={metakey}
									type="text"
									placeholder={`Select ${label.toLowerCase()}...`}
									value={(field.value as string) || ""}
									onChange={(e) =>
										field.onChange(e.target.value)
									}
									list={`${metakey}-list`}
									data-testid={formatToDataTestId(
										`editEngineDetails-${label}-autocomplete`,
									)}
								/>
								<datalist id={`${metakey}-list`}>
									{(filterOptions[metakey] || []).map((o) => (
										<option key={o} value={o} />
									))}
								</datalist>
							</>,
						)
					}
				/>
			);

		if (display_options === "multi-typeahead")
			return (
				<Controller
					key={metakey}
					name={metakey}
					control={control}
					render={({ field }) =>
						wrap(
							<MultiTypeaheadField
								id={metakey}
								value={
									Array.isArray(field.value)
										? (field.value as string[])
										: []
								}
								onChange={field.onChange}
								options={filterOptions[metakey] || []}
								placeholder={`Press enter to add ${metakey}`}
								testId={formatToDataTestId(
									`editEngineDetails-${label}-autocomplete`,
								)}
							/>,
						)
					}
				/>
			);

		if (display_options === "select-box")
			return (
				<Controller
					key={metakey}
					name={metakey}
					control={control}
					render={({ field }) =>
						wrap(
							<SelectBoxField
								id={metakey}
								value={
									Array.isArray(field.value)
										? (field.value as string[])
										: typeof field.value === "string"
											? [field.value]
											: []
								}
								onChange={field.onChange}
								options={filterOptions[metakey] || []}
							/>,
						)
					}
				/>
			);

		return null;
	};

	if (!canEdit) return null;

	return (
		<div className="flex h-full w-full flex-col">
			<div className="flex-1 overflow-y-auto">
				<Breadcrumb className="mb-6">
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink
								className="cursor-pointer text-inherit"
								onClick={() => safeNavigate("...")}
							>
								{name} Catalog
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator>
							<ChevronRight />
						</BreadcrumbSeparator>
						<BreadcrumbItem>
							<BreadcrumbLink
								className="cursor-pointer text-inherit"
								onClick={() => safeNavigate("..")}
							>
								{active.name}
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator>
							<ChevronRight />
						</BreadcrumbSeparator>
						<BreadcrumbItem>
							<BreadcrumbPage>Edit</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				<div className="mb-6 flex items-center justify-between">
					<h3 className="font-semibold text-foreground text-xl">
						Edit {active.name}
					</h3>
					<div className="flex items-center">
						<Button
							variant="ghost"
							size="sm"
							className="flex items-center gap-1.5 text-primary hover:bg-primary/10 hover:text-primary"
							onClick={() => setGenerateOpen(true)}
							disabled={!insightStore.defaultTextGenerationModel}
							data-testid={formatToDataTestId(
								`editEngineDetails-${name}-generate-btn`,
							)}
						>
							<Sparkles className="size-4" />
							<span className="font-medium text-sm">
								Generate with AI
							</span>
						</Button>
						{!insightStore.defaultTextGenerationModel && (
							<Tooltip>
								<TooltipTrigger asChild>
									<CircleQuestionMark
										className="size-4 cursor-pointer text-primary hover:text-primary/80"
										onClick={() =>
											navigate("/settings/my-profile")
										}
										data-testid={formatToDataTestId(
											`editEngineDetails-${name}-generate-help-icon`,
										)}
										aria-label="Generate with AI help icon"
									/>
								</TooltipTrigger>
								<TooltipContent>
									Set a default text generation model to
									enable this feature. Click to configure now.
								</TooltipContent>
							</Tooltip>
						)}
					</div>
				</div>

				<div className="space-y-6">
					{engineMetaKeys.map(renderField)}
				</div>
			</div>

			<div className="flex items-center justify-end gap-2 py-4">
				<Button
					variant="outline"
					onClick={handleCancel}
					data-testid="editEngineDetails-close-btn"
				>
					Cancel
				</Button>
				<Button
					variant="default"
					onClick={() => onSubmit()}
					disabled={!isDirty}
					data-testid="editEngineDetails-submit-btn"
				>
					Save
				</Button>
			</div>

			<GenerateWithAIModal
				open={generateOpen}
				engineId={id}
				engineType={type}
				modelId={insightStore.defaultTextGenerationModel}
				onBack={() => setGenerateOpen(false)}
				onGenerated={handleGenerated}
			/>

			<UnsavedChangesDialog
				open={pendingNavPath !== null}
				onStay={handleCancelLeave}
				onLeave={handleConfirmLeave}
				onSaveAndLeave={handleSaveAndLeave}
			/>
		</div>
	);
});
