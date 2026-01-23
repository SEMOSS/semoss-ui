import { observer } from "mobx-react-lite";
import { useRef } from "react";
import {
	Button,
	cn,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	Textarea,
} from "@semoss/ui/next";
import { InlineSuggestionOverlay } from "./InlineSuggestionOverlay";
import type { PromptAssistStore } from "./PromptAssistStore";
import type { PromptIssue } from "./types";

interface ExpandedPromptDialogProps {
	open: boolean;
	onClose: () => void;
	value: string;
	onChange: (value: string) => void;
	promptAssistStore: PromptAssistStore;
	onApplySuggestion: (issue: PromptIssue) => void;
}

export const ExpandedPromptDialog = observer<ExpandedPromptDialogProps>(
	({
		open,
		onClose,
		value,
		onChange,
		promptAssistStore,
		onApplySuggestion,
	}) => {
		const containerRef = useRef<HTMLDivElement>(null);
		const textareaRef = useRef<HTMLTextAreaElement>(null);

		return (
			<Dialog open={open} onOpenChange={onClose}>
				<DialogContent className="flex h-[60vh] max-w-4xl flex-col gap-0 p-0">
					<DialogHeader className="border-border border-b px-6 py-4">
						<div className="flex items-center justify-between">
							<DialogTitle className="text-foreground">
								Expanded Prompt View
							</DialogTitle>
						</div>
					</DialogHeader>

					<div className="flex-1 overflow-hidden p-3">
						<div ref={containerRef} className="relative h-full">
							<Textarea
								ref={textareaRef}
								value={value}
								onChange={(e) => onChange(e.target.value)}
								placeholder="Enter your prompt..."
								className={cn(
									"h-full resize-none bg-background text-foreground",
								)}
							/>

							{/* Overlay for underlines */}
							{promptAssistStore.config.enabled && value && (
								<InlineSuggestionOverlay
									text={value}
									issues={promptAssistStore.issues}
									containerRef={containerRef}
									textareaRef={textareaRef}
									onIssueClick={(issue) =>
										onApplySuggestion(issue)
									}
								/>
							)}
						</div>
					</div>

					<div className="flex items-center justify-between border-border border-t px-6 py-4">
						<div className="text-muted-foreground text-sm">
							{value.length} characters •{" "}
							{value.split(/\s+/).filter(Boolean).length} words
						</div>
						<Button onClick={onClose}>Close</Button>
					</div>
				</DialogContent>
			</Dialog>
		);
	},
);
