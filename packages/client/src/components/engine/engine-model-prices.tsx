import { Lock, Plus, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Role } from "@semoss/sdk";
import { usePixel } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Badge,
	Button,
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Input,
	Spinner,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	toast,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { isRecord } from "@semoss/utility/object";
import { useSession } from "@/hooks";
import {
	formatPrice,
	formatPricingProviderLabel,
	getAddablePricingProviders,
	type ModelMetadata,
	toPricingProviderKey,
} from "./engine-metadata-display";

/** The rates the card shows and edits, in dollars per million tokens */
const RATES = [
	{ key: "input", label: "Input" },
	{ key: "output", label: "Output" },
	{ key: "cache_read", label: "Cache Read" },
	{ key: "cache_write", label: "Cache Write" },
] as const;

/** One of the rates the card edits */
type RateKey = (typeof RATES)[number]["key"];

/** The rates every price entry needs, so cost can be worked out */
const REQUIRED_RATES: readonly RateKey[] = ["input", "output"];

/** One price entry as it is typed: the rates as text, by key */
type RateDrafts = Record<RateKey, string>;

/** A price entry with no rates typed yet */
const EMPTY_DRAFT: RateDrafts = {
	input: "",
	output: "",
	cache_read: "",
	cache_write: "",
};

/** Why an owner cannot save the prices as typed */
const CANNOT_REMOVE = "A price cannot be cleared, only changed";
const LAST_PRICE = "A model keeps at least one price";

/** One row of the card: a price entry, stored or added, and the key its typed rates are kept under */
interface PriceRow {
	/** Stable for the row while it is edited */
	key: string;
	/** The entry as stored, or the provider and model id of one added */
	entry: Record<string, unknown>;
	/** The stored entry's place in the stored list, or null for one added */
	storedIndex: number | null;
}

/**
 * @param value - a rate as the backend stores it
 * @returns the rate as a number, or null when it has none
 */
const readRate = (value: unknown): number | null => {
	if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
		return value;
	}
	if (typeof value === "string" && value.trim() !== "") {
		const parsed = Number(value);
		return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
	}
	return null;
};

/**
 * @param entry - a price entry
 * @returns its rates as the inputs show them
 */
const toDraft = (entry: Record<string, unknown>): RateDrafts => ({
	input: String(readRate(entry.input) ?? ""),
	output: String(readRate(entry.output) ?? ""),
	cache_read: String(readRate(entry.cache_read) ?? ""),
	cache_write: String(readRate(entry.cache_write) ?? ""),
});

/**
 * @param text - a rate as typed
 * @returns the rate, or null when it is empty, or NaN when it is not a price
 */
const parseRate = (text: string): number | null => {
	if (text.trim() === "") {
		return null;
	}
	const value = Number(text);
	return Number.isFinite(value) && value >= 0 ? value : Number.NaN;
};

export interface EngineModelPricesProps {
	/** Id of the model engine */
	engineId: string;
	/** The user's permission for the engine; only owners change prices */
	permission: Role;
	/** Called after the prices are saved */
	onUpdated?: () => void;
}

/**
 * A model's prices, in US dollars per million tokens: what its cost limits
 * count calls at. Only the model's owners change them, for example to enter
 * contract prices; its editors see them read-only. Owners can add prices for
 * any provider and remove any provider's price but the one cost limits use,
 * which can only be changed; a rate that has a value cannot be cleared.
 */
