import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { RoomStore } from "@/stores";
import { NotebookPreviewBlock } from "./notebook-preview-block";

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

// the notebook records the insight it is given; the editor is not under test
vi.mock("@semoss/shared", async (original) => ({
	...(await original<typeof import("@semoss/shared")>()),
	Notebook: ({ insightId }: { insightId: string }) => (
		<p>Notebook in {insightId}</p>
	),
}));

vi.mock("./save-file-dialog", () => ({ SaveFileDialog: () => null }));

/** A one-cell notebook, as a fenced `ipynb` block holds it. */
const CONTENT = JSON.stringify({
	cells: [
		{
			cell_type: "code",
			id: "cell-1",
			metadata: {},
			source: ["print(1)"],
			outputs: [],
			execution_count: null,
		},
	],
	metadata: {},
	nbformat: 4,
	nbformat_minor: 5,
});

const roomWith = (insightId: string) => ({ insightId }) as RoomStore;

afterEach(cleanup);

it("runs the notebook in the room's insight", () => {
	render(
		<NotebookPreviewBlock content={CONTENT} room={roomWith("room-1")} />,
	);

	expect(screen.getByText("Notebook in room-1")).toBeVisible();
});

it("shows a draft's notebook read-only until its room is prepared", () => {
	render(<NotebookPreviewBlock content={CONTENT} room={roomWith("new")} />);

	expect(screen.queryByText(/Notebook in/)).not.toBeInTheDocument();
	expect(screen.getByRole("button", { name: "Run all" })).toBeDisabled();
});
