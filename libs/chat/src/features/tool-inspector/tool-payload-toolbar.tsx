import {
	CopyIcon,
	Maximize2Icon,
	SearchIcon,
	WrapTextIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "@semoss/i18n";
import { Button, toast } from "@semoss/ui/next";
import { copyTextToClipboard } from "@semoss/utility/clipboard";

interface ToolPayloadToolbarProps {
	/** Format label or the Pretty / Raw selector. */
	children: ReactNode;
	/** Always copy the complete payload, including collapsed fields. */
	text: string;
	onFind?: () => void;
	isFindReady?: boolean;
	onWrap?: () => void;
	isWrapped?: boolean;
	onExpand?: (trigger: HTMLButtonElement) => void;
}

/** Compact actions shared by formatted inputs and raw payloads. */
export const ToolPayloadToolbar = ({
	children,
	text,
	onFind,
	isFindReady,
	onWrap,
	isWrapped,
	onExpand,
}: ToolPayloadToolbarProps) => {
	const { t } = useTranslation("tool");
	return (
		<div className="flex shrink-0 flex-wrap items-center justify-between gap-1 border-b bg-muted/40 px-2 py-1">
			{children}
			<div className="flex items-center gap-0.5">
				{onFind && (
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="size-8"
						disabled={!isFindReady}
						aria-label={t("inspector.find")}
						title={t("inspector.find")}
						onClick={onFind}
					>
						<SearchIcon aria-hidden className="size-3.5" />
					</Button>
				)}
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="size-8"
					aria-label={t("inspector.copy")}
					title={t("inspector.copy")}
					onClick={() =>
						copyTextToClipboard(text, {
							onSuccess: () =>
								toast.success(t("inspector.copied")),
							onError: () =>
								toast.error(t("inspector.copyFailed")),
						})
					}
				>
					<CopyIcon aria-hidden className="size-3.5" />
				</Button>
				{onWrap && (
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="size-8"
						aria-label={t("inspector.wrap")}
						title={t("inspector.wrap")}
						aria-pressed={isWrapped}
						onClick={onWrap}
					>
						<WrapTextIcon aria-hidden className="size-3.5" />
					</Button>
				)}
				{onExpand && (
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="size-8"
						aria-label={t("actions.expand")}
						data-tool-expand
						title={t("actions.expand")}
						onClick={(event) => onExpand(event.currentTarget)}
					>
						<Maximize2Icon aria-hidden className="size-3.5" />
					</Button>
				)}
			</div>
		</div>
	);
};
