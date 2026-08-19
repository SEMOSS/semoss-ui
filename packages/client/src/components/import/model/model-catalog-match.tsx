import { Check, ChevronsUpDown, X } from "lucide-react";
import { useState } from "react";
import {
	Badge,
	Button,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	Muted,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@semoss/ui/next";

/** One entry from the `matches` list returned by MatchStaticModelMetadata. */
export interface CatalogMatchSuggestion {
	key: string;
	id?: string;
	name?: string;
	provider?: string;
	family?: string;
	score?: number;
}

/**
 * What MatchStaticModelMetadata came back with for a typed model ID. `modelId`
 * is carried so a response that lands after the user has typed on can be
 * recognized as stale and dropped.
 */
export interface CatalogMatchState {
	modelId: string;
	status: "LOADING" | "MATCHED" | "UNMATCHED" | "ERROR";
	/** the catalog key the ID resolved to with no help from the user */
	exactMatch: string | null;
	suggestions: CatalogMatchSuggestion[];
	allKeys: string[];
}

interface ModelCatalogMatchProps {
	state: CatalogMatchState | null;
	/** the entry the user picked by hand, null while the ID stands on its own */
	pickedKey: string | null;
	onPick: (catalogKey: string | null) => void;
}

/** How many ranked suggestions to offer before falling back to the full list. */
const VISIBLE_SUGGESTIONS = 5;

const describeSuggestion = (suggestion: CatalogMatchSuggestion) => {
	const parts = [suggestion.name, suggestion.provider].filter(Boolean);
	return parts.length > 0 ? parts.join(" - ") : suggestion.id || "";
};

/**
 * Sits under the Model ID field and reports whether the ID was found in
 * meta/model.json. An ID that resolves on its own says so and moves on; one
 * that does not lets the user point at an entry themselves, which is what gets
 * saved as CATALOG_MODEL_KEY.
 */
export const ModelCatalogMatch = (props: ModelCatalogMatchProps) => {
	const { state, pickedKey, onPick } = props;
	const [browserOpen, setBrowserOpen] = useState(false);

	if (!state) {
		return null;
	}

	const catalogBrowser = (label: string) => (
		<Popover open={browserOpen} onOpenChange={setBrowserOpen}>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="justify-between gap-2"
					data-testid="model-catalog-match-browse"
				>
					{label}
					<ChevronsUpDown className="size-3.5 opacity-60" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[320px] p-0" align="start">
				<Command>
					<CommandInput placeholder="Search the model catalog..." />
					<CommandList>
						<CommandEmpty>No matching catalog entry.</CommandEmpty>
						<CommandGroup>
							{state.allKeys.map((catalogKey) => (
								<CommandItem
									key={catalogKey}
									value={catalogKey}
									onSelect={() => {
										onPick(catalogKey);
										setBrowserOpen(false);
									}}
									data-testid={`model-catalog-match-option-${catalogKey}`}
								>
									<Check
										className={
											pickedKey === catalogKey
												? "size-3.5 opacity-100"
												: "size-3.5 opacity-0"
										}
									/>
									{catalogKey}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);

	// a hand-picked entry outranks whatever the ID would have resolved to, so it is
	// reported on its own rather than alongside the suggestions it came from
	if (pickedKey) {
		return (
			<div
				className="flex flex-col gap-2"
				data-testid="model-catalog-match-picked"
			>
				<Muted className="text-sm">
					Using catalog entry{" "}
					<span className="font-mono text-foreground">
						{pickedKey}
					</span>
					. Its metadata has been filled in below and saved with this
					model.
				</Muted>
				<div className="flex flex-row items-center gap-2">
					{catalogBrowser("Change entry")}
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="gap-1"
						onClick={() => onPick(null)}
						data-testid="model-catalog-match-clear"
					>
						<X className="size-3.5" />
						Clear
					</Button>
				</div>
			</div>
		);
	}

	if (state.status === "LOADING") {
		return (
			<Muted
				className="text-sm"
				data-testid="model-catalog-match-loading"
			>
				Checking the model catalog...
			</Muted>
		);
	}

	if (state.status === "ERROR") {
		return (
			<Muted className="text-sm" data-testid="model-catalog-match-error">
				Could not reach the model catalog. Fill in the metadata fields
				below yourself.
			</Muted>
		);
	}

	if (state.status === "MATCHED" && state.exactMatch) {
		return (
			<div
				className="flex flex-col gap-2"
				data-testid="model-catalog-match-exact"
			>
				<Muted className="text-sm">
					Recognized as{" "}
					<span className="font-mono text-foreground">
						{state.exactMatch}
					</span>
					. The metadata below was filled in from the catalog.
				</Muted>
				{catalogBrowser("Use a different entry")}
			</div>
		);
	}

	return (
		<div
			className="flex flex-col gap-2"
			data-testid="model-catalog-match-unmatched"
		>
			<Muted className="text-sm">
				<span className="font-mono text-foreground">
					{state.modelId}
				</span>{" "}
				is not in the model catalog. Pick the entry it corresponds to
				and its metadata will be filled in below, or leave this alone
				and set the fields yourself.
			</Muted>
			{state.suggestions.length > 0 && (
				<div className="flex flex-col gap-1">
					<Muted className="text-xs">Closest entries</Muted>
					<div className="flex flex-row flex-wrap gap-2">
						{state.suggestions
							.slice(0, VISIBLE_SUGGESTIONS)
							.map((suggestion) => (
								<Button
									key={suggestion.key}
									type="button"
									variant="outline"
									size="sm"
									className="h-auto flex-col items-start gap-0.5 py-1.5"
									onClick={() => onPick(suggestion.key)}
									data-testid={`model-catalog-match-suggestion-${suggestion.key}`}
								>
									<span className="font-mono text-xs">
										{suggestion.key}
									</span>
									{describeSuggestion(suggestion) && (
										<span className="font-normal text-[11px] text-muted-foreground">
											{describeSuggestion(suggestion)}
										</span>
									)}
								</Button>
							))}
					</div>
				</div>
			)}
			<div className="flex flex-row items-center gap-2">
				{catalogBrowser(
					state.suggestions.length > 0
						? "Browse all entries"
						: "Pick a catalog entry",
				)}
				{state.allKeys.length > 0 && (
					<Badge variant="secondary" className="font-normal">
						{state.allKeys.length} models
					</Badge>
				)}
			</div>
		</div>
	);
};
