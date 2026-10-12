import { useEffect, useRef, useState } from "react";
import type { UseFormReturn } from "@semoss/ui/next";
import type { InsightActions } from "@/lib/pixel";
import { message } from "./onboarding-ui";
import {
	previewTopicOrganization,
	suggestTopicOrganization,
	type TopicOrganizationPreview,
	type TopicOrganizationProposal,
} from "./topic-organization-api";
import {
	type TopicOrganizationGroup,
	topicOrganizationGroupsSchema,
} from "./topic-organization-schema";
import type { TopicReviewDraft } from "./topic-review-api";
import type { useTopicReviewChanges } from "./use-topic-review-changes";
import type { useTopicReviewDraft } from "./use-topic-review-draft";

interface TopicOrganizationController {
	proposal: TopicOrganizationProposal | null;
	isProposalOpen: boolean;
	isProposalStale: boolean;
	preview: TopicOrganizationPreview | null;
	isAsking: boolean;
	isOpening: boolean;
	error: string | null;
	ask: () => Promise<void>;
	showProposal: () => void;
	closeProposal: () => void;
	openPreview: (
		groups: TopicOrganizationGroup[],
		expectedRevision?: number,
	) => Promise<boolean>;
	acceptPreview: () => Promise<void>;
	closePreview: () => void;
}

/** An optional assistant and direct combinations share autosave, typed changes and stale-owner protection. */
export function useTopicOrganization(
	actions: InsightActions,
	controller: ReturnType<typeof useTopicReviewDraft>,
	form: Pick<UseFormReturn<TopicReviewDraft>, "getValues">,
	changes: ReturnType<typeof useTopicReviewChanges>,
): TopicOrganizationController {
	const [proposal, setProposal] = useState<TopicOrganizationProposal | null>(
		null,
	);
	const [isProposalOpen, setIsProposalOpen] = useState(false);
	const [preview, setPreview] = useState<TopicOrganizationPreview | null>(
		null,
	);
	const [isAsking, setIsAsking] = useState(false);
	const [isOpening, setIsOpening] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const active = useRef(false);
	const scope = useRef({ actions, reviewId: controller.review.id });
	scope.current = { actions, reviewId: controller.review.id };
	const inFlight = useRef(false);
	const previewOrigin = useRef<number | undefined>(undefined);
	const reviewId = controller.review.id;
	useEffect(() => {
		active.current = true;
		return () => {
			active.current = false;
		};
	}, []);
	const isCurrent = (): boolean =>
		active.current &&
		scope.current.actions === actions &&
		scope.current.reviewId === reviewId;

	const ask = async (): Promise<void> => {
		if (!isCurrent() || inFlight.current || changes.error) return;
		inFlight.current = true;
		setIsAsking(true);
		setError(null);
		try {
			const saved = await controller.flushDraft(form.getValues());
			if (!isCurrent()) return;
			const proposed = await suggestTopicOrganization(actions, saved);
			if (!isCurrent()) return;
			setProposal(proposed);
			setIsProposalOpen(true);
		} catch (cause: unknown) {
			if (isCurrent()) setError(message(cause));
		} finally {
			inFlight.current = false;
			if (isCurrent()) setIsAsking(false);
		}
	};

	const openPreview = async (
		groups: TopicOrganizationGroup[],
		expectedRevision?: number,
	): Promise<boolean> => {
		if (!isCurrent() || inFlight.current || changes.error) return false;
		inFlight.current = true;
		setIsOpening(true);
		setError(null);
		try {
			const saved = await controller.flushDraft(form.getValues());
			if (!isCurrent()) return false;
			if (
				expectedRevision !== undefined &&
				saved.revision !== expectedRevision
			)
				throw new Error(
					"Your topics changed since these suggestions. Ask again using your updated context.",
				);
			const page = await previewTopicOrganization(actions, saved, groups);
			if (!isCurrent()) return false;
			previewOrigin.current = expectedRevision;
			setPreview(page);
			setIsProposalOpen(false);
			return true;
		} catch (cause: unknown) {
			if (isCurrent()) setError(message(cause));
			return false;
		} finally {
			inFlight.current = false;
			if (isCurrent()) setIsOpening(false);
		}
	};

	const acceptPreview = async (): Promise<void> => {
		if (
			!preview ||
			!isCurrent() ||
			changes.isChanging ||
			changes.error ||
			preview.groups.some((group) => !group.canApply)
		)
			return;
		if (
			controller.status !== "saved" ||
			controller.review.revision !== preview.revision
		) {
			setError(
				"Your review changed after this preview. Close it and preview the grouping again.",
			);
			return;
		}
		const changed = await changes.change({
			type: "organize",
			groups: topicOrganizationGroupsSchema.parse(preview.groups),
			scopeVersion: preview.scopeVersion,
		});
		if (!isCurrent() || !changed) return;
		if (proposal && previewOrigin.current === proposal.revision) {
			const included = new Set(
				preview.groups.flatMap((group) => group.topicKeys),
			);
			const remaining = proposal.groups.filter(
				(group) => !group.topicKeys.some((key) => included.has(key)),
			);
			const beforeCount = changed.draft.topics.filter(
				(topic) => topic.keep,
			).length;
			setProposal(
				remaining.length
					? {
							...proposal,
							groups: remaining,
							revision: changed.revision,
							beforeCount,
							proposedCount:
								beforeCount -
								remaining.reduce(
									(total, group) =>
										total + group.topicKeys.length - 1,
									0,
								),
						}
					: null,
			);
		}
		setPreview(null);
		setError(null);
	};

	return {
		proposal,
		isProposalOpen,
		preview,
		isAsking,
		isOpening,
		error,
		isProposalStale:
			!!proposal &&
			(controller.status !== "saved" ||
				proposal.revision !== controller.review.revision),
		ask,
		openPreview,
		acceptPreview,
		showProposal: () => {
			if (proposal) setIsProposalOpen(true);
		},
		closeProposal: () => {
			if (!isOpening) setIsProposalOpen(false);
		},
		closePreview: () => {
			if (!changes.isChanging) setPreview(null);
		},
	};
}
