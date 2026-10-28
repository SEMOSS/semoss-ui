import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { XlsxFileAccessNotice } from "./xlsx-file-access-notice";

describe("XLSX file access notice", () => {
	it("explains an advisory recommendation and requires explicit acknowledgement", () => {
		const onEnableEditing = vi.fn();
		render(
			<XlsxFileAccessNotice
				access={{ kind: "recommended" }}
				onEnableEditing={onEnableEditing}
				onUnlock={vi.fn()}
			/>,
		);
		expect(screen.getByText(/author recommends/)).toBeVisible();
		fireEvent.click(screen.getByRole("button", { name: "Enable Editing" }));
		expect(onEnableEditing).toHaveBeenCalledOnce();
	});
	it("labels unsupported verifier fallback honestly", () => {
		render(
			<XlsxFileAccessNotice
				access={{ kind: "unsupported-password" }}
				onEnableEditing={vi.fn()}
				onUnlock={vi.fn()}
			/>,
		);
		expect(screen.getByText(/continues without verifying/)).toBeVisible();
	});
	it("validates passwords, retains a recoverable failure, and clears the password after success", async () => {
		const onUnlock = vi
			.fn()
			.mockResolvedValueOnce(false)
			.mockResolvedValueOnce(true);
		render(
			<XlsxFileAccessNotice
				access={{ kind: "password" }}
				onEnableEditing={vi.fn()}
				onUnlock={onUnlock}
			/>,
		);
		const input = screen.getByLabelText("Password to modify");
		expect(input).toHaveAttribute("type", "password");
		fireEvent.change(input, { target: { value: "incorrect" } });
		fireEvent.click(screen.getByRole("button", { name: "Enable Editing" }));
		expect(
			await screen.findByText(
				"Incorrect password to modify this workbook.",
			),
		).toBeVisible();
		fireEvent.change(input, { target: { value: "correct" } });
		fireEvent.click(screen.getByRole("button", { name: "Enable Editing" }));
		await waitFor(() => expect(input).toHaveValue(""));
		expect(onUnlock).toHaveBeenNthCalledWith(1, "incorrect");
		expect(onUnlock).toHaveBeenNthCalledWith(2, "correct");
	});
});
