import { Sparkles } from "lucide-react";
import { useState } from "react";
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
import { type StyleSaveRequest, useStyleSave } from "../live/use-style-save";
import type { Profile, StyleProposal } from "../state/collaboration.types";
import { ResetStyleDialog } from "./reset-style-dialog";
import { StyleForm } from "./style-form";
import { isEmptyStyleDraft, type StyleDraft } from "./style-form-values";

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
	const learning = useStyleLearning();
	const save = useStyleSave();
	const [actionError, setActionError] = useState<string | null>(null);
	const { style } = profile;
	const proposal = style.pending ?? null;

	/** Runs a save the owner asked for; failures reach the form that asked, or the alert for a button. */
	const run = async (
		request: StyleSaveRequest,
		successMessage: string,
	): Promise<void> => {
		setActionError(null);
		await save(request, successMessage);
	};
	const runFromButton = async (
		request: StyleSaveRequest,
		successMessage: string,
	): Promise<void> => {
		try {
			await run(request, successMessage);
		} catch (cause: unknown) {
			setActionError(
				cause instanceof Error
					? cause.message
					: "Unable to save your style",
			);
		}
	};

	const resetRequest: StyleSaveRequest = {
		summary: "",
		examples: [],
		variants: {},
		source: "learned",
		confirmed: false,
		clearProposal: true,
	};
	const resetStyle = (): Promise<void> =>
		runFromButton(resetRequest, "Writing style reset");
	// nothing left to agree to means no style, not an empty confirmed one
	const confirmProposal = (draft: StyleDraft): Promise<void> =>
		isEmptyStyleDraft(draft)
			? run(resetRequest, "Writing style reset")
			: run(
					{
						...draft,
						source: "learned",
						confirmed: true,
						clearProposal: true,
					},
					"Writing style confirmed and saved",
				);
	const discardProposal = (): Promise<void> =>
		runFromButton(
			{
				summary: style.summary,
				examples: style.examples,
				variants: style.variants ?? {},
				source: style.source,
				confirmed: style.confirmed,
				clearProposal: true,
			},
			"Proposal discarded",
		);
	const saveStyle = (draft: StyleDraft): Promise<void> =>
		isEmptyStyleDraft(draft)
			? run(resetRequest, "Writing style reset")
			: run(
					{ ...draft, source: "you", confirmed: true },
					"Writing style saved",
				);
	const hasStyle =
		style.confirmed ||
		!!proposal ||
		!!style.summary.trim() ||
		style.examples.length > 0 ||
		Object.keys(style.variants ?? {}).length > 0;

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
				{hasStyle && <ResetStyleDialog onReset={resetStyle} />}
			</div>
			{actionError && (
				<Alert variant="destructive">
					<AlertDescription>{actionError}</AlertDescription>
				</Alert>
			)}
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
						key={`proposal-${JSON.stringify([proposal.learnedAt, proposal.summary, proposal.examples, proposal.variants])}`}
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
						key={`style-${JSON.stringify([style.summary, style.examples, style.variants, style.confirmed, style.learnedAt])}`}
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
