import { Sparkles } from "lucide-react";
import {
	Button,
	FormSelect,
	FormTextarea,
	H3,
	P,
	SelectItem,
	Spinner,
} from "@semoss/ui/next";
import { Failure } from "./onboarding-ui";

interface TopicOrganizationContextProps {
	isBusy: boolean;
	isAsking: boolean;
	hasProposal: boolean;
	error: string | null;
	onAsk: () => void;
	onShowProposal: () => void;
	triggerId: string;
}

/** The owner's organizing context belongs to setup, alongside an optional assistant. */
export function TopicOrganizationContext({
	isBusy,
	isAsking,
	hasProposal,
	error,
	onAsk,
	onShowProposal,
	triggerId,
}: TopicOrganizationContextProps) {
	return (
		<section
			aria-labelledby={`${triggerId}-heading`}
			className="space-y-4 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-6"
		>
			<H3 id={`${triggerId}-heading`} className="text-lg">
				How do you organize your work?
			</H3>
			<P className="text-muted-foreground text-sm">
				Describe the projects, clients or areas that matter to you. The
				assistant can align overlapping suggestions and propose a
				smaller starting set.
			</P>
			<FormTextarea
				name="guidance"
				label="Give the assistant some context (optional)"
				rows={3}
				maxLength={6000}
				disabled={isBusy}
				placeholder={
					"Recruiting: working with John M and Taylor J; UNC and VCU emails.\nBank client A: Jim and Hank Z; client A delivery threads."
				}
			/>
			<FormSelect
				name="granularity"
				label="How broad should your topics be?"
				disabled={isBusy}
			>
				<SelectItem value="broad">
					Broad areas — a small starting set
				</SelectItem>
				<SelectItem value="projects">
					Individual projects and clients
				</SelectItem>
				<SelectItem value="detailed">More detailed topics</SelectItem>
			</FormSelect>
			<div className="flex flex-wrap gap-2">
				<Button
					id={triggerId}
					type="button"
					variant="outline"
					disabled={isBusy}
					onClick={onAsk}
				>
					{isAsking ? (
						<Spinner className="size-4" />
					) : (
						<Sparkles aria-hidden="true" />
					)}
					{isAsking
						? "Thinking through your topics…"
						: "Suggest a better grouping"}
				</Button>
				{hasProposal && (
					<Button
						type="button"
						variant="ghost"
						disabled={isBusy}
						onClick={onShowProposal}
					>
						Review suggested groups
					</Button>
				)}
			</div>
			<P className="text-muted-foreground text-xs">
				You choose what to keep. Suggestions become draft changes only
				after you review them.
			</P>
			{error && <Failure error={error} />}
		</section>
	);
}
