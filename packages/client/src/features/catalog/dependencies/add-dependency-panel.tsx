import { Check, Search, X } from "lucide-react";
import { type UIEvent, useEffect, useRef, useState } from "react";
import {
	Button,
	H4,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
	Muted,
	Spinner,
	ToggleGroup,
	ToggleGroupItem,
} from "@semoss/ui/next";
import { ACTIVE_TOGGLE_CLASS } from "@/features/dependency-map/active-toggle";
import { DependencyItemImage } from "@/features/dependency-map/dependency-item-image";
import { MapTooltip } from "@/features/dependency-map/map-tooltip";
import { getDependencyTypeConfig } from "./catalog-dependency";
import type { DependencyOption } from "./catalog-dependency-draft";
import {
	type DependencySource,
	useDependencyOptions,
} from "./use-dependency-options";

/** Props for {@link AddDependencyPanel}. */
interface AddDependencyPanelProps {
	/** The owner, which is never offered */
	catalogId: string;
	/** The targets the draft already links to, listed as Added and not pickable */
	linkedIds: ReadonlySet<string>;
	/** Adds a target to the draft */
	onPick: (option: DependencyOption) => void;
	/** Closes the panel */
	onClose: () => void;
}

/**
 * Add Dependency, in the Ontology's drawer area while its dependencies are
 * edited, as the automation canvas's add-node menu is: Engines or Projects,
 * then a search over the ones the user can see, a page at a time as the list
 * scrolls. A target already linked reads Added. Picking one adds it to the
 * draft and opens its link, to name and describe it.
 */
export const AddDependencyPanel = ({
	catalogId,
	linkedIds,
	onPick,
	onClose,
}: AddDependencyPanelProps) => {
	const [source, setSource] = useState<DependencySource>("ENGINE");
	const [search, setSearch] = useState("");
	const searchRef = useRef<HTMLInputElement>(null);
	const { options, isLoading, hasMore, next } = useDependencyOptions({
		catalogId,
		search,
		source,
	});
	const sourceLabel = source === "ENGINE" ? "engines" : "projects";

	// the search takes focus when the panel opens, as a picker should
	useEffect(() => {
		searchRef.current?.focus();
	}, []);

	const handleScroll = (event: UIEvent<HTMLDivElement>): void => {
		const list = event.currentTarget;
		const isNearBottom =
			list.scrollHeight - list.scrollTop - list.clientHeight < 80;
		if (isNearBottom && !isLoading && hasMore) {
			next();
		}
	};

	return (
		<aside
			aria-label="Add Dependency"
			className="slide-in-from-right flex size-full min-h-0 animate-in flex-col border-l bg-background duration-300"
		>
			<div className="flex flex-col gap-3 border-b p-4">
				<div className="flex items-center gap-2">
					<H4 className="flex-1 text-base">Add Dependency</H4>
					<MapTooltip label="Close">
						<Button
							type="button"
							size="icon-sm"
							variant="ghost"
							aria-label="Close Add Dependency"
							onClick={onClose}
						>
							<X aria-hidden="true" />
						</Button>
					</MapTooltip>
				</div>
				<ToggleGroup
					type="single"
					size="sm"
					variant="outline"
					aria-label="What to add"
					value={source}
					onValueChange={(value: DependencySource | "") => {
						if (value) {
							setSource(value);
						}
					}}
				>
					<ToggleGroupItem
						value="ENGINE"
						className={ACTIVE_TOGGLE_CLASS}
					>
						Engines
					</ToggleGroupItem>
					<ToggleGroupItem
						value="PROJECT"
						className={ACTIVE_TOGGLE_CLASS}
					>
						Projects
					</ToggleGroupItem>
				</ToggleGroup>
				<InputGroup>
					<InputGroupAddon>
						<Search aria-hidden="true" />
					</InputGroupAddon>
					<InputGroupInput
						ref={searchRef}
						type="search"
						aria-label={`Search ${sourceLabel}`}
						placeholder={`Search ${sourceLabel}`}
						value={search}
						onChange={(event) => setSearch(event.target.value)}
					/>
				</InputGroup>
			</div>
			<div
				className="min-h-0 flex-1 overflow-y-auto p-2"
				onScroll={handleScroll}
			>
				{isLoading && options.length === 0 ? (
					<div className="flex justify-center py-8">
						<Spinner />
					</div>
				) : options.length === 0 ? (
					<Muted className="px-2 py-8 text-center">
						No {sourceLabel} found.
					</Muted>
				) : (
					<ul
						aria-label={`Matching ${sourceLabel}`}
						className="flex flex-col"
					>
						{options.map((option) => {
							const isLinked = linkedIds.has(option.catalog_id);
							const config = getDependencyTypeConfig(
								option.catalog_type,
							);
							return (
								<li key={option.catalog_id}>
									<Item
										asChild
										size="sm"
										className="w-full flex-nowrap px-2 py-2 text-left"
									>
										<button
											type="button"
											disabled={isLinked}
											onClick={() => onPick(option)}
										>
											<ItemMedia>
												<DependencyItemImage
													node={{
														id: option.catalog_id,
														kind: config.kind,
														type: option.catalog_type,
														subtype:
															option.catalog_subtype ??
															null,
														name:
															option.catalog_name ??
															option.catalog_id,
													}}
													className="size-8"
												/>
											</ItemMedia>
											<ItemContent className="min-w-0 gap-0">
												<ItemTitle className="w-full truncate">
													{option.catalog_name ||
														option.catalog_id}
												</ItemTitle>
												<ItemDescription className="truncate text-xs">
													{config.label}
												</ItemDescription>
											</ItemContent>
											{isLinked ? (
												<ItemActions className="text-muted-foreground text-xs">
													<Check
														className="size-4 text-primary"
														aria-hidden="true"
													/>
													Added
												</ItemActions>
											) : null}
										</button>
									</Item>
								</li>
							);
						})}
					</ul>
				)}
				{isLoading && options.length > 0 ? (
					<div className="flex justify-center py-2">
						<Spinner className="size-4" />
					</div>
				) : null}
			</div>
		</aside>
	);
};
