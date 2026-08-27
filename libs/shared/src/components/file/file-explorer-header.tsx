import { ChevronDownIcon, SearchIcon } from "lucide-react";
import type React from "react";
import { useTranslation } from "@semoss/i18n";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	ToggleGroup,
	ToggleGroupItem,
} from "@semoss/ui/next";
import type { FileExplorerApi } from "./file-explorer.types";

export interface FileExplorerHeaderProps {
	explorer: FileExplorerApi;
	/**
	 * Trailing slot. The header draws no buttons of its own, so this is where
	 * refresh / new / publish live — or nowhere, when a host hoists them into
	 * its own chrome.
	 */
	actions?: React.ReactNode;
}

/**
 * The explorer's current-directory control and search field.
 *
 * The path is a single truncated label for the current folder plus a dropdown
 * of its ancestors (innermost first), not a horizontal breadcrumb — it has to
 * survive a narrow sidebar. Focusing search collapses the path and the actions
 * so the field can take the full width.
 */
export const FileExplorerHeader: React.FC<FileExplorerHeaderProps> = ({
	explorer,
	actions = null,
}) => {
	const { t } = useTranslation("common");
	const { crumbs, path, showSearch } = explorer.header;

	return (
		<div className="flex w-full flex-col gap-1.5 px-2">
			<div className="flex w-full flex-row items-center justify-between gap-1">
				<div
					className={`${showSearch ? "w-0" : "flex-1"} flex flex-row items-center gap-1 overflow-hidden transition-all duration-300 ease-in-out`}
				>
					<DropdownMenu>
						<DropdownMenuTrigger
							data-testid="file-explorer-path-dropdown-trigger"
							className="flex flex-1 items-center gap-1.5"
							aria-label={t("fileExplorer.toggleMenu")}
							disabled={crumbs.length <= 1}
							title={path}
						>
							<div className="min-w-12 max-w-64 truncate text-start text-sm">
								{crumbs[0]}
							</div>
							{crumbs.length > 1 && (
								<ChevronDownIcon className="size-4 text-muted-foreground" />
							)}
						</DropdownMenuTrigger>
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
												crumbs
													.slice(index)
													.reverse()
													.join("/"),
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

				{explorer.capabilities.search && (
					<InputGroup
						className={`${showSearch ? "flex-1" : "w-32"} transition-all duration-300 ease-in-out`}
					>
						<InputGroupInput
							data-testid="file-explorer-search-input"
							type="search"
							placeholder={t("fileExplorer.search")}
							value={explorer.header.search}
							onChange={(e) =>
								explorer.header.setSearch(e.target.value)
							}
							onFocus={() =>
								explorer.header.setIsSearchActive(true)
							}
							onBlur={() =>
								explorer.header.setIsSearchActive(false)
							}
						/>
						<InputGroupAddon align="inline-end">
							<SearchIcon />
						</InputGroupAddon>
					</InputGroup>
				)}

				<div
					className={`${showSearch ? "w-0" : ""} flex flex-row items-center gap-1 overflow-hidden transition-all duration-300 ease-in-out`}
				>
					{actions}
				</div>
			</div>
			{showSearch && (
				<div className="flex w-full flex-row items-center justify-between gap-1">
					<ToggleGroup
						type="single"
						variant="outline"
						size="sm"
						value={explorer.header.searchType}
						onValueChange={explorer.header.setSearchType}
					>
						<ToggleGroupItem
							data-testid="file-explorer-search-all-toggle"
							value="all"
							aria-label={t("fileExplorer.searchAllAria")}
							title={t("fileExplorer.searchAllAria")}
						>
							{t("fileExplorer.searchAll")}
						</ToggleGroupItem>
						<ToggleGroupItem
							data-testid="file-explorer-search-current-toggle"
							value="current"
							aria-label={t("fileExplorer.searchCurrentAria")}
							title={t("fileExplorer.searchCurrentTitle", {
								path,
							})}
						>
							{t("fileExplorer.searchOnly", { name: crumbs[0] })}
						</ToggleGroupItem>
					</ToggleGroup>
				</div>
			)}
		</div>
	);
};
