import { act, render } from "@testing-library/react";
import type { ToolViewRendererProps } from "@semoss/shared";
import type { ConversationTool } from "@/features/messages/types/message";
import type { PendingToolApproval } from "@/features/rooms/types/room";
import { ComponentToolView } from "./component-tool-view";

const state = vi.hoisted(() => ({
	props: undefined as ToolViewRendererProps | undefined,
	onApproveTool: vi.fn(
		async (
			_approval: PendingToolApproval,
			_args: Record<string, unknown>,
		) => undefined,
	),
	onRejectTool: vi.fn(async (_approval: PendingToolApproval) => undefined),
}));
vi.mock("../tool-workbench.context", () => ({ useToolWorkbench: () => state }));
vi.mock("@semoss/shared", () => ({
	ToolViewRenderer: (props: ToolViewRendererProps) => {
		state.props = props;
		return null;
	},
}));

const tool: ConversationTool = {
	id: "calendar",
	name: "CreateEvent",
	title: "Create Event",
	parentMessageId: "answer",
	status: "INPUT_REQUIRED",
	arguments: { subject: "Review" },
	metadata: { SMSS_FUNCTION_NAME: "MicrosoftCalendarCreateEvent" },
};
const action: PendingToolApproval = {
	toolId: tool.id,
	toolName: tool.name,
	parentMessageId: tool.parentMessageId,
	arguments: tool.arguments,
	actionId: "approval",
	roomId: "child-room",
};
const view = { component: () => null, params: { provider: "microsoft" } };

beforeEach(() => {
	vi.clearAllMocks();
	state.props = undefined;
});

it("forwards connector outcomes as responses instead of executing the original action", async () => {
	render(
		<ComponentToolView
			tool={tool}
			action={action}
			view={view}
			fallback={null}
		/>,
	);
	const props = state.props;
	if (!props) throw new Error("View did not render");
	expect(props.call.functionName).toBe("MicrosoftCalendarCreateEvent");
	expect(state.onApproveTool).not.toHaveBeenCalled();
	const outcome = {
		userAction: "saved-draft",
		summary: "Saved a draft instead",
		result: { draftId: "draft" },
	};
	await act(async () => {
		await props.onRespond(outcome);
	});
	expect(state.onApproveTool).toHaveBeenCalledWith(
		{ ...action, requiresResponse: true },
		outcome,
	);
	expect(state.props?.mode).toBe("result");
});

it("rejects repeated decisions while the controller is still saving", async () => {
	let resolveDecision: () => void = () => undefined;
	const decision = new Promise<void>((resolve) => {
		resolveDecision = resolve;
	});
	state.onApproveTool.mockImplementationOnce(() => decision);
	render(
		<ComponentToolView
			tool={tool}
			action={action}
			view={view}
			fallback={null}
		/>,
	);
	const props = state.props;
	if (!props) throw new Error("View did not render");
	await act(async () => {
		const first = props.onApprove({ subject: "Updated review" });
		await expect(props.onApprove()).rejects.toThrow("no longer available");
		expect(state.onApproveTool).toHaveBeenCalledTimes(1);
		resolveDecision();
		await first;
	});
});
