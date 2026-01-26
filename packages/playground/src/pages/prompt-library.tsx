import { ChevronLeft, ChevronRight, Info, Plus, Search, X } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { EditPromptModal } from "@/components/prompt/edit-prompt-modal";
import { PromptGrid } from "@/components/prompt/prompt-grid";
import { suggestedPrompts } from "@/components/prompt/suggested-prompts";
import { usePixel } from "@/hooks";
import menuIcon from "../assets/img/Prompt_Library_Default.svg";
import BaseAppLayout from "../components/common/base-app-layout";
import PromptCategories from "../components/prompt/prompt-categories";

export type Prompt = {
	ID: string;
	TITLE: string;
	CONTEXT?: string;
	INTENT?: string;
	VERSION?: number;
	CREATED_BY?: string;
	DATE_CREATED?: string | Date | undefined;
	GLOBAL?: boolean;
	tags?: string[];
	metaKeys?: Record<string, string[]>;
};

// Adapter type to keep existing PromptGrid + filters working
type PromptRow = Prompt & {
	prompt_title: string;
	prompt_text: string;
	prompt_category: string;
};

type SelectedCategory = { label: string; value: string };
type UnknownRecord = Record<string, unknown>;

function isRecord(v: unknown): v is UnknownRecord {
	return typeof v === "object" && v !== null;
}

function getString(v: unknown, fallback = ""): string {
	if (typeof v === "string") return v;
	if (v === null || v === undefined) return fallback;
	return String(v);
}

function getBoolean(v: unknown, fallback = false): boolean {
	if (typeof v === "boolean") return v;
	return fallback;
}

function getNumber(v: unknown): number | undefined {
	return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function getStringArray(v: unknown): string[] {
	if (!Array.isArray(v)) return [];
	return v.map((x) => getString(x)).filter(Boolean);
}

function normalizePrompt(input: unknown): Prompt {
	if (!isRecord(input)) {
		return { ID: "", TITLE: "", GLOBAL: false, tags: [] };
	}

	return {
		ID: getString(input.ID ?? input.id),
		TITLE: getString(input.TITLE ?? input.prompt_title),
		CONTEXT:
			typeof input.CONTEXT === "string"
				? input.CONTEXT
				: typeof input.prompt_context === "string"
					? input.prompt_context
					: undefined,
		INTENT:
			typeof input.INTENT === "string"
				? input.INTENT
				: typeof input.prompt_text === "string"
					? input.prompt_text
					: undefined,
		VERSION: getNumber(input.VERSION),
		CREATED_BY:
			typeof input.CREATED_BY === "string"
				? input.CREATED_BY
				: typeof input.created_by === "string"
					? input.created_by
					: undefined,
		DATE_CREATED: ((): string | Date | null => {
			const v: unknown = input.DATE_CREATED ?? input.date_created;
			if (typeof v === "string" || v instanceof Date) return v;
			return undefined;
		})(),
		GLOBAL: getBoolean(input.GLOBAL ?? input.global, false),
		tags: getStringArray(input.tags),
		metaKeys: isRecord(input.metaKeys)
			? (input.metaKeys as Record<string, string[]>)
			: isRecord(input.metakeys)
				? (input.metakeys as Record<string, string[]>)
				: undefined,
	};
}

function useMediaQuery(query: string) {
	const getInitial = () => {
		if (typeof window === "undefined" || !window.matchMedia) return false;
		return window.matchMedia(query).matches;
	};

	const [matches, setMatches] = useState<boolean>(getInitial);

	useEffect(() => {
		if (typeof window === "undefined" || !window.matchMedia) return;
		const mql = window.matchMedia(query);

		const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);

		setMatches(mql.matches);

		if (mql.addEventListener) {
			mql.addEventListener("change", onChange);
			return () => mql.removeEventListener("change", onChange);
		}

		// eslint-disable-next-line deprecation/deprecation
		mql.addListener(onChange);
		// eslint-disable-next-line deprecation/deprecation
		return () => mql.removeListener(onChange);
	}, [query]);

	return matches;
}

