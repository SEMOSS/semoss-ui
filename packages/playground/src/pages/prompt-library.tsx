import { ChevronLeft, ChevronRight, Info, Plus, Search, X } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { EditPromptModal } from "@/components/prompt/edit-prompt-modal";
import { PromptGrid } from "@/components/prompt/prompt-grid";
import type { Prompt } from "@/types/prompt";
import menuIcon from "../assets/img/Prompt_Library_Default.svg";
import BaseAppLayout from "../components/common/base-app-layout";
import PromptCategories from "../components/prompt/prompt-categories";

type SelectedCategory = { label: string; value: string };
type UnknownRecord = Record<string, unknown>;
type LoadStatus = "IDLE" | "LOADING" | "DONE" | "ERROR";
type UserMeta = Record<string, unknown>;
type MetaMap = Record<string, string[]>;

function isRecord(v: unknown): v is UnknownRecord {
	return typeof v === "object" && v !== null;
}

// function hasNativeMeta(x: unknown): x is { NATIVE: { meta: UserMeta } } {
// 	return (
// 		typeof x === "object" &&
// 		x !== null &&
// 		"NATIVE" in x &&
// 		typeof (x as any).NATIVE === "object" &&
// 		(x as any).NATIVE !== null &&
// 		"meta" in (x as any).NATIVE &&
// 		typeof (x as any).NATIVE.meta === "object" &&
// 		(x as any).NATIVE.meta !== null
// 	);
// }

const normalizeToMetaMap = (meta: unknown): MetaMap | null => {
	if (typeof meta !== "object" || meta === null) return null;

	const out: MetaMap = {};
	for (const [k, v] of Object.entries(meta as Record<string, unknown>)) {
		if (Array.isArray(v) && v.every((s) => typeof s === "string"))
			out[k] = v;
		else if (typeof v === "string")
			out[k] = [v]; // optional normalization
		else return null; // fail fast if shape doesn’t match
	}
	return out;
};

