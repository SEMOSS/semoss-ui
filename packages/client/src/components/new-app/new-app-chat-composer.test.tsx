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

vi.mock("@semoss/shared", () => ({
	ProjectSelect: ({
		name,
		onChange,
		projectTypes,
		disabled,
	}: {
		name: string;
		onChange: (project: {
			project_id: string;
			project_name: string;
			project_type: "CODE" | "WORKSPACE";
		}) => void;
		projectTypes?: string[];
		disabled?: boolean;
	}) => {
		const isAgent = projectTypes?.includes("WORKSPACE");
		return (
			<button
				type="button"
				disabled={disabled}
				aria-label={isAgent ? "Agent" : "Template"}
				onClick={() =>
					onChange(
						isAgent
							? {
									project_id: "agent-1",
									project_name: "Builder Agent",
									project_type: "WORKSPACE",
								}
							: {
									project_id: "template-1",
									project_name: "Dashboard Starter",
									project_type: "CODE",
								},
					)
				}
			>
				{name}
			</button>
		);
	},
}));

describe("NewAppChatComposer", () => {
	beforeEach(() => {
		mocks.createAppFromTemplate.mockReset();
		mocks.navigate.mockReset();
	});

	it("normalizes and caps generated workspace names", () => {
		const name = createNewAppWorkspaceName(
			" Dashboard   Starter ",
			" Build   a detailed revenue dashboard with regional comparisons and forecasts ",
		);

		expect(name).toHaveLength(80);
		expect(name).toMatch(/^Dashboard Starter - Build a detailed/);
	});

	it("creates a private workspace and navigates with the handoff", async () => {
		mocks.createAppFromTemplate.mockResolvedValue("project-1");
		render(<NewAppChatComposer />);

		fireEvent.click(screen.getByRole("button", { name: "Agent" }));
		fireEvent.click(screen.getByRole("button", { name: "Template" }));
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
				name: "Dashboard Starter - Build a sales dashboard",
				templateId: "template-1",
				isGlobal: false,
			}),
		);
		expect(mocks.navigate).toHaveBeenCalledWith("/app/project-1/edit", {
			state: {
				prompt: "Build a sales dashboard",
				agent: {
					workspace_id: "agent-1",
					name: "Builder Agent",
				},
			},
		});
	});

	it("submits on Enter but not Shift+Enter", async () => {
		mocks.createAppFromTemplate.mockResolvedValue("project-1");
		render(<NewAppChatComposer />);

		fireEvent.click(screen.getByRole("button", { name: "Agent" }));
		fireEvent.click(screen.getByRole("button", { name: "Template" }));
		const prompt = screen.getByLabelText("Prompt");
		fireEvent.change(prompt, { target: { value: "Build an app" } });
		fireEvent.keyDown(prompt, { key: "Enter", shiftKey: true });
		expect(mocks.createAppFromTemplate).not.toHaveBeenCalled();

		fireEvent.keyDown(prompt, { key: "Enter" });
		await waitFor(() =>
			expect(mocks.createAppFromTemplate).toHaveBeenCalledTimes(1),
		);
	});

	it("announces required context when submitted empty", async () => {
		render(<NewAppChatComposer />);
		fireEvent.click(
			screen.getByRole("button", {
				name: "Create workspace and send prompt",
			}),
		);

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Select an agent",
		);
		expect(mocks.createAppFromTemplate).not.toHaveBeenCalled();
	});
});
