import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SettingsLinkField } from "./settings-link-field";

afterEach(cleanup);

describe("SettingsLinkField", () => {
	it("shows the link with buttons to copy it and open it in a new tab", () => {
		render(
			<SettingsLinkField
				label="Share Link"
				description="Opens the app in this platform."
				url="https://example.com/#/s/app-1"
				testIdPrefix="test-share"
			/>,
		);

		expect(screen.getByLabelText("Share Link")).toHaveValue(
			"https://example.com/#/s/app-1",
		);
		expect(screen.getByLabelText("Share Link")).toHaveAccessibleDescription(
			"Opens the app in this platform.",
		);
		expect(
			screen.getByRole("button", { name: "Copy Share Link" }),
		).toBeEnabled();
		const open = screen.getByRole("link", {
			name: "Open Share Link in a new tab",
		});
		expect(open).toHaveAttribute("href", "https://example.com/#/s/app-1");
		expect(open).toHaveAttribute("target", "_blank");
	});

	it("disables both buttons while there is no link", () => {
		render(
			<SettingsLinkField
				label="Portal Link"
				description="Publish the portal to get its link."
				url=""
				emptyText="Not published yet"
				testIdPrefix="test-portal"
			/>,
		);

		expect(screen.getByLabelText("Portal Link")).toHaveAttribute(
			"placeholder",
			"Not published yet",
		);
		expect(
			screen.getByRole("button", { name: "Copy Portal Link" }),
		).toBeDisabled();
		expect(
			screen.getByRole("button", {
				name: "Open Portal Link in a new tab",
			}),
		).toBeDisabled();
		expect(screen.queryByRole("link")).not.toBeInTheDocument();
	});
});
