import {
	Code,
	FileText,
	GitCommitHorizontal,
	type LucideIcon,
	ScrollText,
	Trash2,
	Webhook,
} from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	InlineCode,
	Muted,
	Small,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";

const HOOK_KIND_ICONS: Record<string, LucideIcon> = {
	pixel: Code,
	git_commit: GitCommitHorizontal,
	log_tools: ScrollText,
	ppt_to_pdf: FileText,
};

/** Icon for a hook kind; unknown kinds get a generic hook icon. */
export const getAgentHookIcon = (kind: string): LucideIcon =>
	HOOK_KIND_ICONS[kind] ?? Webhook;

/**
 * Translated name and description for a hook kind. Unknown kinds (new
 * backend kinds the UI does not know yet) fall back to their raw id and no
 * description.
 */
export const useAgentHookCopy = () => {
	const { t } = useTranslation("agent");
	return {
		getLabel: (kind: string) =>
			t(`hooks.kinds.${kind}.label`, { defaultValue: kind }),
		getDescription: (kind: string) =>
			t(`hooks.kinds.${kind}.description`, { defaultValue: "" }),
	};
};

export interface AgentHookHeaderProps {
	/** The hook's kind id, e.g. "git_commit". */
	kind: string;
	/** Removes the hook. Omit in view mode. */
	onRemove?: () => void;
}

/** Icon, readable name, raw kind id and description for one agent hook. */
export const AgentHookHeader = ({ kind, onRemove }: AgentHookHeaderProps) => {
	const { t } = useTranslation("agent");
	const { getLabel, getDescription } = useAgentHookCopy();
	const Icon = getAgentHookIcon(kind);
	const label = getLabel(kind);
	const description = getDescription(kind);

	return (
		<div className="flex items-start gap-3">
			<div className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-border bg-muted">
				<Icon aria-hidden="true" className="size-4" />
			</div>
			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				<div className="flex flex-wrap items-center gap-2">
					<Small>{label}</Small>
					{label !== kind && (
						<InlineCode className="py-0 text-xs">{kind}</InlineCode>
					)}
				</div>
				{description && (
					<Muted className="font-normal text-xs">{description}</Muted>
				)}
			</div>
			{onRemove && (
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							aria-label={t("hooks.remove", { label })}
							onClick={onRemove}
						>
							<Trash2 aria-hidden="true" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>{t("hooks.removeTooltip")}</TooltipContent>
				</Tooltip>
			)}
		</div>
	);
};
