import { X } from "lucide-react";
import { type RefObject, useId, useRef } from "react";
import {
	Button,
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@semoss/ui/next";
import { restoreThreadFocus } from "@/features/collaboration/components/thread-menu.utils";
import { WorkChatSettings } from "@/features/work-thread/work-chat-settings";
import { useWorkComposerSession } from "@/features/work-thread/work-composer-state.context";
import { useWorkThread } from "@/features/work-thread/work-thread-context";

interface ChatSettingsDrawerProps {
	/** Shows this conversation's settings. */
	open: boolean;
	/** Requests a visibility change after pending saves finish. */
	onOpenChange: (open: boolean) => void;
	/** Receives focus when the drawer closes. */
	returnFocusRef?: RefObject<HTMLButtonElement | null>;
}

/** Keeps draft settings between visits while the sheet owns modal focus. */
export function ChatSettingsDrawer({
	open,
	onOpenChange,
	returnFocusRef,
}: ChatSettingsDrawerProps) {
	const descriptionId = useId();
	const previousFocus = useRef<HTMLElement | null>(null);
	const { session } = useWorkThread();
	const composer = useWorkComposerSession(session.threadId);
	return (
		<WorkChatSettings
			presentation="drawer"
			draftSession={composer}
			renderContainer={(content, isSaving) => (
				<Sheet
					open={open}
					onOpenChange={(nextOpen) => {
						if (!isSaving) onOpenChange(nextOpen);
					}}
				>
					<SheetContent
						side="right"
						showCloseButton={false}
						aria-describedby={descriptionId}
						className="w-full gap-0 p-0 sm:max-w-md"
						onOpenAutoFocus={() => {
							previousFocus.current =
								document.activeElement instanceof HTMLElement
									? document.activeElement
									: null;
						}}
						onCloseAutoFocus={(event) => {
							event.preventDefault();
							restoreThreadFocus(
								returnFocusRef?.current ??
									previousFocus.current,
							);
						}}
						onEscapeKeyDown={(event) => {
							if (isSaving) event.preventDefault();
						}}
						onInteractOutside={(event) => {
							if (isSaving) event.preventDefault();
						}}
					>
						<SheetHeader className="shrink-0 flex-row items-start gap-3 border-b">
							<div className="min-w-0 flex-1 space-y-1">
								<SheetTitle>Chat settings</SheetTitle>
								<SheetDescription>
									<span id={descriptionId}>
										Choose how the assistant responds in
										this chat.
									</span>
								</SheetDescription>
							</div>
							<SheetClose asChild>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="size-11 shrink-0"
									aria-label="Close settings"
									disabled={isSaving}
								>
									<X aria-hidden="true" />
								</Button>
							</SheetClose>
						</SheetHeader>
						{content}
					</SheetContent>
				</Sheet>
			)}
		/>
	);
}
