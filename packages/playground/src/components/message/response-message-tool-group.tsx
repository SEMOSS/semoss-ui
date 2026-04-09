import {
	CheckIcon,
	ChevronDownIcon,
	CirclePause,
	XCircleIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { cn, Spinner } from "@semoss/ui/next";
import { useLoadingMessage } from "@/hooks";
import type { ResponseMessageStore, ToolStore } from "@/stores";
import { ResponseMessageTool } from "./response-message-tool";

const getGroupStatus = (tools: ToolStore[]) => {
	if (tools.some((t) => t.status === "LOADING")) return "LOADING";
	if (tools.some((t) => t.status === "ERROR")) return "ERROR";
	if (tools.some((t) => t.status === "PAUSED")) return "PAUSED";
	if (tools.every((t) => t.status === "CANCELLED")) return "CANCELLED";
	return "SUCCESS";
};

const groupStatusConfig = {
	LOADING: {
		icon: <Spinner />,
	},
	ERROR: {
		icon: <XCircleIcon className="size-5" />,
	},
	CANCELLED: {
		icon: <XCircleIcon className="size-5" />,
	},
	PAUSED: {
		icon: <CirclePause className="size-5" />,
	},
	SUCCESS: {
		icon: <CheckIcon className="size-5" />,
	},
} as const;

interface ResponseMessageToolGroupProps {
	/** Message to render */
	message: ResponseMessageStore;

	/** Tools to group */
	tools: ToolStore[];
}

export const ResponseMessageToolGroup: React.FC<ResponseMessageToolGroupProps> =
	observer(({ message, tools }) => {
		const { t } = useTranslation("chat");
		const [isOpen, setIsOpen] = useState(false);

		const groupStatus = getGroupStatus(tools);
		const { icon } = groupStatusConfig[groupStatus];
		const isLoading = groupStatus === "LOADING";

		const { loadingMessage } = useLoadingMessage(
			isLoading,
			tools
				.filter((tool) => tool.status === "LOADING")
				.flatMap((tool) =>
					tool.json._meta.SMSS_MCP_UI?.loadingMessage
						? [tool.json._meta.SMSS_MCP_UI.loadingMessage]
						: [],
				),
		);

		const label = isLoading
			? t("tool.groupLoading", {
					toolName: tools[0].json.title,
					count: tools.length - 1,
				})
			: t("tool.groupClosed", {
					toolName: tools[0].json.title,
					count: tools.length - 1,
				});

		return (
			<div
				className={cn(
					"flex flex-col overflow-hidden rounded-lg border border-border bg-sidebar",
				)}
			>
				{/* Header toggle */}
				<button
					type="button"
					className="flex w-full cursor-pointer items-center gap-3 p-2 text-left transition-colors hover:bg-accent"
					onClick={() => setIsOpen((prev) => !prev)}
				>
					<div className="flex size-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground">
						{icon}
					</div>
					<span className="-ml-1.5 truncate text-muted-foreground text-sm">
						{label}
					</span>
					{isLoading && !isOpen && loadingMessage && (
						<span className="shrink-0 text-muted-foreground text-sm italic">
							{loadingMessage}
						</span>
					)}
					<ChevronDownIcon
						className={cn(
							"ml-auto size-5 shrink-0 text-muted-foreground transition-transform duration-200",
							isOpen && "rotate-180",
						)}
					/>
				</button>

				{/* Expanded tool list — animates open/close via grid-rows */}
				<div
					className={cn(
						"grid transition-[grid-template-rows] duration-200 ease-in-out",
						isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
					)}
				>
					<div className="overflow-hidden">
						<div className="flex flex-col gap-2 px-2 pb-2">
							{tools.map((tool) => (
								<div
									key={tool.id}
									className="flex flex-col gap-2"
								>
									<ResponseMessageTool
										message={message}
										tool={tool}
									/>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		);
	});
