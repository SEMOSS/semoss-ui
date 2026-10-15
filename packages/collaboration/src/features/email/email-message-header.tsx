import { ChevronDown, Mail } from "lucide-react";
import type { ReactNode } from "react";
import {
	Avatar,
	AvatarFallback,
	ButtonGroup,
	cn,
	H3,
	P,
	Small,
} from "@semoss/ui/next";
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
	/** Hide envelope details while retaining the message identity and tools. */
	isExpanded?: boolean;
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
	isExpanded = true,
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
		<header
			className={cn(
				"min-w-0 space-y-2",
				isExpanded && "border-border/60 border-b pb-2",
			)}
		>
			<div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
				<div className="flex min-w-0 flex-1 basis-48 flex-wrap items-center gap-2">
					<H3 className="min-w-0 break-words font-medium text-base leading-normal">
						{subject || "Untitled email"}
					</H3>
					{status}
				</div>
				{actions && (
					<ButtonGroup
						aria-label="Email actions"
						className="max-w-full flex-wrap items-center"
					>
						{actions}
					</ButtonGroup>
				)}
			</div>
			<div className="flex min-w-0 items-start gap-2">
				{avatar ?? (
					<Avatar className="size-8 shrink-0" aria-hidden="true">
						<AvatarFallback className="bg-muted text-muted-foreground">
							{initials || <Mail className="size-4" />}
						</AvatarFallback>
					</Avatar>
				)}
				<div className="min-w-0 flex-1">
					<div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
						<P className="min-w-0 break-words font-medium text-base">
							<span>{sender || "Your Outlook account"}</span>
							{address && address !== name && name && (
								<span className="ml-2 break-all font-normal text-muted-foreground">
									&lt;{address}&gt;
								</span>
							)}
						</P>
						{at && (
							<Small className="text-base text-muted-foreground">
								<time dateTime={at}>{dateLabel(at)}</time>
							</Small>
						)}
					</div>
					{recipients.length > 0 && (
						<details hidden={!isExpanded} className="group min-w-0">
							<summary className="flex min-h-8 pointer-coarse:min-h-11 cursor-pointer list-none items-center gap-2 rounded-md text-base hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
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
									className="size-4 shrink-0 text-muted-foreground group-open:rotate-180"
									aria-hidden="true"
								/>
							</summary>
							<div className="mt-1 border-border/60 border-t">
								{to.length > 0 && (
									<EmailAddressRow label="To">
										{to.map((value, index) => (
											<span
												key={`${index}:${value}`}
												className="max-w-full break-all py-1"
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
												className="max-w-full break-all py-1"
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
		</header>
	);
}
