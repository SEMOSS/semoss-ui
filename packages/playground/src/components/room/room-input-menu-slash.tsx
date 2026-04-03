import { BookOpenIcon, CheckIcon, HammerIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useIteratorPixel } from "@semoss/sdk/react";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	Spinner,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import { engineProjectToMCP } from "@/components";
import { useRoot } from "@/hooks";
import type { RoomStore } from "@/stores";
import type { App, Engine, MCPConfig } from "@/types";

interface RoomInputMenuSlashProps {
	/** Room options containing MCP configurations */
	options: RoomStore["options"];
	/** Callback when an MCP is selected */
	onSelect: (tool: MCPConfig) => void;
}

/**
 * RoomInputMenuSlash - Searchable menu for slash (/) command
 *
 * Displays both knowledge (VECTOR) and toolbox (non-VECTOR) MCPs
 * in a unified list with icons for visual distinction. Fetched from
 * the backend with infinite scroll support.
 */
const RoomInputMenuSlashInner: React.FC<RoomInputMenuSlashProps> = ({
	options,
	onSelect,
}) => {
	const { t } = useTranslation("room");
	const { root } = useRoot();
	const [search, setSearch] = useState("");

	const debouncedSearch = useDebouncedValue(search);
	const enableKnowledgeMCP = root.theme.enableKnowledgeMCP !== false;

	/**
	 * Get all MCPs (both knowledge and tools) with lazy loading
	 */
	const getMCPs = useIteratorPixel<(App | Engine)[], MCPConfig>(
		(limit, offset) =>
			`MyEngineProject (metaKeys = ["tag", "description"], ${enableKnowledgeMCP ? `metaFilters=[{"tag":["MCP"]}], ` : ""}${debouncedSearch ? `filterWord=${JSON.stringify(debouncedSearch)}, ` : ""}limit=[${limit}], offset=[${offset}])`,
		(response) => {
			// if its less than the limit, we know its the end
			if (response.length < 15) {
				return -1;
			}

			return Infinity;
		},
		(response) => {
			return response.map(engineProjectToMCP);
		},
		{
			limit: 15,
		},
		[debouncedSearch, enableKnowledgeMCP],
	);

	/**
	 * Setup infinite scroll for the command list
	 */
	const { setScroll } = useInfiniteScroll({
		disabled: getMCPs.isLoading || !getMCPs.hasMore,
		onNext: () => {
			getMCPs.next();
		},
	});

	// Track selected MCPs
	const selectedMCPs = options.mcp.reduce(
		(acc, curr) => {
			acc[curr.id] = curr;
			return acc;
		},
		{} as Record<string, MCPConfig>,
	);

	const hasResults = getMCPs.data.length > 0;

	return (
		<Command shouldFilter={false} className="w-full">
			<CommandInput
				placeholder={t("menuMcp.searchPlaceholder")}
				value={search}
				onValueChange={setSearch}
				autoFocus
			/>
			<CommandList
				className="max-h-[300px]"
				ref={(ele) => setScroll(ele)}
			>
				{!getMCPs.isLoading && !hasResults ? (
					<CommandEmpty>
						{search
							? t("menuMcp.noResults")
							: t("menuMcp.noItemsAvailable")}
					</CommandEmpty>
				) : null}

				{!getMCPs.isLoading && hasResults && (
					<CommandGroup>
						{getMCPs.data.map((item) => (
							<CommandItem
								key={item.id}
								value={item.id}
								onSelect={() => {
									onSelect({
										type: item.type,
										id: item.id,
										name: item.name,
									});
								}}
							>
								{item.type === "VECTOR" ? (
									<BookOpenIcon className="mr-2 size-4" />
								) : (
									<HammerIcon className="mr-2 size-4" />
								)}
								{item.name}
								<CheckIcon
									className={`ml-auto ${selectedMCPs[item.id] ? "opacity-100" : "opacity-0"}`}
								/>
							</CommandItem>
						))}
					</CommandGroup>
				)}

				{getMCPs.isLoading && (
					<div className="flex items-center justify-center py-4">
						<Spinner className="size-4" />
					</div>
				)}
			</CommandList>
		</Command>
	);
};

export const RoomInputMenuSlash = observer(RoomInputMenuSlashInner);
