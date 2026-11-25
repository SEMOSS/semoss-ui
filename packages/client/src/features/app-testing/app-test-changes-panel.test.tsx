import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AppTestChangesPanel } from "./app-test-changes-panel";

const state = vi.hoisted(() => ({
	query: {
		status: "SUCCESS",
		data: {
			target: "app",
			configuration: {
				enabled: false,
				baseBranch: "master",
				buildCommand: "",
			},
			isActive: false,
			change: {} as Record<string, unknown>,
		},
		error: null,
		refresh: vi.fn(),
	},
	save: vi.fn(),
	abandon: vi.fn(),
	log: vi.fn(),
}));
vi.mock("@semoss/sdk/react", () => ({ useSessionPixel: () => state.query }));
vi.mock("@/api/app-testing", async (original) => ({
	...(await original<typeof import("@/api/app-testing")>()),
	saveAppChanges: state.save,
	abandonAppChange: state.abandon,
	getAppChangeBuildLog: state.log,
}));
beforeEach(() => {
	vi.clearAllMocks();
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe(): void {}
			unobserve(): void {}
			disconnect(): void {}
		},
	);
	state.query.status = "SUCCESS";
	state.query.data = {
		target: "app",
		configuration: {
			enabled: false,
			baseBranch: "master",
			buildCommand: "",
		},
		isActive: false,
		change: {},
	};
	state.save.mockImplementation(async (_app, configuration) => ({
		...state.query.data,
		configuration,
	}));
	state.abandon.mockResolvedValue({ ...state.query.data });
	state.log.mockResolvedValue("Build failed: missing module");
});
afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
	vi.useRealTimers();
});
const open = (): void => {
	fireEvent.click(screen.getByText(/Test-gated app changes/));
};

it("saves opt-in settings and preserves edits after a rejected save", async () => {
	state.save.mockRejectedValueOnce(new Error("Cannot save settings"));
	render(<AppTestChangesPanel appId="app" isBusy={false} />);
	open();
	fireEvent.click(
		screen.getByRole("switch", {
			name: "Use tested branches for app chat",
		}),
	);
	fireEvent.change(screen.getByRole("textbox", { name: "Build command" }), {
		target: { value: "npm run build" },
	});
	fireEvent.click(screen.getByRole("button", { name: "Save settings" }));
	await screen.findByText("Cannot save settings");
	expect(screen.getByRole("textbox", { name: "Build command" })).toHaveValue(
		"npm run build",
	);
	fireEvent.click(screen.getByRole("button", { name: "Save settings" }));
	await waitFor(() => expect(state.save).toHaveBeenCalledTimes(2));
	expect(state.save).toHaveBeenLastCalledWith("app", {
		enabled: true,
		baseBranch: "master",
		buildCommand: "npm run build",
	});
});

it("shows candidate status and blocks configuration changes while its agent is running", () => {
	state.query.data = {
		...state.query.data,
		isActive: true,
		change: {
			id: "change",
			branch: "app-change/change",
			status: "TESTING",
			runId: "test-run",
		},
	};
	render(<AppTestChangesPanel appId="app" isBusy={false} />);
	open();
	expect(
		screen.getByRole("switch", {
			name: "Use tested branches for app chat",
		}),
	).toBeDisabled();
	expect(
		screen.getByRole("button", { name: "Abandon pending change" }),
	).toBeDisabled();
	expect(screen.getByText(/Test run: test-run/)).toBeTruthy();
});

it("can inspect a private build log or abandon a failed candidate without deleting it", async () => {
	state.query.data.change = {
		id: "change",
		branch: "app-change/change",
		status: "FAILED",
		reason: "Build failed",
	};
	render(<AppTestChangesPanel appId="app" isBusy={false} />);
	open();
	fireEvent.click(screen.getByRole("button", { name: "View build log" }));
	await screen.findByText("Build failed: missing module");
	expect(state.log).toHaveBeenCalledWith("app");
	fireEvent.click(
		screen.getByRole("button", { name: "Abandon pending change" }),
	);
	await waitFor(() => expect(state.abandon).toHaveBeenCalledWith("app"));
	expect(state.query.refresh).toHaveBeenCalled();
});

it("refreshes enabled workflow status and stops polling on unmount", async () => {
	vi.useFakeTimers();
	state.query.data.configuration.enabled = true;
	const { unmount } = render(
		<AppTestChangesPanel appId="app" isBusy={false} />,
	);
	await act(async () => vi.advanceTimersByTimeAsync(5000));
	expect(state.query.refresh).toHaveBeenCalledTimes(1);
	unmount();
	await act(async () => vi.advanceTimersByTimeAsync(10_000));
	expect(state.query.refresh).toHaveBeenCalledTimes(1);
});

it("does not expose editable defaults after a failed read", () => {
	state.query.status = "ERROR";
	render(<AppTestChangesPanel appId="app" isBusy={false} />);
	open();
	expect(screen.getByText("Could not read app change settings")).toBeTruthy();
	expect(screen.queryByRole("textbox", { name: "Base branch" })).toBeNull();
});

it("preserves the focused draft while background status refresh clears query data", () => {
	const { rerender } = render(
		<AppTestChangesPanel appId="app" isBusy={false} />,
	);
	open();
	const command = screen.getByRole("textbox", { name: "Build command" });
	fireEvent.change(command, { target: { value: "npm ci && npm run build" } });
	command.focus();
	state.query.status = "LOADING";
	rerender(<AppTestChangesPanel appId="app" isBusy={false} />);
	expect(screen.getByRole("textbox", { name: "Build command" })).toBe(
		command,
	);
	expect(command).toHaveValue("npm ci && npm run build");
	expect(document.activeElement).toBe(command);
	state.query.status = "SUCCESS";
	state.query.data = {
		...state.query.data,
		change: { status: "NO_CHANGES" },
	};
	rerender(<AppTestChangesPanel appId="app" isBusy={false} />);
	expect(command).toHaveValue("npm ci && npm run build");
});
