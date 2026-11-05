import { X } from "lucide-react";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { cn, Popover, PopoverAnchor, PopoverContent } from "@semoss/ui/next";
import { normalizeTagArray } from "@/utility";

export interface CatalogTagInputProps {
	/** Selected tag values */
	value?: string[] | string;
	/** Callback fired when tag collection changes */
	onChange: (value: string[]) => void;
	/** Placeholder for the inline input */
	placeholder: string;
	/** Id of the inline input, so a label can name it */
	id?: string;
	/** Optional test id for the input */
	testId?: string;
	/** Values suggested as the user types */
	options?: string[];
}

/**
 * Tags typed or picked one at a time, shown as chips. Enter adds the text
 * typed, or the suggestion picked with the arrow keys; leaving the field adds
 * what was typed too.
 */
export const CatalogTagInput = ({
	value,
	onChange,
	placeholder,
	id,
	testId,
	options,
}: CatalogTagInputProps) => {
	const listId = useId();
	const anchorRef = useRef<HTMLDivElement>(null);
	const [inputValue, setInputValue] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const [activeIndex, setActiveIndex] = useState(-1);
	const selectedTags = normalizeTagArray(value)
		.map((tag) => tag.trim())
		.filter((tag) => tag !== "");

	const query = inputValue.trim().toLowerCase();
	const suggestions = (options ?? []).filter(
		(option) =>
			!selectedTags.includes(option) &&
			option.toLowerCase().includes(query),
	);
	const isListOpen = isOpen && suggestions.length > 0;
	const activeOption = isListOpen ? suggestions[activeIndex] : undefined;
	const getOptionId = (index: number) => `${listId}-${index}`;
	const activeOptionId = activeOption ? getOptionId(activeIndex) : undefined;

	// keep the option picked with the arrow keys in view
	useEffect(() => {
		if (activeOptionId) {
			document
				.getElementById(activeOptionId)
				?.scrollIntoView({ block: "nearest" });
		}
	}, [activeOptionId]);

	const closeList = () => {
		setIsOpen(false);
		setActiveIndex(-1);
	};

	const addTag = (tag: string) => {
		const trimmed = tag.trim();
		if (trimmed && !selectedTags.includes(trimmed)) {
			onChange([...selectedTags, trimmed]);
			setInputValue("");
		}
		setActiveIndex(-1);
	};

	const removeTag = (tag: string) => {
		onChange(selectedTags.filter((selectedTag) => selectedTag !== tag));
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "ArrowDown" || event.key === "ArrowUp") {
			if (suggestions.length === 0) {
				return;
			}
			event.preventDefault();
			setIsOpen(true);
			const step = event.key === "ArrowDown" ? 1 : -1;
			setActiveIndex((index) => {
				const next = index + step;
				if (next < 0) {
					return suggestions.length - 1;
				}
				return next >= suggestions.length ? 0 : next;
			});
		} else if (event.key === "Enter") {
			event.preventDefault();
			addTag(activeOption ?? inputValue);
		}
	};

	return (
		<Popover
			open={isListOpen}
			onOpenChange={(open) => {
				if (!open) {
					closeList();
				}
			}}
		>
			<PopoverAnchor asChild>
				<div
					ref={anchorRef}
					className="flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1.5 shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 dark:bg-input/30"
				>
					{selectedTags.map((tag) => (
						<span
							key={tag}
							className="inline-flex h-6 items-center gap-1 rounded-md bg-muted pr-1 pl-2 text-foreground text-sm"
						>
							{tag}
							<button
								type="button"
								aria-label={`Remove ${tag}`}
								onClick={(event) => {
									event.preventDefault();
									removeTag(tag);
								}}
								className="rounded-sm p-0.5 text-muted-foreground hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
							>
								<X className="size-3" aria-hidden />
							</button>
						</span>
					))}
					<input
						id={id}
						type="text"
						role="combobox"
						aria-autocomplete="list"
						aria-expanded={isListOpen}
						aria-controls={isListOpen ? listId : undefined}
						aria-activedescendant={activeOptionId}
						value={inputValue}
						onChange={(event) => {
							setInputValue(event.target.value);
							setIsOpen(true);
							setActiveIndex(-1);
						}}
						onClick={() => setIsOpen(true)}
						onKeyDown={handleKeyDown}
						onBlur={() => {
							addTag(inputValue);
							closeList();
						}}
						placeholder={placeholder}
						className="h-6 min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
						data-testid={testId}
					/>
				</div>
			</PopoverAnchor>
			<PopoverContent
				align="start"
				sideOffset={4}
				className="w-(--radix-popover-trigger-width) p-1"
				// focus stays in the field while the list is open, even through a
				// press on an option or the list's scrollbar
				onOpenAutoFocus={(event) => event.preventDefault()}
				onCloseAutoFocus={(event) => event.preventDefault()}
				onMouseDown={(event) => event.preventDefault()}
				onInteractOutside={(event) => {
					if (anchorRef.current?.contains(event.target as Node)) {
						event.preventDefault();
					}
				}}
			>
				<div
					id={listId}
					role="listbox"
					aria-label="Suggestions"
					className="flex max-h-60 flex-col overflow-y-auto"
				>
					{suggestions.map((option, index) => (
						<button
							key={option}
							type="button"
							id={getOptionId(index)}
							role="option"
							aria-selected={index === activeIndex}
							// the field keeps focus, and moves through the options with the arrow keys
							tabIndex={-1}
							className={cn(
								"w-full truncate rounded-sm px-2 py-1.5 text-start text-sm",
								index === activeIndex &&
									"bg-accent text-accent-foreground",
							)}
							onMouseEnter={() => setActiveIndex(index)}
							onClick={() => addTag(option)}
						>
							{option}
						</button>
					))}
				</div>
			</PopoverContent>
		</Popover>
	);
};
