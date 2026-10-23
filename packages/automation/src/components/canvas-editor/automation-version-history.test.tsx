// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	listAutomationVersions,
	rollbackAutomation,
} from "../../api/automation-history";
import { AutomationVersionHistory } from "./automation-version-history";

vi.mock("../../api/automation-history", () => ({
	listAutomationVersions: vi.fn(),
	rollbackAutomation: vi.fn(),
}));

const version = {
	id: "abc123",
	user: "Editor",
	date: "2026-10-19",
	message: "Saved workflow",
};
let root: Root;
let container: HTMLDivElement;
const onRestored = vi.fn();
const onOpenChange = vi.fn();

async function renderHistory(overrides = {}) {
	await act(async () =>
		root.render(
			<AutomationVersionHistory
				appId="app-1"
				open
				onOpenChange={onOpenChange}
				onRestored={onRestored}
				isDirty={false}
				canRestore
				disabled={false}
				{...overrides}
			/>,
		),
	);
}

async function clickButton(name: string) {
	const button = Array.from(document.querySelectorAll("button")).find(
		(element) =>
			(element.getAttribute("aria-label") ??
				element.textContent?.trim()) === name,
	);
	if (!button) throw new Error(`Missing button: ${name}`);
	await act(async () => button.click());
}

describe("Automation version history", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
		container = document.createElement("div");
		document.body.append(container);
		root = createRoot(container);
		vi.mocked(listAutomationVersions).mockResolvedValue([version]);
		vi.mocked(rollbackAutomation).mockResolvedValue(undefined);
	});
	afterEach(async () => {
		await act(async () => root.unmount());
		container.remove();
		vi.unstubAllGlobals();
	});

	it("loads history only when opened and displays version metadata", async () => {
		await renderHistory({ open: false });
		expect(listAutomationVersions).not.toHaveBeenCalled();
		await renderHistory();
		expect(listAutomationVersions).toHaveBeenCalledWith("app-1");
		for (const value of Object.values(version))
			expect(document.body.textContent).toContain(value);
	});

	it("keeps the history trigger inactive until enabled", async () => {
		await renderHistory({ open: false, disabled: true });
		const trigger = container.querySelector<HTMLButtonElement>(
			'button[aria-label="Version history"]',
		);
		expect(trigger?.disabled).toBe(true);
		await clickButton("Version history");
		expect(onOpenChange).not.toHaveBeenCalled();
		expect(listAutomationVersions).not.toHaveBeenCalled();

		await renderHistory({ open: false, disabled: false });
		expect(trigger?.disabled).toBe(false);
		await clickButton("Version history");
		expect(onOpenChange).toHaveBeenCalledWith(true);
	});

	it("requires confirmation before discarding a draft and restoring", async () => {
		await renderHistory({ isDirty: true });
		await clickButton("Restore version abc123");
		expect(rollbackAutomation).not.toHaveBeenCalled();
		expect(document.body.textContent).toContain(
			"Unsaved canvas changes will be discarded.",
		);
		await clickButton("Confirm restore");
		expect(rollbackAutomation).toHaveBeenCalledExactlyOnceWith(
			"app-1",
			"abc123",
		);
		expect(onRestored).toHaveBeenCalledOnce();
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("allows canceling restoration without modifying the automation", async () => {
		await renderHistory();
		await clickButton("Restore version abc123");
		await clickButton("Back");
		expect(rollbackAutomation).not.toHaveBeenCalled();
		expect(document.body.textContent).toContain("Version history");
	});

	it("shows an empty state", async () => {
		vi.mocked(listAutomationVersions).mockResolvedValue([]);
		await renderHistory();
		expect(document.body.textContent).toContain("No saved versions");
	});

	it("retains list failures and supports retry", async () => {
		vi.mocked(listAutomationVersions).mockRejectedValueOnce(
			new Error("History denied"),
		);
		await renderHistory();
		expect(document.querySelector('[role="alert"]')?.textContent).toContain(
			"History denied",
		);
		await clickButton("Retry");
		expect(document.body.textContent).toContain("Saved workflow");
	});

	it("retains rollback failures without discarding the draft", async () => {
		vi.mocked(rollbackAutomation).mockRejectedValue(
			new Error("Restore denied"),
		);
		await renderHistory({ isDirty: true });
		await clickButton("Restore version abc123");
		await clickButton("Confirm restore");
		expect(document.querySelector('[role="alert"]')?.textContent).toContain(
			"Restore denied",
		);
		expect(onRestored).not.toHaveBeenCalled();
		expect(onOpenChange).not.toHaveBeenCalledWith(false);
	});

	it("prevents restoration without edit permission", async () => {
		await renderHistory({ canRestore: false });
		await clickButton("Restore version abc123");
		expect(rollbackAutomation).not.toHaveBeenCalled();
		expect(document.body.textContent).not.toContain("Confirm restore");
	});

	it("locks dismissal and repeat restoration while pending", async () => {
		let complete = () => {};
		vi.mocked(rollbackAutomation).mockReturnValue(
			new Promise<void>((resolve) => {
				complete = resolve;
			}),
		);
		await renderHistory();
		await clickButton("Restore version abc123");
		await clickButton("Confirm restore");
		await clickButton("Restoring...");
		// Attempt to dismiss the modal while the restoration is pending
		await act(async () =>
			document.dispatchEvent(
				new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
			),
		);
		expect(rollbackAutomation).toHaveBeenCalledOnce();
		expect(onOpenChange).not.toHaveBeenCalledWith(false);
		expect(document.querySelector("output")?.textContent).toContain(
			"Restoring",
		);
		await act(async () => complete());
		expect(onRestored).toHaveBeenCalledOnce();
	});

	it("ignores a stale history request after changing projects", async () => {
		let complete = (_versions: (typeof version)[]) => {};
		vi.mocked(listAutomationVersions).mockReturnValueOnce(
			new Promise((resolve) => {
				complete = resolve;
			}),
		);
		await renderHistory();
		expect(document.querySelector("output")?.textContent).toContain(
			"Loading versions",
		);
		vi.mocked(listAutomationVersions).mockResolvedValue([
			{ ...version, id: "def456", message: "Other project" },
		]);
		await renderHistory({ appId: "app-2" });
		await act(async () => complete([version]));
		expect(document.body.textContent).toContain("Other project");
		expect(document.body.textContent).not.toContain("Saved workflow");
	});

	it("returns focus to the selected version when confirmation is canceled", async () => {
		await renderHistory();
		await clickButton("Restore version abc123");
		expect(document.activeElement?.textContent).toBe("Back");
		await clickButton("Back");
		expect(document.activeElement?.getAttribute("aria-label")).toBe(
			"Restore version abc123",
		);
	});
});
