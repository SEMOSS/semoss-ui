import type { ReactNode } from "react";
import { useTranslation } from "@semoss/i18n";
import { Alert, AlertDescription, Button, Spinner } from "@semoss/ui/next";

/** Props for {@link ToolApprovalActions}. */
export interface ToolApprovalActionsProps {
	/** The approve button's label, which says what runs, such as `Send`. */
	approveLabel: string;
	/**
	 * Runs the call. Without it the approve button submits the form it is in,
	 * so the form's values are checked first.
	 */
	onApprove?: () => void;
	/** Denies the call, which then does not run. */
	onDeny: () => void;
	/** Whether a decision is being made, which disables every action. */
	isBusy: boolean;
	/** Whether the approval is the decision being made, for its spinner. */
	isApproving?: boolean;
	/** Why the last decision failed. */
	error?: string | null;
	/** Operations offered in place of the call, such as Save as Draft. */
	children?: ReactNode;
}

/**
 * The decision row under a call that waits for the user: Deny, any operation
 * offered instead, and the approval, which says what runs.
 */
export const ToolApprovalActions = ({
	approveLabel,
	onApprove,
	onDeny,
	isBusy,
	isApproving = false,
	error,
	children,
}: ToolApprovalActionsProps) => {
	const { t } = useTranslation("connectors");
	return (
		<div className="flex flex-col gap-2">
			{error ? (
				<Alert variant="destructive">
					<AlertDescription className="wrap-anywhere">
						{error}
					</AlertDescription>
				</Alert>
			) : null}
			<div className="flex flex-wrap justify-end gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={isBusy}
					onClick={onDeny}
				>
					{t("toolViews.deny")}
				</Button>
				{children}
				<Button
					type={onApprove ? "button" : "submit"}
					size="sm"
					disabled={isBusy}
					onClick={onApprove}
				>
					{isApproving ? <Spinner className="size-4" /> : null}
					{approveLabel}
				</Button>
			</div>
		</div>
	);
};
