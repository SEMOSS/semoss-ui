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
	InputGroupButton,
	InputGroupInput,
	P,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Tabs,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import { NavbarLeft } from "@/components/shared/NavbarLeft";
import { NavbarHeader } from "@/components/shared/navbar-header";
import { useRootStore } from "@/hooks";
import { PromptLibraryCards } from "../../components/prompt/library/prompt-library-cards";
import type { Prompt } from "../../components/prompt/prompt.types";
import { PromptModal } from "./PromptModal";

type ViewMode = "grid" | "list";
type PromptTabMode = "My Prompts" | "Global Prompts";

export const PromptPage = observer(() => {
	const { configStore, monolithStore } = useRootStore();
	const navigate = useNavigate();
	const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
	const [promptMode, setPromptMode] = useState("");
	const [pageReload, setPageReload] = useState(false);

	const [filters, setFilters] = useState<string[]>([]);
	const [allPrompts, setAllPrompts] = useState([]);
	const [searchValue, setSearchValue] = useState("");
	const [view, setView] = useState<ViewMode>("list");
	const [mode, setMode] = useState<PromptTabMode>("My Prompts");
	const [isFiltersOpen, setIsFiltersOpen] = useState(false);
	const [promptTags, setPromptTags] = useState<string[]>([]);

	/**
	 * @desc Load prompts and tags
	 */
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional — reruns on pageReload signal only
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
					const tagSet = new Set<string>();
					output.forEach((tag: { metavalue: string }) => {
						tagSet.add(tag.metavalue);
					});
					setPromptTags([...tagSet]);
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
				if (mode === "Global Prompts" && !prompt.global) {
					return false;
				}
				if (
					filters.length > 0 &&
					!filters.some((f) => prompt.tags?.includes(f))
				) {
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
	}, [allPrompts, filters, searchValue, mode, configStore.store.user.id]);

	const hasActiveFilter = filters.length > 0;

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
				<div className="flex flex-col gap-3">
					<div className="flex w-full min-w-0 flex-wrap items-end gap-2 md:flex-nowrap">
						<InputGroup className="h-10 min-w-[110px] flex-[1_1_auto]">
							<InputGroupAddon>
								<Search className="size-4" />
							</InputGroupAddon>
							<InputGroupInput
								className="h-10"
								placeholder="Search prompts..."
								value={searchValue}
								onChange={(e) => setSearchValue(e.target.value)}
								aria-label="Search prompts"
							/>
							{searchValue ? (
								<InputGroupAddon align="inline-end">
									<InputGroupButton
										size="icon-xs"
										variant="ghost"
										onClick={() => setSearchValue("")}
										aria-label="Clear search"
									>
										<X className="size-4" />
									</InputGroupButton>
								</InputGroupAddon>
							) : null}
						</InputGroup>
						<div className="flex w-auto shrink-0 items-center gap-1">
							<Popover
								open={isFiltersOpen}
								onOpenChange={setIsFiltersOpen}
							>
								<PopoverTrigger asChild>
									<Button variant="outline" className="h-9">
										<Filter className="size-4" />
										Filters
										{hasActiveFilter
											? ` (${filters.length})`
											: ""}
									</Button>
								</PopoverTrigger>
								<PopoverContent
									align="end"
									className="w-56 p-0"
								>
									<div className="flex flex-col">
										{promptTags
											.filter((tag) => tag !== "all")
											.map((tag) => (
												<button
													key={tag}
													type="button"
													className={`px-4 py-2 text-left text-sm capitalize hover:bg-muted/50 ${
														filters.includes(tag)
															? "bg-muted font-medium"
															: ""
													}`}
													onClick={() => {
														setFilters((prev) =>
															prev.includes(tag)
																? prev.filter(
																		(f) =>
																			f !==
																			tag,
																	)
																: [
																		...prev,
																		tag,
																	],
														);
													}}
												>
													{tag}
												</button>
											))}
									</div>
								</PopoverContent>
							</Popover>
							<div className="flex shrink-0 items-center gap-1">
								<Button
									variant={
										view === "list"
											? "secondary"
											: "outline"
									}
									size="icon-sm"
									className="h-9 w-9"
									aria-label="List view"
									title="List view"
									onClick={() => setView("list")}
								>
									<List className="size-4" />
								</Button>
								<Button
									variant={
										view === "grid"
											? "secondary"
											: "outline"
									}
									size="icon-sm"
									className="h-9 w-9"
									aria-label="Grid view"
									title="Grid view"
									onClick={() => setView("grid")}
								>
									<LayoutGrid className="size-4" />
								</Button>
							</div>
						</div>
					</div>
				</div>

				{/* Active Filters */}
				{hasActiveFilter && (
					<div className="-my-3 flex flex-wrap items-center gap-2">
						{filters.map((f) => (
							<Badge key={f} variant="outline" className="gap-1">
								{f}
								<button
									type="button"
									onClick={() =>
										setFilters((prev) =>
											prev.filter((t) => t !== f),
										)
									}
									className="ml-1 hover:text-destructive"
									aria-label={`Remove ${f} filter`}
								>
									<X className="size-3" />
								</button>
							</Badge>
						))}
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setFilters([])}
						>
							Clear all
						</Button>
					</div>
				)}

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
									className="after:-bottom-px relative flex-none! whitespace-nowrap rounded-none border-0! bg-transparent! px-1 pb-3 text-sm shadow-none! after:absolute after:right-0 after:left-0 after:h-0.5 after:bg-primary after:opacity-0 hover:bg-transparent! data-[state=active]:bg-transparent! data-[state=active]:text-primary! data-[state=active]:shadow-none! data-[state=active]:after:opacity-100"
								>
									My Prompts
								</TabsTrigger>
								<TabsTrigger
									value="Global Prompts"
									data-testid="promptPage-globalPrompts-btn"
									className="after:-bottom-px relative flex-none! whitespace-nowrap rounded-none border-0! bg-transparent! px-1 pb-3 text-sm shadow-none! after:absolute after:right-0 after:left-0 after:h-0.5 after:bg-primary after:opacity-0 hover:bg-transparent! data-[state=active]:bg-transparent! data-[state=active]:text-primary! data-[state=active]:shadow-none! data-[state=active]:after:opacity-100"
								>
									Global Prompts
								</TabsTrigger>
							</TabsList>
						</Tabs>
					</div>

					{filteredPrompts.length > 0 ? (
						<PromptLibraryCards
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
