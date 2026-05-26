import { X } from "lucide-react";
import { observer } from "mobx-react-lite";
import {
	Button,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";

interface LLMOverlayProps {
	/** List of LLMs to select from */
	llmList: Record<string, string>[];
	/** Id of the selected LLM */
	selectedLLM: string;
	/** Method called when a LLM is selected */
	onSelect: (id: string) => void;
	/** Method called to close overlay  */
	onClose: () => void;
}

/**
 * TODO: If you dont pass llmList make call to get all models
 */

export const LLMSelectOverlay = observer((props: LLMOverlayProps) => {
	const {
		llmList,
		selectedLLM,
		onSelect = () => null,
		onClose = () => null,
	} = props;

	return (
		<>
			<div className="flex flex-row items-center justify-between border-border border-b p-4">
				<span>Select model to use across builder</span>
				<Button
					variant="ghost"
					size="icon-sm"
					title="close"
					aria-label="close"
					onClick={onClose}
				>
					<X className="size-4" />
				</Button>
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
						{llmList.map((LLM) => (
							<SelectItem
								key={LLM.value}
								value={LLM.value}
								className="items-start"
							>
								<span className="flex flex-col">
									<span>{LLM.label}</span>
									<span className="text-muted-foreground text-xs">
										id: {LLM.value}
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
