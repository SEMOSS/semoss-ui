import "@testing-library/jest-dom";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { HttpError } from "@semoss/sdk";
import {
	updateDatabaseSmssProperties,
	updateProjectSmssProperties,
} from "@/api";
import { UpdateSMSS } from "./update-smss";

class ResizeObserverMock {
	observe() {}
	unobserve() {}
	disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);

const ENGINE_ID = "db-1";

const READ = vi.hoisted(() => ({
	current: { smss: "ENGINE\tdb-1\n", smssHash: "hash-1" },
	refresh: (() => {}) as () => void,
	adminMode: false,
}));

vi.mock("@semoss/sdk/react", () => ({
	usePixel: () => ({
		status: "SUCCESS",
		data: READ.current,
		error: undefined,
		refresh: () => READ.refresh(),
	}),
}));

vi.mock("@semoss/shared", () => ({
	MonacoEditor: ({
		value,
		onChange,
		options,
	}: {
		value: string;
		onChange: (value: string) => void;
		options: { readOnly: boolean };
	}) => (
		<textarea
			aria-label="SMSS"
			value={value}
			readOnly={options.readOnly}
			onChange={(event) => onChange(event.target.value)}
		/>
	),
}));

vi.mock("@/api", () => ({
	updateDatabaseSmssProperties: vi.fn(),
	updateProjectSmssProperties: vi.fn(),
}));

vi.mock("@/hooks", () => ({
	useSettings: () => ({ adminMode: READ.adminMode }),
}));

/** Renders the editor, unlocks it and types new text into it. */
const editSmss = (text: string, type: "DATABASE" | "PROJECT" = "DATABASE") => {
	render(<UpdateSMSS type={type} id={ENGINE_ID} />);
	fireEvent.click(screen.getByRole("button", { name: "Unlock Editor" }));
	fireEvent.change(screen.getByRole("textbox", { name: "SMSS" }), {
		target: { value: text },
	});
};

const save = () =>
	fireEvent.click(
		screen.getByRole("button", { name: "Update SMSS Properties" }),
	);

const changedSinceRead = () =>
	new HttpError("The SMSS changed since it was read", 409, {
		errorMessage: "The SMSS changed since it was read",
		errorCode: "SMSS_CHANGED",
	});

describe("UpdateSMSS", () => {
	beforeEach(() => {
		READ.current = { smss: "ENGINE\tdb-1\n", smssHash: "hash-1" };
		READ.refresh = vi.fn();
		READ.adminMode = false;
		vi.mocked(updateDatabaseSmssProperties).mockReset();
		vi.mocked(updateProjectSmssProperties).mockReset();
	});

	afterEach(() => {
		cleanup();
	});

	test("a save sends the hash the SMSS was read with", async () => {
		vi.mocked(updateDatabaseSmssProperties).mockResolvedValue({
			data: { success: true, smssHash: "hash-2" },
		} as never);
		editSmss("ENGINE\tdb-1\nNEW\tvalue\n");

		save();

		await waitFor(() =>
			expect(updateDatabaseSmssProperties).toHaveBeenCalledWith(
				"db-1",
				"ENGINE\tdb-1\nNEW\tvalue\n",
				"hash-1",
				false,
			),
		);
		expect(READ.refresh).toHaveBeenCalledTimes(1);
	});

	test("a project's save sends its hash in admin mode", async () => {
		READ.adminMode = true;
		vi.mocked(updateProjectSmssProperties).mockResolvedValue({
			data: { success: true, smssHash: "hash-2" },
		} as never);
		editSmss("PROJECT\tdb-1\n", "PROJECT");

		save();

		await waitFor(() =>
			expect(updateProjectSmssProperties).toHaveBeenCalledWith(
				"db-1",
				"PROJECT\tdb-1\n",
				"hash-1",
				true,
			),
		);
	});

	test("a save refused because the SMSS changed keeps the edits and says so", async () => {
		vi.mocked(updateDatabaseSmssProperties).mockRejectedValue(
			changedSinceRead(),
		);
		editSmss("ENGINE\tdb-1\nMINE\tvalue\n");

		save();

		const alert = await screen.findByRole("alert");
		expect(
			within(alert).getByText("This SMSS changed since you opened it"),
		).toBeInTheDocument();
		expect(screen.getByRole("textbox", { name: "SMSS" })).toHaveValue(
			"ENGINE\tdb-1\nMINE\tvalue\n",
		);
		expect(
			screen.getByRole("button", { name: "Lock Editor" }),
		).toBeInTheDocument();
		expect(READ.refresh).not.toHaveBeenCalled();
	});

	test("Load Latest asks before it drops the edits, then reads the SMSS again", async () => {
		vi.mocked(updateDatabaseSmssProperties).mockRejectedValue(
			changedSinceRead(),
		);
		editSmss("ENGINE\tdb-1\nMINE\tvalue\n");
		save();
		const alert = await screen.findByRole("alert");

		fireEvent.click(
			within(alert).getByRole("button", { name: "Load Latest" }),
		);

		const dialog = await screen.findByRole("dialog", {
			name: "Load the latest SMSS?",
		});
		expect(
			within(dialog).getByText("Your unsaved changes will be lost."),
		).toBeInTheDocument();
		expect(READ.refresh).not.toHaveBeenCalled();

		fireEvent.click(
			within(dialog).getByRole("button", { name: "Load Latest" }),
		);

		expect(READ.refresh).toHaveBeenCalledTimes(1);
		await waitFor(() =>
			expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
		);
	});

	test("Refresh asks first when there are unsaved edits, and keeps them on Cancel", async () => {
		editSmss("ENGINE\tdb-1\nMINE\tvalue\n");

		fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

		const dialog = await screen.findByRole("dialog", {
			name: "Load the latest SMSS?",
		});
		fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
		expect(READ.refresh).not.toHaveBeenCalled();
		expect(screen.getByRole("textbox", { name: "SMSS" })).toHaveValue(
			"ENGINE\tdb-1\nMINE\tvalue\n",
		);
	});

	test("Refresh with nothing unsaved reads the SMSS again at once", () => {
		render(<UpdateSMSS type="DATABASE" id={ENGINE_ID} />);

		fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

		expect(READ.refresh).toHaveBeenCalledTimes(1);
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});
});
