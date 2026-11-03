import { UsageLimitGuideButton } from "@semoss/shared";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@semoss/ui/next";
import { UsageLimitPathPanel } from "./usage-limit-path-panel";
import type { UsageLimitPathRequest } from "./use-usage-limit-path";

export interface UsageLimitPathSheetProps {
	/** Whose path to show on which model, or null to keep the sheet closed */
	request: UsageLimitPathRequest | null;
	/** The sheet's title, such as "How Limits Apply to Eli on GPT-5" */
	title: string;
	/** What the sheet shows, under the title */
	description?: string;
	/** Called when the sheet closes */
	onClose: () => void;
}

/**
 * A side sheet with how usage limits apply to one person on a model, step by
 * step, with each rule's use and when it resets. Read only; Refresh reads it
 * again.
 */
export const UsageLimitPathSheet = ({
	request,
	title,
	description,
	onClose,
}: UsageLimitPathSheetProps) => (
	<Sheet
		open={request !== null}
		onOpenChange={(isOpen) => {
			if (!isOpen) {
				onClose();
			}
		}}
	>
		<SheetContent className="w-full overflow-y-auto sm:max-w-xl">
			<SheetHeader className="pb-0">
				<SheetTitle className="wrap-break-word pe-8">
					{title}
				</SheetTitle>
				{description ? (
					<SheetDescription>{description}</SheetDescription>
				) : null}
			</SheetHeader>
			<UsageLimitPathPanel
				request={request}
				className="px-4 pb-6"
				actions={
					request ? (
						<UsageLimitGuideButton
							isOwnView={request.person === undefined}
							viewer={
								request.admin
									? { isAdminMode: true }
									: undefined
							}
						/>
					) : null
				}
			/>
		</SheetContent>
	</Sheet>
);
