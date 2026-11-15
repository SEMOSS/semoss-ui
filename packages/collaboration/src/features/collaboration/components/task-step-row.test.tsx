import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { type TaskStep, TaskStepRow } from "./task-step-row";

const step: TaskStep = {
	id: "s1",
	text: "Send Kira the deck",
	kind: "task",
	status: "open",
	assigneeId: "",
	assigneeName: "",
	closedBy: "",
};

describe("TaskStepRow", () => {
	afterEach(cleanup);

	it("marks the owner's step done and reopens a finished one", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		const { rerender } = render(
			<ul>
				<TaskStepRow
					step={step}
					state="mine"
					selfId="me"
					onChange={onChange}
				/>
			</ul>,
		);
		await user.click(
			screen.getByRole("button", {
				name: "Mark done: Send Kira the deck",
			}),
		);
		expect(onChange).toHaveBeenLastCalledWith("s1", { status: "done" });
		rerender(
			<ul>
				<TaskStepRow
					step={{ ...step, status: "done", closedBy: "c-12" }}
					state="done"
					selfId="me"
					onChange={onChange}
				/>
			</ul>,
		);
		// a step closed from mail says so, since the owner did not close it
		expect(screen.getByText(/Marked done from a message/)).toBeTruthy();
		await user.click(
			screen.getByRole("button", { name: "Reopen: Send Kira the deck" }),
		);
		expect(onChange).toHaveBeenLastCalledWith("s1", { status: "open" });
	});

	it("drops a step that is not the owner's and remembers why", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<ul>
				<TaskStepRow
					step={step}
					state="mine"
					selfId="me"
					onChange={onChange}
				/>
			</ul>,
		);
		await user.click(
			screen.getByRole("button", {
				name: "More for: Send Kira the deck",
			}),
		);
		await user.click(screen.getByRole("menuitem", { name: "Not mine" }));
		expect(onChange).toHaveBeenCalledWith("s1", {
			status: "dropped",
			note: "not mine",
		});
	});

	it("takes over a step someone else was given", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<ul>
				<TaskStepRow
					step={{ ...step, assigneeId: "p2", assigneeName: "Kira" }}
					state="waiting"
					selfId="me"
					onChange={onChange}
				/>
			</ul>,
		);
		await user.click(
			screen.getByRole("button", {
				name: "More for: Send Kira the deck",
			}),
		);
		await user.click(
			screen.getByRole("menuitem", { name: "This is mine" }),
		);
		expect(onChange).toHaveBeenCalledWith("s1", {
			status: "open",
			assigneeId: "me",
		});
	});

	it("saves an edited step and leaves an unchanged one alone", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<ul>
				<TaskStepRow
					step={step}
					state="mine"
					selfId="me"
					onChange={onChange}
				/>
			</ul>,
		);
		await user.click(
			screen.getByRole("button", {
				name: "More for: Send Kira the deck",
			}),
		);
		await user.click(screen.getByRole("menuitem", { name: "Edit" }));
		const input = screen.getByRole("textbox", { name: "Step" });
		await user.clear(input);
		await user.type(input, "Send Kira the final deck{Enter}");
		expect(onChange).toHaveBeenCalledWith("s1", {
			text: "Send Kira the final deck",
		});
	});

	it("shows no controls without a way to save", () => {
		render(
			<ul>
				<TaskStepRow step={step} state="mine" selfId="me" />
			</ul>,
		);
		expect(screen.queryByRole("button")).toBeNull();
	});
});
