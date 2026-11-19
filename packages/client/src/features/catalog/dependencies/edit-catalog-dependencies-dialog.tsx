import { Check, Copy, Search, X } from "lucide-react";
import { type UIEvent, useId, useState } from "react";
import {
	runPixel,
	useDebouncedValue,
	useIteratorPixel,
} from "@semoss/sdk/react";
import {
	AppCatalogAvatar,
	type CatalogDependency,
	type CatalogDependencyRow,
	type CatalogType,
	type Engine,
	EngineSubtypeIcon,
	type Project,
} from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	Badge,
	Button,
	cn,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	FieldGroup,
	FieldSet,
	Form,
	FormInput,
	FormTextarea,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	Tabs,
	TabsList,
	TabsTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
	useFieldArray,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { ALL_ENGINE_TYPES } from "@/utility/catalog";
import {
	getDependencyTypeConfig,
	toCatalogDependencyPayload,
} from "./catalog-dependency";

interface EditCatalogDependenciesDialogProps {
	/** Called on close; true when a save succeeded */
	onClose: (saved: boolean) => void;
	/** The owner's id */
	catalogId: string;
	/** The owner's specific type */
	catalogType: CatalogType;
	/**
	 * The owner's current manual dependencies, the initial selection. Read
	 * once, when the dialog mounts; mount it only while it is open.
	 */
	dependencies: CatalogDependencyRow[];
}

/** A target the picker offers. */
type DependencyOption = Pick<
	CatalogDependency,
	"catalog_id" | "catalog_name" | "catalog_type" | "catalog_subtype"
>;

const isCatalogTypeValue = (value: unknown): value is CatalogType =>
	typeof value === "string";

/** One selected manual dependency, with its optional name and description. */
const dependencyEntrySchema = z.object({
	catalog_id: z.string(),
	catalog_name: z.string(),
	catalog_type: z.custom<CatalogType>(isCatalogTypeValue),
	catalog_subtype: z.string().optional(),
	dependency_name: z.string().trim().max(255, "Use 255 characters or fewer"),
	dependency_description: z.string().trim(),
});

const dependenciesFormSchema = z.object({
	dependencies: z
		.array(dependencyEntrySchema)
		.superRefine((entries, context) => {
			// names are unique within the owner, and every manual row of the
			// owner is in the form, so a repeat here is a repeat on the owner
			const seen = new Set<string>();
			entries.forEach((entry, index) => {
				const key = entry.dependency_name.toLowerCase();
				if (!key) return;
				if (seen.has(key)) {
					context.addIssue({
						code: "custom",
						path: [index, "dependency_name"],
						message: "Another dependency already has this name",
					});
				}
				seen.add(key);
			});
		}),
});

type DependenciesFormValues = z.infer<typeof dependenciesFormSchema>;
type DependencyEntry = DependenciesFormValues["dependencies"][number];

/**
 * A form entry for a manual dependency or a newly picked target, with an
 * empty name and description where it has none.
 */
const toDependencyEntry = (
	dependency: DependencyOption &
		Partial<
			Pick<
				CatalogDependencyRow,
				"dependency_name" | "dependency_description"
			>
		>,
): DependencyEntry => ({
	catalog_id: dependency.catalog_id,
	catalog_name: dependency.catalog_name,
	catalog_type: dependency.catalog_type,
	catalog_subtype: dependency.catalog_subtype,
	dependency_name: dependency.dependency_name ?? "",
	dependency_description: dependency.dependency_description ?? "",
});

/** Which reactor populates the list. */
type DependencySource = "ENGINE" | "PROJECT";

/** Every project type the picker offers, in the backend's spelling. */
const PROJECT_TYPES: readonly CatalogType[] = [
	"CODE",
	"BLOCKS",
	"INSIGHTS",
	"SKILL",
	"NOTEBOOK",
	"AUTOMATION",
	"WORKSPACE",
];

/** The type filter's value when every type of the source is listed. */
const ALL_TYPES = "ALL";

/** Page size for the paginated reactors. */
const PAGE_LIMIT = 25;

/** The icon of a dependency: a project's avatar or an engine's subtype icon. */
const renderDependencyIcon = (
	dep: DependencyOption,
	sizeClass: string,
	textClass: string,
) =>
	getDependencyTypeConfig(dep.catalog_type).kind === "project" ? (
		<AppCatalogAvatar
			projectId={dep.catalog_id}
			name={dep.catalog_name}
			className={cn("shrink-0 rounded", sizeClass, textClass)}
		/>
	) : (
		<EngineSubtypeIcon
			engineType={dep.catalog_type}
			engineSubtype={dep.catalog_subtype}
			alt={dep.catalog_name}
			className={cn("shrink-0 object-contain", sizeClass)}
		/>
	);

