import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "@semoss/ui/next";
import { StyledTooltip } from "../prompt.styled";
import type { Builder } from "../prompt.types";
import { PromptLibraryDialog } from "./PromptLibraryDialog";

export const PromptLibraryDialogButton = (props: {
	disabled: boolean;
	builder: Builder;
}) => {
	const [promptLibraryOpen, setPromptLibraryOpen] = useState(false);

	const closePromptLibrary = () => {
		setPromptLibraryOpen(false);
	};

	return (
		<>
			{props.disabled ? (
				<StyledTooltip
					title={
						<p className="w-full p-2 text-base">
							Add a name and select an LLM to browse
						</p>
					}
				>
					<span>
						<Button
							disabled
							variant="ghost"
						>
							Browse Prompt Templates
							<ExternalLink className="ml-2 h-4 w-4" />
						</Button>
					</span>
				</StyledTooltip>
			) : (
				<Button
					onClick={() => setPromptLibraryOpen(true)}
					variant="ghost"
				>
					Browse Prompt Templates
					<ExternalLink className="ml-2 h-4 w-4" />
				</Button>
			)}
			<PromptLibraryDialog
				builder={props.builder}
				promptLibraryOpen={promptLibraryOpen}
				closePromptLibrary={closePromptLibrary}
			/>
		</>
	);
};
