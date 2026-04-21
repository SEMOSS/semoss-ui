import { Search, Space, X } from "lucide-react";
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

export type SearchCategory =
	| "methodName"
	| "requestMessage"
	| "engineType"
	| "roomId";

export interface SearchToken {
	id: string;
	category: SearchCategory;
	values: string[];
}

export interface SearchPayload {
	search?: {
		methodName?: string[];
		requestMessage?: string[];
		engineType?: string[];
	};
	others?: string;
	roomId?: string;
}

interface CategoryMeta {
	label: string;
	color: string;
	bgColor: string;
	borderColor: string;
}

const CATEGORIES: SearchCategory[] = [
	"methodName",
	"requestMessage",
	"engineType",
	"roomId",
];

const CATEGORY_META: Record<SearchCategory, CategoryMeta> = {
	methodName: {
		label: "Method",
		color: "text-blue-700 dark:text-blue-300",
		bgColor: "bg-blue-100 dark:bg-blue-900/40",
		borderColor: "border-blue-300 dark:border-blue-700",
	},
	requestMessage: {
		label: "Request Message",
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
	roomId: {
		label: "Room",
		color: "text-violet-700 dark:text-violet-300",
		bgColor: "bg-violet-100 dark:bg-violet-900/40",
		borderColor: "border-violet-300 dark:border-violet-700",
	},
};

let _tokenIdCounter = 0;
const nextTokenId = (): string => `tok_${++_tokenIdCounter}`;

export const buildSearchPayload = (
	tokens: SearchToken[],
	freeText: string,
): SearchPayload => {
	const roomIdTokens = tokens.filter((t) => t.category === "roomId");
	const categoryTokens = tokens.filter((t) => t.category !== "roomId");
	const roomIdValues = roomIdTokens.flatMap((t) => t.values);

	if (
		categoryTokens.length === 0 &&
		!freeText.trim() &&
		roomIdValues.length === 0
	)
		return {};

	const result: SearchPayload = {};

	if (roomIdValues.length > 0) {
		result.roomId = roomIdValues[roomIdValues.length - 1];
	}

	if (categoryTokens.length > 0) {
		const search: NonNullable<SearchPayload["search"]> = {};
		for (const token of categoryTokens) {
			const key = token.category as keyof NonNullable<
				SearchPayload["search"]
			>;
			if (!search[key]) search[key] = [];
			search[key].push(...token.values);
		}
		result.search = search;
	}

	if (freeText.trim()) {
		result.others = freeText.trim();
	}

	return result;
};

export interface TokenizedSearchBarProps {
	tokens: SearchToken[];
	freeText: string;
	onTokensChange: (tokens: SearchToken[]) => void;
	onFreeTextChange: (text: string) => void;
	onSearch?: (tokens: SearchToken[], freeText: string) => void;
	placeholder?: string;
}

export const TokenizedSearchBar = ({
	tokens,
	freeText,
	onTokensChange,
	onFreeTextChange,
	onSearch,
	placeholder = "Search method, requestMessage, engine… or pick a category",
}: TokenizedSearchBarProps) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const [pendingCategory, setPendingCategory] =
		useState<SearchCategory | null>(null);
	const [dropdownOpen, setDropdownOpen] = useState(false);

	const addToken = useCallback(
		(category: SearchCategory, value: string) => {
			const trimmed = value.trim();
			if (!trimmed) return;

			const existing = tokens.find((t) => t.category === category);
			let newTokens: SearchToken[];

			if (existing) {
				newTokens = tokens?.map((t) =>
					t.id === existing.id
						? { ...t, values: [...t.values, trimmed] }
						: t,
				);
			} else {
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

	const removeValue = useCallback(
		(tokenId: string, valueIdx: number) => {
			const token = tokens?.find((t) => t.id === tokenId);
			if (!token) return;

			let newTokens: SearchToken[];

			if (token?.values?.length <= 1) {
				newTokens = tokens?.filter((t) => t.id !== tokenId);
			} else {
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

	const selectCategory = useCallback(
		(cat: SearchCategory) => {
			setPendingCategory(cat);
			setDropdownOpen(false);
			if (freeText.trim()) {
				addToken(cat, freeText);
			} else {
				setTimeout(() => inputRef.current?.focus(), 0);
			}
		},
		[freeText, addToken],
	);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent<HTMLInputElement>) => {
			const value = freeText;

			if (e.key === "Enter" || e.key === ",") {
				e.preventDefault();
				if (pendingCategory && value.trim()) {
					addToken(pendingCategory, value);
				} else if (pendingCategory && !value.trim()) {
					setPendingCategory(null);
				} else if (!pendingCategory && value.trim()) {
					onSearch?.(tokens, value.trim());
				}
				return;
			}

			if (e.key === "Backspace" && !value) {
				e.preventDefault();
				if (pendingCategory) {
					setPendingCategory(null);
				} else if (tokens?.length > 0) {
					const lastToken = tokens[tokens?.length - 1];
					removeValue(lastToken.id, lastToken.values?.length - 1);
				}
				return;
			}

			if (e.key === " " && e.ctrlKey) {
				e.preventDefault();
				setDropdownOpen(true);
				return;
			}

			if (e.key === "Escape") {
				setPendingCategory(null);
				setDropdownOpen(false);
			}
		},
		[freeText, pendingCategory, tokens, addToken, removeValue, onSearch],
	);

	useEffect(() => {
		const handler = (e: globalThis.KeyboardEvent) => {
			if (e.key === "Escape") setDropdownOpen(false);
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, []);

	const pendingMeta = pendingCategory ? CATEGORY_META[pendingCategory] : null;

	return (
		<div className="px-3 pb-2">
			<label className="flex min-h-[32px] flex-wrap items-center gap-1 rounded border border-border bg-secondary px-2 py-1 transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
				<Search
					size={12}
					className="flex-shrink-0 text-muted-foreground"
				/>

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
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											removeValue(token.id, vi);
										}}
										className="cursor-pointer rounded-sm border-none bg-transparent p-0 opacity-60 transition-opacity hover:opacity-100"
									>
										<X size={8} />
									</button>
								</span>
							))}
						</Badge>
					);
				})}

				{pendingMeta && (
					<span
						className={`flex items-center gap-0.5 rounded-sm border px-1.5 py-0 font-mono text-[10px] ${pendingMeta.bgColor} ${pendingMeta.borderColor} ${pendingMeta.color}`}
					>
						{pendingMeta.label}:
					</span>
				)}

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
									<button
										type="button"
										key={cat}
										onClick={() => selectCategory(cat)}
										className="flex w-full cursor-pointer items-center gap-2 rounded-sm border-none bg-transparent px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
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
									</button>
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

				<span className="ml-auto flex flex-shrink-0 items-center gap-1.5">
					{!dropdownOpen && (
						<span className="flex select-none items-center gap-1 whitespace-nowrap font-mono text-[9px] text-muted-foreground/60">
							Ctrl +
							<Space className="h-3 w-3" />
						</span>
					)}
					{(tokens?.length > 0 || freeText) && (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onTokensChange([]);
								onFreeTextChange("");
								setPendingCategory(null);
								onSearch?.([], "");
							}}
							className="flex-shrink-0 cursor-pointer border-none bg-transparent p-0 text-muted-foreground transition-colors hover:text-foreground"
						>
							<X size={12} />
						</button>
					)}
				</span>
			</label>
		</div>
	);
};

export default TokenizedSearchBar;
