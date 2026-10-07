import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { BriefViewSwitch } from "@/features/dashboard/brief-view-switch";
import { DailyChatHeader } from "./daily-chat-header";

const profile = vi.hoisted(() => ({
	timezone: "UTC",
	liveTimezone: undefined as string | undefined,
}));

vi.mock("@/features/collaboration/state/collaboration-session.context", () => ({
	useOptionalCollaborationSession: () => ({
		state: {
			profile: { timezone: profile.timezone },
			liveProfile: profile.liveTimezone
				? { timezone: profile.liveTimezone }
				: undefined,
		},
	}),
}));

vi.mock("@/features/dashboard/brief-context-rail", () => ({
	BriefContextRail: ({ topicId }: { topicId?: string }) => (
		<aside aria-label="Your daily context">
			<button type="button">Review {topicId || "all topics"}</button>
		</aside>
	),
}));

function renderHeader(
	props: Partial<ComponentProps<typeof DailyChatHeader>> = {},
	state?: unknown,
) {
	const header = (
		<DailyChatHeader
			threadId="retained-draft"
			title="Conversation title"
			isWorkbenchOpen={false}
			{...props}
		/>
	);
	const path = props.isNewChat ? "/new" : "/thread/room:retained-room";
	const router = createMemoryRouter(
		[
			{ path: "/", element: <BriefViewSwitch view="brief" /> },
			{ path: "/new", element: header },
			{ path: "/thread/:threadId", element: header },
		],
		{ initialEntries: [{ pathname: path, state }] },
	);
	render(<RouterProvider router={router} />);
	return router;
}

beforeEach(() => {
	vi.useFakeTimers({ toFake: ["Date"] });
	vi.setSystemTime(new Date("2026-10-06T14:00:00.000Z"));
	profile.timezone = "UTC";
	profile.liveTimezone = undefined;
});

afterEach(() => {
	cleanup();
	vi.useRealTimers();
});

it.each([
	["  Plan the next release  ", "Plan the next release"],
	[" \n ", "Assistant"],
])("uses the saved title %j with an Assistant fallback", (title, expected) => {
	renderHeader({ title });
	expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
		expected,
	);
	expect(screen.getByRole("link", { name: "New Session" })).toBeVisible();
});

it.each([
	["  Riley Warren ", "Good morning, Riley."],
	["", "Good morning."],
	[undefined, "Good morning."],
])("greets a new chat for profile name %j", (userName, expected) => {
	profile.timezone = "America/New_York";
	renderHeader({ isNewChat: true, userName });
	expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
		expected,
	);
	expect(screen.getByText("What would you like to work on?")).toBeVisible();
	expect(screen.queryByRole("link", { name: "New Session" })).toBeNull();
	expect(screen.getByRole("button", { name: "Your day" })).toBeVisible();
	expect(screen.getByRole("link", { name: "Brief" })).toBeVisible();
	expect(screen.getByRole("link", { name: /Chat/ })).toBeVisible();
});

it("uses the live profile timezone for the new-chat greeting", () => {
	profile.liveTimezone = "Asia/Tokyo";
	renderHeader({ isNewChat: true, userName: "Riley" });
	expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
		"Good evening, Riley.",
	);
});

it.each([
	{ isNewChat: true, presentation: "new session" },
	{ isNewChat: false, presentation: "saved chat" },
])(
	"opens $presentation daily context by keyboard and restores focus on Escape",
	async ({ isNewChat }) => {
		const user = userEvent.setup();
		renderHeader({ topicId: "release", isNewChat });
		const trigger = screen.getByRole("button", { name: "Your day" });
		await user.tab();
		expect(trigger).toHaveFocus();
		await user.keyboard("{Enter}");
		const dialog = screen.getByRole("dialog", { name: "Your day" });
		expect(
			within(dialog).getByRole("button", { name: "Review release" }),
		).toHaveFocus();
		await user.keyboard("{Escape}");
		expect(screen.queryByRole("dialog")).toBeNull();
		expect(trigger).toHaveFocus();
	},
);

it("retains the local draft identity and topic through Brief", async () => {
	const user = userEvent.setup();
	const router = renderHeader({ topicId: "release", isNewChat: true });
	await user.click(screen.getByRole("link", { name: "Brief" }));
	expect(router.state.location.pathname).toBe("/");
	await user.click(screen.getByRole("link", { name: /Chat/ }));
	expect(router.state.location.pathname).toBe("/new");
	expect(router.state.location.state).toEqual({
		sessionId: "retained-draft",
		topicId: "release",
	});
});

it("starts a separate new chat without carrying saved room state", async () => {
	const user = userEvent.setup();
	const router = renderHeader({}, { sessionId: "retained-draft" });
	await user.click(screen.getByRole("link", { name: "New Session" }));
	expect(router.state.location.pathname).toBe("/new");
	expect(router.state.location.state).toBeNull();
});
