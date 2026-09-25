import { render, screen } from "@testing-library/react";
import { Button } from "@semoss/ui/next";
import { PageContainer } from "./page-container";
import { PageHeader } from "./page-header";

describe("PageHeader", () => {
	it("uses the shared page width and responsive header layout", () => {
		render(
			<PageContainer>
				<PageHeader
					eyebrow="Page context"
					title="Page title"
					description="Page description"
					action={<Button>Primary action</Button>}
				/>
			</PageContainer>,
		);

		const page = screen.getByRole("main");
		expect(page).toHaveClass("w-full", "max-w-7xl", "p-4", "md:p-6");

		const heading = screen.getByRole("heading", {
			level: 3,
			name: "Page title",
		});
		expect(heading).toBeVisible();
		expect(screen.getByText("Page description")).toBeVisible();

		const header = heading.closest("header");
		expect(header).toHaveClass("flex-col", "sm:flex-row");
		expect(
			screen.getByRole("button", { name: "Primary action" })
				.parentElement,
		).toHaveClass("w-full", "sm:w-auto");
	});
});
