import { Play } from "lucide-react";
import { useState } from "react";
import { Button } from "@semoss/ui/next";
import { StyledTooltip } from "../../prompt.styled";
import { PromptBuilderContextTestDialog } from "./PromptBuilderContextTestDialog";

export const PromptBuilderContextTestDialogButton = (props: {
	disabled: boolean;
	llm: string;
	context: string;
}) => {
	const [promptContextTestOpen, setPromptContextTestOpen] = useState(false);

	const closePromptContextTest = () => {
		setPromptContextTestOpen(false);
	};

	return (
		<>
			{props.disabled ? (
				<StyledTooltip
					title={
						<p className="w-full p-2 text-base">
							Select an LLM and add context to test your prompt
						</p>
					}
				>
					<span>
						<Button
							variant="ghost"
							size="sm"
							disabled
						>
							<Play className="mr-2 h-4 w-4" />
							Test Prompt
						</Button>
					</span>
				</StyledTooltip>
			) : (
				<Button
					variant="ghost"
					size="sm"
					onClick={() => setPromptContextTestOpen(true)}
				>
					<Play className="mr-2 h-4 w-4" />
					Test Prompt
				</Button>
			)}
			<PromptBuilderContextTestDialog
				llm={props.llm}
				context={props.context}
				open={promptContextTestOpen}
				close={closePromptContextTest}
			/>
		</>
	);
};
