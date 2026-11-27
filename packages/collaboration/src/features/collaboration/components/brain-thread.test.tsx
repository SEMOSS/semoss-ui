import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, expect, it } from "vitest";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import type {
	CollaborationState,
	FilingSignals,
	ThreadTopicLink,
} from "../state/collaboration.types";
import { CollaborationSessionProvider } from "../state/collaboration-session.context";
import { BrainThread } from "./brain-thread";

afterEach(cleanup);

const THREAD = "th-geng-review";
const signals: FilingSignals = {
	keywordMatches: [{ keyword: "rate limit", field: "subject" }],
	matchedSenderIds: [],
	baseConfidence: 80,
	finalConfidence: 80,
	topicVipApplied: false,
	topicVipPoints: 0,
};

function renderThread(link: Partial<ThreadTopicLink>) {
	const state: CollaborationState = createInitialCollaborationState();
	const thread = state.threads.find((candidate) => candidate.id === THREAD);
	const first = thread?.topicLinks[0];
	if (!thread || !first) throw new Error("Missing fixture thread link");
	thread.topicLinks = [{ ...first, primary: true, ...link }];
	render(
		<CollaborationSessionProvider initialState={state}>
			<MemoryRouter initialEntries={[`/brain/threads/${THREAD}`]}>
				<Routes>
					<Route
						path="/brain/threads/:threadId"
						element={<BrainThread />}
					/>
				</Routes>
			</MemoryRouter>
		</CollaborationSessionProvider>,
	);
	return (
		state.topics.find((topic) => topic.id === first.topicId)?.short ?? ""
	);
}

it("shows why the thread is filed in the header and under its topic", () => {
	const topic = renderThread({ source: "confirmed", signals });
	// header: one line naming the topic
	expect(screen.getByText(`Filed under ${topic}:`)).toBeVisible();
	expect(
		screen.getByText(/topic keyword "rate limit"\. Confidence 80%\./),
	).toBeVisible();
	// Topics section: the full reason with the confidence on its own line
	expect(
		screen.getByText('The subject has the topic keyword "rate limit".'),
	).toBeVisible();
	expect(screen.getByText("Confidence 80%.")).toBeVisible();
});

it("calls a suggested link a suggestion in the header", () => {
	const topic = renderThread({ source: "suggested", signals });
	expect(screen.getByText(`Suggested for ${topic}:`)).toBeVisible();
});

it("keeps the header quiet for an owner-made link but says so under the topic", () => {
	renderThread({ source: "you", signals: undefined });
	expect(screen.queryByText(/^Filed under/)).toBeNull();
	expect(screen.getByText("You filed this thread here.")).toBeVisible();
});

it("shows no reason for a link without evidence", () => {
	renderThread({ source: "confirmed", signals: undefined });
	expect(screen.queryByText(/^Filed under/)).toBeNull();
	expect(screen.queryByText(/Confidence/)).toBeNull();
});

it("names the likeliest suggestion in the header, not a leftover primary flag", () => {
	const state: CollaborationState = createInitialCollaborationState();
	const thread = state.threads.find((candidate) => candidate.id === THREAD);
	const [weak, strong] = state.topics.filter(
		(topic) => topic.isSample === thread?.isSample,
	);
	if (!thread || !weak || !strong) throw new Error("Missing fixture topics");
	thread.topicLinks = [
		{
			topicId: weak.id,
			source: "suggested",
			confidence: 27,
			primary: true,
			signals: { ...signals, finalConfidence: 27 },
		},
		{
			topicId: strong.id,
			source: "suggested",
			confidence: 71,
			primary: false,
			signals: { ...signals, finalConfidence: 71 },
		},
	];
	render(
		<CollaborationSessionProvider initialState={state}>
			<MemoryRouter initialEntries={[`/brain/threads/${THREAD}`]}>
				<Routes>
					<Route
						path="/brain/threads/:threadId"
						element={<BrainThread />}
					/>
				</Routes>
			</MemoryRouter>
		</CollaborationSessionProvider>,
	);
	expect(screen.getByText(`Suggested for ${strong.short}:`)).toBeVisible();
	expect(screen.queryByText(`Suggested for ${weak.short}:`)).toBeNull();
});
