import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { useSyncExternalStore } from "react";
import { createMemoryRouter, useParams } from "react-router";
import { RouterProvider } from "react-router/dom";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import {
	CollaborationSessionProvider,
	useCollaborationSession,
} from "@/features/collaboration/state/collaboration-session.context";
import {
	useWorkComposerSession,
	WorkComposerStateProvider,
} from "@/features/work-thread/work-composer-state.context";
import { NewSessionPage } from "@/pages/new-session.page";
import { WorkThreadPage } from "@/pages/work-thread.page";

vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ insightId: "new-chat-test" }),
}));
vi.mock("@/features/collaboration/components/work-thread", () => ({
	WorkThread: ({
		threadId: suppliedThreadId,
		isNewChat = false,
		onSent,
	}: {
		threadId?: string;
		isNewChat?: boolean;
		onSent?: () => void;
	}) => {
		const { threadId: routeThreadId = "" } = useParams();
		const threadId = suppliedThreadId ?? routeThreadId;
		const composer = useWorkComposerSession(threadId);
		const memory = useSyncExternalStore(
			composer.subscribe,
			composer.getSnapshot,
		);
		const { state } = useCollaborationSession();
		const thread = state.threads.find(
			(candidate) => candidate.id === threadId,
		);
		return (
			<div>
				<output aria-label="Chat presentation">
					{isNewChat ? "New chat" : "Room"}
				</output>
				<output aria-label="Session identity">{threadId}</output>
				<output aria-label="Topic links">
					{thread?.topicLinks.map((link) => link.topicId).join(",")}
				</output>
				<textarea
					aria-label="Chat draft"
					value={memory.draft.text}
					onChange={(event) =>
						composer.setDraft(memory.revision, {
							document: null,
							text: event.target.value,
							files: [],
						})
					}
				/>
				<button type="button" onClick={onSent}>
					Accept first message
				</button>
			</div>
		);
	},
}));

function setup(navigationState?: unknown) {
	const state = createInitialCollaborationState();
	state.topics.push({
		...state.topics[0],
		id: "live-topic",
		isSample: false,
	});
	const router = createMemoryRouter(
		[
			{ path: "/new", Component: NewSessionPage },
			{ path: "/", element: <div>Brief</div> },
			{
				path: "/work/thread/:threadId",
				Component: WorkThreadPage,
			},
		],
		{
			initialEntries: ["/", { pathname: "/new", state: navigationState }],
			initialIndex: 1,
		},
	);
	render(
		<CollaborationSessionProvider initialState={state}>
			<WorkComposerStateProvider>
				<RouterProvider router={router} />
			</WorkComposerStateProvider>
		</CollaborationSessionProvider>,
	);
	return router;
}

it("opens /new with a reviewable suggested draft and only navigates after an accepted send", async () => {
	const router = setup({
		prompt: "Brief me for my next meeting",
		topicId: "live-topic",
	});
	await waitFor(() =>
		expect(screen.getByRole("textbox", { name: "Chat draft" })).toHaveValue(
			"Brief me for my next meeting",
		),
	);
	expect(router.state.location.pathname).toBe("/new");
	expect(screen.getByLabelText("Chat presentation")).toHaveTextContent(
		"New chat",
	);
	expect(screen.getByLabelText("Topic links")).toHaveTextContent(
		"live-topic",
	);
	const sessionId = screen.getByLabelText("Session identity").textContent;
	expect(sessionId).toMatch(/^session:[a-f0-9-]{36}$/);
	fireEvent.click(
		screen.getByRole("button", { name: "Accept first message" }),
	);
	await waitFor(() =>
		expect(router.state.location.pathname).toBe(
			`/work/thread/${encodeURIComponent(sessionId ?? "")}`,
		),
	);
	expect(screen.getByLabelText("Chat presentation")).toHaveTextContent(
		"Room",
	);
	expect(screen.getByLabelText("Session identity")).toHaveTextContent(
		sessionId ?? "",
	);
	expect(screen.getByLabelText("Topic links")).toHaveTextContent(
		"live-topic",
	);
	await act(() => router.navigate(-1));
	expect(router.state.location.pathname).toBe("/");
	await act(() => router.navigate(1));
	expect(screen.getByLabelText("Chat presentation")).toHaveTextContent(
		"Room",
	);
	expect(screen.getByLabelText("Session identity")).toHaveTextContent(
		sessionId ?? "",
	);
});

it("restores an unsent draft when returning from Brief and makes New chat a separate session", async () => {
	const router = setup();
	const sessionId = screen.getByLabelText("Session identity").textContent;
	fireEvent.change(screen.getByRole("textbox", { name: "Chat draft" }), {
		target: { value: "Keep this question" },
	});
	await act(() => router.navigate("/"));
	await act(() => router.navigate("/new", { state: { sessionId } }));
	expect(screen.getByLabelText("Session identity")).toHaveTextContent(
		sessionId ?? "",
	);
	expect(screen.getByRole("textbox", { name: "Chat draft" })).toHaveValue(
		"Keep this question",
	);
	expect(screen.getByLabelText("Chat presentation")).toHaveTextContent(
		"New chat",
	);
	await act(() => router.navigate("/new", { state: null }));
	expect(screen.getByLabelText("Session identity").textContent).not.toBe(
		sessionId,
	);
	expect(screen.getByRole("textbox", { name: "Chat draft" })).toHaveValue("");
});

it("ignores invalid route state and unavailable topics", () => {
	setup({
		sessionId: "not-a-session",
		prompt: { text: "Do not submit" },
		topicId: "missing-topic",
	});
	expect(screen.getByLabelText("Session identity").textContent).toMatch(
		/^session:[a-f0-9-]{36}$/,
	);
	expect(screen.getByLabelText("Topic links")).toHaveTextContent("");
	expect(screen.getByRole("textbox", { name: "Chat draft" })).toHaveValue("");
});
