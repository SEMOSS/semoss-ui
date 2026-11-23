import { Check } from "lucide-react";
import type { UIEvent } from "react";
import {
	cn,
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
	Muted,
	Spinner,
} from "@semoss/ui/next";
import { DependencyItemImage } from "@/features/dependency-map/dependency-item-image";
import { getDependencyTypeConfig } from "./catalog-dependency";
import type { DependencyOption } from "./catalog-dependency-draft";
import type { UseDependencyOptionsResult } from "./use-dependency-options";

/** How close to the end of the list the next page is read, in pixels. */
const NEXT_PAGE_DISTANCE = 80;

/** Props for {@link DependencyOptionList}. */
interface DependencyOptionListProps {
	/** The options read so far and their paging, from `useDependencyOptions` */
	read: UseDependencyOptionsResult;
	/** What the options are, in lower case, such as "engines" or "models" */
	sourceLabel: string;
	/** Whether an option is picked, read as pressed */
	isSelected: (option: DependencyOption) => boolean;
	/** Whether an option cannot be picked, such as one already linked */
	isDisabled?: (option: DependencyOption) => boolean;
	/** The word after a picked or unpickable option, such as Added */
	getStatus?: (option: DependencyOption) => string | null;
	/** Picks, or unpicks, an option */
	onPick: (option: DependencyOption) => void;
	/** Whether the field holding the list shows a problem */
	isInvalid?: boolean;
	/** The id of the field's error, which the list is described by */
	errorId?: string;
	/** Size classes for the scrolling area */
	className?: string;
}

/**
 * The engines or projects a dependency picker offers, scrolling, a page at a
 * time as the list nears its end: a spinner while the first page is read,
 * the read's error, "No … found", or one row per option (its image, name and
 * type) with a check and the caller's word once picked. The Add Dependency
 * dialog and the Engines panel's Manage dialog share it; each keeps its own
 * search and what is picked.
 */
export const DependencyOptionList = ({
	read,
	sourceLabel,
	isSelected,
	isDisabled,
	getStatus,
	onPick,
	isInvalid = false,
	errorId,
	className,
}: DependencyOptionListProps) => {
	const { options, isLoading, hasMore, error, next } = read;

	const handleScroll = (event: UIEvent<HTMLDivElement>): void => {
		const list = event.currentTarget;
		const isNearEnd =
			list.scrollHeight - list.scrollTop - list.clientHeight <
			NEXT_PAGE_DISTANCE;
		if (isNearEnd && !isLoading && hasMore) {
			next();
		}
	};

	return (
		<div
			className={cn(
				"overflow-y-auto rounded-md border p-1",
				isInvalid && "border-destructive",
				className,
			)}
			onScroll={handleScroll}
		>
			{error ? (
				<p className="px-2 py-8 text-center text-destructive text-sm">
					{`Couldn't read the ${sourceLabel}: ${error.message}`}
				</p>
			) : isLoading && options.length === 0 ? (
				<div className="flex justify-center py-8">
					<Spinner />
				</div>
			) : options.length === 0 ? (
				<Muted className="block px-2 py-8 text-center">
					No {sourceLabel} found.
				</Muted>
			) : (
				<ul
					aria-label={`Matching ${sourceLabel}`}
					aria-describedby={isInvalid ? errorId : undefined}
					className="flex flex-col"
				>
					{options.map((option) => {
						const isPicked = isSelected(option);
						const status = getStatus?.(option) ?? null;
						const config = getDependencyTypeConfig(
							option.catalog_type,
						);
						const name = option.catalog_name || option.catalog_id;
						return (
							<li key={option.catalog_id}>
								<Item
									asChild
									size="sm"
									className={cn(
										"w-full flex-nowrap px-2 py-2 text-left",
										isPicked && "bg-accent",
									)}
								>
									<button
										type="button"
										aria-pressed={isPicked}
										disabled={isDisabled?.(option) ?? false}
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
													name,
												}}
												className="size-8"
											/>
										</ItemMedia>
										<ItemContent className="min-w-0 gap-0">
											<ItemTitle className="w-full truncate">
												{name}
											</ItemTitle>
											<ItemDescription className="truncate text-xs">
												{config.label}
											</ItemDescription>
										</ItemContent>
										{status ? (
											<ItemActions className="text-muted-foreground text-xs">
												<Check
													className="size-4 text-primary"
													aria-hidden="true"
												/>
												{status}
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
	);
};
