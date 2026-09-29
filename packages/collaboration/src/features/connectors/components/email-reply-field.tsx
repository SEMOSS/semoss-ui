import { Info, Reply, ReplyAll } from "lucide-react";
import { useId } from "react";
import {
	Button,
	FormField,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Small,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	useFormContext,
} from "@semoss/ui/next";
import { EmailAddressRow } from "@/features/email/email-address-row";
import type { EmailDraftValues } from "../api/email-draft-values";

export interface EmailReplyContext {
	/** Source identity for display only; Outlook still resolves native reply recipients. */
	name?: string;
	address?: string;
}

/** A familiar reply selector bound to the existing native reply-all field. */
export function EmailReplyField({
	disabled,
	context,
}: {
	disabled: boolean;
	context?: EmailReplyContext;
}) {
	const { control } = useFormContext<EmailDraftValues>();
	const id = useId();
	return (
		<FormField
			control={control}
			name="replyAll"
			render={({ field }) => (
				<div className="border-border/60 border-b">
					<EmailAddressRow label="To">
						<div className="flex min-w-0 flex-1 basis-40 flex-col gap-1 py-1">
							<span className="break-words font-medium">
								{context?.name ||
									context?.address ||
									"Original sender"}
							</span>
							{context?.name && context.address && (
								<Small className="break-all text-muted-foreground">
									{context.address}
								</Small>
							)}
						</div>
						<Select
							value={field.value ? "all" : "sender"}
							onValueChange={(value) =>
								field.onChange(value === "all")
							}
							disabled={disabled}
						>
							<SelectTrigger
								ref={field.ref}
								onBlur={field.onBlur}
								aria-label="Reply recipients"
								aria-describedby={field.value ? id : undefined}
								className="h-9 pointer-coarse:min-h-11 w-fit gap-2 border-0 bg-muted/50 shadow-none"
							>
								{field.value ? (
									<ReplyAll
										className="size-4"
										aria-hidden="true"
									/>
								) : (
									<Reply
										className="size-4"
										aria-hidden="true"
									/>
								)}
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="sender">Reply</SelectItem>
								<SelectItem value="all">Reply all</SelectItem>
							</SelectContent>
						</Select>
						<Tooltip disableHoverableContent={false}>
							<TooltipTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									className="pointer-coarse:size-11 size-8 text-muted-foreground"
									aria-label="About reply recipients"
								>
									<Info
										className="size-4"
										aria-hidden="true"
									/>
								</Button>
							</TooltipTrigger>
							<TooltipContent className="max-w-64">
								Outlook sets final recipients from the original
								email. Review them before sending.
							</TooltipContent>
						</Tooltip>
					</EmailAddressRow>
					{field.value && (
						<Small id={id} className="pb-3 text-muted-foreground">
							Includes the original To and Cc recipients,
							including people excluded from assistant context.
						</Small>
					)}
				</div>
			)}
		/>
	);
}
