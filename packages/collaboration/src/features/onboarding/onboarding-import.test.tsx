import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import { ImportStep } from "./onboarding-steps";

const completed = {
	id: "old-import",
	status: "done",
	step: "done",
	progress: 100,
	counts: { messages: 100, threads: 100 },
};
function response(output: unknown) {
	return { pixelReturn: [{ output, operationType: ["MAP"] }] };
}
function mount(start: () => Promise<unknown>) {
	const run = vi.fn(async (statement: string) => {
		if (statement.startsWith("BrainGetJob(")) return response(completed);
		if (statement.startsWith("BrainImportMail("))
			return response(await start());
		throw new Error(`Unexpected request: ${statement}`);
	});
	const onNext = vi.fn();
	render(
		<ImportStep
			actions={{ run } as unknown as InsightActions}
			days={30}
			onNext={onNext}
			onManager={vi.fn()}
			eyebrow="Step 3 of 7"
		/>,
	);
	return { run, onNext };
}
afterEach(cleanup);

describe("importing updated fixtures after a completed import", () => {
	it("shows Import again and starts a new job rather than reusing the old completion", async () => {
		let resolve: (value: unknown) => void = () => {};
		const { run, onNext } = mount(
			() =>
				new Promise((done) => {
					resolve = done;
				}),
		);
		const importAgain = await screen.findByRole("button", {
			name: "Import again",
		});
		expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
		await userEvent.click(importAgain);
		expect(run).toHaveBeenCalledWith(
			"BrainImportMail(days=[30], teams=[true]);",
		);
		expect(
			screen.getByRole("button", { name: "Starting import…" }),
		).toBeDisabled();
		expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
		expect(onNext).not.toHaveBeenCalled();
		await act(async () =>
			resolve({
				id: "new-import",
				status: "running",
				progress: 5,
				step: "reading inbox",
				counts: {},
			}),
		);
		await waitFor(() =>
			expect(
				screen.queryByRole("button", { name: "Continue" }),
			).not.toBeInTheDocument(),
		);
		expect(screen.getByText("importing")).toBeInTheDocument();
	});

	it("keeps rerun available after a start failure", async () => {
		const start = vi
			.fn()
			.mockRejectedValueOnce(new Error("Fixture unavailable"))
			.mockResolvedValue({ ...completed, id: "new-import" });
		const { run } = mount(start);
		await userEvent.click(
			await screen.findByRole("button", { name: "Import again" }),
		);
		await screen.findByText("Fixture unavailable");
		const retry = screen.getByRole("button", { name: "Import again" });
		expect(retry).toBeEnabled();
		await userEvent.click(retry);
		await waitFor(() => expect(start).toHaveBeenCalledTimes(2));
		expect(
			run.mock.calls.filter(([stmt]) =>
				stmt.startsWith("BrainImportMail("),
			),
		).toHaveLength(2);
	});
});
