import { Sparkles } from "lucide-react";
import {
	Alert,
	AlertDescription,
	Button,
	H3,
	P,
	Small,
	Spinner,
} from "@semoss/ui/next";
import { useStyleLearning } from "../live/use-style-learning";
import type { Profile, StyleProposal } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { StyleForm } from "./style-form";
import type { StyleDraft } from "./style-form-values";

const describeProposal = (proposal: StyleProposal): string => {
	const { emails = 0, chats = 0, windowDays = 0 } = proposal.sample ?? {};
	const from = proposal.sample
		? `Learned from ${emails} sent ${emails === 1 ? "email" : "emails"} and ${chats} chat ${chats === 1 ? "message" : "messages"} from the last ${windowDays} days. `
		: "";
	return `${from}It is not used when drafting until you confirm it.`;
};

/**
 * Review how the assistant writes as you: confirm or edit a learned proposal, edit the confirmed style, and learn
 * again from recent mail and chats. Drafts use only the confirmed style.
 */
export function StyleSettings({ profile }: { profile: Profile }) {
	const { dispatch } = useCollaborationSession();
	const learning = useStyleLearning();
	const { style } = profile;
	const proposal = style.pending ?? null;

	const confirmProposal = (draft: StyleDraft): void => {
		dispatch({
			type: "profile.save",
			target: "live",
			changes: {
				style: {
					...style,
					...draft,
					source: "learned",
					confirmed: true,
					pending: null,
				},
			},
		});
	};
	const discardProposal = (): void => {
		dispatch({
			type: "profile.save",
			target: "live",
			changes: { style: { ...style, pending: null } },
		});
	};
	const saveStyle = (draft: StyleDraft): void => {
		dispatch({
			type: "profile.save",
			target: "live",
			changes: {
				style: { ...style, ...draft, source: "you", confirmed: true },
			},
		});
	};

	return (
		<section
			className="space-y-4 border-border border-t pt-5"
			aria-label="How you write"
		>
			<div className="space-y-1">
				<H3 className="font-medium text-base">How you write</H3>
				<P className="text-base text-muted-foreground">
					Drafts use the style you confirm here. Learning reads up to
					50 emails you sent and your chat messages from the last 30
					days, and keeps nothing until you agree to it.
				</P>
			</div>
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
				<Button
					type="button"
					variant="outline"
					disabled={learning.isLearning}
					onClick={() => void learning.start()}
				>
					{learning.isLearning ? (
						<Spinner className="size-4" />
					) : (
						<Sparkles aria-hidden="true" />
					)}
					{style.confirmed || proposal
						? "Learn again from my writing"
						: "Learn from my writing"}
				</Button>
				{learning.isLearning && (
					<output className="text-muted-foreground text-sm">
						{learning.step || "Learning your style"}
					</output>
				)}
			</div>
			{learning.error && (
				<Alert variant="destructive">
					<AlertDescription>{learning.error}</AlertDescription>
				</Alert>
			)}
			{proposal ? (
				<div className="space-y-3">
					<Small className="block text-muted-foreground">
						{describeProposal(proposal)}
					</Small>
					<StyleForm
						key={`proposal-${proposal.learnedAt ?? proposal.summary}`}
						draft={proposal}
						submitLabel="Confirm this style"
						onSubmit={confirmProposal}
						secondary={
							<Button
								type="button"
								variant="outline"
								onClick={discardProposal}
							>
								Discard proposal
							</Button>
						}
					/>
				</div>
			) : (
				<div className="space-y-3">
					<Small className="block text-muted-foreground">
						{style.confirmed
							? "Confirmed. Drafts use this style."
							: "Not confirmed yet. Drafts do not use a style."}
					</Small>
					<StyleForm
						key={`style-${style.learnedAt ?? ""}-${style.confirmed}`}
						draft={{
							summary: style.summary,
							examples: style.examples,
							variants: style.variants ?? {},
						}}
						submitLabel="Save and confirm style"
						onSubmit={saveStyle}
					/>
				</div>
			)}
		</section>
	);
}
