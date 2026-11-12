import { useTranslation } from "@semoss/i18n";
import { Badge, Muted, Small } from "@semoss/ui/next";
import type { ChatToolParameter } from "../tools/chat-tool-info";

/** Props for {@link ChatToolDetails}. */
interface ChatToolDetailsProps {
	/** What the model calls. */
	name: string;
	/** What the model is told the tool does. */
	description: string;
	/** The arguments the tool takes. */
	parameters: ChatToolParameter[];
}

/**
 * What the model is told about one tool: the name it calls, what the tool
 * does, and the arguments it takes. Indented to line up with a row's title,
 * past its chevron.
 */
export const ChatToolDetails = ({
	name,
	description,
	parameters,
}: ChatToolDetailsProps) => {
	const { t } = useTranslation("chatTools");
	return (
		<div className="flex flex-col gap-3 ps-10 pe-3 pb-3">
			<code className="break-all text-muted-foreground text-xs">
				{name}
			</code>
			{description ? (
				<Muted className="font-normal">{description}</Muted>
			) : null}
			<div className="flex flex-col gap-1.5">
				<Small>{t("details.parameters")}</Small>
				{parameters.length === 0 ? (
					<Muted className="font-normal">
						{t("details.noParameters")}
					</Muted>
				) : (
					<ul className="flex flex-col gap-1.5">
						{parameters.map((parameter) => (
							<li
								key={parameter.name}
								className="flex min-w-0 flex-col gap-0.5"
							>
								<span className="flex min-w-0 items-center gap-2">
									<code className="break-all text-xs">
										{parameter.name}
									</code>
									{parameter.isRequired ? (
										<Badge
											variant="outline"
											className="shrink-0"
										>
											{t("details.required")}
										</Badge>
									) : null}
								</span>
								{parameter.description ? (
									<Muted className="font-normal">
										{parameter.description}
									</Muted>
								) : null}
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
};
