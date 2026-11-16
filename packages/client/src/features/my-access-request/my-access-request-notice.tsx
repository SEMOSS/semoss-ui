import { Clock } from "lucide-react";
import { useState } from "react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	toast,
} from "@semoss/ui/next";
import { formatLocalDateTime } from "@semoss/utility/date";
import { getErrorMessage } from "@semoss/utility/error";
import type { MyAccessRequest } from "@/api/user-access";
import { getLevelLabel } from "@/features/bulk-access-management/permission-batch";

/** Props for {@link MyAccessRequestNotice}. */
export interface MyAccessRequestNoticeProps {
	/** The user's own request that waits for an owner's decision */
	request: MyAccessRequest;
	/** What the request is for, in lowercase, such as "app" or "database" */
	noun: string;
	/** Opens the request dialog, to change the level asked for or the reason */
	onChange: () => void;
	/** Withdraws the request; rejects with the backend's reason */
	onWithdraw: () => Promise<void>;
}

/**
 * Shows the signed in user the access request they made on an engine or a
 * project that waits for its owners' decision: the level asked for, when, and
 * the reason given. The user changes it, which asks again with the new level
 * or reason, or withdraws it after a confirmation.
 */
export const MyAccessRequestNotice = ({
	request,
	noun,
	onChange,
	onWithdraw,
}: MyAccessRequestNoticeProps) => {
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [isWithdrawing, setIsWithdrawing] = useState(false);
	const [withdrawError, setWithdrawError] = useState<string | null>(null);
	const level = getLevelLabel(request.permission);
	const requestedAt = formatLocalDateTime(request.requestedAt ?? undefined);

	const handleWithdraw = async () => {
		setIsWithdrawing(true);
		setWithdrawError(null);
		try {
			await onWithdraw();
			toast.success("Your access request was withdrawn");
			setIsConfirmOpen(false);
		} catch (e: unknown) {
			setWithdrawError(
				getErrorMessage(e, "Could not withdraw your access request"),
			);
		} finally {
			setIsWithdrawing(false);
		}
	};

	return (
		<>
			<Alert>
				<Clock aria-hidden />
				<AlertTitle>You asked for {level} access</AlertTitle>
				<AlertDescription className="flex flex-col gap-3">
					<span>
						{requestedAt ? `Asked ${requestedAt}. ` : ""}
						The {noun}'s owners have not decided yet.
					</span>
					{request.comment ? (
						<span className="whitespace-pre-wrap">
							{request.comment}
						</span>
					) : null}
					<div className="flex flex-wrap gap-2">
						<Button
							type="button"
							size="sm"
							variant="outline"
							onClick={onChange}
						>
							Change Request
						</Button>
						<Button
							type="button"
							size="sm"
							variant="outline"
							onClick={() => {
								setWithdrawError(null);
								setIsConfirmOpen(true);
							}}
						>
							Withdraw Request
						</Button>
					</div>
				</AlertDescription>
			</Alert>
			<Dialog
				open={isConfirmOpen}
				onOpenChange={(isOpen) => {
					if (!isOpen && !isWithdrawing) {
						setIsConfirmOpen(false);
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="font-medium text-base leading-6">
							Withdraw Access Request
						</DialogTitle>
						<DialogDescription>
							Your request for {level} access is taken back, and
							the {noun}'s owners no longer see it. You can ask
							again at any time.
						</DialogDescription>
					</DialogHeader>
					{withdrawError ? (
						<Alert variant="destructive">
							<AlertDescription>{withdrawError}</AlertDescription>
						</Alert>
					) : null}
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							disabled={isWithdrawing}
							onClick={() => setIsConfirmOpen(false)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="destructive"
							disabled={isWithdrawing}
							onClick={handleWithdraw}
						>
							{isWithdrawing
								? "Withdrawing..."
								: "Withdraw Request"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};
