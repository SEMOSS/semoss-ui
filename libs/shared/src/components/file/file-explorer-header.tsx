import { ChevronDownIcon, SearchIcon, XIcon } from "lucide-react";
import type React from "react";
import { useEffect, useRef } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
	ToggleGroup,
	ToggleGroupItem,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { FileExplorerApi } from "./file-explorer.types";
import { normalizeAssetPath } from "./file-explorer.utils";

export interface FileExplorerHeaderProps {
	explorer: FileExplorerApi;
	/**
	 * Trailing slot. The header draws no buttons of its own beyond the search
	 * toggle, so this is where refresh / new / publish live — or nowhere, when a
	 * host hoists them into its own chrome.
	 */
	actions?: React.ReactNode;
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
 * scope toggle from hiding while it is still filtering.
 */
export const FileExplorerHeader: React.FC<FileExplorerHeaderProps> = ({
	explorer,
	actions = null,
}) => {
	const { t } = useTranslation("common");
	const { crumbs, path, search, showSearch } = explorer.header;
	const searchInputRef = useRef<HTMLInputElement>(null);
	const searchToggleRef = useRef<HTMLButtonElement>(null);
	const searchLabel = t("fileExplorer.searchToggle");

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
										disabled={crumbs.length <= 1}
										title={path}
									>
										<div className="min-w-0 truncate text-start font-medium text-sm">
											{crumbs[0]}
										</div>
										{crumbs.length > 1 && (
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
										{crumb}
									</DropdownMenuItem>
								);
							})}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				<div className="flex shrink-0 flex-row items-center gap-1">
					<Tooltip>
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
					{search && (
						<InputGroupAddon align="inline-end">
							<InputGroupButton
								data-testid="file-explorer-clear-search-button"
								size="icon-xs"
								variant="ghost"
								aria-label={t("fileExplorer.clearSearch")}
								onClick={clearSearch}
							>
								<XIcon className="size-4" />
							</InputGroupButton>
						</InputGroupAddon>
					)}
				</InputGroup>
			)}

			{showSearch && explorer.capabilities.search && (
				<ToggleGroup
					type="single"
					variant="outline"
					size="sm"
					className="w-full"
					value={explorer.header.searchType}
					// radix clears a single group to "" when the active item is
					// clicked again, and anything that is not "all" scopes the
					// search to the current directory
					onValueChange={(value) =>
						value && explorer.header.setSearchType(value)
					}
				>
					<ToggleGroupItem
						data-testid="file-explorer-search-all-toggle"
						className="flex-1"
						value="all"
						aria-label={t("fileExplorer.searchAllAria")}
						title={t("fileExplorer.searchAllAria")}
					>
						{t("fileExplorer.searchAll")}
					</ToggleGroupItem>
					<ToggleGroupItem
						data-testid="file-explorer-search-current-toggle"
						className="flex-1"
						value="current"
						aria-label={t("fileExplorer.searchCurrentAria")}
						title={t("fileExplorer.searchCurrentTitle", {
							path,
						})}
					>
						{t("fileExplorer.searchOnly", { name: crumbs[0] })}
					</ToggleGroupItem>
				</ToggleGroup>
			)}
		</div>
	);
};
