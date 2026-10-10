import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, expect, it } from "vitest";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import type { CollaborationState } from "../state/collaboration.types";
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
