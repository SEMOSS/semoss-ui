import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { type TaskStep, TaskStepRow } from "./task-step-row";

const step: TaskStep = {
	id: "s1",
	text: "Send Kira the deck",
	kind: "task",
	status: "open",
	assigneeId: "",
	assigneeName: "",
	due: "",
	closedBy: "",
	closedText: "",
	closedSubject: "",
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
					step={{
						...step,
						status: "done",
						closedBy: "c-12",
						closedText: "Sent Kira the deck",
						closedSubject: "Deck for Friday",
					}}
					state="done"
					selfId="me"
					onChange={onChange}
				/>
			</ul>,
		);
		// a step closed from mail says so, since the owner did not close it
		expect(
			screen.getByText(
				'Marked done from "Deck for Friday": Sent Kira the deck. Reopen it if that is wrong.',
			),
		).toBeTruthy();
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

	it("sets, changes and clears a step's due date from the edit form", async () => {
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
		const openEdit = async () => {
			await user.click(
				screen.getByRole("button", {
					name: "More for: Send Kira the deck",
				}),
			);
			await user.click(screen.getByRole("menuitem", { name: "Edit" }));
		};
		await openEdit();
		fireEvent.change(screen.getByLabelText("Due"), {
			target: { value: "2026-12-03" },
		});
		await user.click(screen.getByRole("button", { name: "Save" }));
		expect(onChange).toHaveBeenLastCalledWith("s1", { due: "2026-12-03" });
		rerender(
			<ul>
				<TaskStepRow
					step={{ ...step, due: "2026-12-03T00:00:00Z" }}
					state="mine"
					selfId="me"
					onChange={onChange}
				/>
			</ul>,
		);
		await openEdit();
		expect((screen.getByLabelText("Due") as HTMLInputElement).value).toBe(
			"2026-12-03",
		);
		fireEvent.change(screen.getByLabelText("Due"), {
			target: { value: "" },
		});
		await user.click(screen.getByRole("button", { name: "Save" }));
		expect(onChange).toHaveBeenLastCalledWith("s1", { due: "" });
	});

	it("shows the due date on an open step, not on a finished one", () => {
		const dated = { ...step, due: "2026-12-03T00:00:00Z" };
		const { rerender } = render(
			<ul>
				<TaskStepRow step={dated} state="mine" selfId="me" />
			</ul>,
		);
		expect(screen.getByText(/^Due Dec 3$/)).toBeTruthy();
		rerender(
			<ul>
				<TaskStepRow
					step={{ ...dated, status: "done" }}
					state="done"
					selfId="me"
				/>
			</ul>,
		);
		expect(screen.queryByText(/^Due /)).toBeNull();
	});

	it("shows no controls without a way to save", () => {
		render(
			<ul>
				<TaskStepRow step={step} state="mine" selfId="me" />
			</ul>,
		);
		expect(screen.queryByRole("button")).toBeNull();
	});

	it("says when a step came from a conversation filed away, and says nothing otherwise", () => {
		const { rerender } = render(
			<ul>
				<TaskStepRow
					step={{ ...step, inbox: "fyi" }}
					state="mine"
					selfId="me"
				/>
			</ul>,
		);
		expect(
			screen.getByText(
				"From a conversation filed as for your information",
			),
		).toBeTruthy();
		rerender(
			<ul>
				<TaskStepRow
					step={{ ...step, inbox: "waiting" }}
					state="mine"
					selfId="me"
				/>
			</ul>,
		);
		expect(
			screen.getByText(
				"From a conversation where you are waiting on someone else",
			),
		).toBeTruthy();
		rerender(
			<ul>
				<TaskStepRow
					step={{ ...step, inbox: "needs_me" }}
					state="mine"
					selfId="me"
				/>
			</ul>,
		);
		expect(screen.queryByText(/From a conversation/)).toBeNull();
	});

	it("links a step to the conversation it came from, and says the topic of a loose step", () => {
		render(
			<MemoryRouter>
				<ul>
					<TaskStepRow
						step={{
							...step,
							threadId: "th 1",
							threadSubject: "Deck for Friday",
						}}
						state="mine"
						selfId="me"
						topicName="Launch"
					/>
				</ul>
			</MemoryRouter>,
		);
		expect(
			screen.getByRole("link", { name: "Deck for Friday" }),
		).toHaveAttribute("href", "/thread/th%201");
		expect(screen.getByText("Topic: Launch")).toBeVisible();
	});
});
