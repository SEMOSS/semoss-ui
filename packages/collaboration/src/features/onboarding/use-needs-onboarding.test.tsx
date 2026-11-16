import {
	act,
	cleanup,
	render,
	renderHook,
	screen,
	waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { toast } from "@semoss/ui/next";
import type { InsightActions } from "@/lib/pixel";
import { WorkStep } from "./onboarding-steps";
import { useNeedsOnboarding } from "./use-needs-onboarding";

// one actions object: the read reruns whenever it changes
const insight = vi.hoisted(() => ({
	connection: {} as Record<string, unknown>,
	finishError: "",
	actions: {
		run: vi.fn(async (statement: string) => {
			if (statement === "BrainFinishSetup();" && insight.finishError)
				throw new Error(insight.finishError);
			return {
				pixelReturn: [
					{
						output:
							statement === "BrainGetConnection();"
								? insight.connection
								: {},
						operationType: ["MAP"],
					},
				],
			};
		}),
	},
}));
vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useInsight: () => insight,
}));

/** BrainGetConnection's output, before the flags each test sets. */
const CONNECTION = {
	microsoft: { signedIn: true, account: "owner@test.com", renewable: true },
	mailbox: "owner@test.com",
	background: {
		saved: false,
		account: null,
		renewable: false,
		canSave: true,
		otherAccount: false,
	},
	sources: [],
	folders: null,
};

/** The hook's answer once the connection read has settled. */
async function needsSetup(flags: Record<string, unknown>) {
	insight.connection = { ...CONNECTION, ...flags };
	const { result } = renderHook(() => useNeedsOnboarding());
	await waitFor(() =>
		expect(insight.actions.run).toHaveBeenCalledWith(
			"BrainGetConnection();",
		),
	);
	await act(async () => {});
	return result.current;
}

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	insight.actions.run.mockClear();
	insight.finishError = "";
	sessionStorage.clear();
	window.location.hash = "";
});

describe("sending the owner back to setup", () => {
	it("sends an owner who left after the import back to setup", async () => {
		expect(await needsSetup({ imported: true, setupDone: false })).toBe(
			true,
		);
	});

	it("keeps Today once setup was finished or skipped, imported or not", async () => {
		expect(await needsSetup({ imported: true, setupDone: true })).toBe(
			false,
		);
		cleanup();
		expect(await needsSetup({ imported: false, setupDone: true })).toBe(
			false,
		);
	});

	it("keeps the import rule on a server without the setup flag", async () => {
		expect(await needsSetup({ imported: false })).toBe(true);
		cleanup();
		expect(await needsSetup({ imported: true })).toBe(false);
	});

	it("never redirects when the connection cannot be read", async () => {
		insight.actions.run.mockRejectedValueOnce(new Error("Network down"));
		expect(await needsSetup({ imported: false, setupDone: false })).toBe(
			false,
		);
	});

	it("leaves setup on Skip when the server cannot save it, and does not ask again this session", async () => {
		const failed = vi.spyOn(toast, "error").mockReturnValue("failed");
		insight.finishError = "Server unavailable";
		const user = userEvent.setup();
		render(
			<WorkStep
				actions={insight.actions as unknown as InsightActions}
				onNext={vi.fn()}
				eyebrow="Step 6 of 8"
			/>,
		);
		const skip = screen.getByRole("button", { name: "Skip for now" });
		await waitFor(() => expect(skip).toBeEnabled());
		await user.click(skip);
		await waitFor(() => expect(window.location.hash).toBe("#/work"));
		expect(insight.actions.run).toHaveBeenCalledWith("BrainFinishSetup();");
		expect(failed).toHaveBeenCalledWith(
			expect.stringContaining("Server unavailable"),
		);
		cleanup();
		insight.actions.run.mockClear();
		insight.connection = {
			...CONNECTION,
			imported: true,
			setupDone: false,
		};
		const { result } = renderHook(() => useNeedsOnboarding());
		await act(async () => {});
		expect(result.current).toBe(false);
		expect(insight.actions.run).not.toHaveBeenCalled();
	});
});
