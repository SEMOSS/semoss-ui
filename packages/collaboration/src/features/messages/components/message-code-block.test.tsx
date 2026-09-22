import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MessageCodeBlock, normalizeCodeLanguage } from "./message-code-block";

describe("MessageCodeBlock", () => {
	it("falls back safely for unknown syntax labels", () => {
		expect(normalizeCodeLanguage("custom-lang")).toEqual({
			language: "txt",
			label: "CUSTOM-LANG",
		});
	});

	it("enables copy and a read-only expanded view after completion", async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, "clipboard", {
			configurable: true,
			value: { writeText },
		});
		render(<MessageCodeBlock code="const value = 1;" language="ts" />);

		fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
		await waitFor(() =>
			expect(writeText).toHaveBeenCalledWith("const value = 1;"),
		);
		fireEvent.click(screen.getByRole("button", { name: "Expand code" }));

		expect(screen.getByText("Read-only generated code.")).toBeTruthy();
		expect(
			screen.getByRole("region", { name: "Expanded TS code" }),
		).toBeTruthy();
	});

	it("keeps completion actions disabled while code is growing", () => {
		render(
			<MessageCodeBlock code="const value" language="ts" isStreaming />,
		);

		expect(screen.getByText("Generating TS…")).toBeTruthy();
		expect(
			(
				screen.getByRole("button", {
					name: "Copy code",
				}) as HTMLButtonElement
			).disabled,
		).toBe(true);
		expect(
			(
				screen.getByRole("button", {
					name: "Expand code",
				}) as HTMLButtonElement
			).disabled,
		).toBe(true);
	});
});
