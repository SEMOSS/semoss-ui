import { SquareArrowOutUpRightIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useRoot } from "@/hooks";
import type { MCP } from "@/types";

const PLATFORM_URL = import.meta.env.VITE_PLATFORM_URL
	? import.meta.env.VITE_PLATFORM_URL
	: "";

interface InputMessageBadgeProps {
	/** MCP to render */
	mcp: MCP;
}

export const InputMessageBadge: React.FC<InputMessageBadgeProps> = observer(
	({ mcp }) => {
		const { root } = useRoot();
		return (
			<span
				title={`${mcp.type} - ${mcp.id}`}
				className={
					"inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs"
				}
			>
				{mcp.name}

				{root.theme.showPlatformLinks !== false && (
					<a
						target="_blank"
						href={`${PLATFORM_URL}/#/${mcp.type === "PROJECT" ? "app" : "engine"}/${mcp.id}`}
					>
						<SquareArrowOutUpRightIcon className="size-2.5" />
					</a>
				)}
			</span>
		);
	},
);
