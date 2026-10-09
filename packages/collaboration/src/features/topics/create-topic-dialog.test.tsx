import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState } from "react";
import { beforeEach, expect, it, vi } from "vitest";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import type { Topic } from "@/features/collaboration/state/collaboration.types";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import { createTopic } from "./api/topic-api";
import { CreateTopicDialog } from "./create-topic-dialog";
import { savedTopic } from "./topic-test-fixtures";

const mocks = vi.hoisted(() => ({
	actions: { run: vi.fn() },
	onSubmit: vi.fn(),
	onChange: vi.fn(),
}));
vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ actions: mocks.actions }),
}));
vi.mock("./api/topic-api", () => ({ createTopic: vi.fn() }));

beforeEach(() => {
	vi.resetAllMocks();
	vi.mocked(createTopic).mockResolvedValue(savedTopic);
});

function Harness() {
	const trigger = useRef<HTMLButtonElement>(null);
	const [isOpen, setOpen] = useState(false);
	return (
		<CollaborationSessionProvider
			initialState={createInitialCollaborationState()}
			onChange={mocks.onChange}
		>
			<button type="button" ref={trigger} onClick={() => setOpen(true)}>
				New topic
			</button>
			{isOpen && (
				<CreateTopicDialog
					returnFocusRef={trigger}
					onSubmit={(id) => {
						mocks.onSubmit(id);
						setOpen(false);
					}}
				/>
			)}
		</CollaborationSessionProvider>
	);
}

it("validates the required name, creates once, and completes with the canonical server identity", async () => {
	const user = userEvent.setup();
	render(<Harness />);
	await user.click(screen.getByRole("button", { name: "New topic" }));
	await user.click(screen.getByRole("button", { name: "Create topic" }));
	expect(screen.getByText("Name is required.")).toBeVisible();
	expect(
		screen.getByRole("textbox", { name: "Name (required)" }),
	).toHaveAttribute("aria-describedby");
	expect(createTopic).not.toHaveBeenCalled();
	await user.type(
		screen.getByRole("textbox", { name: "Name (required)" }),
		"India trip",
	);
	await user.type(
		screen.getByRole("textbox", { name: "Description (optional)" }),
		"Visit clients",
	);
	await user.click(screen.getByRole("button", { name: "Create topic" }));
	await waitFor(() =>
		expect(mocks.onSubmit).toHaveBeenCalledWith(savedTopic.id),
	);
	expect(createTopic).toHaveBeenCalledExactlyOnceWith(mocks.actions, {
		name: "India trip",
		description: "Visit clients",
	});
	expect(
		mocks.onChange.mock.calls.flatMap(([change]) => change.commands),
	).toContainEqual({ type: "topic.received", topic: savedTopic });
});

it("retains entered values and an inline error after failure, then retries successfully", async () => {
	vi.mocked(createTopic).mockRejectedValueOnce(
		new Error("Topic could not be saved"),
	);
	const user = userEvent.setup();
	render(<Harness />);
	await user.click(screen.getByRole("button", { name: "New topic" }));
	await user.type(
		screen.getByRole("textbox", { name: "Name (required)" }),
		"India trip",
	);
	await user.click(screen.getByRole("button", { name: "Create topic" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Topic could not be saved",
	);
	expect(
		screen.getByRole("textbox", { name: "Name (required)" }),
	).toHaveValue("India trip");
	expect(mocks.onSubmit).not.toHaveBeenCalled();
	await user.click(screen.getByRole("button", { name: "Create topic" }));
	await waitFor(() =>
		expect(mocks.onSubmit).toHaveBeenCalledWith(savedTopic.id),
	);
});

it("blocks dismissal and duplicate submission while saving, then restores trigger focus", async () => {
	let finish: (topic: Topic) => void = () => undefined;
	vi.mocked(createTopic).mockImplementationOnce(
		() =>
			new Promise((resolve) => {
				finish = resolve;
			}),
	);
	const user = userEvent.setup();
	render(<Harness />);
	await user.click(screen.getByRole("button", { name: "New topic" }));
	await user.type(
		screen.getByRole("textbox", { name: "Name (required)" }),
		"India trip",
	);
	await user.click(screen.getByRole("button", { name: "Create topic" }));
	expect(screen.getByRole("button", { name: /Creating…/ })).toBeDisabled();
	expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
	await user.keyboard("{Escape}{Enter}");
	expect(screen.getByRole("dialog", { name: "Create topic" })).toBeVisible();
	expect(createTopic).toHaveBeenCalledOnce();
	await act(async () => {
		finish(savedTopic);
	});
	await waitFor(() =>
		expect(screen.getByRole("button", { name: "New topic" })).toHaveFocus(),
	);
});
