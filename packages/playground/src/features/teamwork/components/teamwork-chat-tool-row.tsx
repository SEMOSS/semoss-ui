import { ChevronRightIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import {
	Badge,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Muted,
	Small,
} from "@semoss/ui/next";
import type { ChatToolInfo } from "../tools/chat-tool-info";

/** Props for {@link TeamworkChatToolRow}. */
export interface TeamworkChatToolRowProps {
	/** The tool. */
	tool: ChatToolInfo;
}

/**
 * One tool the assistant has: its title, the name the model calls, and
 * whether it runs on its own or asks first. Opening it shows what the model is
 * told the tool does and the arguments it takes.
 */
export const TeamworkChatToolRow = ({ tool }: TeamworkChatToolRowProps) => {
	const { t } = useTranslation("teamwork");

	return (
		<li>
			<Collapsible>
				<CollapsibleTrigger asChild>
					<button
						type="button"
						className="group flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-start hover:bg-accent focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
					>
						<ChevronRightIcon
							aria-hidden
							className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-90"
						/>
						<span className="flex min-w-0 flex-1 flex-col">
							<span className="truncate text-sm">
								{tool.title}
							</span>
							<code className="truncate text-muted-foreground text-xs">
								{tool.name}
							</code>
						</span>
						<Badge
							variant={
								tool.execution === "ask"
									? "secondary"
									: "outline"
							}
							className="shrink-0"
						>
							{tool.execution === "ask"
								? t("chatTools.asksFirst")
								: t("chatTools.runsOnItsOwn")}
						</Badge>
					</button>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<div className="flex flex-col gap-3 ps-8 pe-2 pb-3">
						{tool.description ? (
							<Muted>{tool.description}</Muted>
						) : null}
						<div className="flex flex-col gap-1.5">
							<Small className="font-medium">
								{t("chatTools.parameters")}
							</Small>
							{tool.parameters.length === 0 ? (
								<Muted>{t("chatTools.noParameters")}</Muted>
							) : (
								<ul className="flex flex-col gap-1.5">
									{tool.parameters.map((parameter) => (
										<li
											key={parameter.name}
											className="flex min-w-0 flex-col gap-0.5"
										>
											<span className="flex min-w-0 items-center gap-2">
												<code className="truncate text-xs">
													{parameter.name}
												</code>
												{parameter.isRequired ? (
													<Badge
														variant="outline"
														className="shrink-0"
													>
														{t(
															"chatTools.required",
														)}
													</Badge>
												) : null}
											</span>
											{parameter.description ? (
												<Muted>
													{parameter.description}
												</Muted>
											) : null}
										</li>
									))}
								</ul>
							)}
						</div>
					</div>
				</CollapsibleContent>
			</Collapsible>
		</li>
	);
};
