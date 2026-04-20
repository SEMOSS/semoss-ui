import { Play } from "lucide-react";
import { useState } from "react";
import { Button } from "@semoss/ui/next";
import { StyledTooltip } from "../../prompt.styled";
import { PromptBuilderContextTestDialog } from "./prompt-builder-context-test-dialog";

export const PromptBuilderContextTestDialogButton = (props: {
	disabled: boolean;
	llm: string;
	context: string;
}) => {
	const [promptContextTestOpen, setPromptContextTestOpen] = useState(false);

	return (
		<>
			{props.disabled ? (
				<StyledTooltip
					title={
						<span className="block w-full p-2 text-sm">
							Select an LLM and add context to test your prompt
						</span>
					}
				>
					<span>
						<Button variant="outline" size="sm" disabled>
							<Play className="h-4 w-4" />
							Test Prompt
						</Button>
					</span>
				</StyledTooltip>
			) : (
				<Button
					variant="outline"
					size="sm"
					onClick={() => setPromptContextTestOpen(true)}
				>
					<Play className="h-4 w-4" />
					Test Prompt
				</Button>
			)}
			<PromptBuilderContextTestDialog
				llm={props.llm}
				context={props.context}
				open={promptContextTestOpen}
				close={() => setPromptContextTestOpen(false)}
			/>
		</>
	);
};
