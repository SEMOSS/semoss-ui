import { useLayoutEffect, useState } from "react";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	type UseFormReturn,
} from "@semoss/ui/next";
import type { EmailDraftValues } from "../api/email-draft-values";
import { EmailRecipientField } from "./email-recipient-field";

/** Keep optional address fields discoverable without hiding populated or invalid recipients. */
export function EmailAddressFields({
	form,
	disabled,
}: {
	form: UseFormReturn<EmailDraftValues>;
	disabled: boolean;
}) {
	const [revealed, setRevealed] = useState({ cc: false, bcc: false });
	const [focusField, setFocusField] = useState<"cc" | "bcc" | null>(null);
	const [cc, bcc] = form.watch(["cc", "bcc"]);
	const showCc = revealed.cc || Boolean(cc || form.formState.errors.cc);
	const showBcc = revealed.bcc || Boolean(bcc || form.formState.errors.bcc);
	useLayoutEffect(() => {
		if (focusField) {
			form.setFocus(focusField);
			setFocusField(null);
		}
	}, [focusField, form]);
	return (
		<div>
			<EmailRecipientField
				name="to"
				label="To"
				disabled={disabled}
				actions={(["cc", "bcc"] as const).map((name) =>
					(name === "cc" ? showCc : showBcc) ? null : (
						<Tooltip key={name} disableHoverableContent={false}>
							<TooltipTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									className="min-h-9 pointer-coarse:min-h-11 px-2 text-muted-foreground"
									disabled={disabled}
									onClick={() => {
										setRevealed((current) => ({
											...current,
											[name]: true,
										}));
										setFocusField(name);
									}}
								>
									{name === "cc" ? "Cc" : "Bcc"}
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								{name === "cc"
									? "Add copy recipients"
									: "Add blind copy recipients"}
							</TooltipContent>
						</Tooltip>
					),
				)}
			/>
			{showCc && (
				<EmailRecipientField name="cc" label="Cc" disabled={disabled} />
			)}
			{showBcc && (
				<EmailRecipientField
					name="bcc"
					label="Bcc"
					disabled={disabled}
				/>
			)}
		</div>
	);
}
