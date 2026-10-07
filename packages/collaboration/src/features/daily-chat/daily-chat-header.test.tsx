import { cleanup, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
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

function renderHeader(
	props: Partial<ComponentProps<typeof DailyChatHeader>> = {},
) {
	render(<DailyChatHeader {...props} />);
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
	["  Riley Warren ", "Good morning, Riley."],
	["", "Good morning."],
	[undefined, "Good morning."],
])("greets a new chat for profile name %j", (userName, expected) => {
	profile.timezone = "America/New_York";
	renderHeader({ userName });
	expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
		expected,
	);
	expect(screen.getByText("What would you like to work on?")).toBeVisible();
	expect(screen.queryByRole("link", { name: "New Session" })).toBeNull();
	expect(screen.queryByRole("button", { name: "Your day" })).toBeNull();
	expect(screen.queryByRole("link", { name: "Brief" })).toBeNull();
	expect(screen.queryByRole("link", { name: /Chat/ })).toBeNull();
});

it("uses the live profile timezone for the new-chat greeting", () => {
	profile.liveTimezone = "Asia/Tokyo";
	renderHeader({ userName: "Riley" });
	expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
		"Good evening, Riley.",
	);
});
