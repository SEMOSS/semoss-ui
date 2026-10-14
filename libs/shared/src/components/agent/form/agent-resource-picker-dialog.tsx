import { Plus } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@semoss/ui/next";

/** Strips a shared selector's own card chrome so it fills the dialog body. */
export const EMBEDDED_SELECTOR_CLASS_NAME =
	"min-h-0 flex-1 rounded-none border-0 shadow-none";

export interface AgentResourcePickerDialogProps<T> {
	/** Label for the trigger button. */
	triggerLabel: string;
	/** Dialog title. */
	title: string;
	/** Dialog description. */
	description: string;
	/** Committed selection. Seeds the draft each time the dialog opens. */
	value: T;
	/** Called with the draft when the user confirms. Cancel discards the draft. */
	onApply: (value: T) => void;
	/** Renders the catalog picker bound to the draft selection. */
	children: (draft: T, setDraft: (next: T) => void) => ReactNode;
}

/**
 * Hosts a catalog selector (MCP, skill, prompt) in a dialog so the form
 * itself only lists what is attached. Edits apply on "Done"; "Cancel" or
 * dismissing leaves the committed selection untouched.
 */
export const AgentResourcePickerDialog = <T,>({
	triggerLabel,
	title,
	description,
	value,
	onApply,
	children,
}: AgentResourcePickerDialogProps<T>) => {
	const { t } = useTranslation("agent");
	const [open, setOpen] = useState(false);
	const [draft, setDraft] = useState<T>(value);

	const onOpenChange = (next: boolean) => {
		if (next) setDraft(value);
		setOpen(next);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="w-fit"
				>
					<Plus aria-hidden="true" />
					{triggerLabel}
				</Button>
			</DialogTrigger>
			<DialogContent className="h-[min(48rem,calc(100dvh-2rem))] gap-0 overflow-hidden p-0 sm:max-w-4xl">
				<DialogHeader className="border-border border-b p-6 pe-12">
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<div className="flex min-h-0 flex-1 flex-col">
					{children(draft, setDraft)}
				</div>
				<DialogFooter className="border-border border-t p-4">
					<Button
						type="button"
						variant="outline"
						onClick={() => setOpen(false)}
					>
						{t("form.picker.cancel")}
					</Button>
					<Button
						type="button"
						onClick={() => {
							onApply(draft);
							setOpen(false);
						}}
					>
						{t("form.picker.done")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
