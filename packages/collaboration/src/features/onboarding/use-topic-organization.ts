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
import {
	askTopicReview,
	draftWithChatChange,
	type ReviewChatMessage,
	type ReviewChatReply,
	reviewDraft,
	type TopicReviewDraft,
	topicClues,
} from "./topic-review-api";
import type { useTopicReviewChanges } from "./use-topic-review-changes";
import type { useTopicReviewDraft } from "./use-topic-review-draft";

interface TopicOrganizationController {
	chatMessages: ReviewChatMessage[];
	chatReply: ReviewChatReply | null;
	chatStates: Record<number, "used" | "dismissed" | "stale">;
	chatError: string | null;
	isChatting: boolean;
	isChatStale: boolean;
	chatCombination: {
		index: number;
		proposal: TopicOrganizationProposal;
	} | null;
	sendChat: (text: string) => Promise<boolean>;
	acceptChatChange: (index: number) => Promise<void>;
	dismissChatChange: (index: number) => void;
	openChatPreview: (
		groups: TopicOrganizationGroup[],
		revision?: number,
	) => Promise<boolean>;
	closeChatCombination: () => void;
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
	const [chatMessages, setChatMessages] = useState<ReviewChatMessage[]>([]);
	const [chatReply, setChatReply] = useState<ReviewChatReply | null>(null);
	const [chatStates, setChatStates] = useState<
		Record<number, "used" | "dismissed" | "stale">
	>({});
	const [chatError, setChatError] = useState<string | null>(null);
	const [isChatting, setIsChatting] = useState(false);
	const [chatCombination, setChatCombination] = useState<{
		index: number;
		proposal: TopicOrganizationProposal;
	} | null>(null);
	const chatKeys = useRef<string[]>([]);
	const previewChatIndex = useRef<number | null>(null);
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

	const sendChat = async (text: string): Promise<boolean> => {
		if (
			!isCurrent() ||
			inFlight.current ||
			changes.isChanging ||
			changes.error ||
			!text.trim()
		)
			return false;
		inFlight.current = true;
		setIsChatting(true);
		setChatError(null);
		try {
			const saved = await controller.flushDraft(form.getValues());
			if (!isCurrent()) return false;
			const messages: ReviewChatMessage[] = [
				...chatMessages,
				{ role: "owner", text: text.trim().slice(0, 4000) },
			];
			const reply = await askTopicReview(actions, saved, messages);
			if (!isCurrent()) return false;
			setChatMessages([
				...messages,
				{ role: "assistant", text: reply.reply },
			]);
			setChatReply(reply);
			setChatStates({});
			chatKeys.current = reply.changes.map(
				() => `added-${crypto.randomUUID()}`,
			);
			return true;
		} catch (cause: unknown) {
			if (isCurrent()) setChatError(message(cause));
			return false;
		} finally {
			inFlight.current = false;
			if (isCurrent()) setIsChatting(false);
		}
	};
	const acceptChatChange = async (index: number): Promise<void> => {
		if (
			!isCurrent() ||
			inFlight.current ||
			changes.isChanging ||
			changes.error ||
			!chatReply ||
			chatStates[index]
		)
			return;
		setChatError(null);
		if (
			controller.status !== "saved" ||
			controller.review.revision !== chatReply.revision ||
			JSON.stringify(form.getValues()) !==
				JSON.stringify(reviewDraft(controller.review))
		) {
			setChatError(
				"Your topics changed since these proposals. Ask again with the updated draft.",
			);
			return;
		}
		const change = chatReply.changes[index];
		if (!change) return;
		if (change.type === "combine") {
			const topics = controller.review.draft.topics.filter((topic) =>
				change.topicKeys.includes(topic.key),
			);
			if (topics.some((topic) => !topic.keep || topic.mergedIntoKey)) {
				setChatError(
					"Keep these topics separately before previewing their combination.",
				);
				return;
			}
			const target = topics.find((topic) => topic.accepted) ?? topics[0];
			if (!target) return;
			const beforeCount = controller.review.draft.topics.filter(
				(topic) => topic.keep && !topic.mergedIntoKey,
			).length;
			setChatCombination({
				index,
				proposal: {
					reviewId,
					revision: chatReply.revision,
					beforeCount,
					proposedCount: beforeCount - topics.length + 1,
					questions: [],
					groups: [
						{
							topicKeys: change.topicKeys,
							targetKey: target.key,
							name: change.name || target.name,
							description:
								change.description || target.description,
							terms: topicClues(
								[
									...topics.map((topic) => topic.terms),
									...change.addTerms,
								].join("\n"),
							).join("\n"),
							reason: change.reason || "Combine related topics",
						},
					],
				},
			});
			return;
		}
		inFlight.current = true;
		try {
			const draft = draftWithChatChange(
				controller.review,
				change,
				chatKeys.current[index],
			);
			const changed = await changes.saveDraft(draft, chatReply.revision);
			if (!changed || !isCurrent()) return;
			setChatStates((states) => {
				const next = { ...states, [index]: "used" as const };
				chatReply.changes.forEach((other, i) => {
					if (
						i !== index &&
						!next[i] &&
						change.topicKey &&
						(other.topicKey === change.topicKey ||
							other.topicKeys.includes(change.topicKey))
					)
						next[i] = "stale";
				});
				return next;
			});
			setChatReply({ ...chatReply, revision: changed.revision });
		} catch (cause: unknown) {
			if (isCurrent()) setChatError(message(cause));
		} finally {
			inFlight.current = false;
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
		if (previewChatIndex.current !== null) {
			const index = previewChatIndex.current;
			setChatStates((states) => ({ ...states, [index]: "used" }));
			setChatCombination(null);
			previewChatIndex.current = null;
		}
		setPreview(null);
		setError(null);
	};

	return {
		chatMessages,
		chatReply,
		chatStates,
		chatError,
		isChatting,
		chatCombination,
		isChatStale:
			!!chatReply &&
			(controller.status !== "saved" ||
				controller.review.revision !== chatReply.revision),
		sendChat,
		acceptChatChange,
		dismissChatChange: (index) =>
			setChatStates((states) => ({ ...states, [index]: "dismissed" })),
		openChatPreview: async (groups, revision) => {
			const opened = await openPreview(groups, revision);
			if (opened)
				previewChatIndex.current = chatCombination?.index ?? null;
			return opened;
		},
		closeChatCombination: () => {
			if (!isOpening) setChatCombination(null);
		},
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
			if (!changes.isChanging) {
				setPreview(null);
				previewChatIndex.current = null;
			}
		},
	};
}
