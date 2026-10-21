import { act, fireEvent, render, screen } from "@testing-library/react";
import { animationClock } from "../test-utils/animation-clock";
import { MessageMarkdown } from "./message-markdown";

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

it("keeps the same code scroller when its fence closes and more prose follows", async () => {
	animationClock();
	const { rerender } = render(
		<MessageMarkdown
			text={"Before\n\n```ts\nconst value = 1;"}
			isStreaming
			shouldFlush
		/>,
	);
	const scroller = screen.getByRole("region", { name: "TS code" });
	scroller.scrollTop = 120;
	fireEvent.focus(scroller);
	expect(screen.queryByRole("button", { name: "Expand code" })).toBeNull();
	rerender(
		<MessageMarkdown
			text={"Before\n\n```ts\nconst value = 1;\n```\n\nAfter"}
			isStreaming
			shouldFlush
		/>,
	);
	expect(screen.getByRole("region", { name: "TS code" })).toBe(scroller);
	expect(scroller.scrollTop).toBe(120);
	expect(screen.getByRole("button", { name: "Expand code" })).toBeEnabled();
	expect(screen.getByText("After")).toBeVisible();
	rerender(
		<MessageMarkdown
			text={"Before\n\n```ts\nconst value = 1;\n```\n\nAfter"}
			isStreaming={false}
		/>,
	);
	expect(screen.getByRole("region", { name: "TS code" })).toBe(scroller);
	await act(async () => {
		await new Promise((resolve) => setTimeout(resolve, 0));
	});
});

it("only treats the unfinished fence as streaming and preserves GFM content", async () => {
	animationClock();
	render(
		<MessageMarkdown
			text={
				"| A | B |\n|---|---|\n| 1 | 2 |\n\n~~~js\none()\n~~~\n\n```python\nprint(2)"
			}
			isStreaming
		/>,
	);
	expect(screen.getByRole("table")).toBeVisible();
	const actions = screen.getAllByRole("button", { name: "Expand code" });
	expect(actions[0]).toBeEnabled();
	expect(actions).toHaveLength(1);
	await act(async () => {
		await new Promise((resolve) => setTimeout(resolve, 0));
	});
});

it("defers highlighting for indented unfinished fences too", () => {
	animationClock();
	render(
		<MessageMarkdown text={"   ```ts\n   const value = 1;"} isStreaming />,
	);
	expect(screen.getByRole("region", { name: "TS code" })).toHaveTextContent(
		"const value = 1;",
	);
	expect(screen.queryByRole("button", { name: "Expand code" })).toBeNull();
});
