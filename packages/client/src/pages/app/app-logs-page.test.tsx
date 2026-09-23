import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	searchAppLogs: vi.fn(),
}));

vi.mock("@/api", () => ({
	searchAppLogs: mocks.searchAppLogs,
}));

vi.mock("@/hooks", () => ({
	useProject: () => ({
		project: { project_id: "project-1" },
	}),
}));

import { AppLogsPage } from "./app-logs-page";

describe("AppLogsPage", () => {
	beforeEach(() => {
		mocks.searchAppLogs.mockReset();
	});

	it("loads and displays recent application logs on mount", async () => {
		mocks.searchAppLogs.mockResolvedValue({
			lines: [
				"[INFO ] 2026-09-23 12:08:43 p.r.LogMessage:49 [user=test] recent activity",
			],
			hasMore: false,
		});

		render(<AppLogsPage />);

		await waitFor(() => {
			expect(mocks.searchAppLogs).toHaveBeenCalledWith({
				projectId: "project-1",
				query: undefined,
				levels: [],
				offset: 0,
				limit: 50,
			});
		});
		expect(await screen.findByText("recent activity")).toBeInTheDocument();
	});
});
