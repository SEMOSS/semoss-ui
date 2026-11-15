import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import {
	CollaborationSessionProvider,
	useWorkChanged,
} from "../state/collaboration-session.context";
import { NewWorkItemDialog } from "./new-work-item-dialog";

const insight = vi.hoisted(() => ({
	actions: {
		run: vi.fn(async () => ({
			pixelReturn: [
				{ output: { id: "new" }, operationType: ["OPERATION"] },
			],
		})),
	},
}));
vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useInsight: () => insight,
}));

beforeAll(() => {
	HTMLElement.prototype.hasPointerCapture = () => false;
	HTMLElement.prototype.releasePointerCapture = () => undefined;
});

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

function WorkVersion() {
	return (
		<output aria-label="Work version">
			{useWorkChanged().workVersion}
		</output>
	);
}

function setup(onCreated = vi.fn()) {
	render(
		<CollaborationSessionProvider
			initialState={createInitialCollaborationState()}
		>
			<NewWorkItemDialog onCreated={onCreated} />
			<WorkVersion />
		</CollaborationSessionProvider>,
	);
	return onCreated;
}

describe("NewWorkItemDialog", () => {
	it("makes the item from its name, then tells the list", async () => {
		const user = userEvent.setup();
		const onCreated = setup();
		await user.click(screen.getByRole("button", { name: "New work item" }));
		const make = screen.getByRole("button", { name: "Make work item" });
		expect((make as HTMLButtonElement).disabled).toBe(true);
		await user.type(
			screen.getByRole("textbox", { name: "Work item name" }),
			"Plan the offsite",
		);
		await user.click(make);
		await waitFor(() => expect(onCreated).toHaveBeenCalled());
		// every view of work is told, not only the one that mounted the dialog
		expect(screen.getByLabelText("Work version")).toHaveTextContent("1");
		expect(insight.actions.run).toHaveBeenCalledWith(
			'WorkSaveWork(title=["Plan the offsite"]);',
		);
	});

	it("says why it could not make the item and stays open", async () => {
		insight.actions.run.mockResolvedValueOnce({
			pixelReturn: [
				{ output: "Title too long", operationType: ["ERROR"] },
			],
		} as never);
		const user = userEvent.setup();
		const onCreated = setup();
		await user.click(screen.getByRole("button", { name: "New work item" }));
		await user.type(
			screen.getByRole("textbox", { name: "Work item name" }),
			"x",
		);
		await user.click(
			screen.getByRole("button", { name: "Make work item" }),
		);
		expect(
			await screen.findByText(
				"The work item was not made: Title too long",
			),
		).toBeTruthy();
		expect(onCreated).not.toHaveBeenCalled();
	});
});
