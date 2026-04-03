import { CheckIcon, ChevronRightIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { cn } from "@semoss/ui/next";
import type { ResponseMessageStore, ToolStore } from "@/stores";
import { ResponseMessageTool } from "./response-message-tool";

interface ResponseMessageToolGroupProps {
	/** Message to render */
	message: ResponseMessageStore;

	/** Completed tools to group */
	tools: ToolStore[];
}

export const ResponseMessageToolGroup: React.FC<ResponseMessageToolGroupProps> =
	observer(({ message, tools }) => {
		const [isOpen, setIsOpen] = useState(false);
		const firstTool = tools[0];
		const remaining = tools.length - 1;

		return (
			<div className="flex flex-col">
				{/* Header row */}
				<div className="flex items-center gap-1 pr-0">
					<button
						type="button"
						className="flex items-center gap-1.5 p-1 pr-0 text-left"
						onClick={() => setIsOpen((prev) => !prev)}
					>
						{isOpen ? (
							<span className="text-muted-foreground text-xs leading-normal">
								Tools ({tools.length})
							</span>
						) : (
							<>
								<CheckIcon className="size-3.5 shrink-0 text-muted-foreground" />
								<span className="text-muted-foreground text-xs leading-normal">
									{firstTool?.json.title}
									{remaining > 0 && (
										<span className="opacity-70">
											{" "}
											+ {remaining} more
										</span>
									)}
								</span>
							</>
						)}
					</button>

					{/* Growing line */}
					<div className="mx-1 h-px flex-1 self-center bg-border/40" />

					{/* Chevron toggle */}
					<button
						type="button"
						className="shrink-0 p-1 text-muted-foreground opacity-60 hover:opacity-100"
						onClick={() => setIsOpen((prev) => !prev)}
					>
						<ChevronRightIcon
							className={cn(
								"size-3.5 transition-transform duration-200",
								isOpen && "rotate-90",
							)}
						/>
					</button>
				</div>

				{/* Expanded tool list — animates open/close via grid-rows */}
				<div
					className={cn(
						"grid transition-[grid-template-rows] duration-200 ease-in-out",
						isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
					)}
				>
					<div className="overflow-hidden">
						<div className="flex flex-col">
							{tools.map((tool) => (
								<ResponseMessageTool
									key={tool.id}
									message={message}
									tool={tool}
								/>
							))}
						</div>
					</div>
				</div>
			</div>
		);
	});
