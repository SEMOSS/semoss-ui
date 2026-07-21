import { SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	ScrollArea,
} from "@semoss/ui/next";

export interface PromptLibraryItem {
	id: string;
	title: string;
	context: string;
	tags?: string[];
}

export interface PromptLibraryDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Pure-props, like RoomSidebar/EngineSelect — the host app fetches its own prompts (workspace-scoped in playground, via `META | ListPrompt(...)`) and passes the resolved list in; this library owns no prompt storage/fetching concern. */
	prompts: PromptLibraryItem[];
	isLoading?: boolean;
	onSelectPrompt: (prompt: PromptLibraryItem) => void;
}

const UNGROUPED = "General";

/** Searchable/tag-filterable grid of saved prompts, grouped by tag — ported from playground's real prompts/prompt-library-dialog.tsx (already prop-driven/self-contained there, no store dependency to strip). */
export function PromptLibraryDialog({
	open,
	onOpenChange,
	prompts,
	isLoading = false,
	onSelectPrompt,
}: PromptLibraryDialogProps) {
	const [search, setSearch] = useState("");
	const [activeTag, setActiveTag] = useState<string | null>(null);

	const allTags = useMemo(() => {
		const set = new Set<string>();
		for (const prompt of prompts) {
			for (const tag of prompt.tags ?? []) {
				set.add(tag);
			}
		}
		return Array.from(set).sort((a, b) => a.localeCompare(b));
	}, [prompts]);

	const filtered = useMemo(() => {
		const query = search.trim().toLowerCase();
		return prompts.filter((prompt) => {
			const matchesSearch =
				!query ||
				prompt.title.toLowerCase().includes(query) ||
				(prompt.context ?? "").toLowerCase().includes(query) ||
				(prompt.tags ?? []).some((tag) =>
					tag.toLowerCase().includes(query),
				);
			const matchesTag =
				!activeTag || (prompt.tags ?? []).includes(activeTag);
			return matchesSearch && matchesTag;
		});
	}, [prompts, search, activeTag]);

	const groups = useMemo(() => {
		if (activeTag) {
			return [[activeTag, filtered]] as [string, PromptLibraryItem[]][];
		}
		const map = new Map<string, PromptLibraryItem[]>();
		for (const prompt of filtered) {
			const tags =
				prompt.tags && prompt.tags.length > 0
					? prompt.tags
					: [UNGROUPED];
			for (const tag of tags) {
				if (!map.has(tag)) map.set(tag, []);
				map.get(tag)?.push(prompt);
			}
		}
		return Array.from(map.entries()).sort(([a], [b]) => {
			if (a === UNGROUPED) return 1;
			if (b === UNGROUPED) return -1;
			return a.localeCompare(b);
		});
	}, [filtered, activeTag]);

	function handleClose(nextOpen: boolean) {
		if (!nextOpen) {
			setSearch("");
			setActiveTag(null);
		}
		onOpenChange(nextOpen);
	}

	function handlePromptSelect(prompt: PromptLibraryItem) {
		onSelectPrompt(prompt);
		handleClose(false);
	}

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="flex h-[85vh] w-[95vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
				<DialogHeader className="shrink-0 border-b px-4 pt-5 pb-4 sm:px-6">
					<DialogTitle>Prompts</DialogTitle>

					<div className="mt-3">
						<InputGroup>
							<InputGroupAddon>
								<SearchIcon className="size-4 text-muted-foreground" />
							</InputGroupAddon>
							<InputGroupInput
								placeholder="Search prompts..."
								value={search}
								onChange={(event) =>
									setSearch(event.target.value)
								}
								autoFocus
							/>
						</InputGroup>
					</div>

					{allTags.length > 0 ? (
						<div className="mt-2 flex flex-wrap gap-1.5">
							<button
								type="button"
								onClick={() => setActiveTag(null)}
								className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors hover:bg-accent ${
									activeTag === null
										? "border-primary bg-primary text-primary-foreground"
										: ""
								}`}
							>
								All
							</button>
							{allTags.map((tag) => (
								<button
									key={tag}
									type="button"
									onClick={() =>
										setActiveTag(
											activeTag === tag ? null : tag,
										)
									}
									className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors hover:bg-accent ${
										activeTag === tag
											? "border-primary bg-primary text-primary-foreground"
											: ""
									}`}
								>
									{tag}
								</button>
							))}
						</div>
					) : null}
				</DialogHeader>

				<ScrollArea className="min-h-0 flex-1 px-4 py-4 sm:px-6">
					{groups.length === 0 ? (
						<p className="py-12 text-center text-muted-foreground text-sm">
							No prompts found.
						</p>
					) : (
						<div className="flex flex-col gap-6 pb-2">
							{groups.map(([tag, groupPrompts]) => (
								<div key={tag}>
									<p className="mb-3 flex items-center gap-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
										{tag}
										<span className="font-normal normal-case tracking-normal">
											({groupPrompts.length})
										</span>
									</p>
									<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
										{groupPrompts.map((prompt) => (
											<button
												key={prompt.id}
												type="button"
												disabled={isLoading}
												onClick={() =>
													handlePromptSelect(prompt)
												}
												className="flex flex-col gap-1 rounded-lg border bg-card p-3 text-start shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
											>
												<span className="line-clamp-2 font-medium text-sm leading-snug">
													{prompt.title}
												</span>
												{prompt.context ? (
													<span className="line-clamp-3 text-muted-foreground text-xs leading-relaxed">
														{prompt.context}
													</span>
												) : null}
											</button>
										))}
									</div>
								</div>
							))}
						</div>
					)}
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
}
