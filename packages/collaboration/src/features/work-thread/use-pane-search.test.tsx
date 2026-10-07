import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useId, useState } from "react";
import { TooltipProvider } from "@semoss/ui/next";
import { PaneSearch } from "./pane-search";
import { usePaneSearch } from "./use-pane-search";

function Harness({ older = false }: { older?: boolean }) {
	const search = usePaneSearch("section, details");
	const [open, setOpen] = useState(false);
	const id = useId();
	return (
		<TooltipProvider>
			<PaneSearch search={search} label="Search context" />
			<div ref={search.viewportRef}>
				<section data-testid="parent">
					Launch plan{" "}
					<details>
						<summary>Details</summary>Nested information
					</details>
				</section>
				<section data-testid="controlled">
					<button
						type="button"
						aria-controls={id}
						aria-expanded={open}
						onClick={() => setOpen(!open)}
					>
						Show notes
					</button>
					<div id={id} hidden={!open}>
						Confidential milestone
					</div>
				</section>
				{older && <section>Older launch plan</section>}
			</div>
		</TooltipProvider>
	);
}

it("indexes parent sections with nested disclosures and updates when content is added", async () => {
	const { rerender } = render(<Harness />);
	fireEvent.change(screen.getByRole("searchbox"), {
		target: { value: "LAUNCH" },
	});
	expect(screen.getByRole("status")).toHaveTextContent("0 / 1");
	fireEvent.click(
		screen.getByRole("button", { name: "Next match: Search context" }),
	);
	expect(screen.getByTestId("parent")).toHaveAttribute(
		"data-search-current",
		"true",
	);
	rerender(<Harness older />);
	await waitFor(() =>
		expect(screen.getByRole("status")).toHaveTextContent("1 / 2"),
	);
	fireEvent.click(
		screen.getByRole("button", { name: "Previous match: Search context" }),
	);
	expect(screen.getByRole("status")).toHaveTextContent("2 / 2");
});

it("opens the matching controlled section and clears markers without hiding content", () => {
	render(<Harness />);
	fireEvent.change(screen.getByRole("searchbox"), {
		target: { value: "milestone" },
	});
	fireEvent.click(
		screen.getByRole("button", { name: "Next match: Search context" }),
	);
	expect(screen.getByText("Confidential milestone")).toBeVisible();
	expect(screen.getByTestId("controlled")).toHaveAttribute(
		"data-search-current",
		"true",
	);
	fireEvent.click(
		screen.getByRole("button", { name: "Clear search context" }),
	);
	expect(screen.getByTestId("controlled")).not.toHaveAttribute(
		"data-search-current",
	);
	expect(screen.getByText("Confidential milestone")).toBeVisible();
	fireEvent.change(screen.getByRole("searchbox"), {
		target: { value: "unmatched" },
	});
	expect(screen.getByRole("status")).toHaveTextContent("No matches");
	expect(
		screen.getByRole("button", { name: "Next match: Search context" }),
	).toBeDisabled();
});
