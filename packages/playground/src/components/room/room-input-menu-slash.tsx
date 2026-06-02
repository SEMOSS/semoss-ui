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
import type { App, Engine, MCP, MCPConfig } from "@/types";

interface RoomInputMenuSlashProps {
	/** Room options containing MCP configurations */
	options: RoomStore["options"];
	/** Callback when an MCP is selected */
	onSelect: (tool: MCPConfig) => void;
	/** Callback to close menu and remove slash */
	onRequestClose?: () => void;
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
	onRequestClose,
}) => {
	const { t } = useTranslation("room");
	const { root } = useRoot();
	const [search, setSearch] = useState("");

	const debouncedSearch = useDebouncedValue(search);
	const applyEngineMCPFilter = !!root.theme.featureFlags?.enableKnowledgeMCP;

	/**
	 * Three sources, braided as (knowledge engine, toolbox engine, toolbox
	 * project) per index. Splitting VECTOR off keeps the rendered order
	 * predictable (k, t, t, k, t, t, ...) instead of relying on whatever
	 * order the engines reactor returned the mixed types in. Same rationale
	 * as MCPSelector for using separate iterators over MyEngineProject.
	 *
	 * VECTOR engines are MCP-tag-filtered only when the flag is on; the
	 * other two sources are always filtered to MCP-tagged items.
	 */
	const getKnowledgeEngines = useIteratorPixel<Engine[], MCP>(
		(limit, offset) =>
			`META | MyEngines (metaKeys = ["tag", "description"], ${applyEngineMCPFilter ? `metaFilters=[{"tag":["MCP"]}], ` : ""}engineTypes=["VECTOR"], ${debouncedSearch ? `filterWord=${JSON.stringify(debouncedSearch)}, ` : ""}limit=[${limit}], offset=[${offset}])`,
		(response) => (response.length < 15 ? -1 : Infinity),
		(response) => response.map(engineProjectToMCP),
		{ limit: 15 },
		[debouncedSearch, applyEngineMCPFilter],
	);

	const getToolboxEngines = useIteratorPixel<Engine[], MCP>(
		(limit, offset) =>
			`META | MyEngines (metaKeys = ["tag", "description"], metaFilters=[{"tag":["MCP"]}], engineTypes=["STORAGE", "DATABASE", "FUNCTION", "MODEL"], ${debouncedSearch ? `filterWord=${JSON.stringify(debouncedSearch)}, ` : ""}limit=[${limit}], offset=[${offset}])`,
		(response) => (response.length < 15 ? -1 : Infinity),
		(response) => response.map(engineProjectToMCP),
		{ limit: 15 },
		[debouncedSearch],
	);

	const getProjects = useIteratorPixel<App[], MCP>(
		(limit, offset) =>
			`META | MyProjects (metaKeys = ["tag", "description"], metaFilters=[{"tag":["MCP"]}], ${debouncedSearch ? `filterWord=["<encode>${debouncedSearch}</encode>"], ` : ""}limit=[${limit}], offset=[${offset}])`,
		(response) => (response.length < 15 ? -1 : Infinity),
		(response) => response.map(engineProjectToMCP),
		{ limit: 15 },
		[debouncedSearch],
	);

	const combinedData: MCP[] = [];
	const maxLen = Math.max(
		getKnowledgeEngines.data.length,
		getToolboxEngines.data.length,
		getProjects.data.length,
	);
	for (let i = 0; i < maxLen; i++) {
		const k = getKnowledgeEngines.data[i];
		const te = getToolboxEngines.data[i];
		const p = getProjects.data[i];
		if (k) combinedData.push(k);
		if (te) combinedData.push(te);
		if (p) combinedData.push(p);
	}
	const isLoading =
		getKnowledgeEngines.isLoading ||
		getToolboxEngines.isLoading ||
		getProjects.isLoading;
	const hasMore =
		getKnowledgeEngines.hasMore ||
		getToolboxEngines.hasMore ||
		getProjects.hasMore;

	/**
	 * Setup infinite scroll for the command list. Each scroll-to-bottom
	 * advances whichever sources still have more.
	 */
	const { setScroll } = useInfiniteScroll({
		disabled: isLoading || !hasMore,
		onNext: () => {
			if (getKnowledgeEngines.hasMore) getKnowledgeEngines.next();
			if (getToolboxEngines.hasMore) getToolboxEngines.next();
			if (getProjects.hasMore) getProjects.next();
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

	const hasResults = combinedData.length > 0;

	return (
		<Command shouldFilter={false} className="w-full">
			<CommandInput
				placeholder={t("menuMcp.searchPlaceholder")}
				value={search}
				onValueChange={setSearch}
				autoFocus
				onKeyDown={(e) => {
					// Close menu and delete slash on backspace when search is empty
					if (e.key === "Backspace" && search === "") {
						e.preventDefault();
						onRequestClose?.();
					}
				}}
			/>
			<CommandList
				className="max-h-[300px]"
				ref={(ele) => setScroll(ele)}
			>
				{!isLoading && !hasResults ? (
					<CommandEmpty>
						{search
							? t("menuMcp.noResults")
							: t("menuMcp.noItemsAvailable")}
					</CommandEmpty>
				) : null}

				{hasResults && (
					<CommandGroup>
						{combinedData.map((item) => (
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
									<BookOpenIcon className="me-2 size-4" />
								) : (
									<HammerIcon className="me-2 size-4" />
								)}
								{item.name}
								<CheckIcon
									className={`ms-auto ${selectedMCPs[item.id] ? "opacity-100" : "opacity-0"}`}
								/>
							</CommandItem>
						))}
					</CommandGroup>
				)}

				{isLoading && (
					<div className="flex items-center justify-center py-4">
						<Spinner className="size-4" />
					</div>
				)}
			</CommandList>
		</Command>
	);
};

export const RoomInputMenuSlash = observer(RoomInputMenuSlashInner);
