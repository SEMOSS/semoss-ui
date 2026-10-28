import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { VisioTextEditNotice } from "./visio-text-edit-notice";

it("shows the refusal and copyable draft until deliberately dismissed", () => {
	const onDismiss = vi.fn();
	render(
		<VisioTextEditNotice
			failure={{
				pageId: "0",
				shapeId: "1",
				text: "Keep my text\n<script>literal</script>",
				message: "Dynamic formulas cannot be safely edited.",
			}}
			onDismiss={onDismiss}
		/>,
	);
	expect(screen.getByRole("alert")).toHaveTextContent(
		"Text edit could not be applied",
	);
	expect(
		screen.getByText("Dynamic formulas cannot be safely edited."),
	).toBeVisible();
	expect(
		screen.getByRole("textbox", { name: "Unapplied shape text" }),
	).toHaveValue("Keep my text\n<script>literal</script>");
	fireEvent.click(screen.getByRole("button", { name: "Dismiss draft" }));
	expect(onDismiss).toHaveBeenCalledOnce();
});
