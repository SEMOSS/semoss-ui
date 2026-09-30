import { ArrowLeftIcon } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { H4, ScrollArea } from "@semoss/ui/next";
import { ConnectorIconButton } from "./connector-icon-button";

/** One labelled value under an open item's heading, such as its sender. */
export interface ConnectorDetailField {
	label: string;
	value: string;
}

/** Props for {@link ConnectorDetailView}. */
export interface ConnectorDetailViewProps {
	/** The item's subject or name. */
	title: string;
	/** Goes back to the list. */
	onBack: () => void;
	/** The back button's label, such as `Back to Inbox`. */
	backLabel: string;
	/** Labelled values under the heading. Empty values are left out. */
	fields?: ConnectorDetailField[];
	/** The item's actions, drawn above its content. */
	actions?: ReactNode;
	/** The item's content: its text, attachments, or replies. */
	children?: ReactNode;
}

/**
 * An opened email, thread, chat, or event, in place of the viewer's list.
 *
 * Opening moves focus to the heading, so keyboard and screen reader users
 * land in what they opened.
 */
export const ConnectorDetailView = ({
	title,
	onBack,
	backLabel,
	fields = [],
	actions,
	children,
}: ConnectorDetailViewProps) => {
	const headingRef = useRef<HTMLHeadingElement>(null);
	const shownFields = fields.filter((field) => field.value.trim() !== "");

	useEffect(() => {
		headingRef.current?.focus();
	}, []);

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="flex min-h-10 min-w-0 shrink-0 items-center gap-2 border-border border-b bg-muted/30 px-2 py-1">
				<ConnectorIconButton
					icon={ArrowLeftIcon}
					isDirectional
					label={backLabel}
					onClick={onBack}
				/>
				<H4
					ref={headingRef}
					tabIndex={-1}
					className="min-w-0 flex-1 truncate font-medium text-sm outline-none"
					title={title}
				>
					{title}
				</H4>
			</div>
			{actions ? (
				<div className="shrink-0 border-border border-b bg-muted/20 px-3 py-1.5">
					{actions}
				</div>
			) : null}
			{/* block, not the scroll area's table, so long text wraps to the
			    panel's width instead of widening it */}
			<ScrollArea className="[&>div>div]:block! min-h-0 flex-1">
				<div className="flex flex-col gap-4 p-3">
					{shownFields.length > 0 ? (
						<dl className="flex flex-col gap-1 text-sm">
							{shownFields.map((field) => (
								<div
									key={field.label}
									className="flex min-w-0 gap-2"
								>
									<dt className="shrink-0 text-muted-foreground">
										{field.label}
									</dt>
									<dd className="wrap-anywhere min-w-0">
										{field.value}
									</dd>
								</div>
							))}
						</dl>
					) : null}
					{children}
				</div>
			</ScrollArea>
		</div>
	);
};
