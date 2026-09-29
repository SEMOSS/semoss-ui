import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { NewKnowledgeFormBody } from "@/components/knowledge/new-knowledge-form-body";
import { SaveWorkspaceDialog } from "@/components/room/room-workspace-creation";
import { NewWorkspacePage } from "@/pages/new-workspace-page";

const mocks = vi.hoisted(() => ({
	addWorkspace: vi.fn(),
	navigate: vi.fn(),
	run: vi.fn(),
	upload: vi.fn(),
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("react-router", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("@/hooks", () => ({
	useChat: () => ({ chat: { addWorkspace: mocks.addWorkspace } }),
	useRoot: () => ({
		root: { theme: { featureFlags: {}, defaultEmbedderId: "embedder" } },
	}),
}));
vi.mock("@/hooks/use-chat", () => ({
	useChat: () => ({ chat: { addWorkspace: mocks.addWorkspace } }),
}));
vi.mock("@/hooks/use-root", () => ({
	useRoot: () => ({
		root: { theme: { featureFlags: {}, defaultEmbedderId: "embedder" } },
	}),
}));
vi.mock("@/components/workspace/instructions-modal", () => ({
	InstructionsModal: () => null,
}));
vi.mock("@semoss/sdk/react", async (original) => ({
	...(await original<typeof import("@semoss/sdk/react")>()),
	usePixel: () => ({ status: "SUCCESS", data: { exists: false } }),
	useInsight: () => ({ actions: { run: mocks.run, upload: mocks.upload } }),
}));
vi.mock("@semoss/shared", async (original) => ({
	...(await original<typeof import("@semoss/shared")>()),
	MCPSelector: () => null,
	PromptSelector: () => null,
	SkillSelector: () => null,
}));

beforeEach(() => vi.clearAllMocks());

test("saving an agent from a conversation validates and retains the form after a failed save", async () => {
	mocks.addWorkspace.mockRejectedValueOnce(new Error("Save failed"));
	render(
		<SaveWorkspaceDialog systemPrompt="Current instructions" mcps={[]} />,
	);
	fireEvent.click(
		screen.getByRole("button", { name: "workspace.publishTooltip" }),
	);
	fireEvent.click(
		screen.getByRole("button", { name: "workspace.publishButton" }),
	);
	expect(
		await screen.findByText("workspace.nameRequired"),
	).toBeInTheDocument();
	expect(mocks.addWorkspace).not.toHaveBeenCalled();
	fireEvent.change(screen.getByLabelText("workspace.nameLabel"), {
		target: { value: "Saved agent" },
	});
	fireEvent.click(
		screen.getByRole("button", { name: "workspace.publishButton" }),
	);
	await screen.findByText("workspace.publishError");
	expect(screen.getByLabelText("workspace.nameLabel")).toHaveValue(
		"Saved agent",
	);
	expect(screen.getByRole("dialog")).toBeInTheDocument();
});

test("agent creation retains edits on failure and retries with the existing payload contract", async () => {
	let rejectSave: (reason: Error) => void = () => {};
	mocks.addWorkspace
		.mockImplementationOnce(
			() =>
				new Promise((_, reject) => {
					rejectSave = reject;
				}),
		)
		.mockResolvedValueOnce("agent-1");
	render(<NewWorkspacePage />);
	const name = screen.getByLabelText("workspace:form.nameLabel");
	const instructions = screen.getByLabelText(
		"workspace:form.instructionsLabel",
	);
	fireEvent.change(name, { target: { value: "Research agent" } });
	fireEvent.change(instructions, { target: { value: "Cite sources" } });
	fireEvent.click(
		screen.getByRole("button", { name: "workspace:actions.create" }),
	);
	await waitFor(() => expect(name).toBeDisabled());
	expect(
		screen.getByRole("button", { name: "common:buttons.cancel" }),
	).toBeDisabled();
	rejectSave(new Error("Unavailable"));
	await screen.findByRole("alert");
	expect(name).toHaveValue("Research agent");
	expect(instructions).toHaveValue("Cite sources");
	expect(mocks.navigate).not.toHaveBeenCalled();
	fireEvent.click(
		screen.getByRole("button", { name: "workspace:actions.create" }),
	);
	await waitFor(() =>
		expect(mocks.navigate).toHaveBeenCalledWith("/agent/agent-1"),
	);
	expect(mocks.addWorkspace).toHaveBeenLastCalledWith({
		name: "Research agent",
		description: "",
		system_prompt: "Cite sources",
		prompts: [],
		mcp: [],
		skills: [],
	});
});

test("knowledge creation retains its files and text after failure", async () => {
	const onSuccess = vi.fn();
	mocks.run.mockRejectedValueOnce(new Error("Create unavailable"));
	const formId = "knowledge-test-form";
	render(
		<>
			<NewKnowledgeFormBody formId={formId} onSuccess={onSuccess} />
			<button type="submit" form={formId}>
				Create collection
			</button>
		</>,
	);
	const name = screen.getByLabelText("knowledge:form.nameLabel");
	const description = screen.getByLabelText(
		"knowledge:form.descriptionLabel",
	);
	fireEvent.change(name, { target: { value: "Notes" } });
	fireEvent.change(description, { target: { value: "Project notes" } });
	fireEvent.change(screen.getByLabelText("knowledge:form.filesLabel"), {
		target: {
			files: [new File(["notes"], "notes.txt", { type: "text/plain" })],
		},
	});
	fireEvent.click(screen.getByRole("button", { name: "Create collection" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Create unavailable",
	);
	expect(name).toHaveValue("Notes");
	expect(description).toHaveValue("Project notes");
	expect(screen.getByText("notes.txt")).toBeInTheDocument();
	expect(onSuccess).not.toHaveBeenCalled();
	expect(mocks.upload).not.toHaveBeenCalled();
});
