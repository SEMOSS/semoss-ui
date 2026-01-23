import { observer } from "mobx-react-lite";
import type React from "react";
import { cn } from "@semoss/ui/next";
import { type PromptIssue, Severity } from "./types";

interface InlineSuggestionOverlayProps {
	text: string;
	issues: PromptIssue[];
	containerRef: React.RefObject<HTMLDivElement>;
	textareaRef: React.RefObject<HTMLTextAreaElement>;
	onIssueClick: (
		issue: PromptIssue,
		position: { x: number; y: number },
	) => void;
}

export const InlineSuggestionOverlay = observer<InlineSuggestionOverlayProps>(
	({ text, issues, containerRef, textareaRef, onIssueClick }) => {
		const getSeverityStyles = (severity: Severity) => {
			switch (severity) {
				case Severity.CRITICAL:
					return "border-b-2 border-destructive border-dotted";
				case Severity.MEDIUM:
					return "border-b-2 border-[rgba(234,179,8,1)] border-dotted";
				case Severity.LOW:
					return "border-b-2 border-[rgba(59,130,246,1)] border-dotted";
			}
		};

		const handleIssueClick = (
			issue: PromptIssue,
			event: React.MouseEvent,
		) => {
			const rect = event.currentTarget.getBoundingClientRect();
			onIssueClick(issue, {
				x: rect.left,
				y: rect.bottom + 4,
			});
		};

		// Create highlighted text with underlines
		const renderTextWithUnderlines = () => {
			if (!text || issues.length === 0) {
				return null;
			}

			const parts: Array<{
				text: string;
				issue?: PromptIssue;
			}> = [];

			let lastIndex = 0;
			const sortedIssues = [...issues].sort((a, b) => a.start - b.start);

			sortedIssues.forEach((issue) => {
				// Add text before issue
				if (issue.start > lastIndex) {
					parts.push({
						text: text.substring(lastIndex, issue.start),
					});
				}

				// Add issue text
				parts.push({
					text: text.substring(issue.start, issue.end),
					issue,
				});

				lastIndex = issue.end;
			});

			// Add remaining text
			if (lastIndex < text.length) {
				parts.push({ text: text.substring(lastIndex) });
			}

			return parts.map((part, idx) =>
				part.issue ? (
					// biome-ignore lint/a11y/useSemanticElements: <explanation>
					<span
						// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
						key={idx}
						className={cn(
							"relative inline-block cursor-pointer",
							getSeverityStyles(part.issue.severity),
							part.issue.severity === Severity.CRITICAL &&
								"hover:bg-[rgba(254,226,226,0.5)]",
							part.issue.severity === Severity.MEDIUM &&
								"hover:bg-[rgba(254,249,195,0.5)]",
							part.issue.severity === Severity.LOW &&
								"hover:bg-[rgba(219,234,254,0.5)]",
						)}
						onClick={(e) => handleIssueClick(part.issue!, e)}
						data-testid={`prompt-assist-underline-${part.issue.id}`}
						role="button"
						aria-label={`Issue: ${part.issue.message}`}
						style={{ paddingBottom: "2px" }}
						tabIndex={0}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								handleIssueClick(
									part.issue!,
									e as unknown as React.MouseEvent,
								);
							}
						}}
					>
						{part.text}
					</span>
				) : (
					// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
					<span key={idx}>{part.text}</span>
				),
			);
		};

		return (
			<div
				className="pointer-events-none absolute inset-0 select-none overflow-hidden whitespace-pre-wrap break-words p-3 text-transparent"
				style={{
					fontFamily: "inherit",
					fontSize: "inherit",
					lineHeight: "inherit",
					letterSpacing: "inherit",
				}}
				aria-hidden="true"
			>
				<div className="pointer-events-auto">
					{renderTextWithUnderlines()}
				</div>
			</div>
		);
	},
);
