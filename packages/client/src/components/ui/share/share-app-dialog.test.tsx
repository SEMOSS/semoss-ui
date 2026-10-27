import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAppShareUrl } from "./app-share-url";
import { ShareAppDialog } from "./share-app-dialog";

const writeText = vi.fn();

beforeEach(() => {
	writeText.mockReset().mockResolvedValue(undefined);
	Object.defineProperty(navigator, "clipboard", {
		value: { writeText },
		configurable: true,
	});
});

afterEach(cleanup);

/** Renders the dialog open on an app */
const renderDialog = (hasUnsavedChanges = false) =>
	render(
		<ShareAppDialog
			appId="share-app"
			open
			onOpenChange={vi.fn()}
			hasUnsavedChanges={hasUnsavedChanges}
		/>,
	);

describe("ShareAppDialog", () => {
	it("opens with the link selected", async () => {
		renderDialog();

		const link = screen.getByRole("textbox", { name: "App link" });
		expect(link).toHaveValue(getAppShareUrl("share-app"));
		await waitFor(() => expect(link).toHaveFocus());
		expect(link).toHaveProperty("selectionStart", 0);
		expect(link).toHaveProperty(
			"selectionEnd",
			getAppShareUrl("share-app").length,
		);
	});

	it("opens the app in a new tab", () => {
		renderDialog();

		const open = screen.getByRole("link", {
			name: "Open the app in a new tab",
		});
		expect(open).toHaveAttribute("href", getAppShareUrl("share-app"));
		expect(open).toHaveAttribute("target", "_blank");
	});

	it("copies the link", async () => {
		renderDialog();

		fireEvent.click(screen.getByRole("button", { name: "Copy link" }));

		await waitFor(() =>
			expect(writeText).toHaveBeenCalledWith(getAppShareUrl("share-app")),
		);
	});

	it("copies the embed code from the Embed tab", async () => {
		renderDialog();

		fireEvent.mouseDown(screen.getByRole("tab", { name: "Embed" }));
		const code = await screen.findByRole("textbox", { name: "Embed code" });
		expect(
			screen.getByDisplayValue((value) =>
				value.includes(`src="${getAppShareUrl("share-app")}"`),
			),
		).toBe(code);
		fireEvent.click(
			screen.getByRole("button", { name: "Copy embed code" }),
		);

		await waitFor(() =>
			expect(writeText).toHaveBeenCalledWith(
				expect.stringContaining("<iframe"),
			),
		);
	});

	it("warns only when the app has changes that are not saved", () => {
		const { rerender } = renderDialog();
		expect(
			screen.queryByText(/Save the app first/),
		).not.toBeInTheDocument();

		rerender(
			<ShareAppDialog
				appId="share-app"
				open
				onOpenChange={vi.fn()}
				hasUnsavedChanges
			/>,
		);

		expect(screen.getByText(/Save the app first/)).toBeInTheDocument();
	});
});
