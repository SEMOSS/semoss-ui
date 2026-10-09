import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EntityHeader } from "./entity-header";

const mocks = vi.hoisted(() => ({
	toastError: vi.fn(),
	toastSuccess: vi.fn(),
}));

vi.mock("@semoss/ui/next", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@semoss/ui/next")>();
	return {
		...actual,
		toast: {
			...actual.toast,
			error: mocks.toastError,
			success: mocks.toastSuccess,
		},
	};
});

/** Entity id shown under the name; not a DOM id. */
const AGENT_ID = "agent-1";

/** Render a header for "Sales Agent", renamable when `onRename` is passed. */
const renderHeader = (onRename?: (name: string) => Promise<void>) =>
	render(
		<EntityHeader
			name="Sales Agent"
			id={AGENT_ID}
			onRename={onRename}
			renameLabel="Rename Agent"
		/>,
	);

const getRenameButton = () =>
	screen.getByRole("button", { name: "Rename Agent" });

const queryRenameInput = () =>
	screen.queryByRole("textbox", { name: "Rename Agent" });

/** Open the rename input from the rename button. */
const startRename = (): HTMLInputElement => {
	fireEvent.click(getRenameButton());
	return screen.getByRole("textbox", { name: "Rename Agent" });
};

describe("EntityHeader rename", () => {
	afterEach(() => {
		cleanup();
		mocks.toastError.mockReset();
		mocks.toastSuccess.mockReset();
	});

	it("shows only the name when it cannot be renamed", () => {
		renderHeader();

		expect(
			screen.getByRole("heading", { name: "Sales Agent" }),
		).toBeTruthy();
		expect(
			screen.queryByRole("button", { name: "Rename Agent" }),
		).toBeNull();
	});

	it("saves the trimmed name on Enter and returns focus to the rename button", async () => {
		const onRename = vi.fn().mockResolvedValue(undefined);
		renderHeader(onRename);

		const input = startRename();
		expect(input.value).toBe("Sales Agent");
		fireEvent.change(input, { target: { value: "  Revenue Agent  " } });
		fireEvent.keyDown(input, { key: "Enter" });

		expect(onRename).toHaveBeenCalledTimes(1);
		expect(onRename).toHaveBeenCalledWith("Revenue Agent");
		await waitFor(() =>
			expect(mocks.toastSuccess).toHaveBeenCalledWith(
				'Renamed to "Revenue Agent"',
			),
		);
		await waitFor(() =>
			expect(document.activeElement).toBe(getRenameButton()),
		);
	});

	it("opens when the name is double-clicked", () => {
		renderHeader(vi.fn());

		fireEvent.doubleClick(
			screen.getByRole("heading", { name: "Sales Agent" }),
		);

		expect(queryRenameInput()).toBeTruthy();
	});

	it("saves when the input loses focus", async () => {
		const onRename = vi.fn().mockResolvedValue(undefined);
		renderHeader(onRename);

		const input = startRename();
		fireEvent.change(input, { target: { value: "Revenue Agent" } });
		fireEvent.blur(input);

		expect(onRename).toHaveBeenCalledWith("Revenue Agent");
		await waitFor(() => expect(queryRenameInput()).toBeNull());
	});

	it("cancels on Escape without saving", () => {
		const onRename = vi.fn();
		renderHeader(onRename);

		const input = startRename();
		fireEvent.change(input, { target: { value: "Revenue Agent" } });
		fireEvent.keyDown(input, { key: "Escape" });

		expect(onRename).not.toHaveBeenCalled();
		expect(queryRenameInput()).toBeNull();
		expect(document.activeElement).toBe(getRenameButton());
	});

	it("skips saving a blank or unchanged name", async () => {
		const onRename = vi.fn();
		renderHeader(onRename);

		fireEvent.keyDown(startRename(), { key: "Enter" });
		await waitFor(() => expect(queryRenameInput()).toBeNull());

		const input = startRename();
		fireEvent.change(input, { target: { value: "   " } });
		fireEvent.keyDown(input, { key: "Enter" });

		expect(onRename).not.toHaveBeenCalled();
		expect(mocks.toastSuccess).not.toHaveBeenCalled();
	});

	it("shows a spinner while the name is saving", async () => {
		let finishSave = () => {};
		const onRename = vi.fn(
			() =>
				new Promise<void>((resolve) => {
					finishSave = resolve;
				}),
		);
		renderHeader(onRename);

		const input = startRename();
		fireEvent.change(input, { target: { value: "Revenue Agent" } });
		fireEvent.keyDown(input, { key: "Enter" });

		expect(
			screen.getByRole("status", { name: "Saving name" }),
		).toBeTruthy();
		expect(input.getAttribute("aria-busy")).toBe("true");

		finishSave();
		await waitFor(() => expect(queryRenameInput()).toBeNull());
	});

	it("reports a failed save and keeps the current name", async () => {
		const onRename = vi.fn().mockRejectedValue(new Error("Not the owner"));
		renderHeader(onRename);

		const input = startRename();
		fireEvent.change(input, { target: { value: "Revenue Agent" } });
		fireEvent.keyDown(input, { key: "Enter" });

		await waitFor(() =>
			expect(mocks.toastError).toHaveBeenCalledWith(
				`Couldn't rename to "Revenue Agent"`,
				{ description: "Not the owner" },
			),
		);
		expect(mocks.toastSuccess).not.toHaveBeenCalled();
		expect(
			screen.getByRole("heading", { name: "Sales Agent" }),
		).toBeTruthy();
	});
});

describe("EntityHeader slots", () => {
	afterEach(() => {
		cleanup();
	});

	it("shows what follows the name and the description below it", () => {
		render(
			<EntityHeader
				name="Sales Team"
				nameAddon={<span>Custom</span>}
				description={<p>Everyone in sales</p>}
			/>,
		);

		const heading = screen.getByRole("heading", { name: "Sales Team" });
		const addon = screen.getByText("Custom");
		// the addon sits in the same row as the name
		expect(heading.parentElement).toBe(addon.parentElement);
		expect(screen.getByText("Everyone in sales")).toBeTruthy();
	});

	it("shows only the name without the slots", () => {
		const { container } = render(<EntityHeader name="Sales Team" />);

		const heading = screen.getByRole("heading", { name: "Sales Team" });
		expect(heading.parentElement?.childElementCount).toBe(1);
		expect(container.querySelectorAll("p")).toHaveLength(0);
	});
});
