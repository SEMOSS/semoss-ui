import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { useState } from "react";
import { beforeEach, expect, test, vi } from "vitest";
import type { RoomStore } from "@/stores/room/room.store";
import { PromptOptimizer } from "./PromptOptimizer";

const run = vi.hoisted(() => vi.fn());
vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ actions: { run } }),
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@/hooks/use-chat", () => ({
	useChat: () => ({ chat: { models: {} } }),
}));
const room = {
	roomId: "room",
	options: { instructions: "" },
} as unknown as RoomStore;

function Harness({ disabled = false }: { disabled?: boolean }) {
	const [input, setInput] = useState("Original draft");
	return (
		<>
			<input
				aria-label="Draft"
				value={input}
				onChange={(event) => setInput(event.target.value)}
			/>
			<PromptOptimizer
				input={input}
				setInput={setInput}
				room={room}
				disabled={disabled}
				modelId="model"
			/>
		</>
	);
}

beforeEach(() => {
	run.mockReset();
});

test("optimizes and reverts the draft from the same button", async () => {
	run.mockResolvedValue({
		pixelReturn: [{ output: { response: "Improved draft" } }],
	});
	render(<Harness />);
	fireEvent.click(screen.getByRole("button", { name: "optimizer.optimize" }));
	await waitFor(() =>
		expect(screen.getByRole("textbox")).toHaveValue("Improved draft"),
	);
	fireEvent.click(screen.getByRole("button", { name: "optimizer.revert" }));
	expect(screen.getByRole("textbox")).toHaveValue("Original draft");
	expect(run).toHaveBeenCalledTimes(1);
});

test("does not overwrite a newer draft when optimization resolves", async () => {
	let resolve: (value: unknown) => void = () => {};
	run.mockReturnValue(
		new Promise((done) => {
			resolve = done;
		}),
	);
	render(<Harness />);
	fireEvent.click(screen.getByRole("button", { name: "optimizer.optimize" }));
	fireEvent.change(screen.getByRole("textbox"), {
		target: { value: "Different prompt recalled" },
	});
	await act(async () =>
		resolve({ pixelReturn: [{ output: { response: "Stale result" } }] }),
	);
	expect(screen.getByRole("textbox")).toHaveValue(
		"Different prompt recalled",
	);
	expect(
		screen.queryByRole("button", { name: "optimizer.revert" }),
	).toBeNull();
});

test("busy state invalidates a pending optimizer reply", async () => {
	let resolve: (value: unknown) => void = () => {};
	run.mockReturnValue(
		new Promise((done) => {
			resolve = done;
		}),
	);
	const { rerender } = render(<Harness />);
	fireEvent.click(screen.getByRole("button", { name: "optimizer.optimize" }));
	rerender(<Harness disabled />);
	await act(async () =>
		resolve({ pixelReturn: [{ output: { response: "Late result" } }] }),
	);
	expect(screen.getByRole("textbox")).toHaveValue("Original draft");
	expect(
		screen.getByRole("button", { name: "optimizer.optimize" }),
	).toBeDisabled();
});

test("empty input and failures preserve the draft", async () => {
	run.mockRejectedValue(new Error("Unavailable"));
	render(<Harness />);
	fireEvent.click(screen.getByRole("button", { name: "optimizer.optimize" }));
	await waitFor(() =>
		expect(
			screen.getByRole("button", { name: "optimizer.optimize" }),
		).toBeEnabled(),
	);
	expect(screen.getByRole("textbox")).toHaveValue("Original draft");
	fireEvent.change(screen.getByRole("textbox"), { target: { value: "" } });
	expect(
		screen.getByRole("button", { name: "optimizer.optimize" }),
	).toBeDisabled();
});
