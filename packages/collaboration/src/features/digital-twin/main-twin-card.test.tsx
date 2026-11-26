import {
	cleanup,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, useLocation } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import type { MainTwin } from "@/features/collaboration/state/collaboration.types";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import { MainTwinCard } from "./main-twin-card";

// one actions object, as the provider gives
const insight = vi.hoisted(() => ({ actions: { run: vi.fn() } }));
vi.mock("@semoss/sdk/react", () => ({ useInsight: () => insight }));
const save = vi.hoisted(() => vi.fn());
vi.mock("./api/main-twin", () => ({ saveMainTwin: save }));

const ROBIN: MainTwin = {
	name: "Robin's Digital Twin",
	avatar: "",
	agentId: "collaboration-agent",
};

beforeEach(() => {
	save.mockReset();
});
afterEach(cleanup);

/** Where the Chat button leads, with what it was opened with. */
function Today() {
	const { state } = useLocation();
	return (
		<output aria-label="Today opened with">{JSON.stringify(state)}</output>
	);
}

/** The card on the Digital Twins page, for a twin the server sent or, with none, an older server. */
function renderCard(mainTwin?: MainTwin, isSignedIn = true) {
	const base = createInitialCollaborationState();
	const router = createMemoryRouter(
		[
			{ path: "/twins", Component: MainTwinCard },
			{ path: "/", Component: Today },
			{ path: "/twins/persona", element: <div>Persona page</div> },
		],
		{ initialEntries: ["/twins"] },
	);
	render(
		<CollaborationSessionProvider
			initialState={{
				...base,
				liveProfile: isSignedIn
					? { ...base.profile, email: "robin@northwind.example" }
					: null,
				mainTwin,
			}}
		>
			<RouterProvider router={router} />
		</CollaborationSessionProvider>,
	);
	return screen.getByRole("region", { name: "Your Digital Twin" });
}

it("names the person's own twin, says it is private and what it works with, and leads to its chat and persona", async () => {
	const card = renderCard(ROBIN);
	expect(
		within(card).getByRole("heading", {
			level: 2,
			name: "Your Digital Twin",
		}),
	).toBeVisible();
	expect(within(card).getByText("Robin's Digital Twin")).toBeVisible();
	expect(
		within(card).getByText(
			"Private to you. Works with your mail, Teams, calendar, files, work and routines.",
		),
	).toBeVisible();
	expect(within(card).getByRole("link", { name: "Persona" })).toHaveAttribute(
		"href",
		"/twins/persona",
	);
	// the button reads Chat, and says which chat to someone who cannot see the card around it
	const chat = within(card).getByRole("link", {
		name: "Chat: Robin's Digital Twin",
	});
	expect(chat).toHaveTextContent(/^Chat$/);
	await userEvent.setup().click(chat);
	// Today, opened with its ask box ready to type in
	expect(screen.getByLabelText("Today opened with")).toHaveTextContent(
		'{"focusAskBox":true}',
	);
});

it("draws a chosen picture larger than the Microsoft photo standing in for it, and initials with neither", () => {
	const saved = renderCard({
		...ROBIN,
		avatar: "data:image/png;base64,AAAA",
	});
	const picture = saved.querySelector("img");
	expect(picture).toHaveAttribute("src", "data:image/png;base64,AAAA");
	expect(picture?.parentElement).toHaveClass("size-24");
	cleanup();

	// the photo is only 96 px wide, so it is drawn at 64
	const photo = renderCard(ROBIN).querySelector("img");
	expect(photo).toHaveAttribute(
		"src",
		expect.stringMatching(/\/msgraph\/photo\?email=robin%40northwind/),
	);
	expect(photo?.parentElement).toHaveClass("size-16");
	cleanup();

	const neither = renderCard(ROBIN, false);
	expect(neither.querySelector("img")).toBeNull();
	expect(neither).toHaveTextContent("RD");
});

it("shows no second name and no way to change it on a server that predates the twin", () => {
	const card = renderCard();
	// the heading is the name: it is not said twice
	expect(within(card).getAllByText("Your Digital Twin")).toHaveLength(1);
	expect(
		within(card).getByRole("link", { name: "Chat: Your Digital Twin" }),
	).toBeVisible();
	expect(within(card).getByRole("link", { name: "Persona" })).toBeVisible();
	expect(
		within(card).queryByRole("button", { name: "Name and Picture" }),
	).toBeNull();
});

it("opens the name and picture, shows what was saved at once, and takes the focus back", async () => {
	save.mockResolvedValue({ name: "Rob", image: "NEW" });
	const card = renderCard(ROBIN);
	const user = userEvent.setup();
	const edit = within(card).getByRole("button", { name: "Name and Picture" });
	await user.click(edit);
	const dialog = screen.getByRole("dialog", { name: "Name and Picture" });
	const name = within(dialog).getByRole("textbox", { name: "Name" });
	await user.clear(name);
	await user.type(name, "Rob");
	await user.click(within(dialog).getByRole("button", { name: "Save" }));
	await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
	expect(within(card).getByText("Rob")).toBeVisible();
	expect(within(card).getByRole("link", { name: "Chat: Rob" })).toBeVisible();
	expect(card.querySelector("img")).toHaveAttribute(
		"src",
		"data:image/png;base64,NEW",
	);
	await waitFor(() => expect(edit).toHaveFocus());
});
