import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MyAccessRequest } from "@/api/user-access";
import { MyAccessRequestNotice } from "./my-access-request-notice";

/** A request for Editor access with a reason */
const REQUEST: MyAccessRequest = {
	id: "r1",
	permission: "EDIT",
	comment: "I need to update the forms",
	requestedAt: "2026-11-15T10:00:00Z",
};

/** Renders the notice, returning its callbacks */
const renderNotice = (onWithdraw = vi.fn().mockResolvedValue(undefined)) => {
	const onChange = vi.fn();
	render(
		<MyAccessRequestNotice
			request={REQUEST}
			noun="app"
			onChange={onChange}
			onWithdraw={onWithdraw}
		/>,
	);
	return { onChange, onWithdraw };
};

describe("MyAccessRequestNotice", () => {
	beforeEach(() => {
		vi.stubGlobal(
			"ResizeObserver",
			class {
				observe() {}
				unobserve() {}
				disconnect() {}
			},
		);
	});

	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
	});

	it("shows the level asked for and the reason given", () => {
		renderNotice();

		expect(
			screen.getByText("You asked for Editor access"),
		).toBeInTheDocument();
		expect(
			screen.getByText("I need to update the forms"),
		).toBeInTheDocument();
		expect(
			screen.getByText(/The app's owners have not decided yet/),
		).toBeInTheDocument();
	});

	it("opens the request dialog to change the request", () => {
		const { onChange } = renderNotice();

		fireEvent.click(screen.getByRole("button", { name: "Change Request" }));

		expect(onChange).toHaveBeenCalledOnce();
	});

	it("withdraws only after a confirmation", async () => {
		const { onWithdraw } = renderNotice();

		fireEvent.click(
			screen.getByRole("button", { name: "Withdraw Request" }),
		);
		expect(onWithdraw).not.toHaveBeenCalled();
		const dialog = await screen.findByRole("dialog");
		fireEvent.click(
			within(dialog).getByRole("button", { name: "Withdraw Request" }),
		);

		await waitFor(() => expect(onWithdraw).toHaveBeenCalledOnce());
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
	});

	it("keeps the confirmation open with the backend's reason when it fails", async () => {
		renderNotice(
			vi
				.fn()
				.mockRejectedValue(
					new Error(
						"You have no access request waiting on this project",
					),
				),
		);

		fireEvent.click(
			screen.getByRole("button", { name: "Withdraw Request" }),
		);
		const dialog = await screen.findByRole("dialog");
		fireEvent.click(
			within(dialog).getByRole("button", { name: "Withdraw Request" }),
		);

		expect(
			await within(dialog).findByText(
				"You have no access request waiting on this project",
			),
		).toBeInTheDocument();
		expect(screen.getByRole("dialog")).toBeInTheDocument();
	});
});
