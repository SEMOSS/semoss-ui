import {
	CheckIcon,
	ChevronDownIcon,
	CirclePause,
	HammerIcon,
	XCircleIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { cn, Spinner } from "@semoss/ui/next";
import { useLoadingMessage } from "@/hooks";
import type { ResponseMessageStore, ToolStore } from "@/stores";
import { ResponseMessageTool } from "./response-message-tool";

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

const analyzeTools = (tools: ToolStore[]) => {
	const counts = {
		SUCCESS: 0,
		LOADING: 0,
		ERROR: 0,
		CANCELLED: 0,
		PAUSED: 0,
		INITIAL: 0,
	};
	const loadingOptions: string[] = [];

	for (const tool of tools) {
		counts[tool.status] = (counts[tool.status] ?? 0) + 1;
		if (
			tool.status === "LOADING" &&
			tool.json._meta.SMSS_MCP_UI?.loadingMessage
		) {
			loadingOptions.push(tool.json._meta.SMSS_MCP_UI.loadingMessage);
		}
	}

	let status: keyof typeof groupStatusConfig = "SUCCESS";
	if (counts.LOADING > 0) status = "LOADING";
	else if (counts.ERROR > 0) status = "ERROR";
	else if (counts.PAUSED > 0) status = "PAUSED";
	else if (counts.CANCELLED === tools.length) status = "CANCELLED";

	return { status, counts, loadingOptions };
};

interface ResponseMessageToolGroupProps {
	/** Message to render */
	message: ResponseMessageStore;

	/** Tools to group */
	tools: ToolStore[];
}

export const ResponseMessageToolGroup: React.FC<ResponseMessageToolGroupProps> =
	observer(({ message, tools }) => {
		const { t } = useTranslation("tool");
		const [isOpen, setIsOpen] = useState(false);

		const { status, counts, loadingOptions } = analyzeTools(tools);
		const { icon } = groupStatusConfig[status];
		const isLoading = status === "LOADING";

		const { loadingMessage } = useLoadingMessage(isLoading, loadingOptions);

		const summaryParts = [
			counts.SUCCESS > 0 &&
				counts.SUCCESS < tools.length &&
				t("group.summaryCompleted", { count: counts.SUCCESS }),
			counts.ERROR > 0 &&
				t("group.summaryError", { count: counts.ERROR }),
			counts.CANCELLED > 0 &&
				t("group.summaryCancelled", { count: counts.CANCELLED }),
			counts.PAUSED > 0 &&
				t("group.summaryPaused", { count: counts.PAUSED }),
		].filter((s): s is string => Boolean(s));

		return (
			<div
				className={cn(
					"flex flex-col overflow-hidden rounded-lg border border-border bg-sidebar",
				)}
			>
				{/* Header toggle */}
				<button
					type="button"
					className="flex w-full cursor-pointer items-center gap-3 p-2 text-start transition-colors hover:bg-accent"
					onClick={() => setIsOpen((prev) => !prev)}
				>
					<div className="flex size-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground">
						{isOpen ? <HammerIcon className="size-5" /> : icon}
					</div>
					<span className="-ms-1.5 truncate text-muted-foreground text-sm">
						{isOpen
							? t("group.labelOpen", { count: tools.length })
							: t("group.labelClosed", {
									toolName: tools[0].json.title,
									count: tools.length - 1,
								})}
					</span>
					{isLoading && !isOpen && loadingMessage && (
						<span className="shrink-0 text-muted-foreground text-sm italic">
							{loadingMessage}
						</span>
					)}
					<ChevronDownIcon
						className={cn(
							"ms-auto me-1 size-5 shrink-0 text-muted-foreground transition-transform duration-200",
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
						<div className="flex flex-col gap-1 border-border border-t bg-background p-2">
							<div className="flex flex-col gap-2 p-2">
								{tools.map((tool) => (
									<ResponseMessageTool
										key={tool.id}
										message={message}
										tool={tool}
									/>
								))}
							</div>
							{summaryParts.length > 0 && (
								<span className="ps-2 text-muted-foreground text-sm">
									{summaryParts.join(" · ")}
								</span>
							)}
						</div>
					</div>
				</div>
			</div>
		);
	});
