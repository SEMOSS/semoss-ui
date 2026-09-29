import { ChevronDown, Mail } from "lucide-react";
import type { ReactNode } from "react";
import { Avatar, AvatarFallback, H3, P, Small } from "@semoss/ui/next";
import { dateLabel } from "@/features/collaboration/date-label";
import { EmailAddressRow } from "./email-address-row";

interface EmailMessageHeaderProps {
	/** Display metadata only; callers retain source identity and available actions. */
	subject: string;
	name?: string;
	address?: string;
	at?: string;
	to?: string[];
	cc?: string[];
	status?: ReactNode;
	actions?: ReactNode;
	/** Optional Work identity; other mail surfaces retain their default avatar. */
	avatar?: ReactNode;
}

/** A compact mail envelope with complete address details one click away. */
export function EmailMessageHeader({
	subject,
	name,
	address,
	at,
	to = [],
	cc = [],
	status,
	actions,
	avatar,
}: EmailMessageHeaderProps) {
	const sender = name || address;
	const initials = sender
		?.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((word) => word[0])
		.join("")
		.toUpperCase();
	const recipients = to.length ? to : cc;
	const additional = to.length + cc.length - 1;
	return (
		<header className="min-w-0 space-y-4 border-border border-b pb-4">
			<div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
				<H3 className="min-w-0 flex-1 break-words text-xl leading-snug">
					{subject || "Untitled email"}
				</H3>
				{status && (
					<div className="flex max-w-full flex-wrap items-center gap-2">
						{status}
					</div>
				)}
			</div>
			<div className="flex min-w-0 items-start gap-3">
				{avatar ?? (
					<Avatar className="size-9 shrink-0" aria-hidden="true">
						<AvatarFallback className="bg-muted text-muted-foreground">
							{initials || <Mail className="size-4" />}
						</AvatarFallback>
					</Avatar>
				)}
				<div className="min-w-0 flex-1">
					<div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
						<P className="min-w-0 break-words font-medium text-sm">
							<span className="mr-2 font-normal text-muted-foreground">
								From
							</span>
							<span>{sender || "Your Outlook account"}</span>
						</P>
						{at && (
							<Small className="text-muted-foreground">
								<time dateTime={at}>{dateLabel(at)}</time>
							</Small>
						)}
					</div>
					{address && address !== name && name && (
						<Small className="mt-1 break-all text-muted-foreground">
							{address}
						</Small>
					)}
					{recipients.length > 0 && (
						<details className="group min-w-0">
							<summary className="flex min-h-9 pointer-coarse:min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg text-sm hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
								<span className="text-muted-foreground">
									{to.length ? "To" : "Cc"}
								</span>
								<span className="min-w-0 truncate text-muted-foreground">
									{recipients[0]}
								</span>
								{additional > 0 && (
									<span className="shrink-0 rounded-md bg-muted px-1.5 text-muted-foreground text-xs">
										+{additional}
									</span>
								)}
								<span className="sr-only">Recipients</span>
								<ChevronDown
									className="size-3.5 shrink-0 text-muted-foreground group-open:rotate-180"
									aria-hidden="true"
								/>
							</summary>
							<div className="mt-1 border-border/60 border-t">
								{to.length > 0 && (
									<EmailAddressRow label="To">
										{to.map((value, index) => (
											<span
												key={`${index}:${value}`}
												className="max-w-full break-all rounded-md bg-muted/50 px-2 py-1"
											>
												{value}
											</span>
										))}
									</EmailAddressRow>
								)}
								{cc.length > 0 && (
									<EmailAddressRow label="Cc">
										{cc.map((value, index) => (
											<span
												key={`${index}:${value}`}
												className="max-w-full break-all rounded-md bg-muted/50 px-2 py-1"
											>
												{value}
											</span>
										))}
									</EmailAddressRow>
								)}
							</div>
						</details>
					)}
				</div>
			</div>
			{actions && (
				<div className="flex flex-wrap items-center gap-2">
					{actions}
				</div>
			)}
		</header>
	);
}
