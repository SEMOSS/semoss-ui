import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactNode, useEffect, useState } from "react";
import { createMemoryRouter, useParams } from "react-router";
import { RouterProvider } from "react-router/dom";
import { ThreadPage } from "./thread.page";

const harness = vi.hoisted(() => ({
	closedRooms: [] as string[],
}));

vi.mock("@/features/collaboration/components/legacy-room-layout", () => ({
	LegacyRoomLayout: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("@/components/layouts/agent-layout", () => ({
	AgentLayout: ({
		roomId,
		children,
	}: {
		roomId: string;
		children: ReactNode;
	}) => (
		<>
			<output aria-label="Agent room">{roomId}</output>
			{children}
		</>
	),
}));

vi.mock("@/pages/work-thread.page", () => ({
	WorkThreadPage: () => {
		const { threadId } = useParams();
		return <output aria-label="Work thread">{threadId}</output>;
	},
}));

vi.mock("@/pages/room.page", () => ({
	RoomPage: ({ roomId }: { roomId: string }) => {
		const [draft, setDraft] = useState("");
		useEffect(
			() => () => {
				harness.closedRooms.push(roomId);
			},
			[roomId],
		);
		return (
			<>
				<output aria-label="Direct room">{roomId}</output>
				<textarea
					aria-label="Room draft"
					value={draft}
					onChange={(event) => setDraft(event.target.value)}
				/>
			</>
		);
	},
}));

function renderThread(path: string, state?: unknown) {
	const url = new URL(path, "http://localhost");
	const router = createMemoryRouter(
		[{ path: "/thread/:threadId", Component: ThreadPage }],
		{
			initialEntries: [
				{ pathname: url.pathname, search: url.search, state },
			],
		},
	);
	render(<RouterProvider router={router} />);
	return router;
}

beforeEach(() => {
	harness.closedRooms = [];
});

it.each([
	"th-work-one",
	"session:41d8d770-b756-44cd-b6cf-306c2396f153",
	"connected:outlook:mail/one",
])("opens the existing Work conversation for %s", (threadId) => {
	renderThread(`/thread/${encodeURIComponent(threadId)}`);
	expect(screen.getByLabelText("Work thread")).toHaveTextContent(threadId);
	expect(screen.queryByLabelText("Direct room")).not.toBeInTheDocument();
});

it("opens a direct room with its raw identity and preserves navigation context", () => {
	const roomId = "room/one:two";
	const path = `/thread/${encodeURIComponent(`room:${roomId}`)}`;
	const state = { openedRoomId: roomId };
	const router = renderThread(`${path}?item=approval%26one`, state);
	expect(screen.getByLabelText("Agent room")).toHaveTextContent(roomId);
	expect(screen.getByLabelText("Direct room")).toHaveTextContent(roomId);
	expect(screen.queryByLabelText("Work thread")).not.toBeInTheDocument();
	expect(router.state.location).toMatchObject({
		pathname: path,
		search: "?item=approval%26one",
		state,
	});
});

it("clears the previous direct room's local state when changing conversations", async () => {
	const user = userEvent.setup();
	const router = renderThread("/thread/room%3Aroom-one");
	await user.type(screen.getByLabelText("Room draft"), "Unsent in room one");
	await act(async () => {
		await router.navigate("/thread/room%3Aroom-two");
	});
	expect(screen.getByLabelText("Direct room")).toHaveTextContent("room-two");
	expect(screen.getByLabelText("Room draft")).toHaveValue("");
	expect(harness.closedRooms).toEqual(["room-one"]);
});

it("rejects a direct-room namespace without an identity", () => {
	renderThread("/thread/room%3A");
	expect(screen.getByText("Page not found")).toBeVisible();
	expect(screen.queryByLabelText("Direct room")).not.toBeInTheDocument();
});
