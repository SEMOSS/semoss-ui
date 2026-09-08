import { render, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTemplateChatHandoff } from "./use-template-chat-handoff";

const mocks = vi.hoisted(() => ({
	insight: { isReady: true, insightId: "insight-1" },
	location: {
		pathname: "/app/project-1/edit",
		search: "",
		hash: "",
		state: {
			prompt: "Build a dashboard",
			agent: { workspace_id: "agent-1", name: "Builder Agent" },
		} as unknown,
	},
	navigate: vi.fn(),
	selectPanel: vi.fn(),
	initialize: vi.fn(),
	setAgent: vi.fn(),
	setDraft: vi.fn(),
	submit: vi.fn(),
}));

vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => mocks.insight,
}));

vi.mock("react-router-dom", () => ({
	useLocation: () => mocks.location,
	useNavigate: () => mocks.navigate,
}));

vi.mock("@/hooks", () => ({
	useWorkbench: (
		selector: (state: {
			layout: { actions: { selectPanel: typeof mocks.selectPanel } };
			assistant: {
				initialize: typeof mocks.initialize;
				setAgent: typeof mocks.setAgent;
				setDraft: typeof mocks.setDraft;
				submit: typeof mocks.submit;
			};
		}) => unknown,
	) =>
		selector({
			layout: { actions: { selectPanel: mocks.selectPanel } },
			assistant: {
				initialize: mocks.initialize,
				setAgent: mocks.setAgent,
				setDraft: mocks.setDraft,
				submit: mocks.submit,
			},
		}),
}));

const HandoffProbe = () => {
	useTemplateChatHandoff();
	return null;
};

describe("useTemplateChatHandoff", () => {
	beforeEach(() => {
		mocks.insight.isReady = true;
		mocks.insight.insightId = "insight-1";
		mocks.location.state = {
			prompt: "Build a dashboard",
			agent: { workspace_id: "agent-1", name: "Builder Agent" },
		};
		mocks.navigate.mockReset();
		mocks.selectPanel.mockReset();
		mocks.initialize.mockReset().mockResolvedValue(undefined);
		mocks.setAgent.mockReset();
		mocks.setDraft.mockReset();
		mocks.submit.mockReset().mockResolvedValue(true);
	});

	it("initializes, selects the agent, and submits once in StrictMode", async () => {
		render(
			<StrictMode>
				<HandoffProbe />
			</StrictMode>,
		);

		await waitFor(() => expect(mocks.submit).toHaveBeenCalledTimes(1));
		expect(mocks.navigate).toHaveBeenCalledWith("/app/project-1/edit", {
			replace: true,
			state: null,
		});
		expect(mocks.setAgent).toHaveBeenCalledWith({
			workspace_id: "agent-1",
			name: "Builder Agent",
		});
		expect(mocks.submit).toHaveBeenCalledWith("Build a dashboard");
		expect(mocks.initialize.mock.invocationCallOrder[0]).toBeLessThan(
			mocks.setAgent.mock.invocationCallOrder[0],
		);
		expect(mocks.setDraft).toHaveBeenNthCalledWith(1, "Build a dashboard");
		expect(mocks.setDraft).toHaveBeenNthCalledWith(2, "");
	});

	it("keeps the prompt draft when submission cannot start", async () => {
		mocks.submit.mockResolvedValue(false);
		render(<HandoffProbe />);

		await waitFor(() => expect(mocks.submit).toHaveBeenCalledTimes(1));
		expect(mocks.setDraft).toHaveBeenCalledTimes(1);
		expect(mocks.setDraft).toHaveBeenCalledWith("Build a dashboard");
	});

	it("ignores missing handoff state", async () => {
		mocks.location.state = null;
		render(<HandoffProbe />);

		await Promise.resolve();
		expect(mocks.initialize).not.toHaveBeenCalled();
		expect(mocks.submit).not.toHaveBeenCalled();
	});
});
