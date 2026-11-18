import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, expect, it } from "vitest";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import type {
	CollaborationState,
	FilingSignals,
} from "../state/collaboration.types";
import {
	CollaborationSessionProvider,
	useCollaborationSession,
} from "../state/collaboration-session.context";
import { ReviewCard } from "./review-card";

afterEach(cleanup);

function Links() {
	const { state } = useCollaborationSession();
	const thread = state.threads.find((t) => t.id === "th-hugo-chat");
	return (
		<output>
			{thread?.topicLinks
				.map((link) => `${link.topicId}:${link.source}`)
				.join(",")}
		</output>
	);
}

// th-hugo-chat has t-geng and t-gsales suggested; review r2 asks about it
function renderChoice(edit: (state: CollaborationState) => void) {
	const state = createInitialCollaborationState();
	edit(state);
	const review = state.reviews.find((r) => r.id === "r2");
	if (!review) throw new Error("Missing topic choice review");
	render(
		<CollaborationSessionProvider initialState={state}>
			<MemoryRouter>
				<ReviewCard review={review} />
				<Links />
			</MemoryRouter>
		</CollaborationSessionProvider>,
	);
}

it("asks a yes/no question when only one topic is a candidate", () => {
	renderChoice((state) => {
		const review = state.reviews.find((r) => r.id === "r2");
		if (review) review.candidates = ["t-gsales"];
	});
	expect(
		screen.getByRole("button", { name: "File under Northwind Sales" }),
	).toBeVisible();
	expect(screen.queryByRole("button", { name: "Both" })).toBeNull();
	expect(screen.queryByRole("button", { name: "Northwind Eng" })).toBeNull();
	fireEvent.click(screen.getByRole("button", { name: "Not this topic" }));
	// only the candidate's suggestion comes off; the other link is not this review's
	expect(screen.getByRole("status")).toHaveTextContent(/^t-geng:suggested$/);
});

it("offers both candidates, Both and Neither, and Both confirms only them", () => {
	renderChoice((state) => {
		const review = state.reviews.find((r) => r.id === "r2");
		if (review) review.candidates = ["t-geng", "t-gsales"];
		state.threads
			.find((t) => t.id === "th-hugo-chat")
			?.topicLinks.push({
				topicId: "t-trip",
				source: "suggested",
				confidence: 40,
				primary: false,
			});
	});
	expect(screen.getByRole("button", { name: "Neither" })).toBeVisible();
	fireEvent.click(screen.getByRole("button", { name: "Both" }));
	expect(screen.getByRole("status")).toHaveTextContent(
		/^t-geng:confirmed,t-gsales:confirmed,t-trip:suggested$/,
	);
});

const keywordSignals: FilingSignals = {
	keywordMatches: [{ keyword: "rate limit", field: "subject" }],
	matchedSenderIds: [],
	baseConfidence: 80,
	finalConfidence: 80,
	topicVipApplied: false,
	topicVipPoints: 0,
};

it("shows why each candidate topic was suggested", () => {
	renderChoice((state) => {
		const review = state.reviews.find((r) => r.id === "r2");
		if (review) {
			review.candidates = ["t-geng", "t-gsales"];
			review.candidateSignals = { "t-geng": keywordSignals };
		}
	});
	expect(screen.getByText("Northwind Eng:")).toBeVisible();
	expect(
		screen.getByText('The subject has the topic keyword "rate limit".'),
	).toBeVisible();
	expect(screen.getByText("Confidence 80%.")).toBeVisible();
	// Northwind Sales has no evidence, so it says nothing
	expect(screen.queryByText("Northwind Sales:")).toBeNull();
});

it("falls back to the thread's link for a review asked before evidence was kept", () => {
	renderChoice((state) => {
		const review = state.reviews.find((r) => r.id === "r2");
		if (review) {
			review.candidates = ["t-gsales"];
			review.candidateSignals = undefined;
		}
		const link = state.threads
			.find((t) => t.id === "th-hugo-chat")
			?.topicLinks.find((l) => l.topicId === "t-gsales");
		if (link) link.signals = keywordSignals;
	});
	expect(screen.getByText("Northwind Sales:")).toBeVisible();
	expect(screen.getByText("Confidence 80%.")).toBeVisible();
});

it("keeps one line per candidate when compact", () => {
	const state = createInitialCollaborationState();
	const review = state.reviews.find((r) => r.id === "r2");
	if (!review) throw new Error("Missing topic choice review");
	review.candidates = ["t-geng"];
	review.candidateSignals = { "t-geng": keywordSignals };
	render(
		<CollaborationSessionProvider initialState={state}>
			<MemoryRouter>
				<ReviewCard review={review} compact />
			</MemoryRouter>
		</CollaborationSessionProvider>,
	);
	expect(screen.queryByRole("list")).toBeNull();
	expect(
		screen.getByText(/topic keyword "rate limit"\. Confidence 80%\./),
	).toBeVisible();
});

function Topics() {
	const { state } = useCollaborationSession();
	const review = state.reviews.find((r) => r.id === "r1");
	return (
		<output data-testid="topics">
			{`${state.topics.some((t) => t.id === "st-gsec")}:${review?.status}:${
				state.threads.filter((t) =>
					t.topicLinks.some((l) => l.topicId === "t-gsales"),
				).length > 0
			}`}
		</output>
	);
}

it("adds a new topic to an existing topic picked from the list", async () => {
	const user = userEvent.setup();
	const state = createInitialCollaborationState();
	const review = state.reviews.find((r) => r.id === "r1");
	if (!review) throw new Error("Missing new topic review");
	// no suggested match, so the owner has to pick
	if (review.candidate) review.candidate.mergeCandidate = null;
	for (const topic of state.topics) topic.status = "active";
	render(
		<CollaborationSessionProvider initialState={state}>
			<MemoryRouter>
				<ReviewCard review={review} />
				<Topics />
			</MemoryRouter>
		</CollaborationSessionProvider>,
	);
	const add = screen.getByRole("button", {
		name: "Add to an existing topic",
	});
	expect(add).toBeDisabled();
	const picker = screen.getByRole("combobox", { name: "Existing topic" });
	picker.focus();
	await user.keyboard("{Enter}");
	await user.click(await screen.findByRole("option", { name: /Sales/ }));
	expect(add).toBeEnabled();
	await user.click(add);
	// the question is answered and the new topic is gone, merged into the chosen one
	expect(screen.getByTestId("topics")).toHaveTextContent(/^false:accepted:/);
});

it("undoes an answered topic question", async () => {
	const state = createInitialCollaborationState();
	const review = state.reviews.find((r) => r.id === "r2");
	if (!review) throw new Error("Missing topic choice review");
	review.status = "dismissed";
	function Status() {
		const { state: current } = useCollaborationSession();
		return (
			<output>
				{current.reviews.find((r) => r.id === "r2")?.status}
			</output>
		);
	}
	render(
		<CollaborationSessionProvider initialState={state}>
			<MemoryRouter>
				<ReviewCard review={review} />
				<Status />
			</MemoryRouter>
		</CollaborationSessionProvider>,
	);
	fireEvent.click(screen.getByRole("button", { name: "Undo" }));
	expect(screen.getByRole("status")).toHaveTextContent("open");
});

it("says who the conversation is with and offers a topic the question did not name", () => {
	renderChoice((state) => {
		const review = state.reviews.find((r) => r.id === "r2");
		if (review) review.candidates = ["t-gsales"];
	});
	expect(screen.getByText(/message/)).toHaveTextContent(/^With /);
	expect(
		screen.getByRole("combobox", { name: /^Another topic for / }),
	).toBeVisible();
});
