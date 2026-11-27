import {
	ChevronDownIcon,
	ListFilterIcon,
	SearchIcon,
	XIcon,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { FileExplorerApi } from "./file-explorer.types";
import { normalizeAssetPath } from "./file-explorer.utils";
import type { FileExplorerPlace } from "./file-explorer-root.types";

export interface FileExplorerHeaderProps {
	explorer: FileExplorerApi;
	/**
	 * Trailing slot. The header draws no buttons of its own beyond the search
	 * toggle, so this is where refresh / new / publish live — or nowhere, when a
	 * host hoists them into its own chrome.
	 */
	actions?: React.ReactNode;
	/**
	 * Where it is drawn in a `FileExplorer` with several roots: at the top
	 * level, it names that level and has no path; inside a root, the root's
	 * top reads as the root's name, and the path ends with the top level.
	 */
	place?: FileExplorerPlace;
}

/**
 * The absolute path an ancestor entry in the path dropdown navigates to.
 *
 * `crumbs` runs innermost-first and ends with a `"/"` root sentinel, so the
 * sentinel has to come out before the segments are re-joined — leaving it in
 * yields a doubled leading slash, which `normalizeAssetPath` does not strip
 * because it only trims trailing ones.
 *
 * @param crumbs - The header's crumb list.
 * @param index - The selected crumb's position in it.
 * @return The normalized directory path.
 */
const getAncestorPath = (crumbs: string[], index: number) =>
	normalizeAssetPath(
		`/${crumbs
			.slice(index)
			.filter((crumb) => crumb !== "/")
			.reverse()
			.join("/")}`,
	);

/**
 * The explorer's current-directory control and search field.
 *
 * The path is a single truncated label for the current folder plus a dropdown
 * of its ancestors (innermost first), not a horizontal breadcrumb — it has to
 * survive a narrow sidebar. Search is a toggle rather than a permanently
 * mounted field, so the path and the action buttons keep their width; the row
 * it opens stays open for as long as a query is live, which is what keeps the
 * search's filters, in a menu inside the field, from hiding while it is still
 * filtering.
 */
export const FileExplorerHeader: React.FC<FileExplorerHeaderProps> = ({
	explorer,
	actions = null,
	place,
}) => {
	const { t } = useTranslation("common");
	const { crumbs, path, search, showSearch } = explorer.header;
	const searchInputRef = useRef<HTMLInputElement>(null);
	const searchToggleRef = useRef<HTMLButtonElement>(null);
	const searchLabel = t("fileExplorer.searchToggle");
	const isRoots = place?.level === "roots";
	const rootPlace = place?.level === "root" ? place : null;
	/**
	 * What a crumb reads: a root's own top is its name.
	 *
	 * @param crumb - The crumb.
	 * @returns Its label.
	 */
	const crumbLabel = (crumb: string): string =>
		crumb === "/" && rootPlace ? rootPlace.rootName : crumb;
	const currentLabel = isRoots ? place.label : crumbLabel(crumbs[0]);
	// inside a root there is always the top level above it
	const hasAncestors = !isRoots && (crumbs.length > 1 || Boolean(rootPlace));
	// the search's filters, in a menu inside the field, where the source can
	// keep a search to the current folder; the top level searches everything
	const hasScope =
		!isRoots &&
		explorer.capabilities.search &&
		explorer.capabilities.searchScope !== false;
	const isCurrentOnly = explorer.header.searchType !== "all";
	const filtersLabel = t("fileExplorer.searchFilters");

	// the row also opens from Ctrl/Cmd+F on the tree, so focus follows the
	// state rather than the click that usually causes it
	useEffect(() => {
		if (showSearch) {
			searchInputRef.current?.focus();
		}
	}, [showSearch]);

	/** Empty the query, keeping the row open and focused. */
	const clearSearch = () => {
		explorer.header.setSearch("");
		explorer.header.setIsSearchOpen(true);
		searchInputRef.current?.focus();
	};

	/** Close the row, dropping any live query that would reopen it. */
	const closeSearch = () => {
		explorer.header.setSearch("");
		explorer.header.setIsSearchOpen(false);
	};

	return (
		<div className="flex w-full flex-col gap-1.5 px-2">
			<div className="flex w-full flex-row items-center justify-between gap-1">
				<div className="flex min-w-0 flex-1 flex-row items-center gap-1 overflow-hidden">
					<DropdownMenu>
						<ContextMenu>
							{/* the trigger for the right-click menu wraps a plain
							    div rather than `DropdownMenuTrigger` itself — a
							    disabled button (crumbs.length <= 1, at the root)
							    stops receiving mouse events entirely, which would
							    take the copy-path menu down with it right where
							    copying "/" is most likely to be wanted */}
							<ContextMenuTrigger asChild>
								<div className="flex min-w-0 flex-1">
									<DropdownMenuTrigger
										data-testid="file-explorer-path-dropdown-trigger"
										className="flex min-w-0 flex-1 items-center gap-1.5"
										aria-label={t(
											"fileExplorer.toggleMenu",
										)}
										disabled={!hasAncestors}
										title={isRoots ? place.label : path}
									>
										<div className="min-w-0 truncate text-start font-medium text-sm">
											{currentLabel}
										</div>
										{hasAncestors && (
											<ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
										)}
									</DropdownMenuTrigger>
								</div>
							</ContextMenuTrigger>
							<ContextMenuContent>
								<ContextMenuItem
									data-testid="file-explorer-path-copy-button"
									onSelect={() =>
										explorer.commands.copyPath(path)
									}
								>
									{t("fileExplorer.contextMenu.copyPath")}
								</ContextMenuItem>
							</ContextMenuContent>
						</ContextMenu>
						<DropdownMenuContent align="start">
							{crumbs.map((crumb, index) => {
								if (index === 0) {
									return null;
								}

								return (
									<DropdownMenuItem
										// biome-ignore lint/suspicious/noArrayIndexKey: Each item in a path may not be unique, only the last one
										key={index}
										data-testid={`file-explorer-path-dropdown-item-${index}`}
										onSelect={() =>
											explorer.commands.navigateTo(
												getAncestorPath(crumbs, index),
											)
										}
									>
										{crumbLabel(crumb)}
									</DropdownMenuItem>
								);
							})}
							{rootPlace ? (
								<DropdownMenuItem
									data-testid="file-explorer-path-dropdown-roots"
									onSelect={rootPlace.onExit}
								>
									{rootPlace.label}
								</DropdownMenuItem>
							) : null}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				<div className="flex shrink-0 flex-row items-center gap-1">
					<Tooltip disableHoverableContent={false}>
						<TooltipTrigger asChild>
							<Button
								ref={searchToggleRef}
								data-testid="file-explorer-search-toggle"
								variant="ghost"
								size="icon-sm"
								aria-label={searchLabel}
								aria-expanded={showSearch}
								onClick={() =>
									showSearch
										? closeSearch()
										: explorer.header.setIsSearchOpen(true)
								}
							>
								<SearchIcon aria-hidden className="size-3" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>{searchLabel}</TooltipContent>
					</Tooltip>
					{actions}
				</div>
			</div>

			{showSearch && (
				<InputGroup className="h-8">
					<InputGroupAddon>
						<SearchIcon className="size-4 text-muted-foreground" />
					</InputGroupAddon>
					<InputGroupInput
						ref={searchInputRef}
						data-testid="file-explorer-search-input"
						placeholder={t("fileExplorer.search")}
						value={search}
						onChange={(e) =>
							explorer.header.setSearch(e.target.value)
						}
						onKeyDown={(e) => {
							if (e.key !== "Escape") {
								return;
							}

							// the explorer root handles Escape too (closes the
							// context menu, clears the selection), so this one
							// must not reach it
							e.preventDefault();
							e.stopPropagation();

							if (search) {
								clearSearch();
								return;
							}

							explorer.header.setIsSearchOpen(false);
							searchToggleRef.current?.focus();
						}}
					/>
					{search || hasScope ? (
						<InputGroupAddon align="inline-end">
							{search ? (
								<InputGroupButton
									data-testid="file-explorer-clear-search-button"
									size="icon-xs"
									variant="ghost"
									aria-label={t("fileExplorer.clearSearch")}
									onClick={clearSearch}
								>
									<XIcon className="size-4" />
								</InputGroupButton>
							) : null}
							{hasScope ? (
								<DropdownMenu>
									<Tooltip disableHoverableContent={false}>
										<TooltipTrigger asChild>
											<DropdownMenuTrigger asChild>
												<InputGroupButton
													data-testid="file-explorer-search-filters-button"
													size="icon-xs"
													variant="ghost"
													aria-label={filtersLabel}
													// a narrowed search shows it is
													className={cn(
														isCurrentOnly &&
															"text-primary",
													)}
												>
													<ListFilterIcon className="size-4" />
												</InputGroupButton>
											</DropdownMenuTrigger>
										</TooltipTrigger>
										<TooltipContent>
											{filtersLabel}
										</TooltipContent>
									</Tooltip>
									<DropdownMenuContent align="end">
										<DropdownMenuRadioGroup
											value={
												isCurrentOnly
													? "current"
													: "all"
											}
											// anything that is not "all" scopes
											// the search to the current directory
											onValueChange={(value) =>
												explorer.header.setSearchType(
													value,
												)
											}
										>
											<DropdownMenuRadioItem
												data-testid="file-explorer-search-all-toggle"
												value="all"
												title={t(
													"fileExplorer.searchAllAria",
												)}
											>
												{t("fileExplorer.searchAll")}
											</DropdownMenuRadioItem>
											<DropdownMenuRadioItem
												data-testid="file-explorer-search-current-toggle"
												value="current"
												title={t(
													"fileExplorer.searchCurrentTitle",
													{ path },
												)}
											>
												{t("fileExplorer.searchOnly", {
													name: crumbLabel(crumbs[0]),
												})}
											</DropdownMenuRadioItem>
										</DropdownMenuRadioGroup>
									</DropdownMenuContent>
								</DropdownMenu>
							) : null}
						</InputGroupAddon>
					) : null}
				</InputGroup>
			)}
		</div>
	);
};
