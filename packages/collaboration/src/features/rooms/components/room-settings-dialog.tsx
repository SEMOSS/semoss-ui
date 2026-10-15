import { type RefObject, useState } from "react";
import { Dialog, DialogContent, Sheet, SheetContent } from "@semoss/ui/next";
import {
	RoomSettingsForm,
	type RoomSettingsFormProps,
} from "./room-settings-form";

interface RoomSettingsDialogProps
	extends Omit<
		RoomSettingsFormProps,
		"presentation" | "onCancel" | "onSaved" | "onSubmittingChange"
	> {
	open: boolean;
	/** Use a right-side overlay drawer for hosts that still need modal settings. */
	presentation?: "dialog" | "drawer";
	returnFocusRef: RefObject<HTMLButtonElement | null>;
	onOpenChange: (open: boolean) => void;
}

/** Modal host for the same settings form used by the room workbench. */
export function RoomSettingsDialog({
	open,
	presentation = "dialog",
	returnFocusRef,
	onOpenChange,
	...settings
}: RoomSettingsDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const isDrawer = presentation === "drawer";
	const SettingsRoot = isDrawer ? Sheet : Dialog;
	const SettingsContent = isDrawer ? SheetContent : DialogContent;
	const handleOpenChange = (nextOpen: boolean): void => {
		if (!nextOpen && isSubmitting) return;
		onOpenChange(nextOpen);
	};
	return (
		<SettingsRoot open={open} onOpenChange={handleOpenChange}>
			<SettingsContent
				className={
					isDrawer
						? "h-dvh w-full overflow-hidden p-6 motion-reduce:animate-none sm:max-w-xl"
						: "overflow-hidden sm:max-w-2xl"
				}
				showCloseButton={!isSubmitting}
				onEscapeKeyDown={(event) => {
					if (isSubmitting) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (isSubmitting) event.preventDefault();
				}}
				onCloseAutoFocus={(event) => {
					event.preventDefault();
					returnFocusRef.current?.focus();
				}}
			>
				<RoomSettingsForm
					{...settings}
					presentation="dialog"
					onCancel={() => handleOpenChange(false)}
					onSaved={() => onOpenChange(false)}
					onSubmittingChange={setIsSubmitting}
				/>
			</SettingsContent>
		</SettingsRoot>
	);
}
