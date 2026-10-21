import { EyeIcon, EyeOffIcon } from "lucide-react";
import {
	Toggle,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";

interface AssistantAgentResourcesToggleProps {
	/** The settings list whose agent-provided entries can be hidden. */
	resource: "tools" | "skills";
	/** Whether the agent-provided entries are currently visible. */
	isVisible: boolean;
	/** Updates presentation without changing the agent's resources. */
	onVisibleChange: (isVisible: boolean) => void;
}

/** A compact visibility control shared by the tool and skill settings lists. */
export const AssistantAgentResourcesToggle = ({
	resource,
	isVisible,
	onVisibleChange,
}: AssistantAgentResourcesToggleProps) => (
	<Tooltip disableHoverableContent={false}>
		<TooltipTrigger asChild>
			<Toggle
				type="button"
				size="sm"
				className="shrink-0 text-muted-foreground"
				aria-label={`Hide agent ${resource}`}
				pressed={!isVisible}
				onPressedChange={(isHidden) => onVisibleChange(!isHidden)}
			>
				{isVisible ? (
					<EyeIcon className="size-3.5" aria-hidden="true" />
				) : (
					<EyeOffIcon className="size-3.5" aria-hidden="true" />
				)}
			</Toggle>
		</TooltipTrigger>
		<TooltipContent>
			{isVisible ? "Hide" : "Show"} agent {resource}
		</TooltipContent>
	</Tooltip>
);
