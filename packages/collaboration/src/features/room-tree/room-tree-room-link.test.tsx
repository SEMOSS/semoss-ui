import {
	act,
	cleanup,
	createEvent,
	fireEvent,
	render,
	screen,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, MemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, expect, it, vi } from "vitest";
import { formatLocalDateTime } from "@semoss/utility/date";
import type { RoomTreeRoom } from "./room-tree.types";
import { RoomTreeRoomLink } from "./room-tree-room-link";

const room: RoomTreeRoom = {
	roomId: "room/one ?",
	roomName: "Pricing conversation",
	topics: [],
};
const roomHref = "/thread/room%3Aroom%2Fone%20%3F";
const indicatorId = "room-tree-room-link-unread-indicator";

/** Render one saved-room destination with real navigation behavior. */
function renderRoomLink(
	summary: RoomTreeRoom = room,
	pathname = "/",
	state?: { openedRoomId: string },
) {
	const onNavigate = vi.fn();
	const router = createMemoryRouter(
		[
			{
				path: "*",
				element: (
					<RoomTreeRoomLink room={summary} onNavigate={onNavigate} />
				),
			},
		],
		{ initialEntries: [{ pathname, state }] },
	);
	render(<RouterProvider router={router} />);
	return { router, onNavigate, user: userEvent.setup() };
}

afterEach(cleanup);

it.each([
	{
		isUnread: undefined,
		topicUnavailable: false,
		description: "",
	},
	{
		isUnread: true,
		topicUnavailable: false,
		description: "Unread activity",
	},
	{
		isUnread: false,
		topicUnavailable: true,
		description: "Topic unavailable",
	},
	{
		isUnread: true,
		topicUnavailable: true,
		description: "Unread activity Topic unavailable",
	},
])(
	"describes unread=$isUnread and unavailable=$topicUnavailable without changing the room title",
	({ isUnread, topicUnavailable, description }) => {
		renderRoomLink({ ...room, isUnread, topicUnavailable });
		const link = screen.getByRole("link", {
			name: "Pricing conversation",
		});
		expect(link).toHaveAttribute("href", roomHref);
		expect(link).toHaveAccessibleDescription(description);
		expect(link).not.toHaveAttribute("aria-current");
		if (isUnread) {
			const indicator = within(link).getByTestId(indicatorId);
			expect(indicator).toBeVisible();
			expect(indicator).toHaveAttribute("aria-hidden", "true");
			expect(
				within(link).getByText("Unread activity"),
			).toBeInTheDocument();
		} else {
			expect(
				within(link).queryByTestId(indicatorId),
			).not.toBeInTheDocument();
			expect(
				within(link).queryByText("Unread activity"),
			).not.toBeInTheDocument();
		}
		expect(screen.queryByRole("button")).not.toBeInTheDocument();
	},
);

it.each([
	{ pathname: roomHref, state: undefined },
	{ pathname: "/thread/source-thread", state: { openedRoomId: room.roomId } },
])(
	"keeps unread activity visible on an active room at $pathname",
	({ pathname, state }) => {
		renderRoomLink({ ...room, isUnread: true }, pathname, state);
		const link = screen.getByRole("link", { name: "Pricing conversation" });
		expect(link).toHaveAttribute("aria-current", "page");
		expect(link).toHaveAccessibleDescription("Unread activity");
		expect(within(link).getByTestId(indicatorId)).toBeVisible();
	},
);

it("opens the exact room by keyboard and leaves unread state to the room owner", async () => {
	const { user, router, onNavigate } = renderRoomLink({
		...room,
		isUnread: true,
	});
	const link = screen.getByRole("link", { name: "Pricing conversation" });
	act(() => link.focus());
	await user.keyboard("{Enter}");
	expect(router.state.location.pathname).toBe(roomHref);
	expect(onNavigate).toHaveBeenCalledOnce();
	expect(link).toHaveAttribute("aria-current", "page");
	expect(link).toHaveAccessibleDescription("Unread activity");
	expect(within(link).getByTestId(indicatorId)).toBeVisible();
});

it.each([
	{ ctrlKey: true },
	{ metaKey: true },
	{ shiftKey: true },
	{ altKey: true },
	{ button: 1 },
])(
	"keeps modified navigation independent of the current drawer: %j",
	(options) => {
		const { onNavigate, router } = renderRoomLink({
			...room,
			isUnread: true,
		});
		const link = screen.getByRole("link", { name: "Pricing conversation" });
		const click = createEvent.click(link, options);
		// The test does not open a browser tab; it only exercises the link handler.
		click.preventDefault();
		fireEvent(link, click);
		expect(onNavigate).not.toHaveBeenCalled();
		expect(router.state.location.pathname).toBe("/");
		expect(link).toHaveAttribute("href", roomHref);
		expect(link).toHaveAccessibleDescription("Unread activity");
	},
);

