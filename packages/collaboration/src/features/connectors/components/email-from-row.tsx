import { Info, UserRound } from "lucide-react";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { EmailAddressRow } from "@/features/email/email-address-row";

/** Outlook owns the sender identity; the application login is not a mailbox identity. */
export function EmailFromRow() {
	return (
		<EmailAddressRow label="From">
			<span className="inline-flex min-h-8 items-center gap-2">
				<UserRound
					className="size-4 text-muted-foreground"
					aria-hidden="true"
				/>
				Your Outlook account
			</span>
			<Tooltip disableHoverableContent={false}>
				<TooltipTrigger asChild>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						className="pointer-coarse:size-11 size-8 text-muted-foreground"
						aria-label="About the sender account"
					>
						<Info className="size-4" aria-hidden="true" />
					</Button>
				</TooltipTrigger>
				<TooltipContent className="max-w-64">
					Uses your connected Microsoft account. Review or change the
					sender in Outlook.
				</TooltipContent>
			</Tooltip>
		</EmailAddressRow>
	);
}
