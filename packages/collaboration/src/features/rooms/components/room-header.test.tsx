import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { roomWorkbenchTriggerId } from "../room-workbench-trigger-id";
import { RoomHeader } from "./room-header";

const agent = {
	name: "Research agent",
	description: "",
	system_prompt: "",
	mcp: [],
	skills: [],
	prompts: [],
};
afterEach(cleanup);

it("keeps a room-specific focus destination when the workbench closes", () => {
	const id = roomWorkbenchTriggerId("room:one/two");
	const props = {
		agent,
		title: "Room",
		workbenchTriggerId: id,
		onToggleToolWorkbench: vi.fn(),
	};
	const view = render(<RoomHeader {...props} isToolWorkbenchOpen />);
	const toggle = screen.getByRole("button", { name: "Close workbench" });
	expect(toggle).toHaveAttribute("id", id);
	view.rerender(<RoomHeader {...props} isToolWorkbenchOpen={false} />);
	expect(screen.getByRole("button", { name: "Open workbench" })).toBe(toggle);
	act(() => document.getElementById(id)?.focus());
	expect(toggle).toHaveFocus();
	expect(roomWorkbenchTriggerId("another-room")).not.toBe(id);
});

it("shows the agent's own image, and its initials when it has none or the image does not load", () => {
	const props = {
		agent,
		title: "Room",
		isToolWorkbenchOpen: false,
		onToggleToolWorkbench: vi.fn(),
	};
	const view = render(<RoomHeader {...props} />);
	const details = screen.getByRole("button", {
		name: "Conversation details: Room",
	});
	expect(details.querySelector("img")).toBeNull();
	expect(details).toHaveTextContent("RA");

	view.rerender(<RoomHeader {...props} agentImage="/twin.png" />);
	const image = details.querySelector("img");
	expect(image).toHaveAttribute("src", "/twin.png");
	// decorative: the button is already named by the conversation
	expect(image).toHaveAttribute("alt", "");
	if (image) fireEvent.error(image);
	expect(details.querySelector("img")).toBeNull();
	expect(details).toHaveTextContent("RA");
});

it("takes initials from the name, not from its possessive", () => {
	render(
		<RoomHeader
			agent={{ ...agent, name: "Ryan's Digital Twin" }}
			title="Room"
			isToolWorkbenchOpen={false}
			onToggleToolWorkbench={vi.fn()}
		/>,
	);
	const details = screen.getByRole("button", {
		name: "Conversation details: Room",
	});
	expect(details).toHaveTextContent("RD");
	expect(details).not.toHaveTextContent("RS");
});

it("says who the chat is with under its title, and what that agent can reach in the details", async () => {
	const props = {
		agent: { ...agent, name: "Renewals Twin" },
		title: "Renewal questions",
		isToolWorkbenchOpen: false,
		onToggleToolWorkbench: vi.fn(),
	};
	const view = render(
		<RoomHeader
			{...props}
			agentLine="Renewals Twin · Shared by Dana"
			agentDetails={
				<p>It answers only from what its owner shared with it.</p>
			}
		/>,
	);
	// the button is named by everything it shows, so saying the line finds it too
	const trigger = screen.getByRole("button", {
		name: "Conversation details: Renewal questions Renewals Twin · Shared by Dana",
	});
	expect(
		within(trigger).getByText("Renewals Twin · Shared by Dana"),
	).toBeVisible();
	await userEvent.setup().click(trigger);
	const details = screen.getByRole("dialog", {
		name: "Conversation details",
	});
	// the details it was handed stand in for the line that names it as an AI agent
	expect(
		within(details).getByText(
			"It answers only from what its owner shared with it.",
		),
	).toBeVisible();
	expect(within(details).queryByText(/AI agent/)).toBeNull();

	// with neither, the header reads as it did
	view.rerender(<RoomHeader {...props} />);
	expect(trigger).toHaveAccessibleName(
		"Conversation details: Renewal questions",
	);
	expect(trigger).toHaveTextContent(/^RTRenewal questions$/);
	expect(
		within(
			screen.getByRole("dialog", { name: "Conversation details" }),
		).getByText("Renewals Twin · AI agent"),
	).toBeVisible();
});

it("exposes a long conversation title to keyboard users and returns focus", async () => {
	const title =
		"Planning the international customer renewal and implementation milestones for next quarter";
	render(
		<RoomHeader
			agent={agent}
			title={title}
			isToolWorkbenchOpen={false}
			onToggleToolWorkbench={vi.fn()}
		/>,
	);
	const user = userEvent.setup();
	const trigger = screen.getByRole("button", {
		name: `Conversation details: ${title}`,
	});
	expect(screen.getByRole("heading", { level: 1 })).toContainElement(trigger);
	act(() => trigger.focus());
	await user.keyboard("{Enter}");
	const details = screen.getByRole("dialog", {
		name: "Conversation details",
	});
	expect(within(details).getByText(title)).toBeVisible();
	expect(
		within(details).getByText("Research agent · AI agent"),
	).toBeVisible();
	await user.keyboard("{Escape}");
	await waitFor(() => expect(trigger).toHaveFocus());
});

it("preserves contextual and workbench actions without workspace navigation controls", async () => {
	const onToggle = vi.fn();
	const onAction = vi.fn();
	render(
		<RoomHeader
			agent={agent}
			title=""
			isToolWorkbenchOpen
			onToggleToolWorkbench={onToggle}
			actions={
				<button type="button" onClick={onAction}>
					Thread action
				</button>
			}
		/>,
	);
	const user = userEvent.setup();
	expect(
		screen.getByRole("button", {
			name: "Conversation details: Untitled conversation",
		}),
	).toBeVisible();
	await user.click(screen.getByRole("button", { name: "Thread action" }));
	await user.click(screen.getByRole("button", { name: "Close workbench" }));
	expect(onToggle).toHaveBeenCalledOnce();
	expect(onAction).toHaveBeenCalledOnce();
	expect(
		screen.queryByRole("button", { name: /navigation/ }),
	).not.toBeInTheDocument();
});
