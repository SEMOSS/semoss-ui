import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, parsePath, RouterProvider } from "react-router";
import { BriefViewSwitch } from "./brief-view-switch";

function renderSwitch(path: string, state?: unknown) {
	const router = createMemoryRouter(
		[
			{ path: "/", element: <BriefViewSwitch view="brief" /> },
			{ path: "/new", element: <BriefViewSwitch view="chat" /> },
			{
				path: "/thread/:threadId",
				element: <BriefViewSwitch view="chat" />,
			},
		],
		{ initialEntries: [{ ...parsePath(path), state }] },
	);
	render(<RouterProvider router={router} />);
	return router;
}

afterEach(cleanup);

it.each([
	["/new", /Chat/],
	["/", /^Brief$/],
] as const)(
	"keeps the current route identity when its selected view is clicked at %s",
	async (path, name) => {
		const user = userEvent.setup();
		const state = {
			sessionId: "retained-chat",
			prompt: "My unsent question",
		};
		const router = renderSwitch(path, state);
		const initialKey = router.state.location.key;
		const onNavigation = vi.fn();
		const unsubscribe = router.subscribe(onNavigation);
		await user.click(screen.getByRole("link", { name }));
		expect(router.state.location.key).toBe(initialKey);
		expect(router.state.location.state).toEqual(state);
		expect(onNavigation).not.toHaveBeenCalled();
		unsubscribe();
	},
);

it.each([
	"/new",
	"/thread/session%3Aretained-chat",
	"/thread/room%3Asaved-room",
])(
	"returns from Brief to the same chat and navigation state at %s",
	async (path) => {
		const user = userEvent.setup();
		const state = {
			sessionId: "retained-chat",
			prompt: "My unsent question",
			topicId: "product",
		};
		const router = renderSwitch(path, state);
		expect(screen.getByRole("link", { name: /Chat/ })).toHaveAttribute(
			"aria-current",
			"page",
		);
		await user.click(screen.getByRole("link", { name: "Brief" }));
		expect(router.state.location.pathname).toBe("/");
		expect(screen.getByRole("link", { name: "Brief" })).toHaveAttribute(
			"aria-current",
			"page",
		);
		await user.click(screen.getByRole("link", { name: /Chat/ }));
		expect(router.state.location.pathname).toBe(path);
		expect(router.state.location.state).toEqual(state);
	},
);

it("switches Brief and Chat with both supported shortcuts and ignores modified chords", () => {
	const router = renderSwitch("/new", { sessionId: "retained-chat" });
	fireEvent.keyDown(window, { key: "j", ctrlKey: true, shiftKey: true });
	expect(router.state.location.pathname).toBe("/new");
	fireEvent.keyDown(window, { key: "j", metaKey: true, altKey: true });
	expect(router.state.location.pathname).toBe("/new");
	fireEvent.keyDown(window, { key: "j", ctrlKey: true });
	expect(router.state.location.pathname).toBe("/");
	fireEvent.keyDown(window, { key: "J", metaKey: true });
	expect(router.state.location.pathname).toBe("/new");
	expect(router.state.location.state).toEqual({ sessionId: "retained-chat" });
});

it.each(["click", "metaKey", "ctrlKey"] as const)(
	"retains an encoded room URL, selected item, hash, and navigation state through %s switching",
	async (interaction) => {
		const pathname = "/thread/room%3Asaved-room";
		const search = "?item=approval%3A42";
		const hash = "#message-42";
		const state = { openedRoomId: "saved-room", prompt: "Keep this draft" };
		const router = renderSwitch(`${pathname}${search}${hash}`, state);
		expect(screen.getByRole("link", { name: /Chat/ })).toHaveAttribute(
			"href",
			`${pathname}${search}${hash}`,
		);
		if (interaction === "click") {
			await userEvent.click(screen.getByRole("link", { name: "Brief" }));
		} else {
			fireEvent.keyDown(window, { key: "j", [interaction]: true });
		}
		expect(router.state.location.pathname).toBe("/");
		expect(router.state.location.state).toEqual({
			chatReturnTo: { pathname, search, hash, state },
		});
		expect(screen.getByRole("link", { name: /Chat/ })).toHaveAttribute(
			"href",
			`${pathname}${search}${hash}`,
		);
		if (interaction === "click") {
			await userEvent.click(screen.getByRole("link", { name: /Chat/ }));
		} else {
			fireEvent.keyDown(window, { key: "j", [interaction]: true });
		}
		expect(router.state.location).toMatchObject({
			pathname,
			search,
			hash,
			state,
		});
	},
);

it("accepts a saved chat destination from before query and hash retention", async () => {
	const state = { openedRoomId: "saved-room" };
	const router = renderSwitch("/?filter=unread#today", {
		chatReturnTo: {
			pathname: "/thread/room%3Asaved-room",
			state,
		},
	});
	expect(screen.getByRole("link", { name: "Brief" })).toHaveAttribute(
		"href",
		"/?filter=unread#today",
	);
	await userEvent.click(screen.getByRole("link", { name: /Chat/ }));
	expect(router.state.location).toMatchObject({
		pathname: "/thread/room%3Asaved-room",
		search: "",
		hash: "",
		state,
	});
});

it("opens a new chat from a fresh brief and ignores unrelated saved destinations", async () => {
	const user = userEvent.setup();
	const router = renderSwitch("/", {
		chatReturnTo: {
			pathname: "/settings/data",
			state: { prompt: "unexpected" },
		},
	});
	await user.click(screen.getByRole("link", { name: /Chat/ }));
	expect(router.state.location.pathname).toBe("/new");
	expect(router.state.location.state).toBeNull();
});
