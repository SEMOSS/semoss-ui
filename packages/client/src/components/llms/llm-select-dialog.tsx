import { X } from "lucide-react";
import { observer } from "mobx-react-lite";
import {
	Button,
	DialogDescription,
	DialogTitle,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";

interface LLMSelectDialogProps {
	/** List of LLMs to select from */
	llmList: Record<string, string>[];
	/** Id of the selected LLM */
	selectedLLM: string;
	/** Method called when a LLM is selected */
	onSelect: (id: string) => void;
	/** Method called to close dialog */
	onClose: () => void;
}

/**
 * TODO: If you dont pass llmList make call to get all models
 */
export const LLMSelectDialog = observer((props: LLMSelectDialogProps) => {
	const {
		llmList,
		selectedLLM,
		onSelect = () => null,
		onClose = () => null,
	} = props;

	return (
		<>
			<div className="flex flex-row items-center justify-between border-border border-b p-4">
				<div className="space-y-1">
					<DialogTitle className="font-medium text-base leading-6">
						Builder model
					</DialogTitle>
					<DialogDescription>
						Choose the model used for builder assistance.
					</DialogDescription>
				</div>
				<Tooltip disableHoverableContent={false}>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="close"
							onClick={onClose}
						>
							<X className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent
						sideOffset={4}
						className="max-w-xs break-words"
					>
						{"close"}
					</TooltipContent>
				</Tooltip>
			</div>
			<div className="p-4">
				<Select
					value={selectedLLM}
					onValueChange={(value) => {
						onSelect(value);
						onClose();
					}}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Select model">
							{llmList.find((l) => l.value === selectedLLM)
								?.label ?? "Select model"}
						</SelectValue>
					</SelectTrigger>
					<SelectContent>
						{llmList.map((llm) => (
							<SelectItem
								key={llm.value}
								value={llm.value}
								className="items-start"
							>
								<span className="flex flex-col">
									<span>{llm.label}</span>
									<span className="text-muted-foreground text-xs">
										id: {llm.value}
									</span>
								</span>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</>
	);
});
