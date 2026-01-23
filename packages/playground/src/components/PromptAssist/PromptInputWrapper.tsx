import { debounce } from "lodash-es";
import {
	Loader2,
	Maximize2,
	Redo2,
	SendIcon,
	Sparkles,
	Undo2,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	Button,
	cn,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { ExpandedPromptDialog } from "./ExpandedPromptDialog";
import { InlineSuggestionOverlay } from "./InlineSuggestionOverlay";
import type { PromptAssistStore } from "./PromptAssistStore";
import { SuggestionPopover } from "./SuggestionPopover";
import type { PromptIssue } from "./types";

interface PromptInputWrapperProps {
	value: string;
	onChange: (value: string) => void;
	onSubmit?: () => void;
	placeholder?: string;
	className?: string;
	promptAssistStore: PromptAssistStore;
	showOptimizeButton?: boolean;
	onOptimize?: () => void;
}

export const PromptInputWrapper = observer<PromptInputWrapperProps>(
	({
		value,
		onChange,
		onSubmit,
		placeholder = "Enter your prompt...",
		className,
		promptAssistStore,
		showOptimizeButton = true,
		onOptimize,
	}) => {
		const containerRef = useRef<HTMLDivElement>(null);
		const textareaRef = useRef<HTMLTextAreaElement>(null);
		const [selectedIssue, setSelectedIssue] = useState<PromptIssue | null>(
			null,
		);
		const [popoverPosition, setPopoverPosition] = useState<{
			x: number;
			y: number;
		}>();
		const [showExpanded, setShowExpanded] = useState(false);

		// Debounced analysis
		const debouncedAnalyze = useCallback(
			debounce((text: string) => {
				promptAssistStore.analyzePrompt(text);
			}, promptAssistStore.config.debounceMs),
			[promptAssistStore],
		);

		// Auto-analyze on text change
		useEffect(() => {
			if (promptAssistStore.config.autoAnalyze && value) {
				debouncedAnalyze(value);
			} else {
				promptAssistStore.clearIssues();
			}

			return () => debouncedAnalyze.cancel();
		}, [value, debouncedAnalyze, promptAssistStore]);

		// Handle issue click
		const handleIssueClick = useCallback(
			(issue: PromptIssue, position: { x: number; y: number }) => {
				setPopoverPosition(position);
				setSelectedIssue(issue);

				// Highlight the problematic text
				if (textareaRef.current) {
					textareaRef.current.focus();
					textareaRef.current.setSelectionRange(
						issue.start,
						issue.end,
					);
				}
			},
			[],
		);

		// Apply suggestion
		const handleApplySuggestion = useCallback(
			(issue: PromptIssue) => {
				const before = value.substring(0, issue.start);
				const after = value.substring(issue.end);
				const newValue = before + issue.suggestion + after;

				// Add to history
				promptAssistStore.addToHistory(value);

				onChange(newValue);
				setSelectedIssue(null);

				// Re-analyze after a short delay
				setTimeout(() => {
					debouncedAnalyze(newValue);
				}, 100);
			},
			[value, onChange, promptAssistStore, debouncedAnalyze],
		);

		// Handle keyboard shortcuts
		const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			// Enter + Cmd/Ctrl to submit
			if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				onSubmit?.();
			}

			// Escape to close popover
			if (e.key === "Escape" && selectedIssue) {
				e.preventDefault();
				setSelectedIssue(null);
			}
		};

		return (
			<>
				<div
					className="relative w-full"
					data-testid="prompt-assist-wrapper"
				>
					{/* Input Container with Overlay */}
					<div
						ref={containerRef}
						className="relative"
						data-testid="prompt-assist-input-container"
					>
						<Textarea
							ref={textareaRef}
							value={value}
							onChange={(e) => onChange(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder={placeholder}
							className={cn(
								"relative max-h-[400px] min-h-[140px] resize-none bg-background pt-3 pr-24 pb-12",
								"overflow-y-auto",
								className,
							)}
							data-testid="prompt-assist-input"
							disabled={!promptAssistStore.config.enabled}
						/>

						{/* Overlay for underlines */}
						{promptAssistStore.config.enabled && value && (
							<InlineSuggestionOverlay
								text={value}
								issues={promptAssistStore.issues}
								containerRef={containerRef}
								textareaRef={textareaRef}
								onIssueClick={handleIssueClick}
							/>
						)}

						{/* Analyzing indicator - Bottom Left */}
						{promptAssistStore.isAnalyzing && (
							<div className="absolute bottom-3 left-25 z-10 flex items-center gap-2 text-muted-foreground text-xs">
								<Loader2 className="h-3 w-3 animate-spin" />
								<span>Analyzing...</span>
							</div>
						)}

						{/* Bottom Left Actions - Undo/Redo & Expand */}
						<div className="absolute bottom-2 left-2 z-10 flex items-center gap-1">
							{/* Undo */}
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => {
											const previous =
												promptAssistStore.undo();
											if (previous !== null)
												onChange(previous);
										}}
										disabled={!promptAssistStore.canUndo}
										className="h-7 w-7"
										type="button"
									>
										<Undo2 className="h-3.5 w-3.5" />
									</Button>
								</TooltipTrigger>
								<TooltipContent side="top">
									Undo (Cmd+Z)
								</TooltipContent>
							</Tooltip>

							{/* Redo */}
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => {
											const next =
												promptAssistStore.redo();
											if (next !== null) onChange(next);
										}}
										disabled={!promptAssistStore.canRedo}
										className="h-7 w-7"
										type="button"
									>
										<Redo2 className="h-3.5 w-3.5" />
									</Button>
								</TooltipTrigger>
								<TooltipContent side="top">
									Redo (Cmd+Shift+Z)
								</TooltipContent>
							</Tooltip>

							{/* Expand */}
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => setShowExpanded(true)}
										disabled={!value}
										className="h-7 w-7"
										type="button"
									>
										<Maximize2 className="h-3.5 w-3.5" />
									</Button>
								</TooltipTrigger>
								<TooltipContent side="top">
									Expand View
								</TooltipContent>
							</Tooltip>
						</div>

						{/* Embedded Buttons - Bottom Right */}
						<div className="absolute right-2 bottom-2 z-10 flex items-center gap-1.5">
							{/* Optimize Button */}
							{showOptimizeButton && (
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											onClick={onOptimize}
											disabled={
												!value ||
												value.length < 10 ||
												!promptAssistStore.config
													.enabled ||
												promptAssistStore.isOptimizing
											}
											className={cn(
												"h-8 w-8 rounded-md",
												promptAssistStore.isOptimizing &&
													"animate-pulse",
											)}
											data-testid="prompt-assist-optimize-btn"
											type="button"
										>
											{promptAssistStore.isOptimizing ? (
												<Loader2 className="h-4 w-4 animate-spin" />
											) : (
												<Sparkles className="h-4 w-4" />
											)}
										</Button>
									</TooltipTrigger>
									<TooltipContent side="top">
										{promptAssistStore.isOptimizing
											? "Optimizing..."
											: "Optimize Prompt (Cmd+Shift+O)"}
									</TooltipContent>
								</Tooltip>
							)}

							{/* Submit Button */}
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="default"
										size="icon"
										onClick={onSubmit}
										disabled={!value || !value.trim()}
										className="h-8 w-8 rounded-md"
										data-testid="prompt-assist-submit-btn"
										type="button"
									>
										<SendIcon className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent side="top">
									Submit (Cmd+Enter)
								</TooltipContent>
							</Tooltip>
						</div>
					</div>

					{/* Suggestion Popover */}
					<SuggestionPopover
						issue={selectedIssue}
						open={!!selectedIssue}
						onClose={() => setSelectedIssue(null)}
						onApply={handleApplySuggestion}
						anchorPosition={popoverPosition}
					/>
				</div>

				{/* Expanded View Dialog */}
				<ExpandedPromptDialog
					open={showExpanded}
					onClose={() => setShowExpanded(false)}
					value={value}
					onChange={onChange}
					promptAssistStore={promptAssistStore}
					onApplySuggestion={handleApplySuggestion}
				/>
			</>
		);
	},
);
