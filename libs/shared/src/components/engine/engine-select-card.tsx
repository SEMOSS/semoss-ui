import {
	FileImageIcon,
	FilePenIcon,
	ImageIcon,
	MoveDownIcon,
	MoveUpIcon,
	SearchIcon,
	TypeIcon,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useIteratorPixel } from "@semoss/sdk/react";
import {
	Badge,
	Card,
	CardContent,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Muted,
	ScrollArea,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import type { Engine } from "@/types";

// ============================================================================
// Helpers
// ============================================================================

/** Derive a deterministic HSL background color from a string. */
const nameToHsl = (str: string): string => {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}
	const hue = Math.abs(hash) % 360;
	return `hsl(${hue}, 55%, 40%)`;
};

/** Generate a 2-letter uppercase abbreviation from a display name. */
const toAbbr = (name: string): string => {
	const words = name.trim().split(/\s+/);
	if (words.length >= 2) {
		return (words[0][0] + words[1][0]).toUpperCase();
	}
	return name.slice(0, 2).toUpperCase();
};

/** Normalize the tag/tags API quirk into a consistent string array. */
const getTags = (engine: Engine): string[] => {
	if (Array.isArray(engine.tag)) return engine.tag;
	if (typeof engine.tag === "string" && engine.tag) return [engine.tag];
	return [];
};

/** Icon + human label + direction for known capability tags. */
const TAG_CONFIG: Record<
	string,
	{ icon: React.ElementType; label: string; direction: "input" | "output" }
> = {
	"text-generation": {
		icon: FilePenIcon,
		label: "Text Generation",
		direction: "output",
	},
	"image-generation": {
		icon: ImageIcon,
		label: "Image Generation",
		direction: "output",
	},
	"text-input": { icon: TypeIcon, label: "Text Input", direction: "input" },
	"image-input": {
		icon: FileImageIcon,
		label: "Image Input",
		direction: "input",
	},
};

// ============================================================================
// EngineCard (single card)
// ============================================================================

interface EngineCardProps {
	engine: Engine;
	selected: boolean;
	onClick: () => void;
}

const EngineCard: React.FC<EngineCardProps> = ({
	engine,
	selected,
	onClick,
}) => {
	const displayName = engine.engine_display_name || engine.engine_name || "";
	const abbr = toAbbr(displayName);
	const avatarBg = nameToHsl(engine.engine_id || displayName);
	const imageUrl = `${(import.meta as Record<string, Record<string, string>>).env.MODULE}/api/e-${engine.engine_id}/image/download`;
	const [imgError, setImgError] = useState(false);

	return (
		<Card
			className={`col-span-1 cursor-pointer p-0 transition-all hover:border-primary/50 hover:shadow-md ${
				selected ? "border-primary ring-2 ring-primary" : ""
			}`}
			onClick={onClick}
		>
			<CardContent className="space-y-2 p-4">
				{/* Name */}
				<div className="line-clamp-2 min-w-0 font-semibold text-sm leading-tight">
					{displayName}
				</div>

				{/* Avatar + subtype badge + capability tag chips */}
				<div className="flex items-center gap-3">
					{imgError ? (
						<div
							className="flex size-16 shrink-0 items-center justify-center rounded-md font-semibold text-sm text-white"
							style={{ backgroundColor: avatarBg }}
						>
							{abbr}
						</div>
					) : (
						<img
							src={imageUrl}
							alt={displayName}
							className="size-16 shrink-0 rounded-md object-cover object-center"
							onError={() => setImgError(true)}
						/>
					)}
					<div className="flex flex-col gap-1">
						{engine.engine_subtype && (
							<Badge variant="outline" className="w-fit text-xs">
								{engine.engine_subtype}
							</Badge>
						)}
						{(() => {
							const tags = getTags(engine);
							const known = tags.filter((t) => TAG_CONFIG[t]);
							// Sort: text-* before image-* (reverse alpha on tag name)
							known.sort((a, b) => b.localeCompare(a));
							const inputs = known.filter(
								(t) => TAG_CONFIG[t].direction === "input",
							);
							const outputs = known.filter(
								(t) => TAG_CONFIG[t].direction === "output",
							);
							if (known.length === 0) return null;

							const renderPills = (tagList: string[]) =>
								tagList.map((tag) => {
									const { icon: Icon, label } =
										TAG_CONFIG[tag];
									return (
										<Tooltip key={tag}>
											<TooltipTrigger asChild>
												<div className="flex items-center justify-center rounded-full border border-border bg-muted p-1.5 text-muted-foreground">
													<Icon className="size-3" />
												</div>
											</TooltipTrigger>
											<TooltipContent>
												{label}
											</TooltipContent>
										</Tooltip>
									);
								});

							return (
								<div className="flex flex-wrap items-center gap-1">
									{inputs.length > 0 && (
										<>
											<MoveDownIcon className="size-2.5 shrink-0 text-muted-foreground" />
											{renderPills(inputs)}
										</>
									)}
									{outputs.length > 0 && (
										<>
											<MoveUpIcon className="size-2.5 shrink-0 text-muted-foreground" />
											{renderPills(outputs)}
										</>
									)}
								</div>
							);
						})()}
					</div>
				</div>

				{/* Description */}
				<div className="line-clamp-2 text-muted-foreground text-xs">
					{engine.description || "No description available."}
				</div>
			</CardContent>
		</Card>
	);
};

