import {
	act,
	cleanup,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
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
