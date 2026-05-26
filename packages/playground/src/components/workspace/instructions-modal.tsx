import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Textarea,
} from "@semoss/ui/next";

interface InstructionsModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;

	/** Current value (raw). */
	value: string;

	/** When true: read-only view. When false: editable. */
	readOnly?: boolean;

	/** Required when not readOnly: writes back as the user types. */
	onChange?: (next: string) => void;

	/** Disable input (e.g. while saving). */
	disabled?: boolean;
}

/**
 * Expanded view / editor for an agent's instructions (system prompt).
 *
 * - readOnly: pre-formatted text in a scroll area + Close button.
 * - editable: full-height Textarea bound live to `onChange`,
 *   character count in the footer, Done button to dismiss.
 */
export const InstructionsModal = ({
	open,
	onOpenChange,
	value,
	readOnly = false,
	onChange,
	disabled = false,
}: InstructionsModalProps) => {
	const { t } = useTranslation(["workspace", "common"]);
	const normalized = (value || "").replace(/\\n/g, "\n");
	const hasContent = normalized.trim().length > 0;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex h-[85vh] w-full flex-col gap-4 sm:max-w-[60rem]">
				<DialogHeader>
					<DialogTitle>
						{readOnly
							? t("workspace:instructions.viewTitle")
							: t("workspace:instructions.editTitle")}
					</DialogTitle>
					<DialogDescription>
						{readOnly
							? t("workspace:instructions.viewDescription")
							: t("workspace:instructions.editDescription")}
					</DialogDescription>
				</DialogHeader>

				<div className="min-h-0 flex-1 overflow-hidden">
					{readOnly ? (
						hasContent ? (
							<div className="h-full overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-4 font-mono text-foreground text-sm">
								{normalized}
							</div>
						) : (
							<div className="flex h-full items-center justify-center rounded-md border border-border border-dashed bg-muted/20 p-4 text-muted-foreground text-sm italic">
								{t("workspace:detail.about.noInstructions")}
							</div>
						)
					) : (
						<Textarea
							value={normalized}
							disabled={disabled}
							onChange={(e) => onChange?.(e.target.value)}
							placeholder={t(
								"common:placeholders.enterInstructions",
							)}
							className="h-full max-h-full resize-none font-mono text-sm"
							data-testid="instructions-modal--textarea"
						/>
					)}
				</div>

				<DialogFooter className="items-center justify-between sm:justify-between">
					<span className="text-muted-foreground text-xs">
						{t("workspace:instructions.charCount", {
							count: normalized.length.toLocaleString(),
						})}
					</span>
					<Button type="button" onClick={() => onOpenChange(false)}>
						{t("common:buttons.close")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
