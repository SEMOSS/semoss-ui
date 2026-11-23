import { Check, Search } from "lucide-react";
import { type UIEvent, useEffect, useRef, useState } from "react";
import {
	cn,
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
import { getDependencyTypeConfig } from "./catalog-dependency";
import type { DependencyOption } from "./catalog-dependency-draft";
import {
	type DependencySource,
	useDependencyOptions,
} from "./use-dependency-options";

/** Props for {@link DependencyTargetPicker}. */
interface DependencyTargetPickerProps {
	/** The owner, which is never offered */
	catalogId: string;
	/** The targets the draft already links to, listed as Added and not pickable */
	linkedIds: ReadonlySet<string>;
	/** The id of the target picked, or null for none yet */
	value: string | null;
	/** Picks a target */
	onChange: (option: DependencyOption) => void;
	/** Whether the field shows a problem, such as nothing picked */
	isInvalid?: boolean;
	/** The id of the field's error, which the list is described by */
	errorId?: string;
	/** Whether the picker takes no input */
	disabled?: boolean;
}

/**
 * The target field of the Add Dependency dialog, as the automation canvas's
 * add-node menu picks a step: Engines or Projects, then a search over the
 * ones the user can see, a page at a time as the list scrolls. A target
 * already linked reads Added and cannot be picked; the one picked reads
 * Selected.
 */
export const DependencyTargetPicker = ({
	catalogId,
	linkedIds,
	value,
	onChange,
	isInvalid = false,
	errorId,
	disabled = false,
}: DependencyTargetPickerProps) => {
	const [source, setSource] = useState<DependencySource>("ENGINE");
	const [search, setSearch] = useState("");
	const searchRef = useRef<HTMLInputElement>(null);
	const { options, isLoading, hasMore, next } = useDependencyOptions({
		catalogId,
		search,
		source,
	});
	const sourceLabel = source === "ENGINE" ? "engines" : "projects";

	// the search takes focus when the dialog opens, as a picker should; it
	// runs before the dialog's own focus, which then leaves it there
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
		<div className="flex flex-col gap-3">
			<ToggleGroup
				type="single"
				size="sm"
				variant="outline"
				aria-label="What to add"
				value={source}
				disabled={disabled}
				onValueChange={(next: DependencySource | "") => {
					if (next) {
						setSource(next);
					}
				}}
			>
				<ToggleGroupItem value="ENGINE" className={ACTIVE_TOGGLE_CLASS}>
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
					disabled={disabled}
					onChange={(event) => setSearch(event.target.value)}
				/>
			</InputGroup>
			<div
				className={cn(
					"h-64 overflow-y-auto rounded-md border p-1",
					isInvalid && "border-destructive",
				)}
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
						aria-describedby={isInvalid ? errorId : undefined}
						className="flex flex-col"
					>
						{options.map((option) => {
							const isLinked = linkedIds.has(option.catalog_id);
							const isSelected = option.catalog_id === value;
							const config = getDependencyTypeConfig(
								option.catalog_type,
							);
							return (
								<li key={option.catalog_id}>
									<Item
										asChild
										size="sm"
										className={cn(
											"w-full flex-nowrap px-2 py-2 text-left",
											isSelected && "bg-accent",
										)}
									>
										<button
											type="button"
											aria-pressed={isSelected}
											disabled={disabled || isLinked}
											onClick={() => onChange(option)}
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
											{isLinked || isSelected ? (
												<ItemActions className="text-muted-foreground text-xs">
													<Check
														className="size-4 text-primary"
														aria-hidden="true"
													/>
													{isLinked
														? "Added"
														: "Selected"}
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
		</div>
	);
};
