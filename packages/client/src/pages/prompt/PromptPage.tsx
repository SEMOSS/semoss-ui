import { Filter, LayoutGrid, List, Plus, Search, X } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Badge,
	Button,
	H3,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	P,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Tabs,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import { NavbarHeader } from "@/components/shared/NavbarHeader";
import { NavbarLeft } from "@/components/shared/NavbarLeft";
import { useRootStore } from "@/hooks";
import { PromptLibraryCards } from "../../components/prompt/library/PromptLibraryCards";
import type { Prompt } from "../../components/prompt/prompt.types";
import { PromptModal } from "./PromptModal";

type ViewMode = "grid" | "list";
type PromptTabMode = "My Prompts" | "Global Prompts";

const tabTriggerClass =
	"!flex-none !border-0 !bg-transparent !shadow-none hover:!bg-transparent data-[state=active]:!bg-transparent data-[state=active]:!shadow-none data-[state=active]:!text-primary after:-bottom-[1px] relative whitespace-nowrap rounded-none px-1 pb-3 text-sm after:absolute after:right-0 after:left-0 after:h-0.5 after:bg-primary after:opacity-0 data-[state=active]:after:opacity-100";

export const PromptPage = observer(() => {
	const { configStore, monolithStore } = useRootStore();
	const navigate = useNavigate();
	const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
	const [promptMode, setPromptMode] = useState("");
	const [pageReload, setPageReload] = useState(false);

	const [filter, setFilter] = useState("all");
	const [allPrompts, setAllPrompts] = useState([]);
	const [searchValue, setSearchValue] = useState("");
	const [view, setView] = useState<ViewMode>("grid");
	const [mode, setMode] = useState<PromptTabMode>("My Prompts");
	const [isFiltersOpen, setIsFiltersOpen] = useState(false);
	const [promptTags, setPromptTags] = useState<string[]>([]);

	/**
	 * @desc Load prompts and tags
	 */
	useEffect(() => {
		init();
		loadTags();
	}, [pageReload]);

	/**
	 * @desc Gets All prompts
	 */
	const init = () => {
		monolithStore.runQuery("ListPrompt()").then((response) => {
			const { output } = response.pixelReturn[0];
			if (output.length > 0) {
				const promptArr = [];
				output.forEach((prompt) => {
					promptArr.push({
						context: prompt.context ? prompt.context : "",
						created_by: prompt.created_by ? prompt.created_by : "",
						date_created: prompt.date_created
							? prompt.date_created
							: "",
						id: prompt.id ? prompt.id : "",
						intent: prompt.intent ? prompt.intent : "",
						title: prompt.title ? prompt.title : "",
						tags: prompt.tags ? prompt.tags : [],
						global: !!prompt.global,
					});
				});
				setAllPrompts(promptArr);
			}
		});
	};

	/**
	 * @desc Gets all filter tag options
	 */
	const loadTags = () => {
		monolithStore
			.runQuery('GetPromptMetaValues( metaKeys = ["tag","domain"])')
			.then((response) => {
				const { output } = response.pixelReturn[0];
				if (output.length > 0) {
					const tagMap: Record<string, string> = { all: "" };
					output.forEach((tag: { metavalue: string }) => {
						tagMap[tag.metavalue] = "";
					});
					setPromptTags(Object.keys(tagMap));
				}
			});
	};

	/**
	 * @desc Filters and searches prompts
	 */
	const filteredPrompts = useMemo(() => {
		if (allPrompts.length === 0) return [];

		return allPrompts
			.filter((prompt) => {
				if (
					mode === "My Prompts" &&
					prompt.created_by !== configStore.store.user.id
				) {
					return false;
				}
				if (
					mode === "Global Prompts" &&
					(prompt.created_by === configStore.store.user.id ||
						!prompt.global)
				) {
					return false;
				}
				if (filter !== "all" && !prompt.tags?.includes(filter)) {
					return false;
				}
				if (searchValue) {
					const search = searchValue.toLowerCase();
					return (
						prompt.title?.toLowerCase().includes(search) ||
						prompt.context?.toLowerCase().includes(search) ||
						prompt.tags?.some((tag: string) =>
							tag.toLowerCase().includes(search),
						)
					);
				}
				return true;
			})
			.sort((a, b) => {
				const firstTitle = a.title.toLowerCase();
				const secondTitle = b.title.toLowerCase();
				if (firstTitle < secondTitle) return -1;
				if (firstTitle > secondTitle) return 1;
				return 0;
			});
	}, [allPrompts, filter, searchValue, mode, configStore.store.user.id]);

	const hasActiveFilter = filter !== "all";

	/**
	 * @desc Used on click of prompt card
	 */
	function handlePromptClick(p: Prompt) {
		navigate(`/prompt/${p.id}`);
	}

	return (
		<>
			<NavbarLeft>
				<NavbarHeader />
			</NavbarLeft>

			<div className="flex flex-col gap-6">
				{/* Header */}
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div className="flex flex-col gap-1">
						<H3 data-tour="app-library-title" className="text-2xl">
							Prompt Catalog
						</H3>
						<P className="text-muted-foreground">
							Manage and discover prompts for various use cases
						</P>
					</div>
					<Button
						variant="default"
						size="lg"
						onClick={() => {
							setPromptMode("Add");
							setIsPromptModalOpen(true);
						}}
						aria-label="Add Prompt"
						data-testid="promptPage-add-btn"
					>
						<Plus className="size-4" />
						Add Prompt
					</Button>
				</div>

				{/* Search and Filters */}
				<div className="flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm">
					<div className="flex flex-col gap-3 md:flex-row md:items-center">
						<InputGroup className="flex-1">
							<InputGroupAddon>
								<Search className="size-4" />
							</InputGroupAddon>
							<InputGroupInput
								placeholder="Search prompts..."
								value={searchValue}
								onChange={(e) => setSearchValue(e.target.value)}
								aria-label="Search prompts"
							/>
						</InputGroup>
						<div className="flex items-center gap-2">
							<Popover
								open={isFiltersOpen}
								onOpenChange={setIsFiltersOpen}
							>
								<PopoverTrigger asChild>
									<Button variant="outline">
										<Filter className="size-4" />
										Filters
										{hasActiveFilter ? " (1)" : ""}
									</Button>
								</PopoverTrigger>
								<PopoverContent
									align="end"
									className="w-56 p-0"
								>
									<div className="flex flex-col">
										{promptTags.map((tag) => (
											<button
												key={tag}
												type="button"
												className={`px-4 py-2 text-left text-sm capitalize hover:bg-muted/50 ${
													filter === tag
														? "bg-muted font-medium"
														: ""
												}`}
												onClick={() => {
													setFilter(tag);
													setIsFiltersOpen(false);
												}}
											>
												{tag}
											</button>
										))}
									</div>
								</PopoverContent>
							</Popover>
							<div className="flex items-center gap-1">
								<Button
									variant={
										view === "grid"
											? "secondary"
											: "outline"
									}
									size="icon-sm"
									aria-label="Grid view"
									title="Grid view"
									onClick={() => setView("grid")}
								>
									<LayoutGrid className="size-4" />
								</Button>
								<Button
									variant={
										view === "list"
											? "secondary"
											: "outline"
									}
									size="icon-sm"
									aria-label="List view"
									title="List view"
									onClick={() => setView("list")}
								>
									<List className="size-4" />
								</Button>
							</div>
						</div>
					</div>
				</div>

				{/* Active Filters */}
				<div className="-my-3 flex flex-wrap items-center gap-2">
					{hasActiveFilter ? (
						<>
							<Badge variant="outline" className="gap-1">
								{filter}
								<button
									type="button"
									onClick={() => setFilter("all")}
									className="ml-1 hover:text-destructive"
									aria-label={`Remove ${filter} filter`}
								>
									<X className="size-3" />
								</button>
							</Badge>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setFilter("all")}
							>
								Clear all
							</Button>
						</>
					) : (
						<P className="text-[11px] text-muted-foreground">
							No filters applied
						</P>
					)}
				</div>

				{/* Tabs and Content */}
				<div className="flex flex-col gap-6 pb-8">
					<div className="border-b pb-1">
						<Tabs
							value={mode}
							onValueChange={(val) =>
								setMode(val as PromptTabMode)
							}
						>
							<TabsList className="w-full flex-nowrap justify-start gap-4 overflow-x-auto rounded-none bg-transparent p-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
								<TabsTrigger
									value="My Prompts"
									data-testid="promptPage-myPrompts-btn"
									className={tabTriggerClass}
								>
									My Prompts
								</TabsTrigger>
								<TabsTrigger
									value="Global Prompts"
									data-testid="promptPage-globalPrompts-btn"
									className={tabTriggerClass}
								>
									Global Prompts
								</TabsTrigger>
							</TabsList>
						</Tabs>
					</div>

					{filteredPrompts.length > 0 ? (
						<PromptLibraryCards
							filter={filter}
							prompts={filteredPrompts}
							view={view}
							currentUserId={configStore.store.user.id}
							onClick={(p: Prompt) => {
								handlePromptClick(p);
							}}
							onDelete={() => {
								setPageReload(!pageReload);
							}}
						/>
					) : (
						<div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
							<P>No prompts found matching your search.</P>
						</div>
					)}
				</div>
			</div>

			<PromptModal
				isOpen={isPromptModalOpen}
				prompt=""
				onClose={(reload) => {
					setIsPromptModalOpen(false);
					if (reload) {
						setPageReload(!pageReload);
					}
				}}
				mode={promptMode}
			/>
		</>
	);
});
