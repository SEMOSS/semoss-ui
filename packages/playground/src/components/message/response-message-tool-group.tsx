import { ChevronDownIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { cn } from "@semoss/ui/next";
import type { ResponseMessageStore, ToolStore } from "@/stores";
import { ResponseMessageTool } from "./response-message-tool";

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

		const closedLabel = t("tool.groupClosed", {
			toolName: tools[0].json.title,
			count: tools.length - 1,
		});

		const openLabel = t("tool.groupOpen", { count: tools.length });

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
						<ChevronDownIcon
							className={cn(
								"size-5 shrink-0 text-muted-foreground transition-transform duration-200",
								isOpen && "rotate-180",
							)}
						/>
					</div>
					<span className="truncate text-muted-foreground text-sm">
						{isOpen ? openLabel : closedLabel}
					</span>
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
