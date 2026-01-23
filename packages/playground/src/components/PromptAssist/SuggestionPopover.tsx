import { AlertCircle, Lightbulb, Sparkles, Zap } from "lucide-react";
import { observer } from "mobx-react-lite";
import {
	Badge,
	Button,
	cn,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@semoss/ui/next";
import { type IssueType, type PromptIssue, Severity } from "./types";

interface SuggestionPopoverProps {
	issue: PromptIssue | null;
	open: boolean;
	onClose: () => void;
	onApply: (issue: PromptIssue) => void;
	anchorPosition?: { x: number; y: number };
}

export const SuggestionPopover = observer<SuggestionPopoverProps>(
	({ issue, open, onClose, onApply, anchorPosition }) => {
		if (!issue) return null;

		const getIcon = () => {
			switch (issue.severity) {
				case Severity.CRITICAL:
					return <AlertCircle className="h-4 w-4 text-red-500" />;
				case Severity.MEDIUM:
					return <Lightbulb className="h-4 w-4 text-yellow-500" />;
				case Severity.LOW:
					return <Zap className="h-4 w-4 text-blue-400" />;
			}
		};

		const getBadgeVariant = (): "destructive" | "default" | "secondary" => {
			switch (issue.severity) {
				case Severity.CRITICAL:
					return "destructive";
				case Severity.MEDIUM:
					return "default";
				case Severity.LOW:
					return "secondary";
			}
		};

		const getTypeLabel = (type: IssueType): string => {
			return type.replace(/_/g, " ").toUpperCase();
		};

		return (
			<Popover
				open={open}
				onOpenChange={(isOpen) => !isOpen && onClose()}
			>
				<PopoverTrigger asChild>
					<div
						className="pointer-events-none fixed"
						style={{
							left: anchorPosition?.x ?? 0,
							top: anchorPosition?.y ?? 0,
							width: 1,
							height: 1,
						}}
					/>
				</PopoverTrigger>
				<PopoverContent
					className="w-96 p-0"
					data-testid="prompt-assist-popover"
					side="bottom"
					align="start"
					sideOffset={4}
				>
					<div className="space-y-4 p-4">
						{/* Header */}
						<div className="flex items-start gap-3">
							<div className="mt-0.5">{getIcon()}</div>
							<div className="min-w-0 flex-1">
								<div className="mb-1 flex items-center gap-2">
									<h4 className="truncate font-semibold text-sm">
										{getTypeLabel(issue.type)}
									</h4>
									<Badge
										variant={getBadgeVariant()}
										className="shrink-0 text-xs"
									>
										{issue.severity}
									</Badge>
								</div>
								<p className="text-muted-foreground text-xs leading-relaxed">
									{issue.message}
								</p>
							</div>
						</div>

						{/* Suggestion */}
						<div className="space-y-2">
							<div className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs">
								<Sparkles className="h-3 w-3" />
								<span>Suggested improvement</span>
							</div>
							<div className="rounded-lg border border-border bg-muted/50 p-3">
								<p className="text-sm leading-relaxed">
									{issue.suggestion}
								</p>
							</div>
						</div>

						{/* Impact Badge */}
						{issue.impact && (
							<div className="flex items-center gap-2">
								<span className="text-muted-foreground text-xs">
									Expected impact:
								</span>
								<Badge
									variant="outline"
									className={cn(
										"text-xs",
										issue.impact === "high" &&
											"border-green-500 text-green-700",
										issue.impact === "medium" &&
											"border-blue-500 text-blue-700",
										issue.impact === "low" &&
											"border-gray-500 text-gray-700",
									)}
								>
									{issue.impact}
								</Badge>
							</div>
						)}

						{/* Actions */}
						<div className="flex gap-2 pt-2">
							<Button
								size="sm"
								onClick={() => onApply(issue)}
								className="flex-1"
								data-testid="prompt-assist-apply-btn"
							>
								Apply Fix
							</Button>
							<Button
								size="sm"
								variant="outline"
								onClick={onClose}
								data-testid="prompt-assist-dismiss-btn"
							>
								Dismiss
							</Button>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		);
	},
);
