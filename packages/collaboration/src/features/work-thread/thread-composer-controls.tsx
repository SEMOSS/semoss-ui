import { MailPlus, Sparkles } from "lucide-react";
import { type Engine, EngineSelect } from "@semoss/shared";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Small,
} from "@semoss/ui/next";

export type ThreadComposerMode = "assistant" | "draft";

interface ThreadComposerControlsProps {
	assistantOnly?: boolean;
	mode: ThreadComposerMode;
	onModeChange: (mode: ThreadComposerMode) => void;
	hasSourceEmail: boolean;
	isModeLocked: boolean;
	modelId: string;
	modelName: string;
	isModelLocked: boolean;
	onModelChange: (model: Engine) => void;
}

/** Compact destination and model controls belonging to the message being composed. */
export function ThreadComposerControls({
	mode,
	assistantOnly = false,
	onModeChange,
	hasSourceEmail,
	isModeLocked,
	modelId,
	modelName,
	isModelLocked,
	onModelChange,
}: ThreadComposerControlsProps) {
	return (
		<div className="flex min-w-0 flex-wrap items-center gap-1 px-2 pt-2">
			{!assistantOnly && (
				<Select
					value={mode}
					disabled={isModeLocked}
					onValueChange={(value) => {
						if (value === "assistant" || value === "draft")
							onModeChange(value);
					}}
				>
					<SelectTrigger
						aria-label="Message mode"
						className="min-h-11 pointer-coarse:min-h-11 w-auto gap-2 rounded-full border-0 bg-transparent px-3 text-xs shadow-none hover:bg-primary/5 sm:min-h-8"
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent align="start">
						<SelectItem value="assistant">
							<Sparkles className="size-4" aria-hidden="true" />
							Ask Assistant
						</SelectItem>
						<SelectItem value="draft" disabled={!hasSourceEmail}>
							<MailPlus className="size-4" aria-hidden="true" />
							Draft
						</SelectItem>
					</SelectContent>
				</Select>
			)}
			{mode === "assistant" ? (
				<fieldset
					className="m-0 min-w-0 max-w-52 flex-1 border-0 p-0"
					aria-label="Assistant model"
				>
					<EngineSelect
						className="h-auto min-h-11 pointer-coarse:min-h-11 w-full gap-1 rounded-full border-0 bg-transparent px-3 py-1 text-xs shadow-none hover:bg-primary/5 sm:min-h-8"
						value={modelId}
						name={modelName || "Choose model"}
						disabled={isModelLocked}
						engineTypes={["MODEL"]}
						metaFilters={[{ tag: "text-generation" }]}
						showEngineIcon={false}
						onChange={onModelChange}
						popoverContentProps={{ align: "start" }}
					/>
				</fieldset>
			) : (
				<Small className="px-2 text-muted-foreground">
					Reply to original sender
				</Small>
			)}
		</div>
	);
}