function getPromptCategory(p: Prompt) {
	const mk = (p.metaKeys ?? {}) as Partial<
		Record<
			| "PROMPT_CATEGORY"
			| "CATEGORY"
			| "CATEGORY_LABEL"
			| "DOMAIN"
			| "USE_CASE",
			string[]
		>
	>;

	const candidates = [
		mk.PROMPT_CATEGORY?.[0],
		mk.CATEGORY?.[0],
		mk.CATEGORY_LABEL?.[0],
		mk.DOMAIN?.[0],
		mk.USE_CASE?.[0],
	].filter(Boolean) as string[];

	if (candidates.length) return candidates[0];
	return p.GLOBAL ? "Global Prompts" : "My Prompts";
}

function adaptPrompt(p: Prompt): PromptRow {
	return {
		...p,
		prompt_title: p.TITLE ?? "",
		prompt_text: String(p.INTENT ?? p.CONTEXT ?? ""),
		prompt_category: getPromptCategory(p),
		tags: Array.isArray(p.tags) ? p.tags : [],
	};
}

export const PromptLibrary = observer(() => {
	const [search, setSearch] = useState("");
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);

	const [globalPrompts, setGlobalPrompts] = useState<PromptRow[]>([]);
	const [categoryArray, setCategoryArray] = useState<string[]>([]);
	const [selectedCategory, setSelectedCategory] = useState<SelectedCategory>({
		label: "My Prompts",
		value: "My Prompts",
	});

	const [availableTags, setAvailableTags] = useState<string[]>([]);
	const [isTagMenuOpen, setIsTagMenuOpen] = useState(false);

	const isMobile = useMediaQuery("(max-width: 640px)");
	const isSmallDevice = useMediaQuery(
		"(max-width: 320px) and (max-height: 568px)",
	);
	const isNarrowDesktop = useMediaQuery("(max-width: 1600px)");
	const shouldShowChevrons = isNarrowDesktop && categoryArray.length > 1;

	const { actions, system } = useInsight();

	const config = system.config as unknown as {
		logins?: Record<string, unknown>;
		loginDetails?: Record<string, { id?: string } | undefined>;
	};

	const auth = Object.keys(config.logins ?? {})[0] ?? "";
	const userId = config.loginDetails?.[auth]?.id ?? "";

	const {
		data: myPromptsRaw,
		refresh,
		status,
	} = usePixel<unknown[]>(`ListMyPrompts(user_id='${userId}');`, {
		data: [],
	});

	const myPrompts = useMemo<PromptRow[]>(() => {
		const arr = Array.isArray(myPromptsRaw) ? myPromptsRaw : [];
		return arr.map((p) => adaptPrompt(normalizePrompt(p)));
	}, [myPromptsRaw]);

	useEffect(() => {
		const getPrompts = async () => {
			try {
				const resultUnknown = (await actions.run(
					`ListPrompt()`,
				)) as unknown;

				const pixelReturn = isRecord(resultUnknown)
					? (resultUnknown as { pixelReturn?: unknown }).pixelReturn
					: undefined;

				const first = Array.isArray(pixelReturn)
					? pixelReturn[0]
					: undefined;
				const output = isRecord(first)
					? (first as { output?: unknown }).output
					: undefined;
				const rows = Array.isArray(output) ? output : [];

				const adapted = rows.map((p) =>
					adaptPrompt(normalizePrompt(p)),
				);

				const nextCategorySet = new Set<string>(["My Prompts"]);
				for (const p of adapted) {
					if (
						p.prompt_category &&
						p.prompt_category !== "My Prompts"
					) {
						nextCategorySet.add(p.prompt_category);
					}
				}
				const nextCategoryArray = Array.from(nextCategorySet);

				const allTags = adapted.flatMap((p) =>
					Array.isArray(p.tags) ? p.tags : [],
				);
				const uniqueTags = Array.from(new Set(allTags)).sort((a, b) =>
					a.localeCompare(b),
				);

				setGlobalPrompts(adapted);
				setCategoryArray(nextCategoryArray);
				setAvailableTags(uniqueTags);
			} catch (error) {
				// eslint-disable-next-line no-console
				console.error("Load failed:", error);
			}
		};

		void getPrompts();
	}, [actions]);

	const handleAddNew = async (newPrompt: Prompt) => {
		try {
			const title = (newPrompt.TITLE ?? "").replace(/"/g, "'");
			const text = String(
				newPrompt.INTENT ?? newPrompt.CONTEXT ?? "",
			).replace(/"/g, "'");

			const responseUnknown = (await actions.run(
				`AddMyPrompts([{"prompt_title":"${title}","prompt_text":"${text}","favorite_flag":"N"}]);`,
			)) as unknown;

			const pixelReturn = isRecord(responseUnknown)
				? (responseUnknown["pixelReturn"] as unknown)
				: undefined;

			const first = Array.isArray(pixelReturn)
				? pixelReturn[0]
				: undefined;

			const operationType =
				isRecord(first) && typeof first["operationType"] === "string"
					? first["operationType"]
					: "";

			const output =
				isRecord(first) && typeof first["output"] === "string"
					? first["output"]
					: "";

			if (operationType.includes("ERROR")) {
				throw new Error(output || "AddMyPrompts failed");
			}

			await refresh();
		} finally {
			setIsEditModalOpen(false);
		}
	};

	const handleButtonClick = ({ label, value }: SelectedCategory) => {
		setIsTagMenuOpen(false);

		if (
			selectedCategory.label === label &&
			selectedCategory.value === value
		) {
			setSelectedCategory({ label: "My Prompts", value: "My Prompts" });
			return;
		}
		setSelectedCategory({ label, value });
	};

	const handleRemoveTag = (tagToRemove: string) => {
		setSelectedTags((prev) => prev.filter((tag) => tag !== tagToRemove));
	};

	const myPromptsSearched = useMemo(() => {
		const lowerSearch = search.trim().toLowerCase();
		return myPrompts.filter((p) => {
			if (!lowerSearch) return true;
			return (
				(p.prompt_title ?? "").toLowerCase().includes(lowerSearch) ||
				(p.prompt_text ?? "").toLowerCase().includes(lowerSearch) ||
				(p.CONTEXT ?? "").toLowerCase().includes(lowerSearch)
			);
		});
	}, [myPrompts, search]);

	const globalPromptsSearched = useMemo(() => {
		const lowerSearch = search.trim().toLowerCase();

		return globalPrompts
			.filter(() => selectedCategory.label !== "My Prompts")
			.filter((p) => p.prompt_category === selectedCategory.label)
			.filter((p) => {
				if (!lowerSearch) return true;
				return (
					(p.prompt_title ?? "")
						.toLowerCase()
						.includes(lowerSearch) ||
					(p.prompt_text ?? "").toLowerCase().includes(lowerSearch) ||
					(p.CONTEXT ?? "").toLowerCase().includes(lowerSearch)
				);
			})
			.filter((p) => {
				if (selectedTags.length === 0) return true;
				if (!Array.isArray(p.tags) || p.tags.length === 0) return false;
				return selectedTags.some((t) => p.tags.includes(t));
			});
	}, [globalPrompts, search, selectedCategory.label, selectedTags]);

	const categoryHasTags = useMemo(() => {
		if (selectedCategory.label === "My Prompts") return false;
		return globalPrompts
			.filter((p) => p.prompt_category === selectedCategory.label)
			.some((p) => Array.isArray(p.tags) && p.tags.length > 0);
	}, [globalPrompts, selectedCategory.label]);

	const displayedTags = selectedTags.slice(0, 2);
	const hiddenCount = Math.max(0, selectedTags.length - 2);

	return (
		<BaseAppLayout
			contentType="default"
			content={
				<>
					<div className="flex items-center gap-2 py-5 text-primary">
						<img src={menuIcon} alt="Prompt Library Icon" />
						<span className="pt-0.5 font-semibold text-2xl leading-tight">
							Prompt Library
						</span>

						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									aria-label="Prompt Library Info"
									variant="ghost"
									size="icon-sm"
									className="ml-1"
								>
									<Info className="h-4 w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent
								side={isMobile ? "bottom" : "right"}
							>
								<div className="max-w-sm text-sm leading-relaxed">
									Browse and use saved conversation starters
									and templates, including your personal
									collection and popular agency-wide prompts
								</div>
							</TooltipContent>
						</Tooltip>
					</div>

					<div className="border-border border-b" />

					<div className="mt-3 mb-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
						<div className="flex-1">
							{!isMobile && (
								<div className="mb-1 font-medium text-muted-foreground text-sm">
									Search
								</div>
							)}

							<div className="relative">
								<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
								<input
									className="h-10 w-full rounded-md border border-border bg-background pr-3 pl-9 text-sm outline-none focus:ring-2 focus:ring-ring"
									placeholder="Search prompts"
									value={search}
									onChange={(e) => setSearch(e.target.value)}
								/>
							</div>
						</div>

						{categoryHasTags && (
							<div className="w-full md:w-[320px]">
								{!isMobile && (
									<div className="mb-1 font-medium text-muted-foreground text-sm">
										Filter by Tags
									</div>
								)}

								<div className="relative">
									<Button
										type="button"
										variant="outline"
										className="h-10 w-full justify-between"
										onClick={() =>
											setIsTagMenuOpen((v) => !v)
										}
									>
										<span className="truncate text-left text-sm">
											{selectedTags.length === 0
												? "Select tags..."
												: selectedTags.join(", ")}
										</span>
										<span className="text-muted-foreground text-xs">
											{selectedTags.length
												? `${selectedTags.length} selected`
												: ""}
										</span>
									</Button>

									{selectedTags.length > 0 && (
										<div className="mt-2 flex flex-wrap gap-2">
											{displayedTags.map((tag) => (
												<span
													key={tag}
													className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-accent-foreground text-xs"
												>
													{tag}
													<button
														type="button"
														className="rounded-sm opacity-80 hover:opacity-100"
														onClick={() =>
															handleRemoveTag(tag)
														}
														aria-label={`Remove ${tag}`}
													>
														<X className="h-3 w-3" />
													</button>
												</span>
											))}
											{hiddenCount > 0 && (
												<span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-muted-foreground text-xs">
													+{hiddenCount} more
												</span>
											)}
										</div>
									)}

									{isTagMenuOpen && (
										<div className="absolute z-10 mt-2 w-full rounded-md border border-border bg-background p-2 shadow-sm">
											<div className="max-h-56 overflow-auto">
												{availableTags.map((tag) => {
													const checked =
														selectedTags.includes(
															tag,
														);
													return (
														<label
															key={tag}
															className="flex cursor-pointer items-center justify-between rounded-sm px-2 py-1 text-sm hover:bg-muted"
														>
															<span
																className={
																	checked
																		? "font-medium text-primary"
																		: ""
																}
															>
																{tag}
															</span>
															<input
																type="checkbox"
																checked={
																	checked
																}
																onChange={(
																	e,
																) => {
																	const next =
																		e.target
																			.checked
																			? [
																					...selectedTags,
																					tag,
																				]
																			: selectedTags.filter(
																					(
																						t,
																					) =>
																						t !==
																						tag,
																				);
																	setSelectedTags(
																		next,
																	);
																}}
															/>
														</label>
													);
												})}
											</div>

											<div className="mt-2 flex items-center justify-between gap-2">
												<Button
													type="button"
													variant="ghost"
													className="h-8 px-2 text-xs"
													onClick={() =>
														setSelectedTags([])
													}
													disabled={
														selectedTags.length ===
														0
													}
												>
													Clear
												</Button>
												<Button
													type="button"
													className="h-8 px-2 text-xs"
													onClick={() =>
														setIsTagMenuOpen(false)
													}
												>
													Done
												</Button>
											</div>
										</div>
									)}
								</div>
							</div>
						)}

						<Button
							className="h-10 whitespace-nowrap"
							onClick={() => {
								setCurrentPrompt({
									ID: "new",
									TITLE: "",
									CONTEXT: "",
									INTENT: "",
									VERSION: 1,
									CREATED_BY: userId,
									DATE_CREATED: new Date(),
									GLOBAL: false,
									tags: [],
									metaKeys: {},
								});
								setIsEditModalOpen(true);
							}}
						>
							<Plus className="mr-2 h-4 w-4" />
							Create Prompt
						</Button>

						{isEditModalOpen && (
							<EditPromptModal
								prompt={currentPrompt}
								open={isEditModalOpen}
								onClose={() => setIsEditModalOpen(false)}
								onSave={handleAddNew}
								isNewPrompt={true}
							/>
						)}
					</div>

					{isMobile && isSmallDevice && (
						<div className="h-[25vh] overflow-auto">
							<div className="mt-3 mb-2">
								<PromptCategories
									categoryArray={categoryArray}
									handleButtonClick={handleButtonClick}
									selectedCategory={selectedCategory}
								/>
							</div>

							<div className="mb-1 text-muted-foreground text-sm">
								{selectedCategory.label === "My Prompts"
									? myPromptsSearched.length
									: globalPromptsSearched.length}{" "}
								prompts found
							</div>

							<div className="h-[25vh] overflow-auto pr-1">
								{status === "LOADING" ? (
									<div className="flex h-full items-center justify-center">
										<div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
									</div>
								) : (
									<PromptGrid
										selectedCategory={selectedCategory}
										globalPrompts={
											selectedCategory.label ===
											"My Prompts"
												? []
												: globalPromptsSearched
										}
										refresh={refresh}
										myPrompts={myPromptsSearched}
										suggestedPrompts={suggestedPrompts}
									/>
								)}
							</div>
						</div>
					)}

					<div className="mt-3 mb-2">
						<div className="relative flex w-full items-center">
							{shouldShowChevrons && (
								<Button
									variant="outline"
									size="icon-sm"
									className="-left-2 absolute z-10"
									onClick={() => {
										const el = document.querySelector(
											".categories-scroll-container",
										);
										if (el instanceof HTMLElement) {
											el.scrollBy({
												left: -220,
												behavior: "smooth",
											});
										}
									}}
									aria-label="Scroll categories left"
								>
									<ChevronLeft className="h-4 w-4" />
								</Button>
							)}

							<div
								className={`categories-scroll-container w-full ${
									shouldShowChevrons
										? "mx-[30px] overflow-x-auto"
										: "overflow-visible"
								}`}
								style={{ scrollbarWidth: "none" as const }}
							>
								<PromptCategories
									categoryArray={categoryArray}
									handleButtonClick={handleButtonClick}
									selectedCategory={selectedCategory}
									className={
										shouldShowChevrons
											? "flex min-w-max flex-nowrap justify-start"
											: "flex min-w-max flex-nowrap justify-center"
									}
								/>
							</div>

							{shouldShowChevrons && (
								<Button
									variant="outline"
									size="icon-sm"
									className="-right-2 absolute z-10"
									onClick={() => {
										const el = document.querySelector(
											".categories-scroll-container",
										);
										if (el instanceof HTMLElement) {
											el.scrollBy({
												left: 220,
												behavior: "smooth",
											});
										}
									}}
									aria-label="Scroll categories right"
								>
									<ChevronRight className="h-4 w-4" />
								</Button>
							)}
						</div>
					</div>

					<div className="mt-3 mb-2 text-muted-foreground text-sm">
						{selectedCategory.label === "My Prompts"
							? myPromptsSearched.length
							: globalPromptsSearched.length}{" "}
						prompts found
					</div>

					<div
						className={`overflow-auto pr-1 ${
							isMobile ? "h-[25vh]" : "h-[calc(100vh-400px)]"
						}`}
					>
						{status === "LOADING" ? (
							<div className="flex h-full items-center justify-center">
								<div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
							</div>
						) : (
							<PromptGrid
								selectedCategory={selectedCategory}
								globalPrompts={
									selectedCategory.label === "My Prompts"
										? []
										: globalPromptsSearched
								}
								refresh={refresh}
								myPrompts={myPromptsSearched}
								suggestedPrompts={suggestedPrompts}
							/>
						)}
					</div>
				</>
			}
		/>
	);
});
