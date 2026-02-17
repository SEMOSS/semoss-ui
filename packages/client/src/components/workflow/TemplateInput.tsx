import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@semoss/ui/next";
import { useWorkflowEditor } from "@/stores/workflow";
import { STEP_TYPE_LABELS } from "@/types/workflow";
import { getUpstreamStepIds } from "@/utility/workflow-dag";

interface TemplateInputProps {
	value: string;
	onChange: (value: string) => void;
	/** Current step ID — used to compute available upstream steps */
	stepId: string;
	placeholder?: string;
	multiline?: boolean;
	className?: string;
}

interface Suggestion {
	label: string;
	insertText: string;
	description?: string;
}

export function TemplateInput({
	value,
	onChange,
	stepId,
	placeholder,
	multiline = false,
	className,
}: TemplateInputProps) {
	const { state } = useWorkflowEditor();
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [suggestionFilter, setSuggestionFilter] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(0);
	const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
	const suggestionsRef = useRef<HTMLDivElement>(null);

	// Compute upstream steps for autocomplete
	const suggestions = useMemo((): Suggestion[] => {
		const steps = state.workflow.steps;
		const upstreamIds = getUpstreamStepIds(steps, stepId);

		const stepSuggestions: Suggestion[] = [];
		for (const s of steps) {
			if (upstreamIds.has(s.stepId)) {
				stepSuggestions.push({
					label: `${s.name}`,
					insertText: `{{${s.stepId}.output}}`,
					description: STEP_TYPE_LABELS[s.type],
				});
			}
		}

		// Add workflow variables
		for (const key of Object.keys(state.workflow.variables)) {
			stepSuggestions.push({
				label: `variables.${key}`,
				insertText: `{{variables.${key}}}`,
				description: "Variable",
			});
		}

		return stepSuggestions;
	}, [state.workflow.steps, state.workflow.variables, stepId]);

	// Filtered suggestions
	const filteredSuggestions = useMemo(() => {
		if (!suggestionFilter) return suggestions;
		const lower = suggestionFilter.toLowerCase();
		return suggestions.filter(
			(s) =>
				s.label.toLowerCase().includes(lower) ||
				s.insertText.toLowerCase().includes(lower),
		);
	}, [suggestions, suggestionFilter]);

	// Detect {{ trigger
	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
			const newValue = e.target.value;
			onChange(newValue);

			// Check if cursor is inside a {{ ... }} expression
			const cursorPos = e.target.selectionStart ?? 0;
			const textBefore = newValue.slice(0, cursorPos);
			const lastOpen = textBefore.lastIndexOf("{{");
			const lastClose = textBefore.lastIndexOf("}}");

			if (lastOpen > lastClose) {
				// We're inside a template expression
				const filterText = textBefore.slice(lastOpen + 2);
				setSuggestionFilter(filterText);
				setShowSuggestions(true);
				setSelectedIndex(0);
			} else {
				setShowSuggestions(false);
			}
		},
		[onChange],
	);

	// Handle suggestion selection
	const selectSuggestion = useCallback(
		(suggestion: Suggestion) => {
			const input = inputRef.current;
			if (!input) return;

			const cursorPos = input.selectionStart ?? 0;
			const textBefore = value.slice(0, cursorPos);
			const lastOpen = textBefore.lastIndexOf("{{");

			if (lastOpen >= 0) {
				const before = value.slice(0, lastOpen);
				const after = value.slice(cursorPos);
				// Remove any trailing }} that the user might not have typed yet
				const trimmedAfter = after.startsWith("}}")
					? after.slice(2)
					: after;
				onChange(before + suggestion.insertText + trimmedAfter);
			}

			setShowSuggestions(false);
		},
		[value, onChange],
	);

	// Keyboard navigation
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (!showSuggestions) return;

			if (e.key === "ArrowDown") {
				e.preventDefault();
				setSelectedIndex((i) =>
					Math.min(i + 1, filteredSuggestions.length - 1),
				);
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				setSelectedIndex((i) => Math.max(i - 1, 0));
			} else if (e.key === "Enter" && filteredSuggestions.length > 0) {
				e.preventDefault();
				selectSuggestion(filteredSuggestions[selectedIndex]);
			} else if (e.key === "Escape") {
				setShowSuggestions(false);
			}
		},
		[showSuggestions, filteredSuggestions, selectedIndex, selectSuggestion],
	);

	// Close suggestions on outside click
	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (
				suggestionsRef.current &&
				!suggestionsRef.current.contains(e.target as HTMLElement) &&
				inputRef.current !== e.target
			) {
				setShowSuggestions(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	const InputComp = multiline ? "textarea" : "input";

	return (
		<div className="relative">
			<InputComp
				ref={
					inputRef as React.RefObject<
						HTMLTextAreaElement & HTMLInputElement
					>
				}
				value={value}
				onChange={handleChange}
				onKeyDown={handleKeyDown}
				placeholder={placeholder}
				className={cn(
					"w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
					multiline && "min-h-[80px] resize-y",
					className,
				)}
			/>
			{showSuggestions && filteredSuggestions.length > 0 && (
				<div
					ref={suggestionsRef}
					className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg"
				>
					{filteredSuggestions.map((suggestion, i) => (
						<button
							key={suggestion.insertText}
							type="button"
							className={cn(
								"flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-blue-50",
								i === selectedIndex && "bg-blue-50",
							)}
							onMouseDown={(e) => {
								e.preventDefault();
								selectSuggestion(suggestion);
							}}
						>
							<span className="font-mono text-xs">
								{suggestion.label}
							</span>
							{suggestion.description && (
								<span className="text-[10px] text-gray-400">
									{suggestion.description}
								</span>
							)}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
