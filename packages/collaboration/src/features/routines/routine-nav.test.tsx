import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Inbox, Receipt, Repeat } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RoutineNav } from "./routine-nav";

afterEach(cleanup);

describe("RoutineNav", () => {
	it("names each routine by its name, describes its state, and marks the open one", async () => {
		const onSelect = vi.fn();
		render(
			<RoutineNav
				label="System routines"
				entries={[
					{
						id: "inbox",
						name: "Inbox daily brief",
						icon: Inbox,
						enabled: true,
						lastStatus: "completed",
					},
					{
						id: "expense",
						name: "Expense review",
						icon: Receipt,
						enabled: false,
						lastStatus: "failed",
					},
					{ id: "custom", name: "Client asks digest", icon: Repeat },
				]}
				selected="inbox"
				onSelect={onSelect}
			/>,
		);

		const inbox = screen.getByRole("button", { name: "Inbox daily brief" });
		expect(inbox).toHaveAttribute("aria-current", "true");
		// a completed run is left to the detail
		expect(inbox).toHaveAccessibleDescription("On");
		const expense = screen.getByRole("button", { name: "Expense review" });
		expect(expense).not.toHaveAttribute("aria-current");
		expect(expense).toHaveAccessibleDescription("Off · Last run failed");
		// not loaded yet, so there is no state to describe
		expect(
			screen.getByRole("button", { name: "Client asks digest" }),
		).toHaveAccessibleDescription("");

		await userEvent.setup().click(expense);
		expect(onSelect).toHaveBeenCalledWith("expense");
	});
});
