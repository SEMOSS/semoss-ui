import { ChevronDown } from "lucide-react";
import { type ReactElement, useMemo, useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Form,
	FormInput,
	FormSelect,
	FormSelectItem,
	FormSwitch,
	Muted,
	Spinner,
	toast,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { formatByteSize } from "@semoss/utility";
import { getErrorMessage } from "@semoss/utility/error";
import {
	defineServedModel,
	type ServedModelDefinition,
	type ServedModelEngineLink,
	type ServingCatalog,
	type ServingCatalogEntry,
} from "@/api/model-serving";
import {
	deriveServedModelName,
	describeStorage,
	servedModelNameProblem,
} from "./model-serving-labels";

/** The lowest and highest node ports SEMOSS may publish a model on */
const MIN_PORT = 1024;
const MAX_PORT = 65_535;

export interface DefineServedModelDialogProps {
	open: boolean;
	/** The approved models; null while they load or when they cannot be read */
	catalog: ServingCatalog | null;
	catalogError: string | null;
	/** The entry to start from, such as the one whose Define button opened it */
	initialEntry: string | null;
	/** The name to start from, such as that of a model gone from the cluster */
	initialName?: string | null;
	/** The engines already linked to that name: they answer again once it runs */
	linkedEngines?: readonly ServedModelEngineLink[];
	/** The served model names already taken */
	existingNames: readonly string[];
	/** Receives the defined model's name, or nothing when cancelled */
	onSubmit: (servedModel?: string) => void;
}

const isWholeNumber = (value: string): boolean => /^\d+$/.test(value);

/** The checks a definition must pass before it is sent. */
function buildDefineSchema(existingNames: readonly string[]) {
	return z
		.object({
			catalogEntry: z.string().min(1, "Choose a model from the catalog."),
			servedModel: z.string().trim(),
			start: z.boolean(),
			createEngine: z.boolean(),
			engineName: z.string().trim(),
			engineGlobal: z.boolean(),
			publish: z.boolean(),
			publishPort: z.string().trim(),
			gpuMemoryUtilization: z.string().trim(),
			maxModelLen: z.string().trim(),
		})
		.superRefine((values, context) => {
			if (values.catalogEntry) {
				const name =
					values.servedModel ||
					deriveServedModelName(values.catalogEntry);
				const problem = servedModelNameProblem(name, existingNames);
				if (problem) {
					context.addIssue({
						code: "custom",
						path: ["servedModel"],
						message: values.servedModel
							? problem
							: `${problem} Type another name.`,
					});
				}
			}
			if (values.publish && values.publishPort) {
				const port = Number(values.publishPort);
				if (
					!isWholeNumber(values.publishPort) ||
					port < MIN_PORT ||
					port > MAX_PORT
				) {
					context.addIssue({
						code: "custom",
						path: ["publishPort"],
						message: `Use a port from ${MIN_PORT} to ${MAX_PORT}, or leave it blank.`,
					});
				}
			}
			if (values.gpuMemoryUtilization) {
				const share = Number(values.gpuMemoryUtilization);
				if (!Number.isFinite(share) || share <= 0 || share > 1) {
					context.addIssue({
						code: "custom",
						path: ["gpuMemoryUtilization"],
						message:
							"Use a share above 0 and at most 1, such as 0.25.",
					});
				}
			}
			if (
				values.maxModelLen &&
				(!isWholeNumber(values.maxModelLen) ||
					Number(values.maxModelLen) < 1)
			) {
				context.addIssue({
					code: "custom",
					path: ["maxModelLen"],
					message: "Use a whole number of tokens, such as 4096.",
				});
			}
		});
}

/** The form's values; numbers stay text until they are checked */
type DefineValues = z.infer<ReturnType<typeof buildDefineSchema>>;

/** The definition the checked values describe. */
function toDefinition(values: DefineValues): ServedModelDefinition {
	return {
		servedModel:
			values.servedModel || deriveServedModelName(values.catalogEntry),
		catalogEntry: values.catalogEntry,
		gpuMemoryUtilization: values.gpuMemoryUtilization
			? Number(values.gpuMemoryUtilization)
			: undefined,
		maxModelLen: values.maxModelLen
			? Number(values.maxModelLen)
			: undefined,
		start: values.start,
		createEngine: values.createEngine,
		engineName:
			values.createEngine && values.engineName
				? values.engineName
				: undefined,
		engineGlobal: values.createEngine && values.engineGlobal,
		publish: values.publish,
		publishPort:
			values.publish && values.publishPort
				? Number(values.publishPort)
				: undefined,
	};
}

/** One line on an entry: its licence, origin, weights and context window. */
function describeEntry(entry: ServingCatalogEntry): string {
	return [
		entry.licence ? `Licence ${entry.licence}` : null,
		entry.origin ? `Origin ${entry.origin}` : null,
		`Weights${entry.sizeBytes ? ` ${formatByteSize(entry.sizeBytes)}` : ""} from ${describeStorage(entry.storageUri)}`,
		entry.contextWindow ? `Context ${entry.contextWindow} tokens` : null,
	]
		.filter(Boolean)
		.join(" · ");
}

/**
 * Defines a served model from an approved catalog entry: its name, whether to
 * start it, give it a SEMOSS engine or publish it for the LAN, and the memory
 * and context it gets. Mount it again (a new key) for each opening, so it
 * starts from its defaults.
 */
export function DefineServedModelDialog({
	open,
	catalog,
	catalogError,
	initialEntry,
	initialName = null,
	linkedEngines = [],
	existingNames,
	onSubmit,
}: DefineServedModelDialogProps): ReactElement {
	const schema = useMemo(
		() => buildDefineSchema(existingNames),
		[existingNames],
	);
	const entries = catalog?.models ?? [];
	const form = useForm<DefineValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			catalogEntry:
				initialEntry &&
				entries.some((entry) => entry.id === initialEntry)
					? initialEntry
					: entries.length === 1
						? entries[0].id
						: "",
			servedModel: initialName ?? "",
			start: false,
			// a model whose engines are still linked to its name needs no new one
			createEngine: linkedEngines.length === 0,
			engineName: "",
			engineGlobal: false,
			publish: false,
			publishPort: "",
			gpuMemoryUtilization: "",
			maxModelLen: "",
		},
	});
	const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
	const { errors, isSubmitting } = form.formState;
	const entryId = form.watch("catalogEntry");
	const isCreatingEngine = form.watch("createEngine");
	const isPublishing = form.watch("publish");
	const isStarting = form.watch("start");
	const entry = entries.find((candidate) => candidate.id === entryId) ?? null;
	const suggestedName = entryId ? deriveServedModelName(entryId) : null;

	const handleOpenChange = (isOpen: boolean): void => {
		if (!isOpen && !isSubmitting) {
			onSubmit();
		}
	};

	const handleSubmit = async (values: DefineValues): Promise<void> => {
		let defined: string;
		try {
			const result = await defineServedModel(toDefinition(values));
			defined = result.model.servedModel;
			toast.success(
				result.engine
					? `Defined ${defined} and its engine ${result.engine.name ?? result.engine.id}.`
					: `Defined ${defined}.`,
			);
			for (const warning of result.warnings) {
				toast.warning(warning);
			}
		} catch (cause: unknown) {
			form.setError("root.server", {
				type: "server",
				message: getErrorMessage(
					cause,
					"The model could not be defined.",
				),
			});
			return;
		}
		onSubmit(defined);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent
				className="sm:max-w-xl"
				showCloseButton={!isSubmitting}
				onEscapeKeyDown={(event) => {
					if (isSubmitting) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (isSubmitting) event.preventDefault();
				}}
			>
				<DialogHeader>
					<DialogTitle className="break-words">
						{initialName
							? `Define ${initialName} Again`
							: "Define a Served Model"}
					</DialogTitle>
					<DialogDescription>
						Serve an approved model from the catalog on KServe.
						Defining it does not take the GPU until it starts.
					</DialogDescription>
				</DialogHeader>
				{linkedEngines.length > 0 ? (
					<Muted className="text-sm">
						{linkedEngines
							.map((engine) => engine.engineName)
							.join(", ")}{" "}
						{linkedEngines.length === 1 ? "is" : "are"} still linked
						to {initialName ?? "this name"} and{" "}
						{linkedEngines.length === 1 ? "answers" : "answer"}{" "}
						again once it runs under that name, so no new engine is
						needed.
					</Muted>
				) : null}
				{catalogError ? (
					<Alert variant="destructive">
						<AlertDescription className="break-words">
							The catalog could not be read: {catalogError}
						</AlertDescription>
					</Alert>
				) : catalog && entries.length === 0 ? (
					<Alert>
						<AlertDescription>
							The catalog has no approved models yet. An admin
							adds them to the serving catalog ConfigMap (
							{catalog.source ?? "unknown"}).
						</AlertDescription>
					</Alert>
				) : null}
				<Form
					form={form}
					onSubmit={handleSubmit}
					noValidate
					aria-busy={isSubmitting}
					className="flex flex-col gap-6"
				>
					<div className="flex flex-col gap-2">
						<FormSelect
							name="catalogEntry"
							label="Catalog entry (required)"
							placeholder={
								catalog
									? "Choose a model"
									: "Loading the catalog..."
							}
							disabled={isSubmitting || entries.length === 0}
							triggerClassName="w-full"
						>
							{entries.map((candidate) => (
								<FormSelectItem
									key={candidate.id}
									value={candidate.id}
								>
									{candidate.displayName
										? `${candidate.displayName} (${candidate.id})`
										: candidate.id}
								</FormSelectItem>
							))}
						</FormSelect>
						{entry ? (
							<Muted className="text-xs">
								{describeEntry(entry)}
							</Muted>
						) : null}
					</div>
					<FormInput
						name="servedModel"
						label="Name"
						placeholder={suggestedName ?? undefined}
						autoComplete="off"
						spellCheck={false}
						disabled={isSubmitting}
						description={
							suggestedName
								? `Clients send it as the model name. Leave it blank for ${suggestedName}.`
								: "Clients send it as the model name: lowercase letters, digits and dashes."
						}
					/>
					<div className="flex flex-col gap-4">
						<FormSwitch
							name="start"
							label="Start it now"
							description="It holds the GPU and its share of the memory while it runs. You can also start it later from the list."
							disabled={isSubmitting}
						/>
						<FormSwitch
							name="createEngine"
							label="Create a SEMOSS engine for it"
							description="Apps, agents and the playground use a model through its engine."
							disabled={isSubmitting}
						/>
						{isCreatingEngine ? (
							<div className="flex flex-col gap-4 border-l-2 pl-4">
								<FormInput
									name="engineName"
									label="Engine name"
									placeholder={
										entry?.displayName ?? undefined
									}
									autoComplete="off"
									disabled={isSubmitting}
									description="Leave it blank for the catalog's name of the model."
								/>
								<FormSwitch
									name="engineGlobal"
									label="Make the engine public"
									description="Everyone on this SEMOSS can use it; otherwise only you, until you share it."
									disabled={isSubmitting}
								/>
							</div>
						) : null}
						<FormSwitch
							name="publish"
							label="Publish it for the LAN"
							description="Opens its OpenAI API on a port of the node. It has no authentication yet, so anyone who reaches the port can use it."
							disabled={isSubmitting}
						/>
						{isPublishing ? (
							<div className="flex flex-col gap-4 border-l-2 pl-4">
								<FormInput
									name="publishPort"
									label="Port"
									type="number"
									inputMode="numeric"
									min={MIN_PORT}
									max={MAX_PORT}
									disabled={isSubmitting}
									description="Leave it blank for the first free port SEMOSS may use (KSERVE_HOST_PORT_RANGE)."
								/>
							</div>
						) : null}
					</div>
					<Collapsible
						open={isAdvancedOpen}
						onOpenChange={setIsAdvancedOpen}
					>
						<CollapsibleTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="-ml-2 gap-1"
							>
								<ChevronDown
									className={cn(
										"size-4 transition-transform",
										isAdvancedOpen && "rotate-180",
									)}
									aria-hidden
								/>
								Memory and context
							</Button>
						</CollapsibleTrigger>
						<CollapsibleContent className="flex flex-col gap-4 pt-2">
							<FormInput
								name="gpuMemoryUtilization"
								label="Share of the unified memory"
								type="number"
								inputMode="decimal"
								step="0.05"
								min="0.05"
								max="1"
								disabled={isSubmitting}
								description="Above 0 and at most 1, such as 0.25. Leave it blank for the catalog's setting."
							/>
							<FormInput
								name="maxModelLen"
								label="Context length (tokens)"
								type="number"
								inputMode="numeric"
								min="1"
								disabled={isSubmitting}
								description={
									entry?.contextWindow
										? `Leave it blank for the catalog's ${entry.contextWindow}.`
										: "Leave it blank for the catalog's setting."
								}
							/>
						</CollapsibleContent>
					</Collapsible>
					{errors.root?.server?.message ? (
						<Alert variant="destructive">
							<AlertDescription className="break-words">
								{errors.root.server.message}
							</AlertDescription>
						</Alert>
					) : null}
					<DialogFooter className="flex-col sm:flex-row">
						<Button
							type="button"
							variant="outline"
							disabled={isSubmitting}
							onClick={() => onSubmit()}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting || entries.length === 0}
						>
							{isSubmitting ? (
								<Spinner className="size-4" />
							) : null}
							{isSubmitting
								? "Defining..."
								: isStarting
									? "Define and Start"
									: "Define Model"}
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
