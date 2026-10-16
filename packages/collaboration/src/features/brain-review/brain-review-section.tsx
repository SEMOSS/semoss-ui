import { type ReactNode, useRef } from "react";
import { H2, P } from "@semoss/ui/next";
import type {
	ReviewAnswer,
	ReviewQuestion,
	ReviewTopic,
} from "./brain-review-api";
import { BrainReviewQuestion } from "./brain-review-question";

interface BrainReviewSectionProps {
	children?: ReactNode;
	title: string;
	description: string;
	questions: ReviewQuestion[];
	topics: ReviewTopic[];
	isBusy: boolean;
	total?: number;
	onAnswer: (
		id: string,
		action: ReviewAnswer,
		topicId?: string,
	) => Promise<boolean>;
}
/** Groups questions by their effect and provides a stable keyboard destination after an answer. */
export function BrainReviewSection({
	children,
	title,
	description,
	questions,
	topics,
	isBusy,
	total,
	onAnswer,
}: BrainReviewSectionProps) {
	const heading = useRef<HTMLHeadingElement>(null);
	return (
		<section
			aria-label={title}
			className="min-w-0 border-b last:border-b-0"
		>
			<div className="space-y-1 px-4 py-4 md:px-6">
				<H2
					ref={heading}
					tabIndex={-1}
					className="text-lg focus-visible:outline-2 focus-visible:outline-ring"
				>
					{title}
				</H2>
				<P className="text-muted-foreground text-sm">{description}</P>
				{total !== undefined && (
					<P className="text-muted-foreground text-sm">
						Showing {questions.length} of {total} questions
					</P>
				)}
			</div>
			{children}
			{questions.length === 0 ? (
				<P className="px-4 pb-4 text-muted-foreground text-sm md:px-6">
					{total && total > 0
						? "Questions in this section have not loaded yet. Use Load more questions below."
						: "No questions to review here."}
				</P>
			) : (
				questions.map((question) => (
					<BrainReviewQuestion
						key={question.id}
						question={question}
						topics={topics}
						isBusy={isBusy}
						onAnswer={async (action, topicId) => {
							const saved = await onAnswer(
								question.id,
								action,
								topicId,
							);
							if (saved) heading.current?.focus();
							return saved;
						}}
					/>
				))
			)}
		</section>
	);
}
