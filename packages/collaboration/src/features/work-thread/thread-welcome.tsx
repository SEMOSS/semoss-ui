import { Mail, MessageSquare, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { H2, P } from "@semoss/ui/next";

/** A small, theme-aware illustration introduces an idle thread's explicit actions. */
export function ThreadWelcome({
	children,
	hasSourceEmail = false,
}: {
	/** Explicit assistant actions for this thread. */ children: ReactNode;
	hasSourceEmail?: boolean;
}) {
	return (
		<section
			aria-label="Get started with this thread"
			className="flex min-w-0 flex-wrap items-center @md/conversation:gap-6 gap-4 py-4"
		>
			<div
				aria-hidden="true"
				className="relative @md/conversation:h-20 h-14 @md/conversation:w-24 w-16 shrink-0"
			>
				<span className="absolute top-0 right-0 flex @md/conversation:size-12 size-8 items-center justify-center rounded-xl bg-muted text-muted-foreground">
					<MessageSquare className="@md/conversation:size-6 size-4" />
				</span>
				<span className="absolute bottom-0 left-0 flex @md/conversation:h-14 h-10 @md/conversation:w-20 w-14 items-center justify-center rounded-xl border border-primary/20 bg-background text-primary">
					<Mail className="@md/conversation:size-8 size-6" />
				</span>
				<span className="absolute right-0 bottom-0 flex @md/conversation:size-8 size-6 items-center justify-center rounded-full border border-primary/20 bg-background text-primary">
					<Sparkles className="@md/conversation:size-4 size-3" />
				</span>
			</div>
			<div className="min-w-0 flex-1 basis-48 space-y-4">
				<div className="space-y-2">
					<H2 className="font-medium text-base">
						Move this thread forward
					</H2>
					<P className="text-muted-foreground">
						{hasSourceEmail
							? "Try “Draft a short reply confirming Friday.” Review it on the right before saving to Outlook."
							: "Ask a question or plan your next step."}
					</P>
				</div>
				{children}
			</div>
		</section>
	);
}