/**
 * Edits an engine's or a project's manual dependencies: pick any of the
 * user's engines (every type) and projects (every type), filtered by type and
 * search, give each an optional name and description, and save the whole
 * manual set. Automatic dependencies come from the owner's configuration and
 * are neither shown nor sent; the backend keeps them. The owner itself is
 * never offered.
 */
export const EditCatalogDependenciesDialog = ({
	onClose,
	catalogId,
	catalogType,
	dependencies,
}: EditCatalogDependenciesDialogProps) => {
	const [search, setSearch] = useState<string>("");
	const [source, setSource] = useState<DependencySource>("ENGINE");
	const [typeFilter, setTypeFilter] = useState<string>(ALL_TYPES);
	const [copiedId, setCopiedId] = useState<string | null>(null);
	const baseId = useId();

	const form = useForm<DependenciesFormValues>({
		resolver: zodResolver(dependenciesFormSchema),
		defaultValues: { dependencies: dependencies.map(toDependencyEntry) },
	});
	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "dependencies",
		keyName: "fieldKey",
	});
	const { errors, isSubmitting } = form.formState;

	const handleCopyId = (id: string) => {
		navigator.clipboard
			.writeText(id)
			.then(() => {
				setCopiedId(id);
				setTimeout(() => {
					setCopiedId((current) => (current === id ? null : current));
				}, 1500);
			})
			.catch(() => {
				toast.error("Failed to copy ID");
			});
	};

	// Coalesce to "" so the initial undefined -> "" debounce transition doesn't
	// reset the iterator (which clears its data but can't refetch an unchanged
	// query), which would blank the list until the source is toggled.
	const debouncedSearch = useDebouncedValue(search) ?? "";
	const filterClause = debouncedSearch
		? `filterWord=${JSON.stringify(debouncedSearch)}, `
		: "";
	const sourceTypes: readonly CatalogType[] =
		source === "ENGINE" ? ALL_ENGINE_TYPES : PROJECT_TYPES;
	const queriedTypes =
		typeFilter === ALL_TYPES
			? sourceTypes
			: sourceTypes.filter((type) => type === typeFilter);

	const getEngines = useIteratorPixel<Engine[], DependencyOption>(
		(limit, offset) =>
			source === "ENGINE"
				? `MyEngines(${filterClause}engineTypes=${JSON.stringify(queriedTypes)}, limit=[${limit}], offset=[${offset}]);`
				: "",
		(response) => (response.length < PAGE_LIMIT ? -1 : Infinity),
		(response) =>
			response.map((eng) => ({
				catalog_id: eng.engine_id,
				catalog_name: eng.engine_display_name || eng.engine_name,
				catalog_type: eng.engine_type,
				catalog_subtype: eng.engine_subtype,
			})),
		{ limit: PAGE_LIMIT },
		[debouncedSearch, source, typeFilter],
	);

	const getProjects = useIteratorPixel<Project[], DependencyOption>(
		(limit, offset) =>
			source === "PROJECT"
				? `MyProjects(${filterClause}projectType=${JSON.stringify(queriedTypes)}, limit=[${limit}], offset=[${offset}]);`
				: "",
		(response) => (response.length < PAGE_LIMIT ? -1 : Infinity),
		(response) =>
			response.map((proj) => ({
				catalog_id: proj.project_id,
				catalog_name: proj.project_display_name || proj.project_name,
				catalog_type: proj.project_type,
			})),
		{ limit: PAGE_LIMIT },
		[debouncedSearch, source, typeFilter],
	);

	const activeSource = source === "ENGINE" ? getEngines : getProjects;
	// an engine or a project can't depend on itself
	const options = activeSource.data.filter(
		(option) => option.catalog_id !== catalogId,
	);
	const isLoading = activeSource.isLoading;
	const sourceLabel = source === "ENGINE" ? "engines" : "projects";

	/**
	 * Advance the active source when the list is scrolled near the bottom.
	 * A native overflow container is used (instead of a Radix ScrollArea) so
	 * mouse-wheel scrolling works reliably inside the dialog.
	 */
	const handleScroll = (event: UIEvent<HTMLDivElement>) => {
		const el = event.currentTarget;
		const nearBottom =
			el.scrollHeight - el.scrollTop - el.clientHeight < 80;
		if (nearBottom && !isLoading && activeSource.hasMore) {
			activeSource.next();
		}
	};

	const handleSubmit = async (
		values: DependenciesFormValues,
	): Promise<void> => {
		try {
			const response = await runPixel<[unknown]>(
				`SetCatalogDependencies(catalogId="${catalogId}", catalogType="${catalogType}", dependencies=${JSON.stringify(values.dependencies.map(toCatalogDependencyPayload))});`,
			);
			if (response.errors.length > 0) {
				throw new Error(response.errors.join(""));
			}
		} catch (e) {
			form.setError("root.server", {
				type: "server",
				message: getErrorMessage(e, "Failed to update dependencies"),
			});
			return;
		}
		toast.success("Successfully updated dependencies");
		onClose(true);
	};

	const toggleDependency = (option: DependencyOption) => {
		const index = fields.findIndex(
			(field) => field.catalog_id === option.catalog_id,
		);
		if (index === -1) {
			append(toDependencyEntry(option), { shouldFocus: false });
		} else {
			remove(index);
		}
	};

	return (
		<Dialog
			open
			onOpenChange={(nextOpen) => {
				if (!nextOpen && !isSubmitting) {
					onClose(false);
				}
			}}
		>
			<DialogContent
				className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-2xl"
				showCloseButton={!isSubmitting}
				onEscapeKeyDown={(event) => {
					if (isSubmitting) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (isSubmitting) event.preventDefault();
				}}
			>
				<DialogHeader>
					<DialogTitle className="font-medium text-base leading-6">
						Edit Dependencies
					</DialogTitle>
					<DialogDescription>
						Add or remove the engines and projects this{" "}
						{getDependencyTypeConfig(
							catalogType,
						).label.toLowerCase()}{" "}
						requires, and say what each is for. Automatic
						dependencies come from its configuration and are kept as
						they are.
					</DialogDescription>
				</DialogHeader>

				<Form
					form={form}
					onSubmit={handleSubmit}
					noValidate
					aria-busy={isSubmitting}
					className="flex min-h-0 flex-1 flex-col gap-4"
				>
					<div className="space-y-4 overflow-y-auto pr-1">
						<p className="font-medium text-sm">
							Linked Dependencies
						</p>

						<div className="flex flex-col gap-2 rounded-md border p-2">
							<Tabs
								value={source}
								onValueChange={(value) => {
									setSource(
										value === "PROJECT"
											? "PROJECT"
											: "ENGINE",
									);
									setTypeFilter(ALL_TYPES);
								}}
							>
								<TabsList className="w-full">
									<TabsTrigger
										value="ENGINE"
										className="flex-1"
									>
										Engines
									</TabsTrigger>
									<TabsTrigger
										value="PROJECT"
										className="flex-1"
									>
										Projects
									</TabsTrigger>
								</TabsList>
							</Tabs>

							<div className="flex flex-col gap-2 sm:flex-row">
								<Select
									value={typeFilter}
									onValueChange={setTypeFilter}
								>
									<SelectTrigger
										className="w-full sm:w-44"
										aria-label="Filter by type"
									>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={ALL_TYPES}>
											All types
										</SelectItem>
										{sourceTypes.map((type) => (
											<SelectItem key={type} value={type}>
												{
													getDependencyTypeConfig(
														type,
													).label
												}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<InputGroup className="flex-1">
									<InputGroupAddon>
										<Search
											className="size-4"
											aria-hidden="true"
										/>
									</InputGroupAddon>
									<InputGroupInput
										placeholder={`Search ${sourceLabel}...`}
										aria-label={`Search ${sourceLabel}`}
										value={search}
										onChange={(e) =>
											setSearch(e.target.value)
										}
										onKeyDown={(e) => {
											// searching is live; Enter must not save
											if (e.key === "Enter")
												e.preventDefault();
										}}
									/>
								</InputGroup>
							</div>

							<div
								className="h-[300px] overflow-y-auto"
								onScroll={handleScroll}
							>
								{isLoading && options.length === 0 ? (
									<div className="flex h-[300px] items-center justify-center">
										<Spinner />
									</div>
								) : options.length === 0 ? (
									<div className="flex h-[300px] items-center justify-center">
										<p className="text-muted-foreground text-sm">
											No {sourceLabel} found.
										</p>
									</div>
								) : (
									<div className="flex flex-col gap-0.5">
										{options.map((option) => {
											const isSelected = fields.some(
												(field) =>
													field.catalog_id ===
													option.catalog_id,
											);
											return (
												<button
													type="button"
													key={option.catalog_id}
													onClick={() =>
														toggleDependency(option)
													}
													disabled={isSubmitting}
													aria-pressed={isSelected}
													className="flex w-full items-center justify-between gap-3 rounded-md p-2 text-left hover:bg-muted/50"
												>
													<div className="flex min-w-0 items-center gap-3">
														{renderDependencyIcon(
															option,
															"size-8",
															"text-xs",
														)}
														<div className="flex min-w-0 flex-col">
															<span className="truncate font-medium text-sm">
																{
																	option.catalog_name
																}
															</span>
															<span className="truncate text-muted-foreground text-xs">
																{
																	getDependencyTypeConfig(
																		option.catalog_type,
																	).label
																}{" "}
																· ID:{" "}
																{
																	option.catalog_id
																}
															</span>
														</div>
													</div>
													{isSelected ? (
														<Check
															className="size-4 shrink-0 text-primary"
															aria-hidden="true"
														/>
													) : null}
												</button>
											);
										})}
										{isLoading ? (
											<div className="flex items-center justify-center py-2">
												<Spinner />
											</div>
										) : null}
									</div>
								)}
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<p className="font-medium text-sm">Selected</p>
								<Badge variant="outline">{fields.length}</Badge>
							</div>
							{fields.length === 0 ? (
								<div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground text-sm">
									No dependencies selected yet.
								</div>
							) : (
								<div className="space-y-3">
									{fields.map((dep, index) => {
										const nameId = `${baseId}-${dep.fieldKey}-name`;
										return (
											<FieldSet
												key={dep.fieldKey}
												aria-labelledby={nameId}
												className="gap-3 rounded-lg border p-3"
											>
												<div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
													{renderDependencyIcon(
														dep,
														"size-12 rounded-lg",
														"text-sm",
													)}
													<div className="min-w-0">
														<p
															id={nameId}
															className="truncate font-medium text-sm"
														>
															{dep.catalog_name}
														</p>
														<div className="flex items-center gap-1">
															<p className="truncate text-muted-foreground text-xs">
																ID:{" "}
																{dep.catalog_id}
															</p>
															<Tooltip
																disableHoverableContent={
																	false
																}
															>
																<TooltipTrigger
																	asChild
																>
																	<Button
																		type="button"
																		variant="ghost"
																		size="icon"
																		className="size-6 shrink-0"
																		onClick={() =>
																			handleCopyId(
																				dep.catalog_id,
																			)
																		}
																		aria-label="Copy ID"
																	>
																		{copiedId ===
																		dep.catalog_id ? (
																			<Check className="size-3 text-success" />
																		) : (
																			<Copy className="size-3" />
																		)}
																	</Button>
																</TooltipTrigger>
																<TooltipContent
																	sideOffset={
																		4
																	}
																	className="max-w-xs break-words"
																>
																	Copy ID
																</TooltipContent>
															</Tooltip>
														</div>
													</div>
													<Button
														type="button"
														variant="ghost"
														size="icon-sm"
														onClick={() =>
															remove(index)
														}
														disabled={isSubmitting}
														aria-label={`Remove ${dep.catalog_name}`}
													>
														<X className="size-4" />
													</Button>
												</div>
												<FieldGroup className="gap-3">
													<FormInput
														name={`dependencies.${index}.dependency_name`}
														label="Name (optional)"
														disabled={isSubmitting}
														autoComplete="off"
													/>
													<FormTextarea
														name={`dependencies.${index}.dependency_description`}
														label="Description (optional)"
														placeholder="What this dependency is for"
														rows={2}
														disabled={isSubmitting}
													/>
												</FieldGroup>
											</FieldSet>
										);
									})}
								</div>
							)}
						</div>
					</div>

					{errors.root?.server?.message ? (
						<Alert variant="destructive">
							<AlertDescription>
								{errors.root.server.message}
							</AlertDescription>
						</Alert>
					) : null}

					<DialogFooter className="flex items-center justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onClose(false)}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? (
								<span className="flex items-center gap-2">
									<Spinner className="size-4" />
									Saving...
								</span>
							) : (
								"Save"
							)}
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
