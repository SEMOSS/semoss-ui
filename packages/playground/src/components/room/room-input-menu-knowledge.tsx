import { BookOpenIcon, CheckIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useIteratorPixel } from "@semoss/sdk/react";
import {
	Badge,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	Spinner,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import { engineProjectToMCP } from "@/components";
import { useRoot } from "@/hooks";
import type { RoomStore } from "@/stores";
import type { App, Engine, MCPConfig } from "@/types";

interface RoomInputMenuKnowledgeProps {
	/**
	 * Options
	 */
	options: RoomStore["options"];

	/**
	 * Callback when a knowledge is selected
	 */
	onSelect: (knowledge: MCPConfig) => void;
}

export const RoomInputMenuKnowledge: React.FC<RoomInputMenuKnowledgeProps> =
	observer(({ options, onSelect }) => {
		const [isOpen, setIsOpen] = useState(false);
		const { t } = useTranslation("room");
		const { root } = useRoot();
		const [search, setSearch] = React.useState("");

		const debouncedSearch = useDebouncedValue(search);
		const enableKnowledgeMCP = root.theme.enableKnowledgeMCP !== false;

		/**
		 * Get all of the knowledge with lazy loading
		 */
		const getKnowledge = useIteratorPixel<(App | Engine)[], MCPConfig>(
			(limit, offset) =>
				isOpen
					? `MyEngineProject (metaKeys = ["tag", "description"], ${enableKnowledgeMCP ? `metaFilters=[{"tag":["MCP"]}], ` : ""}type=["VECTOR"], ${debouncedSearch ? `filterWord=${JSON.stringify(debouncedSearch)}, ` : ""}limit=[${limit}], offset=[${offset}])`
					: "",
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
			[isOpen, debouncedSearch, enableKnowledgeMCP],
		);

		/**
		 * Setup infinite scroll for the command list
		 */
		const { setScroll } = useInfiniteScroll({
			disabled:
				getKnowledge.isLoading || !getKnowledge.hasMore || !isOpen,
			onNext: () => {
				getKnowledge.next();
			},
		});

		// track the selected knowledge
		const knowledge = options.mcp.reduce(
			(acc, curr) => {
				if (curr.type === "VECTOR") {
					acc[curr.id] = curr;
				}
				return acc;
			},
			{} as Record<string, MCPConfig>,
		);

		return (
			<DropdownMenuSub open={isOpen} onOpenChange={setIsOpen}>
				<DropdownMenuSubTrigger>
					<BookOpenIcon />
					<span className="flex-1">
						{t("menuKnowledge.addKnowledge")}
					</span>
					<Badge variant="outline">
						{Object.keys(knowledge).length}
					</Badge>
				</DropdownMenuSubTrigger>
				<DropdownMenuSubContent className="w-72 p-0">
					<Command shouldFilter={false} className="w-full">
						<CommandInput
							placeholder={t("menuKnowledge.searchPlaceholder")}
							value={search}
							onValueChange={setSearch}
							autoFocus
						/>
						<CommandList
							className="max-h-[200px]"
							ref={(ele) => setScroll(ele)}
						>
							{!getKnowledge.isLoading &&
							getKnowledge.data.length === 0 ? (
								<CommandEmpty>
									{t("menuKnowledge.notFound")}
								</CommandEmpty>
							) : null}

							{!getKnowledge.isLoading &&
								getKnowledge.data.length > 0 && (
									<CommandGroup>
										{getKnowledge.data.map((item) => (
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
												{item.name}
												<CheckIcon
													className={`ml-auto ${knowledge[item.id] ? "opacity-100" : "opacity-0"}`}
												/>
											</CommandItem>
										))}
									</CommandGroup>
								)}

							{getKnowledge.isLoading && (
								<div className="flex items-center justify-center py-4">
									<Spinner className="size-4" />
								</div>
							)}
						</CommandList>
					</Command>
				</DropdownMenuSubContent>
			</DropdownMenuSub>
		);
	});
