import { ChevronDown, Pencil, Search, Sparkles, XIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Textarea,
	toast,
} from "@semoss/ui/next";
import { MarkdownEditor } from "@/components/common";
import { useEngine, usePixel, useRootStore } from "@/hooks";
import { formatToDataTestId } from "@/utility";
import { GenerateWithAIModal } from "./generate-with-ai-modal";

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

	const removeTag = (tag: string) => onChange(tags.filter((t) => t !== tag));

	return (
		<div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1.5">
			{tags.map((tag) => (
				<span
					key={tag}
					className="inline-flex items-center gap-0.5 rounded bg-muted px-2 py-0.5 text-foreground text-sm"
				>
					{tag}
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="size-4 p-0 hover:bg-transparent hover:opacity-70"
						onClick={() => removeTag(tag)}
						aria-label={`Remove ${tag}`}
					>
						<XIcon className="size-3" />
					</Button>
				</span>
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

const SelectBoxField = ({
	id,
	value,
	onChange,
	options,
}: SelectBoxFieldProps) => {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const containerRef = useRef<HTMLDivElement>(null);

	const selected = (Array.isArray(value) ? value : []).filter(
		Boolean,
	) as string[];

	const toggle = (option: string) =>
		onChange(
			selected.includes(option)
				? selected.filter((v) => v !== option)
				: [...selected, option],
		);

	const filtered = options.filter((o) =>
		o.toLowerCase().includes(search.toLowerCase()),
	);

	useEffect(() => {
		const handleOutside = (e: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setOpen(false);
				setSearch("");
			}
		};
		if (open) document.addEventListener("mousedown", handleOutside);
		return () => document.removeEventListener("mousedown", handleOutside);
	}, [open]);

	return (
		<div ref={containerRef} className="relative">
			<Button
				type="button"
				id={id}
				variant="outline"
				className="h-auto min-h-10 w-full flex-wrap justify-start gap-1.5 px-2 py-1.5 font-normal"
				onClick={() => setOpen((prev) => !prev)}
			>
				<span className="flex flex-1 flex-wrap gap-1.5">
					{selected.length === 0 ? (
						<span className="text-muted-foreground text-sm">
							Select...
						</span>
					) : (
						selected.map((v) => (
							<span
								key={v}
								className="inline-flex items-center gap-0.5 rounded bg-muted px-2 py-0.5 text-foreground text-sm"
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
							</span>
						))
					)}
				</span>
				<ChevronDown
					className={`size-4 shrink-0 text-muted-foreground transition-transform duration-150 ${
						open ? "rotate-180" : ""
					}`}
				/>
			</Button>

			{open && (
				<div className="absolute top-full right-0 left-0 z-50 mt-1 rounded-md border border-input bg-popover shadow-md">
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
					<div className="max-h-48 overflow-y-auto py-1">
						{filtered.length === 0 ? (
							<p className="px-3 py-2 text-muted-foreground text-sm">
								No options found
							</p>
						) : (
							filtered.map((option) => (
								<label
									key={option}
									className="flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-accent"
								>
									<input
										type="checkbox"
										checked={selected.includes(option)}
										onChange={() => toggle(option)}
										className="size-4 cursor-pointer accent-primary"
									/>
									<span className="text-sm">{option}</span>
								</label>
							))
						)}
					</div>
				</div>
			)}
		</div>
	);
};

// ─── EditEngineDetails ────────────────────────────────────────────────────────

export const EditEngineDetails = observer(() => {
	const { configStore, monolithStore } = useRootStore();
	const { type, active } = useEngine();
	const { id, name, metadata, role, refresh } = active;

	const canEdit = role === "OWNER" || role === "EDITOR";

	const engineMetaKeys = configStore.store.config.databaseMetaKeys.filter(
		(k) => Object.hasOwn(metadata, k.metakey),
	);

	const [open, setOpen] = useState(false);
	const [generateOpen, setGenerateOpen] = useState(false);

	const [filterOptions, setFilterOptions] = useState<
		Record<string, string[]>
	>(() =>
		engineMetaKeys.reduce(
			(prev, current) => {
				prev[current.metakey] = [];
				return prev;
			},
			{} as Record<string, string[]>,
		),
	);

	const getEngineMetaValues = usePixel<
		{ METAKEY: string; METAVALUE: string; count: number }[]
	>(canEdit ? `META | GetDatabaseMetaValues ( metaKeys = ['tags'] ) ;` : "", {
		data: [],
	});

	useEffect(() => {
		if (getEngineMetaValues.status !== "SUCCESS") return;

		const updated = getEngineMetaValues.data.reduce(
			(prev, current) => {
				if (!prev[current.METAKEY]) prev[current.METAKEY] = [];
				prev[current.METAKEY].push(current.METAVALUE);
				return prev;
			},
			{} as Record<string, string[]>,
		);

		engineMetaKeys
			.filter((k) => k.display_options === "select-box")
			.forEach((filter) => {
				if (filter.display_values) {
					updated[filter.metakey] = filter.display_values.split(",");
				}
			});

		setFilterOptions(updated);
	}, [getEngineMetaValues.status, getEngineMetaValues.data]);

	// ↓ reset added alongside setValue — used in handleClose to discard changes
	const { handleSubmit, control, setValue, reset } = useForm<
		Record<string, unknown>
	>({
		defaultValues: metadata || {},
	});

	// ── Close — resets form to original metadata (discard unsaved changes) ─────
	// Called by: Cancel button, outside click, Escape key.
	// NOT called by: handleOpenGenerateAI (setOpen(false) directly → no reset),
	//                onSubmit after save (setOpen(false) directly → no reset).
	const handleClose = () => {
		reset(metadata || {});
		setOpen(false);
	};

	// ── Navigation ─────────────────────────────────────────────────────────────

	// Intentionally calls setOpen(false) directly — must NOT reset the form
	// because the user may come back from the child modal and continue editing.
	const handleOpenGenerateAI = () => {
		setOpen(false);
		setGenerateOpen(true);
	};

	const handleBackFromGenerateAI = () => {
		setGenerateOpen(false);
		setOpen(true);
	};

	const handleGenerated = (data: {
		description?: string;
		tags?: string[];
	}) => {
		if (data.description !== undefined)
			setValue("description", data.description, { shouldDirty: true });

		if (data.tags !== undefined) {
			const tagMetaKey = engineMetaKeys.find((k) =>
				["tag", "tags"].includes(k.metakey.toLowerCase()),
			)?.metakey;
			if (tagMetaKey) {
				setValue(tagMetaKey, data.tags, { shouldDirty: true });
			}
		}

		setGenerateOpen(false);
		setOpen(true);
	};

	// ── Submit ─────────────────────────────────────────────────────────────────

	const onSubmit = handleSubmit((data: object) => {
		const meta = Object.fromEntries(
			Object.entries(data as Record<string, unknown>).filter(
				([, v]) => v !== undefined,
			),
		);

		if (Object.keys(meta).length === 0) {
			toast.info("Nothing to Save");
			return;
		}

		monolithStore
			.runQuery(
				`SetEngineMetadata(engine=["${id}"], meta=[${JSON.stringify(meta)}], jsonCleanup=[true])`,
			)
			.then((response) => {
				const { output, additionalOutput, operationType } =
					response.pixelReturn[0];
				if (operationType.indexOf("ERROR") > -1) {
					toast.error(output as string);
					return;
				}
				toast.success(additionalOutput[0].output);
				// Intentional: setOpen(false) directly — form was saved,
				// no reset needed. refresh() will update metadata from server.
				setOpen(false);
				refresh();
			})
			.catch((error: Error) => {
				toast.error(`Error updating ${type} details: ${error.message}`);
			});
	});

	// ── Field renderer ─────────────────────────────────────────────────────────

	const renderField = (key: (typeof engineMetaKeys)[number]) => {
		const { metakey, display_options } = key;
		const label = metakey.charAt(0).toUpperCase() + metakey.slice(1);

		if (display_options === "markdown") {
			return (
				<div key={metakey}>
					<Controller
						name={metakey}
						control={control}
						render={({ field }) => (
							<MarkdownEditor
								value={(field.value as string) || ""}
								onChange={(value) => field.onChange(value)}
							/>
						)}
					/>
				</div>
			);
		}

		if (display_options === "textarea") {
			return (
				<Controller
					key={metakey}
					name={metakey}
					control={control}
					render={({ field }) => (
						<div className="space-y-1.5">
							<Label
								htmlFor={metakey}
								className="font-semibold text-sm"
							>
								{label}
							</Label>
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
							/>
						</div>
					)}
				/>
			);
		}

		if (display_options === "single-typeahead") {
			return (
				<Controller
					key={metakey}
					name={metakey}
					control={control}
					render={({ field }) => (
						<div className="space-y-1.5">
							<Label
								htmlFor={metakey}
								className="font-semibold text-sm"
							>
								{label}
							</Label>
							<Input
								id={metakey}
								type="text"
								placeholder={`Select ${label.toLowerCase()}...`}
								value={(field.value as string) || ""}
								onChange={(e) => field.onChange(e.target.value)}
								list={`${metakey}-list`}
								data-testid={formatToDataTestId(
									`editEngineDetails-${label}-autocomplete`,
								)}
							/>
							<datalist id={`${metakey}-list`}>
								{(filterOptions[metakey] || []).map(
									(option) => (
										<option key={option} value={option} />
									),
								)}
							</datalist>
						</div>
					)}
				/>
			);
		}

		if (display_options === "multi-typeahead") {
			return (
				<Controller
					key={metakey}
					name={metakey}
					control={control}
					render={({ field }) => (
						<div className="space-y-1.5">
							<Label
								htmlFor={metakey}
								className="font-semibold text-sm"
							>
								{label}
							</Label>
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
							/>
						</div>
					)}
				/>
			);
		}

		if (display_options === "select-box") {
			return (
				<Controller
					key={metakey}
					name={metakey}
					control={control}
					render={({ field }) => (
						<div className="space-y-1.5">
							<Label
								htmlFor={metakey}
								className="font-semibold text-sm"
							>
								{label}
							</Label>
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
							/>
						</div>
					)}
				/>
			);
		}

		return null;
	};

	if (!canEdit) return null;

	return (
		<>
			<Button
				variant="default"
				onClick={() => setOpen(true)}
				data-testid={formatToDataTestId(
					`editEngineDetails-${name}-edit-btn`,
				)}
			>
				<Pencil className="size-4" />
				Edit
			</Button>

			<Dialog
				open={open}
				onOpenChange={(isOpen) => !isOpen && handleClose()}
			>
				<DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-2xl [&>button.absolute]:hidden">
					<DialogHeader>
						<div className="flex items-center justify-between">
							<DialogTitle className="font-semibold text-base">
								Edit{" "}
								{type
									? type.charAt(0).toUpperCase() +
										type.slice(1).toLowerCase()
									: ""}{" "}
								Details
							</DialogTitle>
							<Button
								variant="ghost"
								size="sm"
								className="flex items-center gap-1.5 text-primary hover:bg-primary/10 hover:text-primary"
								onClick={handleOpenGenerateAI}
								data-testid={formatToDataTestId(
									`editEngineDetails-${name}-generate-btn`,
								)}
								disabled={!configStore.defaultTextGenerationModel}
							>
								<Sparkles className="size-4" />
								<span className="font-medium text-sm">
									Generate with AI
								</span>
							</Button>
						</div>
					</DialogHeader>

					<div className="flex-1 space-y-4 overflow-y-scroll">
						{engineMetaKeys.map(renderField)}
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={handleClose}
							data-testid="editEngineDetails-close-btn"
						>
							Cancel
						</Button>
						<Button
							variant="default"
							onClick={() => onSubmit()}
							data-testid="editEngineDetails-submit-btn"
						>
							Save
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<GenerateWithAIModal
				open={generateOpen}
				engineId={id}
				engineType={type}
				modelId={configStore.defaultTextGenerationModel}
				onBack={handleBackFromGenerateAI}
				onGenerated={handleGenerated}
			/>
		</>
	);
});
