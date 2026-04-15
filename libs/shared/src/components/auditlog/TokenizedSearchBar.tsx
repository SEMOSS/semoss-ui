/** biome-ignore-all lint/a11y/noStaticElementInteractions: interactive containers */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: token UI interactions */
/** biome-ignore-all lint/nursery/useSortedClasses: dynamic class merging */

import { Search, X } from "lucide-react";
import {
	type KeyboardEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import {
	Badge,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@semoss/ui/next";

/** Allowed search token categories */
export type SearchCategory = "methodName" | "args" | "engineType";

/** A single search token — one per category, holding multiple values */
export interface SearchToken {
	id: string;
	category: SearchCategory;
	values: string[];
}

/** Structured search payload for the AuditLogReport reactor */
export interface SearchPayload {
	search?: {
		methodName?: string[];
		args?: string[];
		engineType?: string[];
	};
	others?: string;
}

/** Metadata for each category (label + styling) */
interface CategoryMeta {
	label: string;
	color: string;
	bgColor: string;
	borderColor: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: SearchCategory[] = ["methodName", "args", "engineType"];

const CATEGORY_META: Record<SearchCategory, CategoryMeta> = {
	methodName: {
		label: "Method",
		color: "text-blue-700 dark:text-blue-300",
		bgColor: "bg-blue-100 dark:bg-blue-900/40",
		borderColor: "border-blue-300 dark:border-blue-700",
	},
	args: {
		label: "Args",
		color: "text-amber-700 dark:text-amber-300",
		bgColor: "bg-amber-100 dark:bg-amber-900/40",
		borderColor: "border-amber-300 dark:border-amber-700",
	},
	engineType: {
		label: "Engine",
		color: "text-emerald-700 dark:text-emerald-300",
		bgColor: "bg-emerald-100 dark:bg-emerald-900/40",
		borderColor: "border-emerald-300 dark:border-emerald-700",
	},
};

let _tokenIdCounter = 0;
const nextTokenId = (): string => `tok_${++_tokenIdCounter}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a `SearchPayload` from the current list of tokens + free-text input.
 * Returns `undefined` when there is nothing to search.
 */
export const buildSearchPayload = (
	tokens: SearchToken[],
	freeText: string,
): SearchPayload | undefined => {
	if (tokens?.length === 0 && !freeText.trim()) return undefined;

	// Free-text only  →  `others`
	if (tokens?.length === 0 && freeText.trim()) {
		return { others: freeText.trim() };
	}

	// Category-based tokens  →  `search`
	const search: NonNullable<SearchPayload["search"]> = {};
	for (const token of tokens) {
		const key = token.category;
		if (!search[key]) search[key] = [];
		search[key].push(...token.values);
	}

	// If there is also free-text alongside tokens, include as `others`
	if (freeText.trim()) {
		return { search, others: freeText.trim() };
	}

	return { search };
};

// ─── Component ────────────────────────────────────────────────────────────────

export interface TokenizedSearchBarProps {
	/** Current tokens (lifted state) */
	tokens: SearchToken[];
	/** Current free-text value */
	freeText: string;
	/** Called whenever tokens change */
	onTokensChange: (tokens: SearchToken[]) => void;
	/** Called whenever free-text changes */
	onFreeTextChange: (text: string) => void;
	/** Called with the exact search state when user commits an action (add/remove token, Enter, clear) */
	onSearch?: (tokens: SearchToken[], freeText: string) => void;
	/** Placeholder when the bar is empty */
	placeholder?: string;
}

export const TokenizedSearchBar = ({
	tokens,
	freeText,
	onTokensChange,
	onFreeTextChange,
	onSearch,
	placeholder = "Search method, args, engine… or pick a category",
}: TokenizedSearchBarProps) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const [pendingCategory, setPendingCategory] =
		useState<SearchCategory | null>(null);
	const [dropdownOpen, setDropdownOpen] = useState(false);

	// Focus input whenever user clicks the container
	const focusInput = useCallback(() => {
		inputRef.current?.focus();
	}, []);

	// ── Add a value to a category (merges into existing token or creates new) ─
	const addToken = useCallback(
		(category: SearchCategory, value: string) => {
			const trimmed = value.trim();
			if (!trimmed) return;

			const existing = tokens.find((t) => t.category === category);
			let newTokens: SearchToken[];

			if (existing) {
				// Append value to existing category token
				newTokens = tokens?.map((t) =>
					t.id === existing.id
						? { ...t, values: [...t.values, trimmed] }
						: t,
				);
			} else {
				// Create new category token
				newTokens = [
					...tokens,
					{ id: nextTokenId(), category, values: [trimmed] },
				];
			}

			onTokensChange(newTokens);
			onFreeTextChange("");
			setPendingCategory(null);
			onSearch?.(newTokens, "");
		},
		[tokens, onTokensChange, onFreeTextChange, onSearch],
	);

	// ── Remove a single value from a token (removes entire token if last value)
	const removeValue = useCallback(
		(tokenId: string, valueIdx: number) => {
			const token = tokens?.find((t) => t.id === tokenId);
			if (!token) return;

			let newTokens: SearchToken[];

			if (token?.values?.length <= 1) {
				// Last value — remove entire token
				newTokens = tokens?.filter((t) => t.id !== tokenId);
			} else {
				// Remove just this value
				newTokens = tokens?.map((t) =>
					t.id === tokenId
						? {
								...t,
								values: t.values?.filter(
									(_, i) => i !== valueIdx,
								),
							}
						: t,
				);
			}

			onTokensChange(newTokens);
			onSearch?.(newTokens, freeText);
		},
		[tokens, freeText, onTokensChange, onSearch],
	);

	// ── Select a category from the dropdown ──────────────────────────────
	const selectCategory = useCallback(
		(cat: SearchCategory) => {
			setPendingCategory(cat);
			setDropdownOpen(false);
			// If there is already text in the input, turn it into a token value
			if (freeText.trim()) {
				addToken(cat, freeText);
			} else {
				// Focus after category selection so user can type the value
				setTimeout(() => inputRef.current?.focus(), 0);
			}
		},
		[freeText, addToken],
	);

	// ── Key handling ─────────────────────────────────────────────────────
	const handleKeyDown = useCallback(
		(e: KeyboardEvent<HTMLInputElement>) => {
			const value = freeText;

			// Enter / comma  →  create token or trigger search
			if (e.key === "Enter" || e.key === ",") {
				e.preventDefault();
				if (pendingCategory && value.trim()) {
					addToken(pendingCategory, value);
				} else if (pendingCategory && !value.trim()) {
					// Empty input with pending category → cancel pending
					setPendingCategory(null);
				} else if (!pendingCategory && value.trim()) {
					// Free-text submit
					onSearch?.(tokens, value.trim());
				}
				return;
			}

			// Backspace on empty input  →  cancel pending category or pop last value
			if (e.key === "Backspace" && !value) {
				e.preventDefault();
				if (pendingCategory) {
					setPendingCategory(null);
				} else if (tokens?.length > 0) {
					const lastToken = tokens[tokens?.length - 1];
					// Remove the last value from the last token
					removeValue(lastToken.id, lastToken.values?.length - 1);
				}
				return;
			}

			// Escape  →  cancel pending category
			if (e.key === "Escape") {
				setPendingCategory(null);
				setDropdownOpen(false);
			}
		},
		[freeText, pendingCategory, tokens, addToken, removeValue, onSearch],
	);

	// Close dropdown on Escape
	useEffect(() => {
		const handler = (e: globalThis.KeyboardEvent) => {
			if (e.key === "Escape") setDropdownOpen(false);
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, []);

	// ── Derived ──────────────────────────────────────────────────────────
	const pendingMeta = pendingCategory ? CATEGORY_META[pendingCategory] : null;

	return (
		<div className="px-3 pb-2">
			<div
				onClick={focusInput}
				className="flex min-h-[32px] flex-wrap items-center gap-1 rounded border border-border bg-secondary px-2 py-1 transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20"
			>
				<Search
					size={12}
					className="flex-shrink-0 text-muted-foreground"
				/>

				{/* Existing tokens — one pill per category */}
				{tokens?.map((token) => {
					const meta = CATEGORY_META[token.category];
					return (
						<Badge
							key={token?.id}
							variant="outline"
							className={`flex items-center gap-0.5 rounded-sm border px-1.5 py-0 font-mono text-[10px] ${meta.bgColor} ${meta.borderColor} ${meta.color}`}
						>
							<span className="opacity-70">{meta.label}:</span>
							{token?.values?.map((val, vi) => (
								<span
									key={`${token?.id}-${vi}`}
									className="flex items-center gap-0.5"
								>
									{vi > 0 && (
										<span className="opacity-40">,</span>
									)}
									<span>{val}</span>
									<span
										onClick={(e) => {
											e.stopPropagation();
											removeValue(token.id, vi);
										}}
										className="cursor-pointer rounded-sm opacity-60 transition-opacity hover:opacity-100"
									>
										<X size={8} />
									</span>
								</span>
							))}
						</Badge>
					);
				})}

				{/* Pending category indicator */}
				{pendingMeta && (
					<span
						className={`flex items-center gap-0.5 rounded-sm border px-1.5 py-0 font-mono text-[10px] ${pendingMeta.bgColor} ${pendingMeta.borderColor} ${pendingMeta.color}`}
					>
						{pendingMeta.label}:
					</span>
				)}

				{/* Input + category dropdown trigger */}
				<div className="relative flex min-w-[120px] flex-1 items-center">
					<Popover open={dropdownOpen} onOpenChange={setDropdownOpen}>
						<PopoverTrigger asChild>
							<input
								ref={inputRef}
								type="text"
								value={freeText}
								onChange={(e) =>
									onFreeTextChange(e.target.value)
								}
								onKeyDown={handleKeyDown}
								onFocus={() => {
									if (
										!freeText &&
										!pendingCategory &&
										tokens?.length === 0
									) {
										setDropdownOpen(true);
									}
								}}
								placeholder={
									pendingCategory
										? `Type ${CATEGORY_META[pendingCategory].label.toLowerCase()} value…`
										: tokens?.length > 0
											? "Add more filters…"
											: placeholder
								}
								className="w-full border-none bg-transparent font-mono text-[10px] text-foreground outline-none placeholder:text-muted-foreground"
							/>
						</PopoverTrigger>

						<PopoverContent
							align="start"
							sideOffset={8}
							className="w-56 p-1"
							onOpenAutoFocus={(e) => e.preventDefault()}
						>
							<div className="px-2 py-1.5">
								<span className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
									Filter by category
								</span>
							</div>
							{CATEGORIES?.map((cat) => {
								const meta = CATEGORY_META[cat];
								return (
									<div
										key={cat}
										onClick={() => selectCategory(cat)}
										className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
									>
										<span
											className={`flex h-5 w-5 items-center justify-center rounded font-bold text-[10px] ${meta.bgColor} ${meta.color}`}
										>
											{meta.label[0]}
										</span>
										<span className="text-xs">
											{meta.label}
										</span>
										<span className="ml-auto font-mono text-[9px] text-muted-foreground">
											{cat}
										</span>
									</div>
								);
							})}
							<div className="mt-1 border-border border-t px-2 py-1.5">
								<span className="text-[9px] text-muted-foreground">
									Or type to search across all fields
								</span>
							</div>
						</PopoverContent>
					</Popover>
				</div>

				{/* Clear all button */}
				{(tokens?.length > 0 || freeText) && (
					<span
						onClick={(e) => {
							e.stopPropagation();
							onTokensChange([]);
							onFreeTextChange("");
							setPendingCategory(null);
							onSearch?.([], "");
						}}
						className="flex-shrink-0 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
					>
						<X size={12} />
					</span>
				)}
			</div>
		</div>
	);
};

export default TokenizedSearchBar;