export const EngineModelPrices = ({
	engineId,
	permission,
	onUpdated,
}: EngineModelPricesProps) => {
	const runPixel = useSession((state) => state.runPixel);
	const getModelMetadata = usePixel<ModelMetadata>(
		engineId ? `GetModelMetadata(engine=["${engineId}"]);` : "",
	);
	const isOwner = permission === "OWNER";
	const rawPricing: unknown = getModelMetadata.data?.pricing;
	const stored: Record<string, unknown>[] = Array.isArray(rawPricing)
		? rawPricing.filter(isRecord)
		: [];
	const metadata = getModelMetadata.data;
	// the provider whose price cost limits use, and the stored entry they use, if any
	const costProvider = metadata?.effectiveServingProvider ?? null;
	const costEntry = metadata?.costPriceEntry ?? null;
	// false when the price used is the maker's or another entry, in place of the serving provider's own
	const isServingProviderPrice =
		metadata?.costPriceForServingProvider !== false;
	const engineModelId = metadata?.modelId ?? null;
	// the rates typed, by row; a row not typed in shows what is stored
	const [edits, setEdits] = useState<Record<string, RateDrafts>>({});
	// the providers of the entries the owner is adding; any provider can be
	// priced, since the model can be moved to another one later
	const [added, setAdded] = useState<string[]>([]);
	// the stored entries the owner is removing, by their place in the list
	const [removed, setRemoved] = useState<number[]>([]);
	const [isSaving, setIsSaving] = useState(false);
	// problems show only once Save is pressed, so a row just added is not red
	const [hasTriedSave, setHasTriedSave] = useState(false);
	// counts the save attempts a problem stopped, each moving focus to the
	// first price marked invalid
	const [focusRequest, setFocusRequest] = useState(0);
	const tableRef = useRef<HTMLDivElement>(null);
	const problemId = useId();
	const rows: PriceRow[] = [
		...stored.flatMap((entry, index) =>
			removed.includes(index)
				? []
				: [{ key: `stored:${index}`, entry, storedIndex: index }],
		),
		...(engineModelId
			? added.map((provider) => ({
					key: `added:${provider}`,
					entry: {
						servingProvider: provider,
						modelId: engineModelId,
					},
					storedIndex: null,
				}))
			: []),
	];
	const addableProviders = getAddablePricingProviders(
		rows.map((row) => row.entry),
		costProvider,
	);
	const canAdd =
		isOwner && engineModelId !== null && addableProviders.length > 0;
	const costProviderLabel = costProvider
		? formatPricingProviderLabel(costProvider)
		: null;
	const costNote = costEntry
		? isServingProviderPrice || !costProviderLabel
			? `Cost limits count this model's calls at the ${formatPricingProviderLabel(costEntry.servingProvider)} price, marked Used for Cost Limits.`
			: `Cost limits count this model's calls at the ${formatPricingProviderLabel(costEntry.servingProvider)} price, marked Used for Cost Limits, since there is no price for its serving provider, ${costProviderLabel}. Add one if ${costProviderLabel} charges differently.`
		: costProviderLabel
			? `Cost limits count this model's calls at the price for its serving provider, ${costProviderLabel}. There is none yet, so its usage limits cannot have cost rules.`
			: "Cost limits count this model's calls at the price for its serving provider. Set the Serving Provider in Model Settings so they know which price to use.";

	/** Whether cost limits count calls at this entry's prices */
	const isCostEntry = (entry: Record<string, unknown>): boolean =>
		costEntry !== null &&
		entry.servingProvider === costEntry.servingProvider &&
		(entry.modelId ?? null) === (costEntry.modelId ?? null);
	const draftOf = (row: PriceRow): RateDrafts =>
		edits[row.key] ?? toDraft(row.entry);
	// cost limits always keep the price they count at; any other can go
	const canRemove = (row: PriceRow): boolean =>
		isOwner && (row.storedIndex === null || !isCostEntry(row.entry));
	const isDirty =
		Object.keys(edits).length > 0 || added.length > 0 || removed.length > 0;

	/**
	 * @param row - a price entry's row
	 * @param key - one of its rates
	 * @returns why the rate as typed cannot be saved, or null
	 */
	const findRateProblem = (row: PriceRow, key: RateKey): string | null => {
		const value = parseRate(draftOf(row)[key]);
		if (Number.isNaN(value)) {
			return "Enter each price as a number of dollars, 0 or more";
		}
		const isStored =
			row.storedIndex !== null && readRate(row.entry[key]) !== null;
		if (value === null && isStored) {
			return CANNOT_REMOVE;
		}
		if (value === null && REQUIRED_RATES.includes(key)) {
			return "Every price entry needs an input and an output price";
		}
		return null;
	};

	/** Why the prices as typed cannot be saved, the first rate's problem, or null */
	const findProblem = (): string | null => {
		if (rows.length === 0 && stored.length > 0) {
			return LAST_PRICE;
		}
		for (const row of rows) {
			for (const { key } of RATES) {
				const rateProblem = findRateProblem(row, key);
				if (rateProblem) {
					return rateProblem;
				}
			}
		}
		return null;
	};
	const problem = isDirty ? findProblem() : null;
	const shownProblem = hasTriedSave ? problem : null;

	useEffect(() => {
		if (focusRequest === 0) {
			return;
		}
		// runs after the render that marks the prices, so the first one marked
		// gets focus with its problem described
		tableRef.current
			?.querySelector<HTMLElement>('[aria-invalid="true"]')
			?.focus();
	}, [focusRequest]);

	const handleChange = (row: PriceRow, key: RateKey, text: string) => {
		const cleaned = text.replace(/[^0-9.]/g, "");
		setEdits((current) => ({
			...current,
			[row.key]: {
				...(current[row.key] ?? toDraft(row.entry)),
				[key]: cleaned,
			},
		}));
	};

	const handleAdd = (provider: string) => {
		setAdded((current) => [...current, provider]);
		setEdits((current) => ({
			...current,
			[`added:${provider}`]: EMPTY_DRAFT,
		}));
	};

	const handleRemove = (row: PriceRow) => {
		const { storedIndex } = row;
		if (storedIndex === null) {
			setAdded((current) =>
				current.filter((provider) => `added:${provider}` !== row.key),
			);
		} else {
			setRemoved((current) => [...current, storedIndex]);
		}
		setEdits((current) =>
			Object.fromEntries(
				Object.entries(current).filter(([key]) => key !== row.key),
			),
		);
	};

	const reset = () => {
		setEdits({});
		setAdded([]);
		setRemoved([]);
		setHasTriedSave(false);
	};

	const handleSave = async () => {
		setHasTriedSave(true);
		if (problem) {
			setFocusRequest((count) => count + 1);
			return;
		}
		// every stored key of an entry is kept; only the rates shown change, and
		// the rows removed are left out
		const pricing = rows.map((row) => {
			const next: Record<string, unknown> = { ...row.entry };
			for (const { key } of RATES) {
				const value = parseRate(draftOf(row)[key]);
				if (value !== null) {
					next[key] = value;
				}
			}
			return next;
		});
		setIsSaving(true);
		try {
			const response = await runPixel(
				`UpdateModelMetadata(engine=["${engineId}"], map=[${JSON.stringify({ PRICING: pricing })}]);`,
			);
			const result = response.pixelReturn?.[0];
			if (
				response.errors.length > 0 ||
				String(result?.operationType || "").includes("ERROR")
			) {
				throw new Error(
					response.errors.join("") ||
						String(result?.output || "Unable to save the prices."),
				);
			}
			toast.success("The prices were saved");
			reset();
			getModelMetadata.refresh();
			onUpdated?.();
		} catch (error) {
			toast.error(getErrorMessage(error, "Error saving the prices"));
		} finally {
			setIsSaving(false);
		}
	};

	if (getModelMetadata.status === "ERROR") {
		return (
			<Alert variant="destructive">
				<AlertDescription>
					Unable to load the model's prices.
				</AlertDescription>
			</Alert>
		);
	}

	return (
		<Card>
			<CardHeader className="border-b">
				<CardTitle>Prices</CardTitle>
				<CardDescription>
					US dollars per million tokens. Cost limits count this
					model's calls at one of these prices, so only its owners
					change them, for example to enter contract prices. The price
					used for cost limits can be changed but not removed.
				</CardDescription>
				{isOwner && isDirty ? (
					<CardAction className="flex gap-2 self-center">
						<Button
							variant="outline"
							size="sm"
							onClick={reset}
							disabled={isSaving}
						>
							Discard
						</Button>
						<Button
							size="sm"
							onClick={handleSave}
							disabled={isSaving}
						>
							{isSaving ? <Spinner className="size-4" /> : null}
							{isSaving ? "Saving..." : "Save"}
						</Button>
					</CardAction>
				) : null}
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				{getModelMetadata.status !== "SUCCESS" ? (
					<div className="flex min-h-24 items-center justify-center">
						<Spinner />
					</div>
				) : rows.length === 0 ? (
					<div className="flex flex-col items-start gap-2">
						<p className="text-muted-foreground text-sm">
							This model has no prices yet.
						</p>
					</div>
				) : (
					<div
						ref={tableRef}
						className="overflow-x-auto rounded-md border border-border"
					>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Serving Provider</TableHead>
									{RATES.map((rate) => (
										<TableHead key={rate.key}>
											{rate.label}
										</TableHead>
									))}
									{isOwner ? (
										<TableHead className="w-px">
											<span className="sr-only">
												Remove
											</span>
										</TableHead>
									) : null}
								</TableRow>
							</TableHeader>
							<TableBody>
								{rows.map((row) => {
									const { entry } = row;
									const provider =
										typeof entry.servingProvider ===
										"string"
											? formatPricingProviderLabel(
													entry.servingProvider,
												)
											: "Unknown";
									const modelId =
										typeof entry.modelId === "string"
											? entry.modelId
											: null;
									return (
										<TableRow key={row.key}>
											<TableCell className="text-sm">
												<span className="flex flex-col items-start gap-0.5">
													<span>{provider}</span>
													{modelId ? (
														<span className="font-mono text-muted-foreground text-xs">
															{modelId}
														</span>
													) : null}
													{isCostEntry(entry) ? (
														<Badge variant="secondary">
															Used for Cost Limits
														</Badge>
													) : null}
												</span>
											</TableCell>
											{RATES.map((rate) => {
												const value = readRate(
													entry[rate.key],
												);
												// marked only once Save is pressed
												const isInvalid =
													shownProblem !== null &&
													findRateProblem(
														row,
														rate.key,
													) !== null;
												return (
													<TableCell
														key={rate.key}
														className="text-sm"
													>
														{isOwner ? (
															<Input
																inputMode="decimal"
																className="w-28"
																aria-label={`${rate.label} price for ${provider}`}
																aria-invalid={
																	isInvalid
																}
																aria-describedby={
																	isInvalid
																		? problemId
																		: undefined
																}
																value={
																	draftOf(
																		row,
																	)[rate.key]
																}
																onChange={(e) =>
																	handleChange(
																		row,
																		rate.key,
																		e.target
																			.value,
																	)
																}
															/>
														) : value !== null ? (
															formatPrice(value)
														) : (
															<span className="text-muted-foreground">
																-
															</span>
														)}
													</TableCell>
												);
											})}
											{isOwner ? (
												<TableCell className="pr-3">
													{canRemove(row) ? (
														<Button
															type="button"
															variant="ghost"
															size="icon-sm"
															aria-label={`Remove the ${provider} price`}
															onClick={() =>
																handleRemove(
																	row,
																)
															}
														>
															<Trash2
																className="size-4"
																aria-hidden
															/>
														</Button>
													) : null}
												</TableCell>
											) : null}
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>
				)}
				{getModelMetadata.status === "SUCCESS" ? (
					<p className="text-muted-foreground text-xs">{costNote}</p>
				) : null}
				{canAdd ? (
					<DropdownMenu modal={false}>
						<DropdownMenuTrigger asChild>
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="self-start"
							>
								<Plus className="size-4" aria-hidden />
								Add Prices
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start">
							{addableProviders.map((provider) => (
								<DropdownMenuItem
									key={provider.value}
									onSelect={() => handleAdd(provider.value)}
								>
									<span className="flex flex-col">
										<span>{provider.label}</span>
										{costProvider &&
										toPricingProviderKey(provider.value) ===
											toPricingProviderKey(
												costProvider,
											) ? (
											<span className="text-muted-foreground text-xs">
												Serves this model, so cost
												limits use it
											</span>
										) : null}
									</span>
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				) : null}
				{shownProblem ? (
					<Alert variant="destructive">
						<AlertDescription id={problemId}>
							{shownProblem}
						</AlertDescription>
					</Alert>
				) : null}
				{!isOwner ? (
					<p className="flex items-start gap-1.5 text-muted-foreground text-xs">
						<Lock
							className="mt-0.5 size-3.5 shrink-0"
							aria-hidden
						/>
						Only owners can change a model's prices.
					</p>
				) : null}
			</CardContent>
		</Card>
	);
};
