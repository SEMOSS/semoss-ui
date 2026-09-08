import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createNewAppWorkspaceName,
	NewAppChatComposer,
} from "./new-app-chat-composer";

const mocks = vi.hoisted(() => ({
	createAppFromTemplate: vi.fn(),
	navigate: vi.fn(),
}));

vi.mock("@/api", () => ({
	createAppFromTemplate: mocks.createAppFromTemplate,
}));

vi.mock("react-router-dom", async (importOriginal) => {
	const actual = await importOriginal<typeof import("react-router-dom")>();
	return { ...actual, useNavigate: () => mocks.navigate };
});

describe("NewAppChatComposer", () => {
	beforeEach(() => {
		mocks.createAppFromTemplate.mockReset();
		mocks.navigate.mockReset();
	});

	it("normalizes and caps generated workspace names", () => {
		const name = createNewAppWorkspaceName(
			" New App ",
			" Build   a detailed revenue dashboard with regional comparisons and forecasts ",
		);

		expect(name).toHaveLength(80);
		expect(name).toMatch(/^New App - Build a detailed/);
	});

	it("creates a private workspace and navigates with the handoff", async () => {
		mocks.createAppFromTemplate.mockResolvedValue("project-1");
		render(<NewAppChatComposer />);

		fireEvent.change(screen.getByLabelText("Prompt"), {
			target: { value: "Build a sales dashboard" },
		});
		fireEvent.click(
			screen.getByRole("button", {
				name: "Create workspace and send prompt",
			}),
		);

		await waitFor(() =>
			expect(mocks.createAppFromTemplate).toHaveBeenCalledWith({
				name: "New App - Build a sales dashboard",
				isGlobal: false,
			}),
		);
		expect(mocks.navigate).toHaveBeenCalledWith("/app/project-1/edit", {
			state: {
				prompt: "Build a sales dashboard",
				agent: {
					workspace_id: "app-builder",
					name: "app-builder",
				},
			},
		});
	});

	it("submits on Enter but not Shift+Enter", async () => {
		mocks.createAppFromTemplate.mockResolvedValue("project-1");
		render(<NewAppChatComposer />);

		const prompt = screen.getByLabelText("Prompt");
		fireEvent.change(prompt, { target: { value: "Build an app" } });
		fireEvent.keyDown(prompt, { key: "Enter", shiftKey: true });
		expect(mocks.createAppFromTemplate).not.toHaveBeenCalled();

		fireEvent.keyDown(prompt, { key: "Enter" });
		await waitFor(() =>
			expect(mocks.createAppFromTemplate).toHaveBeenCalledTimes(1),
		);
	});

	it("does not render a template selector", () => {
		mocks.createAppFromTemplate.mockResolvedValue("project-1");
		render(<NewAppChatComposer />);

		expect(screen.queryByText("Select template")).not.toBeInTheDocument();
	});
});