// ============================================================================
// EngineSelectCard
// ============================================================================

interface EngineSelectCardProps {
	/** ID of the currently selected engine */
	value: string;

	/** Callback invoked when selection changes */
	onChange: (engine: Engine) => void;

	/** Filter engines by type (e.g., MODEL) */
	engineTypes?: Engine["engine_type"][];

	/** Additional metadata filters for engine query */
	metaFilters?: unknown[];

	/** Whether the selector is disabled */
	disabled?: boolean;
}

export const EngineSelectCard: React.FC<EngineSelectCardProps> = ({
	value,
	onChange,
	engineTypes,
	metaFilters,
	disabled,
}) => {
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search.trim());
	const serverSearch = debouncedSearch.split(/\s+/)[0] || "";

	const getEngines = useIteratorPixel<Engine[], Engine>(
		(limit, offset) =>
			`META | MyEngines(${
				serverSearch
					? `filterWord=["<encode>${serverSearch}</encode>"], `
					: ""
			}${
				engineTypes ? `engineTypes=${JSON.stringify(engineTypes)},` : ""
			}${
				metaFilters
					? `metaFilters=[${JSON.stringify(metaFilters)}],`
					: ""
			} metaKeys=["tag", "description"], limit=[${limit}], offset=[${offset}]);`,
		(response) => (response.length < 15 ? -1 : Infinity),
		(response) => response,
		{ limit: 15 },
		[
			serverSearch,
			JSON.stringify(engineTypes),
			JSON.stringify(metaFilters),
		],
	);

	// Client-side multi-word filtering (mirrors engine-select.tsx behaviour)
	const filteredEngines = (() => {
		const words = debouncedSearch
			.toLowerCase()
			.split(/\s+/)
			.filter(Boolean);
		if (words.length <= 1) return getEngines.data;
		return getEngines.data.filter((engine) => {
			const name = (
				engine.engine_display_name ||
				engine.engine_name ||
				""
			).toLowerCase();
			return words.every((word) => name.includes(word));
		});
	})();

	const { setScroll } = useInfiniteScroll({
		disabled: getEngines.isLoading || !getEngines.hasMore,
		onNext: () => getEngines.next(),
	});

	return (
		<div className="w-full overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm">
			{/* Search bar */}
			<div className="flex w-full flex-row gap-2 border-border border-b bg-muted p-4">
				<InputGroup className="bg-background">
					<InputGroupInput
						autoFocus
						placeholder="Search models..."
						value={search}
						disabled={disabled}
						onChange={(e) => setSearch(e.target.value)}
					/>
					<InputGroupAddon>
						<SearchIcon />
					</InputGroupAddon>
				</InputGroup>
			</div>

			{/* Card grid */}
			<ScrollArea
				className="h-64 w-full flex-1"
				viewportRef={(e) => setScroll(e)}
			>
				{getEngines.isLoading && getEngines.data.length === 0 && (
					<div className="flex h-64 w-full items-center justify-center">
						<Spinner />
					</div>
				)}
				{!getEngines.isLoading && filteredEngines.length === 0 && (
					<div className="flex h-64 w-full items-center justify-center">
						<Muted>No models found</Muted>
					</div>
				)}
				{filteredEngines.length > 0 && (
					<div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-3">
						{filteredEngines.map((engine) => (
							<EngineCard
								key={engine.engine_id}
								engine={engine}
								selected={
									value === engine.engine_id ||
									value === engine.app_id
								}
								onClick={() => {
									if (!disabled) onChange(engine);
								}}
							/>
						))}
						{getEngines.isLoading && (
							<div className="col-span-3 flex justify-center py-2">
								<Spinner className="size-4" />
							</div>
						)}
					</div>
				)}
			</ScrollArea>
		</div>
	);
};
