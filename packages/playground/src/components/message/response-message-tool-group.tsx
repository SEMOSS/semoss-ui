import {
	CheckIcon,
	ChevronDownIcon,
	HammerIcon,
	XCircleIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { cn, Spinner } from "@semoss/ui/next";
import type { ToolStore } from "@/stores";
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
		INITIAL: 0,
	};

	// "Resolving" (the call is still streaming in, or in the gap before the
	// final sync) is distinct from status LOADING (the call is done, the tool is
	// executing). Both drive the same spinner, but the header copy differs.
	let isResolving = false;

	tools.forEach((tool) => {
		if (!tool.isResolved) isResolving = true;
		counts[tool.status] = (counts[tool.status] ?? 0) + 1;
	});

	let status: keyof typeof groupStatusConfig = "SUCCESS";
	if (counts.LOADING > 0) status = "LOADING";
	else if (counts.CANCELLED > 0) status = "CANCELLED";
	else if (counts.ERROR > 0) status = "ERROR";

	return { status, counts, isResolving };
};

export interface ResponseMessageToolGroupProps {
	/** Tools to group */
	tools: ToolStore[];
}

export const ResponseMessageToolGroup = observer(
	({ tools }: ResponseMessageToolGroupProps) => {
		const { t } = useTranslation("tool");
		const [isOpen, setIsOpen] = useState(false);

		const { status, counts, isResolving } = analyzeTools(tools);
		// While still resolving, tools sit at INITIAL (which would otherwise
		// resolve to the SUCCESS check) — force the spinner instead.
		const icon = isResolving ? <Spinner /> : groupStatusConfig[status].icon;

		// Once every call has resolved, some tools can still be running
		// (LOADING) or queued/awaiting a decision (INITIAL) while others have
		// already settled — a distinct state from "all done".
		const settledCount = counts.SUCCESS + counts.ERROR + counts.CANCELLED;
		const inProgressCount = counts.LOADING + counts.INITIAL;

		const summaryParts = [
			counts.SUCCESS > 0 &&
				t("group.summaryCompleted", { count: counts.SUCCESS }),
			counts.ERROR > 0 &&
				t("group.summaryError", { count: counts.ERROR }),
			counts.CANCELLED > 0 &&
				t("group.summaryCancelled", { count: counts.CANCELLED }),
			inProgressCount > 0 &&
				t("group.summaryLoading", { count: inProgressCount }),
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
						{inProgressCount > 0
							? settledCount > 0
								? t("group.labelPartial", {
										count: settledCount,
										loadingCount: inProgressCount,
									})
								: t("group.labelStreaming", {
										count: tools.length,
									})
							: isOpen
								? t("group.labelOpen", {
										count: tools.length,
									})
								: t("group.labelClosed", {
										toolName: tools[0].displayName,
										count: tools.length - 1,
									})}
					</span>
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
	},
);