it("describes every instance independently when the same room appears in multiple lists", () => {
	const summary = { ...room, isUnread: true, topicUnavailable: true };
	render(
		<MemoryRouter>
			<RoomTreeRoomLink room={summary} />
			<RoomTreeRoomLink room={summary} />
		</MemoryRouter>,
	);
	const links = screen.getAllByRole("link", { name: "Pricing conversation" });
	expect(links).toHaveLength(2);
	expect(links[0].getAttribute("aria-describedby")).not.toBe(
		links[1].getAttribute("aria-describedby"),
	);
	for (const link of links) {
		expect(link).toHaveAccessibleDescription(
			"Unread activity Topic unavailable",
		);
		expect(within(link).getByTestId(indicatorId)).toBeVisible();
	}
});

it("preserves both status descriptions while showing the full title on focus", async () => {
	const title =
		"A long room title with all of its original saved conversation context";
	renderRoomLink({
		...room,
		roomName: title,
		isUnread: true,
		topicUnavailable: true,
	});
	const link = screen.getByRole("link", { name: title });
	act(() => link.focus());
	expect(await screen.findByRole("tooltip")).toHaveTextContent(title);
	expect(link).toHaveAccessibleName(title);
	expect(link).toHaveAccessibleDescription(
		"Unread activity Topic unavailable",
	);
});

it("shows three topic dots and an overflow count while describing every linked topic", async () => {
	const activityAt = "2026-10-08T14:30:00.000Z";
	const topics = [
		{ topicId: "a", name: "Architecture" },
		{ topicId: "b", name: "Business" },
		{ topicId: "c", name: "Customer research" },
		{ topicId: "d", name: "Delivery" },
		{ topicId: "e", name: "Engineering" },
	];
	const { user } = renderRoomLink({
		...room,
		topics,
		activityAt,
		isUnread: true,
	});
	const link = screen.getByRole("link", { name: room.roomName });
	const dots = within(link).getAllByTestId("room-topic-indicator");
	expect(dots).toHaveLength(3);
	for (const dot of dots) expect(dot).toBeEmptyDOMElement();
	expect(within(link).getByText("+2")).toBeVisible();
	expect(link).toHaveAccessibleDescription(
		`Unread activity Topics: Architecture, Business, Customer research, Delivery, Engineering Latest activity: ${formatLocalDateTime(activityAt)}`,
	);
	expect(screen.getAllByRole("link")).toHaveLength(1);
	expect(screen.queryByRole("button")).not.toBeInTheDocument();
	act(() => link.focus());
	const tooltip = await screen.findByRole("tooltip");
	expect(tooltip).toHaveTextContent("Pricing conversation");
	expect(tooltip).toHaveTextContent(
		"Architecture, Business, Customer research, Delivery, Engineering",
	);
	expect(tooltip).toHaveTextContent(
		`Latest activity: ${formatLocalDateTime(activityAt)}`,
	);
	await user.keyboard("{Escape}");
	expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
	expect(link).toHaveFocus();
});

it("opens the room when its topic dot is clicked", async () => {
	const { user, router, onNavigate } = renderRoomLink({
		...room,
		topics: [{ topicId: "a", name: "Architecture" }],
	});
	const link = screen.getByRole("link", { name: room.roomName });
	await user.click(within(link).getByTestId("room-topic-indicator"));
	expect(router.state.location.pathname).toBe(roomHref);
	expect(onNavigate).toHaveBeenCalledOnce();
});

it("shows details on hover and does not invent a topic dot or time for an unassigned room", async () => {
	const { user } = renderRoomLink({ ...room, activityAt: "invalid" });
	const link = screen.getByRole("link", { name: room.roomName });
	expect(
		within(link).queryByTestId("room-topic-indicator"),
	).not.toBeInTheDocument();
	await user.hover(link);
	const tooltip = await screen.findByRole("tooltip");
	expect(tooltip).toHaveTextContent("Pricing conversation");
	expect(tooltip).not.toHaveTextContent("Topics:");
	expect(tooltip).not.toHaveTextContent("Latest activity:");
});
