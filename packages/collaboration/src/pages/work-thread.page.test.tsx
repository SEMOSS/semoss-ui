import { act, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { createMemoryRouter, useParams } from "react-router";
import { RouterProvider } from "react-router/dom";
import type { SourceImportResult } from "@/features/rooms/source-import/source-import-attempt";
import { WorkThreadPage } from "./work-thread.page";

const mocks = vi.hoisted(() => ({
	createAttempt: vi.fn(),
	actions: {},
	state: {},
}));
vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ insightId: "owner-insight", actions: mocks.actions }),
}));
vi.mock("@/features/collaboration/state/collaboration-session.context", () => ({
	useCollaborationSession: () => ({ state: mocks.state }),
}));
vi.mock("@/features/rooms/source-import/source-import-attempt", () => ({
	createSourceImportAttempt: mocks.createAttempt,
}));

function ThreadRoute() {
	const { threadId } = useParams();
	return threadId?.startsWith("room:") ? (
		<div>Room conversation</div>
	) : (
		<WorkThreadPage />
	);
}

function setup() {
	const activations: { complete: (roomId: string) => void }[] = [];
	mocks.createAttempt.mockImplementation(() => {
		let complete: (roomId: string) => void = () => undefined;
		const pending = new Promise<SourceImportResult>((resolve) => {
			complete = (roomId) =>
				resolve({
					roomId,
					file: { fileLocation: "/source.md", fileName: "source.md" },
				});
		});
		activations.push({ complete });
		const snapshot = { phase: "loading-source", error: null, roomId: "" };
		return {
			retain: () => () => undefined,
			subscribe: () => () => undefined,
			getSnapshot: () => snapshot,
			start: () => pending,
		};
	});
	const router = createMemoryRouter(
		[
			{ path: "/thread/:threadId", Component: ThreadRoute },
			{ path: "/", element: <div>Brief</div> },
		],
		{ initialEntries: ["/thread/source-one"] },
	);
	render(
		<StrictMode>
			<RouterProvider router={router} />
		</StrictMode>,
	);
	return { router, activations };
}

beforeEach(() => vi.clearAllMocks());

it("shows loading and prevents an abandoned import from changing the route", async () => {
	const { router, activations } = setup();
	expect(screen.getByText("Loading thread…")).toBeVisible();
	await act(async () => {
		await router.navigate("/");
	});
	await act(async () => {
		for (const activation of activations) activation.complete("room-one");
	});
	expect(router.state.location.pathname).toBe("/");
	expect(screen.getByText("Brief")).toBeVisible();
});

it("a new visit to the same source starts a new import attempt", async () => {
	const { router } = setup();
	const initialCount = mocks.createAttempt.mock.calls.length;
	await act(async () => {
		await router.navigate("/thread/source-one");
	});
	expect(mocks.createAttempt.mock.calls.length).toBeGreaterThan(initialCount);
});

it("replaces the import route with the room once when Strict Mode observes completion twice", async () => {
	const { router, activations } = setup();
	const visited: string[] = [];
	const unsubscribe = router.subscribe((state) =>
		visited.push(state.location.pathname),
	);
	await act(async () => {
		for (const activation of activations) activation.complete("room-one");
	});
	expect(router.state.location.pathname).toBe("/thread/room%3Aroom-one");
	expect(screen.getByText("Room conversation")).toBeVisible();
	expect(
		visited.filter((path) => path === "/thread/room%3Aroom-one"),
	).toHaveLength(1);
	unsubscribe();
});
