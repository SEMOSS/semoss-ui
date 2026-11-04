import { InfoIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";

/** Props for {@link SectionInfoTooltip}. */
export interface SectionInfoTooltipProps {
	/** The name of what it explains, such as a section's title. */
	label: string;
	/** The explanation. */
	children: string;
}

/**
 * An info button beside a heading that explains the section in a tooltip, so
 * the section itself carries no paragraph of copy. Focusable, so the
 * explanation is there for keyboard users too.
 */
export const SectionInfoTooltip = ({
	label,
	children,
}: SectionInfoTooltipProps) => {
	const { t } = useTranslation("chatTools");
	return (
		<Tooltip disableHoverableContent={false}>
			<TooltipTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					className="shrink-0"
					aria-label={t("panel.aboutSection", { section: label })}
				>
					<InfoIcon
						aria-hidden="true"
						className="size-4 text-muted-foreground"
					/>
				</Button>
			</TooltipTrigger>
			<TooltipContent className="max-w-64 text-wrap text-xs">
				{children}
			</TooltipContent>
		</Tooltip>
	);
};
