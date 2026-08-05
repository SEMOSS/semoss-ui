import { X } from "lucide-react";
import { useState } from "react";
import { normalizeTagArray } from "@/utility";

export interface CatalogTagInputProps {
	/** Selected tag values */
	value?: string[] | string;
	/** Callback fired when tag collection changes */
	onChange: (value: string[]) => void;
	/** Placeholder for the inline input */
	placeholder: string;
	/** Optional test id for the input */
	testId?: string;
	/** Optional suggested values */
	options?: string[];
	/** Optional datalist id */
	listId?: string;
}

export const CatalogTagInput = ({
	value,
	onChange,
	placeholder,
	testId,
	options,
	listId,
}: CatalogTagInputProps) => {
	const [inputValue, setInputValue] = useState("");
	const selectedTags = normalizeTagArray(value)
		.map((tag) => tag.trim())
		.filter((tag) => tag !== "");

	const addTag = (tag: string) => {
		const trimmed = tag.trim();
		if (trimmed && !selectedTags.includes(trimmed)) {
			onChange([...selectedTags, trimmed]);
			setInputValue("");
		}
	};

	const removeTag = (tag: string) => {
		onChange(selectedTags.filter((selectedTag) => selectedTag !== tag));
	};

	return (
		<div className="flex flex-wrap gap-2 rounded-md border border-input bg-transparent p-2">
			{selectedTags.map((tag) => (
				<span
					key={tag}
					className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-foreground text-sm"
				>
					{tag}
					<button
						type="button"
						onClick={(event) => {
							event.preventDefault();
							removeTag(tag);
						}}
						className="hover:opacity-70"
					>
						<X className="size-3" />
					</button>
				</span>
			))}
			<input
				type="text"
				value={inputValue}
				onChange={(event) => setInputValue(event.target.value)}
				onKeyDown={(event) => {
					if (event.key === "Enter") {
						event.preventDefault();
						addTag(inputValue);
					}
				}}
				onBlur={() => addTag(inputValue)}
				placeholder={placeholder}
				className="min-w-[100px] flex-1 bg-transparent text-sm outline-none"
				data-testid={testId}
				list={listId}
			/>
			{listId && options?.length ? (
				<datalist id={listId}>
					{options.map((option) => (
						<option key={option} value={option} />
					))}
				</datalist>
			) : null}
		</div>
	);
};
