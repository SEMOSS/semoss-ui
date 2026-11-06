import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useParams } from "react-router";
import { loadSearchRecord } from "../api/collaboration-search";
import {
	WorkUpdatesContext,
	type WorkUpdatesStatus,
} from "../live/work-updates.context";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import {
	CollaborationSessionProvider,
	useCollaborationSession,
} from "../state/collaboration-session.context";
import { SavedRecordBoundary } from "./saved-record-boundary";

const insight = vi.hoisted(() => ({ actions: {} }));
vi.mock("@semoss/sdk/react", () => ({ useInsight: () => insight }));
vi.mock("../api/collaboration-search", () => ({ loadSearchRecord: vi.fn() }));

/** The route's topic id as the detail view reads it, and how many copies the page holds. */
function TopicRoute() {
	const { topicId = "" } = useParams();
	const { state } = useCollaborationSession();
	return (
		<SavedRecordBoundary kind="topic" id={topicId}>
			<p>
				{topicId} of {state.topics.length}
			</p>
		</SavedRecordBoundary>
	);
}

it("opens a topic made on this page from a link with its server id, without loading a second copy", async () => {
	const state = createInitialCollaborationState();
	const topic = { ...state.topics[0], id: "local-topic-9" };
	state.topics = [topic];
	vi.mocked(loadSearchRecord).mockResolvedValue({
		type: "records.loaded",
		topics: [{ ...topic, id: "server-topic" }],
		people: [],
		threads: [],
		items: [],
		memories: [],
		workspaces: {},
	});
	const updates: WorkUpdatesStatus = {
		isRefreshing: false,
		lastUpdated: null,
		error: "",
		lastMailCheck: null,
		refresh: vi.fn(),
		refreshTopic: vi.fn(),
		isSyncing: false,
		lastSync: null,
		syncError: "",
		syncMail: vi.fn(),
		serverId: async (id) => (id === "local-topic-9" ? "server-topic" : id),
		localId: (id) => (id === "server-topic" ? "local-topic-9" : id),
	};
	render(
		<CollaborationSessionProvider initialState={state}>
			<WorkUpdatesContext.Provider value={updates}>
				<MemoryRouter initialEntries={["/topics/server-topic"]}>
					<Routes>
						<Route
							path="topics/:topicId"
							element={<TopicRoute />}
						/>
					</Routes>
				</MemoryRouter>
			</WorkUpdatesContext.Provider>
		</CollaborationSessionProvider>,
	);
	expect(await screen.findByText("local-topic-9 of 1")).toBeVisible();
	expect(loadSearchRecord).not.toHaveBeenCalled();
});
