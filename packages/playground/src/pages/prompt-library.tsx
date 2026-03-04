import { ChevronLeft, ChevronRight, Info, Plus, Search, SquareLibrary, X } from "lucide-react";
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
import PromptCategories from "../components/prompt/prompt-categories";
import { useGlobalBreadcrumbs } from "@/hooks";
import { useTranslation } from "@semoss/i18n";

type SelectedCategory = { label: string; value: string };
type UnknownRecord = Record<string, unknown>;
type LoadStatus = "IDLE" | "LOADING" | "DONE" | "ERROR";
type MetaMap = Record<string, string[]>;

function isRecord(v: unknown): v is UnknownRecord {
	return typeof v === "object" && v !== null;
}

const normalizeToMetaMap = (meta: unknown): MetaMap | null => {
	if (typeof meta !== "object" || meta === null) return null;

	const out: MetaMap = {};
	for (const [k, v] of Object.entries(meta as Record<string, unknown>)) {
		if (Array.isArray(v) && v.every((s) => typeof s === "string"))
			out[k] = v;
		else if (typeof v === "string")
			out[k] = [v]; // optional normalization
		else return null; // fail fast if shape doesn't match
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
		metaMap: metaKeys,
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
	const { t } = useTranslation(["promptLibrary", "common"]);
	const [search, setSearch] = useState("");
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);

	const [allPrompts, setAllPrompts] = useState<Prompt[]>([]);
	const [categoryArray, setCategoryArray] = useState<string[]>([
		"My Prompts",
	]);
	const [selectedCategories, setSelectedCategories] = useState<SelectedCategory[]>([
		{ label: "My Prompts", value: "My Prompts" }
	]);

	const [availableTags, setAvailableTags] = useState<string[]>([]);
	const [isTagMenuOpen, setIsTagMenuOpen] = useState(false);
	const [loadStatus, setLoadStatus] = useState<LoadStatus>("IDLE");
	const [hasAttemptedInitialLoad, setHasAttemptedInitialLoad] = useState(false);
	const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

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

	const myPrompts = useMemo(
		() => visiblePrompts.filter((p) => isMinePrompt(p, userId)),
		[visiblePrompts, userId],
	);

	useGlobalBreadcrumbs({
		breadcrumbs: [
			{
				name: t("promptLibrary:breadcrumbs.home"),
				path: "/",
			},
			{
				name: t("promptLibrary:breadcrumbs.library"),
				path: "/prompt-library",
			},
		],
	});

	const refreshPrompts = useCallback(async () => {
		// Don't proceed if userId isn't available yet
		if (!userId) {
			return;
		}
		
		setLoadStatus("LOADING");
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

			const normalized: Prompt[] = rows.map((p) => normalizePrompt(p));
			const visible = normalized.filter((p) => canSeePrompt(p, userId));

			const tagSet = new Set<string>();
			for (const p of visible)
				for (const t of p.tags ?? []) tagSet.add(t);

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

	const isReady = useMemo(() => {
		return Boolean(actions?.run && userId);
	}, [actions?.run, userId]);

	useEffect(() => {	
		if (isReady && !hasAttemptedInitialLoad) {
			setHasAttemptedInitialLoad(true);
			void refreshPrompts();
		}
	}, [isReady, hasAttemptedInitialLoad, refreshPrompts]);

	useEffect(() => {
		void refreshPrompts();
	}, [refreshPrompts]);

const filteredPrompts = useMemo(() => {
	const lower = search.trim().toLowerCase();
	let filtered = visiblePrompts;

	// Filter by categories
	if (selectedCategories.length > 0) {
		const hasMyPrompts = selectedCategories.some(cat => cat.label === "My Prompts");
		const selectedTagCategories = selectedCategories
			.filter(cat => cat.label !== "My Prompts")
			.map(cat => cat.label);

		// If no categories selected, show nothing
		if (!hasMyPrompts && selectedTagCategories.length === 0) {
			filtered = [];
		}
		// If only "My Prompts" is selected, show all user prompts
		else if (hasMyPrompts && selectedTagCategories.length === 0) {
			filtered = visiblePrompts.filter(p => isMinePrompt(p, userId));
		}
		// If only tag categories are selected (no "My Prompts"), show prompts with those tags
		else if (!hasMyPrompts && selectedTagCategories.length > 0) {
			filtered = visiblePrompts.filter(p => 
				p.tags?.some(tag => selectedTagCategories.includes(tag)) ?? false
			);
		}
		// If both "My Prompts" AND tag categories are selected:
		// Show prompts that have the selected tags (regardless of ownership)
		else if (hasMyPrompts && selectedTagCategories.length > 0) {
			filtered = visiblePrompts.filter(p => 
				p.tags?.some(tag => selectedTagCategories.includes(tag)) ?? false
			);
		}
	}

	// Apply search filter
	if (lower) {
		filtered = filtered.filter(p => 
			(p.title ?? "").toLowerCase().includes(lower) ||
			String(p.intent ?? p.context ?? "").toLowerCase().includes(lower)
		);
	}

	// Apply additional tag filter
	if (selectedTags.length > 0) {
		filtered = filtered.filter(p => {
			if (!Array.isArray(p.tags) || p.tags.length === 0) return false;
			return selectedTags.some(t => p.tags.includes(t));
		});
	}

	// Sort the results
	const sorted = [...filtered].sort((a, b) => {
		const dateA = new Date(a.dateCreated || 0).getTime();
		const dateB = new Date(b.dateCreated || 0).getTime();
		
		if (sortOrder === "newest") {
			return dateB - dateA; // Newest first
		} else {
			return dateA - dateB; // Oldest first
		}
	});

	return sorted;
}, [visiblePrompts, selectedCategories, search, selectedTags, userId, sortOrder]);

// Add these separate arrays for PromptGrid
const filteredMyPrompts = useMemo(() => 
	filteredPrompts.filter(p => isMinePrompt(p, userId)),
	[filteredPrompts, userId]
);

const filteredGlobalPrompts = useMemo(() => 
	filteredPrompts.filter(p => !isMinePrompt(p, userId)),
	[filteredPrompts, userId]
);

	const handleAddNew = async (newPrompt: Prompt) => {
		try {
			const payload = {
				// prompt fields
				id: String(newPrompt.id ?? "new"),
				title: String(newPrompt.title ?? "").trim(),
				context: String(newPrompt.context ?? "").trim(),
				intent: String(newPrompt.intent ?? "").trim(),
				version: Number(newPrompt.version ?? 1),

				created_by: String(newPrompt.createdBy ?? userId ?? ""),
				date_created:
					newPrompt.dateCreated instanceof Date
						? newPrompt.dateCreated.toISOString()
						: String(
								newPrompt.dateCreated ??
									new Date().toISOString(),
							),

				global: Boolean(newPrompt.global ?? false),
				tags: Array.isArray(newPrompt.tags) ? newPrompt.tags : [],
				metaMap: newPrompt.metaMap ?? {},
			};

			const responseUnknown = (await actions.run(
				`AddPrompt(map=${JSON.stringify(payload)});`,
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
				throw new Error(output || "AddPrompt failed");
			}

			await refreshPrompts();
			setSelectedCategories([{ label: "My Prompts", value: "My Prompts" }]);
		} finally {
			setIsEditModalOpen(false);
		}
	};

	const handleButtonClick = (category: SelectedCategory) => {
		setIsTagMenuOpen(false);
		setSelectedTags([]);

		setSelectedCategories(prev => {
			const isAlreadySelected = prev.some(cat => cat.label === category.label);
			
			if (isAlreadySelected) {
				// Remove if already selected
				const filtered = prev.filter(cat => cat.label !== category.label);
				// If nothing left, default to "My Prompts"
				return filtered.length === 0 ? [{ label: "My Prompts", value: "My Prompts" }] : filtered;
			} else {
				// Add if not selected
				return [...prev, category];
			}
		});
	};

	const handleClearAllCategories = () => {
		setSelectedCategories([{ label: "My Prompts", value: "My Prompts" }]);
	};

	const handleRemoveTag = (tagToRemove: string) => {
		setSelectedTags((prev) => prev.filter((tag) => tag !== tagToRemove));
	};

	const categoryHasTags = useMemo(() => {
		const nonMyPromptsCategories = selectedCategories.filter(cat => cat.label !== "My Prompts");
		if (nonMyPromptsCategories.length === 0) return false;

		return visiblePrompts
			.filter(p => nonMyPromptsCategories.some(cat => p.tags?.includes(cat.label)))
			.some(p => p.tags?.some(t => !nonMyPromptsCategories.some(cat => cat.label === t)) ?? false);
	}, [visiblePrompts, selectedCategories]);

	const displayedTags = selectedTags.slice(0, 2);
	const hiddenCount = Math.max(0, selectedTags.length - 2);

	return (
		<div className="flex min-h-screen flex-col bg-gray-50">
			<main className="mx-auto w-full flex-1 px-4 py-4 md:px-8 lg:px-12 max-w-4xl">
			<div className="flex items-center gap-2 py-5 text-primary">
				<SquareLibrary className="h-6 w-6" />
				<span className="pt-0.5 font-semibold text-2xl leading-tight">
					{t("promptLibrary:welcomeTitle")}
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
					<TooltipContent side={isMobile ? "bottom" : "right"}>
						<div className="max-w-sm text-sm leading-relaxed">
							{t("promptLibrary:welcomeDescription")}
						</div>
					</TooltipContent>
				</Tooltip>
			</div>

			<div className="border-border border-b" />

			<div className="mt-3 mb-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
				<div className="flex-1">
					{!isMobile && (
						<div className="mb-1 font-medium text-muted-foreground text-sm">
							{t("promptLibrary:search.title")}
						</div>
					)}

					<div className="relative">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
						<input
							className="h-10 w-full rounded-md border border-border bg-background pr-3 pl-9 text-sm outline-none focus:ring-2 focus:ring-ring"
							placeholder={t("promptLibrary:search.placeholder")}
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
								onClick={() => setIsTagMenuOpen((v) => !v)}
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
											.filter(t => !selectedCategories.some(cat => cat.label === t))
											.map((tag) => {
												const checked =
													selectedTags.includes(tag);
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
															checked={checked}
															onChange={(e) => {
																const next = e
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
											onClick={() => setSelectedTags([])}
											disabled={selectedTags.length === 0}
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
							metaMap: {},
						});
						setIsEditModalOpen(true);
					}}
				>
					<Plus className="mr-2 h-4 w-4" />
					{t("promptLibrary:buttons.createPrompt")}
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
							selectedCategories={selectedCategories}
							multiSelect={true}
							onClearAll={handleClearAllCategories}
						/>
					</div>

					<div className="mb-1 text-muted-foreground text-sm">
						{filteredPrompts.length} {t("promptLibrary:descriptions.promptsFound")}
						{selectedCategories.length > 1 && (
							<span className="ml-2 text-xs">
								({selectedCategories.map(cat => cat.label).join(", ")})
							</span>
						)}
					</div>

					<div
						className={`overflow-auto pr-1 ${isMobile ? "h-[25vh]" : "h-[calc(100vh-400px)]"}`}
					>
						{loadStatus === "IDLE" || loadStatus === "LOADING" ? (
							<div className="flex h-full items-center justify-center">
								<div className="flex flex-col items-center gap-2">
									<div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
									<div className="text-muted-foreground text-sm">
										{loadStatus === "IDLE" ? "Initializing..." : "Loading prompts..."}
									</div>
								</div>
							</div>
						) : loadStatus === "ERROR" ? (
							<div className="flex h-full items-center justify-center">
								<div className="flex flex-col items-center gap-2">
									<div className="text-destructive text-sm">Failed to load prompts</div>
									<Button 
										variant="outline" 
										size="sm" 
										onClick={() => {
											setHasAttemptedInitialLoad(false);
											void refreshPrompts();
										}}
									>
										Retry
									</Button>
								</div>
							</div>
						) : (
							<PromptGrid
								selectedCategory={selectedCategories[0] || { label: "My Prompts", value: "My Prompts" }}
								globalPrompts={filteredGlobalPrompts} // Use the new filtered array
								refresh={refreshPrompts}
								myPrompts={filteredMyPrompts} // Use the new filtered array
							/>
						)}
					</div>
				</div>
			)}

<div className="mt-3 mb-2">
	<div className="flex items-center gap-2">
		{/* Scrollable categories container */}
		<div className="flex-1 overflow-x-auto">
			<div className="flex items-center gap-2 pb-2" style={{ scrollbarWidth: "none" }}>
				<PromptCategories
					categoryArray={categoryArray}
					handleButtonClick={handleButtonClick}
					selectedCategories={selectedCategories}
					multiSelect={true}
					onClearAll={null}
					className="flex-shrink-0"
					buttonsContainerClassName="flex flex-nowrap gap-2 min-w-max"
				/>
			</div>
		</div>
	</div>
</div>
<div>

</div>
<div className="flex flex-row justify-between items-center">
			<div className="mt-3 mb-2 text-muted-foreground text-sm">
				{filteredPrompts.length} {t("promptLibrary:descriptions.promptsFound")}
				{selectedCategories.length > 1 && (
					<span className="ml-2 text-xs">
						({selectedCategories.map(cat => cat.label).join(", ")})
					</span>
				)}
			</div>
	<div className="flex items-center gap-2">
		{/* Sort dropdown */}
		<select
			value={sortOrder}
			onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
			className="h-8 rounded-md border border-border bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring"
		>
			<option value="newest">Newest First</option>
			<option value="oldest">Oldest First</option>
		</select>
			<Button
				variant="ghost"
				size="sm"
				onClick={handleClearAllCategories}
				className="text-muted-foreground hover:text-foreground"
				disabled={selectedCategories.length <= 1}
			>
				<X className="mr-1 h-3 w-3" />
				Clear All
			</Button>
	</div>
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
						selectedCategory={selectedCategories[0] || { label: "My Prompts", value: "My Prompts" }}
						globalPrompts={filteredPrompts.filter(p => !isMinePrompt(p, userId))}
						refresh={refreshPrompts}
						myPrompts={filteredPrompts.filter(p => isMinePrompt(p, userId))}
					/>
				)}
			</div>
		</main>
	</div>
	);
});
