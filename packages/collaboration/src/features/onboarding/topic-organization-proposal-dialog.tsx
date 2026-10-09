import { useEffect, useState } from "react";
import {
	Button,
	DialogFooter,
	Form,
	P,
	Spinner,
	useFieldArray,
	useForm,
	zodResolver,
} from "@semoss/ui/next";
import { Failure } from "./onboarding-ui";
import type { TopicOrganizationProposal } from "./topic-organization-api";
import { TopicOrganizationGroupEditor } from "./topic-organization-group-editor";
import {
	type TopicOrganizationProposalValues,
	topicOrganizationProposalFormSchema,
} from "./topic-organization-proposal-form";
import {
	type TopicOrganizationGroup,
	topicOrganizationGroupsSchema,
} from "./topic-organization-schema";
import type { TopicDraft } from "./topic-review-api";
import { TopicReviewDialog } from "./topic-review-dialog";

interface TopicOrganizationProposalDialogProps {
	proposal: TopicOrganizationProposal;
	topics: TopicDraft[];
	isBusy: boolean;
	isStale: boolean;
	error: string | null;
	triggerId: string;
	onPreview: (
		groups: TopicOrganizationGroup[],
		revision: number,
	) => Promise<boolean>;
	onClose: () => void;
}

/** Read and edit the assistant's grouping choices before requesting an authoritative impact preview. */
export function TopicOrganizationProposalDialog({
	proposal,
	topics,
	isBusy,
	isStale,
	error,
	triggerId,
	onPreview,
	onClose,
}: TopicOrganizationProposalDialogProps) {
	const form = useForm<TopicOrganizationProposalValues>({
		resolver: zodResolver(topicOrganizationProposalFormSchema),
		defaultValues: {
			groups: proposal.groups.map((group) => ({
				...group,
				selected: true,
			})),
		},
	});
	const { fields } = useFieldArray({ control: form.control, name: "groups" });
	const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
	const [focusRequest, setFocusRequest] = useState<{
		index: number;
		field: "name" | "description" | "terms" | "topicKeys" | "targetKey";
	} | null>(null);
	const values = form.watch("groups");
	const selected = values.filter((group) => group.selected);
	const afterCount =
		proposal.beforeCount -
		selected.reduce(
			(total, group) => total + Math.max(0, group.topicKeys.length - 1),
			0,
		);
	useEffect(() => {
		if (focusRequest !== null) {
			form.setFocus(`groups.${focusRequest.index}.${focusRequest.field}`);
			setFocusRequest(null);
		}
	}, [focusRequest, form]);
	const handleSubmit = async (
		values: TopicOrganizationProposalValues,
	): Promise<void> => {
		await onPreview(
			topicOrganizationGroupsSchema.parse(
				values.groups.filter((group) => group.selected),
			),
			proposal.revision,
		);
	};
	return (
		<TopicReviewDialog
			title="Suggested topic groups"
			description="These proposals use your work context and email examples. Keep the groups that fit, edit their scope, or leave the suggestions separate."
			isBusy={isBusy}
			triggerId={triggerId}
			onClose={onClose}
		>
			<P className="font-medium">
				Your selection: {proposal.beforeCount} topics → {afterCount}{" "}
				topics
			</P>
			{proposal.questions.length > 0 && (
				<div className="space-y-2">
					<P className="font-medium text-sm">
						Context that would help
					</P>
					<ul className="list-disc space-y-1 pl-6 text-sm">
						{proposal.questions.map((question) => (
							<li key={question}>{question}</li>
						))}
					</ul>
				</div>
			)}
			{isStale && (
				<output className="block text-sm text-warning">
					Your setup changed since these suggestions. Close this view
					and ask again with your updated context.
				</output>
			)}
			<Form
				form={form}
				onSubmit={handleSubmit}
				onError={(validation) => {
					const index = values.findIndex(
						(_, item) => validation.groups?.[item],
					);
					if (index >= 0) {
						const issue = validation.groups?.[index];
						const field = issue?.name
							? "name"
							: issue?.terms
								? "terms"
								: issue?.topicKeys
									? "topicKeys"
									: issue?.targetKey
										? "targetKey"
										: "description";
						setExpandedIndex(index);
						setFocusRequest({ index, field });
					}
				}}
				noValidate
				aria-busy={isBusy}
				className="space-y-4"
			>
				{fields.map((field, index) => (
					<TopicOrganizationGroupEditor
						key={field.id}
						index={index}
						original={proposal.groups[index]}
						topics={topics}
						isExpanded={index === expandedIndex}
						isBusy={isBusy}
						onToggle={() =>
							setExpandedIndex(
								index === expandedIndex ? null : index,
							)
						}
					/>
				))}
				{form.formState.errors.groups?.message && (
					<P role="alert" className="text-destructive text-sm">
						{form.formState.errors.groups.message}
					</P>
				)}
				{error && <Failure error={error} />}
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						disabled={isBusy}
						onClick={onClose}
					>
						Back to topics
					</Button>
					<Button
						type="submit"
						disabled={isBusy || isStale || selected.length === 0}
					>
						{isBusy && <Spinner className="size-4" />}
						{isBusy
							? "Preparing preview…"
							: "Preview selected changes"}
					</Button>
				</DialogFooter>
			</Form>
		</TopicReviewDialog>
	);
}
