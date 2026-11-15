import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { TaskItemControls, type TaskItemFields } from "./task-item-controls";

const item: TaskItemFields = {
	title: "Ship the release",
	status: "active",
	due: "2026-12-01T00:00:00Z",
	priority: "medium",
};

beforeAll(() => {
	// JSDOM does not provide the pointer-capture APIs used by the shared Select.
	HTMLElement.prototype.hasPointerCapture = () => false;
	HTMLElement.prototype.releasePointerCapture = () => undefined;
});

describe("TaskItemControls", () => {
	afterEach(cleanup);

	it("renames the item and ignores an unchanged name", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<TaskItemControls item={item} onChange={onChange} />);
		await user.click(screen.getByRole("button", { name: "Rename" }));
		const input = screen.getByRole("textbox", { name: "Work item name" });
		await user.clear(input);
		await user.type(input, "Ship the 6.0 release{Enter}");
		expect(onChange).toHaveBeenCalledWith({
			title: "Ship the 6.0 release",
		});
		onChange.mockClear();
		await user.click(screen.getByRole("button", { name: "Rename" }));
		await user.type(
			screen.getByRole("textbox", { name: "Work item name" }),
			"{Enter}",
		);
		expect(onChange).not.toHaveBeenCalled();
	});

	it("sets and clears the due date", () => {
		const onChange = vi.fn();
		render(<TaskItemControls item={item} onChange={onChange} />);
		const due = screen.getByLabelText("Work item due");
		expect((due as HTMLInputElement).value).toBe("2026-12-01");
		fireEvent.change(due, { target: { value: "2026-12-15" } });
		expect(onChange).toHaveBeenLastCalledWith({ due: "2026-12-15" });
		fireEvent.change(due, { target: { value: "" } });
		expect(onChange).toHaveBeenLastCalledWith({ due: "" });
	});

	it("sets the priority", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<TaskItemControls item={item} onChange={onChange} />);
		await user.click(screen.getByRole("combobox", { name: "Priority" }));
		await user.click(screen.getByRole("option", { name: "High" }));
		expect(onChange).toHaveBeenCalledWith({ priority: "high" });
	});

	it("marks the whole item done, and reopens a done one", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		const { rerender } = render(
			<TaskItemControls item={item} onChange={onChange} />,
		);
		await user.click(
			screen.getByRole("button", { name: "Mark work item done" }),
		);
		expect(onChange).toHaveBeenLastCalledWith({ status: "done" });
		rerender(
			<TaskItemControls
				item={{ ...item, status: "done" }}
				onChange={onChange}
			/>,
		);
		await user.click(
			screen.getByRole("button", { name: "Reopen work item" }),
		);
		expect(onChange).toHaveBeenLastCalledWith({ status: "active" });
	});

	it("waits while a change is saving", () => {
		render(<TaskItemControls item={item} onChange={vi.fn()} isBusy />);
		expect(
			(
				screen.getByRole("button", {
					name: "Mark work item done",
				}) as HTMLButtonElement
			).disabled,
		).toBe(true);
	});
});