function normalizePrompt(p: unknown): Prompt {
	const obj = (p ?? {}) as Record<string, unknown>;

	const rawTags = obj["tags"];
	const tags = Array.isArray(rawTags)
		? rawTags.map(String).filter(Boolean)
		: typeof rawTags === "string"
			? rawTags
					.split(",")
					.map((s) => s.trim())
					.filter(Boolean)
			: [];

	const rawMetaKeys = obj["metaKeys"];
	const metaKeys =
		typeof rawMetaKeys === "object" && rawMetaKeys !== null
			? (normalizeToMetaMap(rawMetaKeys) ?? {})
			: {};

	const createdByRaw = obj["created_by"];
	const dateCreatedRaw = obj["date_created"];

	return {
		id: String(obj["id"] ?? ""),
		title: String(obj["title"] ?? ""),
		context: String(obj["context"] ?? ""),
		intent: String(obj["intent"] ?? ""),
		version: Number(obj["version"] ?? 0),

		createdBy: createdByRaw == null ? "" : String(createdByRaw),
		dateCreated: dateCreatedRaw == null ? "" : String(dateCreatedRaw),

		global: Boolean(obj["global"] ?? false),
		tags,
		metaKeys,
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

function isMinePrompt(p: Prompt, userId: string) {
	return Boolean(userId) && Boolean(p.createdBy) && p.createdBy === userId;
}

function canSeePrompt(p: Prompt, userId: string) {
	return Boolean(p.global) || (Boolean(userId) && p.createdBy === userId);
}

export const PromptLibrary = observer(() => {
	const [search, setSearch] = useState("");
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);

	const [allPrompts, setAllPrompts] = useState<Prompt[]>([]);
	const [categoryArray, setCategoryArray] = useState<string[]>([
		"My Prompts",
	]);
	const [selectedCategory, setSelectedCategory] = useState<SelectedCategory>({
		label: "My Prompts",
		value: "My Prompts",
	});

	const [availableTags, setAvailableTags] = useState<string[]>([]);
	const [isTagMenuOpen, setIsTagMenuOpen] = useState(false);
	const [loadStatus, setLoadStatus] = useState<LoadStatus>("IDLE");

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

	const visiblePrompts = useMemo(
		() => allPrompts.filter((p) => canSeePrompt(p, userId)),
		[allPrompts, userId],
	);

	console.log("PromptLibrary visiblePrompts:", visiblePrompts);

	const myPrompts = useMemo(
		() => visiblePrompts.filter((p) => isMinePrompt(p, userId)),
		[visiblePrompts, userId],
	);

	console.log("PromptLibrary myPrompts:", myPrompts);

const refreshPrompts = useCallback(async () => {
	setLoadStatus("LOADING");
	try {
		const resultUnknown = (await actions.run(`ListPrompt()`)) as unknown;

		const pixelReturn = isRecord(resultUnknown)
			? (resultUnknown as { pixelReturn?: unknown }).pixelReturn
			: undefined;

		const first = Array.isArray(pixelReturn) ? pixelReturn[0] : undefined;
		const output = isRecord(first) ? (first as { output?: unknown }).output : undefined;
		const rows = Array.isArray(output) ? output : [];

		const normalized: Prompt[] = rows.map((p) => normalizePrompt(p));

		const visible = normalized.filter((p) => canSeePrompt(p, userId));

		const tagSet = new Set<string>();
		for (const p of visible) for (const t of p.tags ?? []) tagSet.add(t);

		const tagsSorted = Array.from(tagSet)
			.filter(Boolean)
			.sort((a, b) => a.localeCompare(b));

		setAllPrompts(normalized);
		setAvailableTags(tagsSorted);
		setCategoryArray(["My Prompts", ...tagsSorted]);
		setLoadStatus("DONE");
	} catch (e) {
		console.error("ListPrompt load failed:", e);
		setLoadStatus("ERROR");
	}
}, [actions, userId]);
console.log('all prompts', allPrompts);
	// useEffect(() => {
	// 	const getUserMetaKeys = async () => {
	// 		try {
	// 			const resultUnknown = (await actions.run(
	// 				`GetUserInfo()`,
	// 			)) as unknown;

	// 			const pixelReturn = isRecord(resultUnknown)
	// 				? (resultUnknown as { pixelReturn?: unknown }).pixelReturn
	// 				: undefined;

	// 			const first = Array.isArray(pixelReturn)
	// 				? pixelReturn[0]
	// 				: undefined;

	// 			const outputUnknown = isRecord(first)
	// 				? (first as { output?: unknown }).output
	// 				: undefined;

	// 			if (!hasNativeMeta(outputUnknown)) return;

	// 			const meta = (outputUnknown as any)?.NATIVE?.meta;
	// 			const metaMap = normalizeToMetaMap(meta);
	// 			if (metaMap === null) return;
	// 			setUserMetaKeys(metaMap);
	// 		} catch (e) {
	// 			console.error("GetUserInfo failed:", e);
	// 		}
	// 	};

	// 	getUserMetaKeys();
	// }, []);

	useEffect(() => {
		void refreshPrompts();
	}, [refreshPrompts]);

const categoryPromptsSearched = useMemo(() => {
	if (selectedCategory.label === "My Prompts") return [];

	const selectedTag = selectedCategory.label;
	const lower = search.trim().toLowerCase();

	return visiblePrompts
		.filter((p) => Array.isArray(p.tags) && p.tags.includes(selectedTag))
		.filter((p) => {
			if (!lower) return true;
			return (
				(p.title ?? "").toLowerCase().includes(lower) ||
				String(p.intent ?? p.context ?? "").toLowerCase().includes(lower)
			);
		})
		.filter((p) => {
			if (selectedTags.length === 0) return true;
			if (!Array.isArray(p.tags) || p.tags.length === 0) return false;
			return selectedTags.some((t) => p.tags.includes(t));
		});
}, [visiblePrompts, search, selectedCategory.label, selectedTags]);

	const handleAddNew = async (newPrompt: Prompt) => {
		try {
			const title = String(newPrompt.title ?? "").replace(/"/g, "'");
			const text = String(newPrompt.context ?? "").replace(/"/g, "'");
			const intent = String(newPrompt.intent ?? "").replace(/"/g, "'");
			const tags = Array.isArray(newPrompt.tags)
				? newPrompt.tags.map((t) => t.replace(/"/g, "'"))
				: [];

			const responseUnknown = (await actions.run(
				`AddPrompt(map={"title":"${title}","context":"${text}","intent":"${intent}","tags":${JSON.stringify(tags)}});`,
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

			await refreshPrompts();
			setSelectedCategory({ label: "My Prompts", value: "My Prompts" });
		} finally {
			setIsEditModalOpen(false);
		}
	};

	const handleButtonClick = ({ label, value }: SelectedCategory) => {
		setIsTagMenuOpen(false);
		setSelectedTags([]);

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
		const lower = search.trim().toLowerCase();
		return myPrompts.filter((p) => {
			if (!lower) return true;
			return (
				(p.title ?? "").toLowerCase().includes(lower) ||
				String(p.intent ?? p.context ?? "")
					.toLowerCase()
					.includes(lower)
			);
		});
	}, [myPrompts, search]);

	const categoryHasTags = useMemo(() => {
		if (selectedCategory.label === "My Prompts") return false;

		const selected = selectedCategory.label;
		return visiblePrompts
			.filter((p) => p.tags?.includes(selected))
			.some((p) => p.tags?.some((t) => t !== selected) ?? false);
	}, [visiblePrompts, selectedCategory.label]);

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
												{availableTags
													.filter(
														(t) =>
															t !==
															selectedCategory.label,
													) // avoid selecting the category tag redundantly
													.map((tag) => {
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
																			e
																				.target
																				.checked
																				? [
																						...selectedTags,
																						tag,
																					]
																				: selectedTags.filter(
																						(
																							t2,
																						) =>
																							t2 !==
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
									id: "new",
									title: "",
									context: "",
									intent: "",
									version: 1,
									createdBy: userId,
									dateCreated: new Date(),
									global: false,
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
									: categoryPromptsSearched.length}{" "}
								prompts found
							</div>

							<div className="h-[25vh] overflow-auto pr-1">
								{loadStatus === "LOADING" ? (
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
												: categoryPromptsSearched
										}
										refresh={refreshPrompts}
										myPrompts={myPromptsSearched}
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
							: categoryPromptsSearched.length}{" "}
						prompts found
					</div>

					<div
						className={`overflow-auto pr-1 ${isMobile ? "h-[25vh]" : "h-[calc(100vh-400px)]"}`}
					>
						{loadStatus === "LOADING" ? (
							<div className="flex h-full items-center justify-center">
								<div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
							</div>
						) : (
							<PromptGrid
								selectedCategory={selectedCategory}
								globalPrompts={
									selectedCategory.label === "My Prompts"
										? []
										: categoryPromptsSearched
								}
								refresh={refreshPrompts}
								myPrompts={myPromptsSearched}
							/>
						)}
					</div>
				</>
			}
		/>
	);
});
