import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useInsight, usePixel } from "@semoss/sdk/react";
import type { InsightActions } from "@/lib/pixel";
import { LinkTopicSourceDialog } from "./link-topic-source-dialog";
import { TopicSourceDetails } from "./topic-source-details";
import { TopicSourceEditor } from "./topic-source-editor";
import { TopicSources } from "./topic-sources";
import {
	linkTopicSource,
	saveTopicDocument,
	saveTopicSource,
	type TopicSourceDetail,
} from "./topic-sources.api";
import { UploadTopicDocumentsDialog } from "./upload-topic-documents-dialog";

vi.mock("@semoss/sdk/react", () => ({
	useInsight: vi.fn(),
	usePixel: vi.fn(),
}));
vi.mock("@/features/rooms/api/upload-room-files", () => ({
	uploadRoomFiles: vi.fn(),
}));
vi.mock("./topic-sources.api", async (original) => ({
	...(await original<typeof import("./topic-sources.api")>()),
	saveTopicSource: vi.fn(),
	saveTopicDocument: vi.fn(),
	linkTopicSource: vi.fn(),
}));

const actions = { run: vi.fn() } as unknown as InsightActions;
const refresh = vi.fn();
const source: TopicSourceDetail = {
	sourceId: "source-1",
	title: "Approved budget",
	kind: "note",
	version: 2,
	status: "ready",
	content: "Budget: $50,000",
	topicIds: ["alpha", "beta"],
};

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(useInsight).mockReturnValue({
		actions,
		insightId: "insight-1",
	} as ReturnType<typeof useInsight>);
	vi.mocked(usePixel).mockReturnValue({
		status: "SUCCESS",
		data: { topicId: "alpha", sources: [] },
		refresh,
		update: vi.fn(),
	});
	vi.mocked(saveTopicSource).mockResolvedValue("source-1");
	vi.mocked(saveTopicDocument).mockResolvedValue("source-1");
	vi.mocked(linkTopicSource).mockResolvedValue(undefined);
});
afterEach(cleanup);

/** Finds the native picker belonging to the shared dropzone. */
function documentPicker(): HTMLInputElement {
	const picker = screen
		.getByRole("button", { name: "Click to browse or drop a file" })
		.querySelector("input[type=file]");
	if (!(picker instanceof HTMLInputElement))
		throw new Error("Document picker missing");
	return picker;
}

describe("topic Sources", () => {
	it("blocks duplicate saves and dismissal while a source save is pending", async () => {
		let complete: ((id: string) => void) | undefined;
		vi.mocked(saveTopicSource).mockReturnValueOnce(
			new Promise<string>((resolve) => {
				complete = resolve;
			}),
		);
		const onSubmit = vi.fn();
		render(
			<TopicSourceEditor
				topicId="alpha"
				kind="note"
				source={source}
				onSubmit={onSubmit}
			/>,
		);
		const user = userEvent.setup();
		await user.click(screen.getByRole("button", { name: "Save source" }));
		expect(screen.getByRole("button", { name: /Saving…/ })).toBeDisabled();
		await user.keyboard("{Escape}");
		expect(screen.getByRole("dialog")).toBeVisible();
		expect(onSubmit).not.toHaveBeenCalled();
		expect(saveTopicSource).toHaveBeenCalledOnce();
		complete?.("source-1");
		await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("source-1"));
	});
	it("does not show content from a different source version in a citation inspector", () => {
		vi.mocked(usePixel).mockReturnValue({
			status: "SUCCESS",
			data: { ...source, version: 3 },
			refresh,
			update: vi.fn(),
		});
		render(
			<TopicSourceDetails
				topicId="alpha"
				sourceId="source-1"
				version={2}
				onClose={vi.fn()}
			/>,
		);
		expect(
			screen.getByText(
				"The returned source does not match this reference.",
			),
		).toBeVisible();
		expect(screen.queryByText(source.content)).toBeNull();
	});
	it("links an existing source only after the owner chooses it", async () => {
		vi.mocked(usePixel).mockReturnValue({
			status: "SUCCESS",
			data: { sources: [{ ...source, topicIds: ["beta"] }] },
			refresh,
			update: vi.fn(),
		});
		const onSubmit = vi.fn();
		render(<LinkTopicSourceDialog topicId="alpha" onSubmit={onSubmit} />);
		expect(linkTopicSource).not.toHaveBeenCalled();
		await userEvent.click(
			screen.getByRole("button", { name: "Link source Approved budget" }),
		);
		await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("source-1"));
		expect(linkTopicSource).toHaveBeenCalledWith(
			actions,
			"alpha",
			"source-1",
		);
	});
	it("uploads a document then persists its association without an email", async () => {
		render(
			<TopicSources
				topicId="alpha"
				isSample={false}
				isArchived={false}
			/>,
		);
		const file = new File(["budget"], "Budget.pdf", {
			type: "application/pdf",
		});
		await userEvent.click(
			screen.getByRole("button", { name: "Upload documents" }),
		);
		await userEvent.upload(documentPicker(), file);
		expect(saveTopicDocument).not.toHaveBeenCalled();
		await userEvent.click(screen.getByRole("button", { name: "Upload" }));
		await waitFor(() =>
			expect(saveTopicDocument).toHaveBeenCalledWith(
				actions,
				"insight-1",
				"alpha",
				file,
			),
		);
		expect(await screen.findByText("1 document added.")).toBeVisible();
		expect(screen.queryByRole("dialog")).toBeNull();
		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: "Upload documents" }),
			).toHaveFocus(),
		);
	});
	it("cancels a selected upload without saving and clears the selection on reopen", async () => {
		render(
			<TopicSources
				topicId="alpha"
				isSample={false}
				isArchived={false}
			/>,
		);
		const user = userEvent.setup();
		const trigger = screen.getByRole("button", {
			name: "Upload documents",
		});
		await user.click(trigger);
		expect(screen.getByRole("button", { name: "Upload" })).toBeDisabled();
		await user.upload(documentPicker(), new File(["draft"], "Draft.txt"));
		await user.click(screen.getByRole("button", { name: "Cancel" }));
		await waitFor(() => expect(trigger).toHaveFocus());
		expect(saveTopicDocument).not.toHaveBeenCalled();
		await user.click(trigger);
		expect(screen.queryByText("Draft.txt")).toBeNull();
		await user.keyboard("{Escape}");
		expect(screen.queryByRole("dialog")).toBeNull();
	});
	it("accepts dropped files, removes selections, and retries only unfinished documents", async () => {
		const first = new File(["first"], "First.txt");
		const second = new File(["second"], "Second.txt");
		const removed = new File(["removed"], "Removed.txt");
		vi.mocked(saveTopicDocument)
			.mockResolvedValueOnce("source-1")
			.mockRejectedValueOnce(new Error("Storage unavailable"));
		const onUploaded = vi.fn();
		const onSubmit = vi.fn();
		render(
			<UploadTopicDocumentsDialog
				topicId="alpha"
				onUploaded={onUploaded}
				onSubmit={onSubmit}
			/>,
		);
		fireEvent.drop(
			screen.getByRole("button", {
				name: "Click to browse or drop a file",
			}),
			{
				dataTransfer: { files: [first, second, removed] },
			},
		);
		const user = userEvent.setup();
		await user.click(
			screen.getByRole("button", { name: "Remove Removed.txt" }),
		);
		expect(screen.queryByText("Removed.txt")).toBeNull();
		await user.click(screen.getByRole("button", { name: "Upload" }));
		expect(
			await screen.findByText(
				/1 document\(s\) added. Storage unavailable/,
			),
		).toBeVisible();
		expect(screen.queryByText("First.txt")).toBeNull();
		expect(screen.getByText("Second.txt")).toBeVisible();
		expect(onUploaded).toHaveBeenCalledWith(1);
		expect(onSubmit).not.toHaveBeenCalled();
		await user.click(screen.getByRole("button", { name: "Upload" }));
		await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("source-1"));
		expect(saveTopicDocument).toHaveBeenCalledTimes(3);
		expect(
			vi.mocked(saveTopicDocument).mock.calls.map((call) => call[3]),
		).toEqual([first, second, second]);
	});
	it("validates oversized documents before any write and retains the selection", async () => {
		render(
			<UploadTopicDocumentsDialog
				topicId="alpha"
				onUploaded={vi.fn()}
				onSubmit={vi.fn()}
			/>,
		);
		const oversized = new File(
			[new Uint8Array(10 * 1024 * 1024 + 1)],
			"Large.pdf",
		);
		await userEvent.upload(documentPicker(), oversized);
		await userEvent.click(screen.getByRole("button", { name: "Upload" }));
		expect(
			await screen.findByText(
				"Large.pdf is over the 10 MB source limit.",
			),
		).toBeVisible();
		expect(screen.getByText("Large.pdf")).toBeVisible();
		expect(saveTopicDocument).not.toHaveBeenCalled();
	});
	it("blocks duplicate uploads and every dismissal path while uploading", async () => {
		let complete: ((id: string) => void) | undefined;
		vi.mocked(saveTopicDocument).mockReturnValueOnce(
			new Promise((resolve) => {
				complete = resolve;
			}),
		);
		const onSubmit = vi.fn();
		render(
			<UploadTopicDocumentsDialog
				topicId="alpha"
				onUploaded={vi.fn()}
				onSubmit={onSubmit}
			/>,
		);
		const user = userEvent.setup();
		await user.upload(documentPicker(), new File(["budget"], "Budget.txt"));
		await user.click(screen.getByRole("button", { name: "Upload" }));
		expect(
			screen.getByRole("button", { name: /Uploading…/ }),
		).toBeDisabled();
		expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
		expect(
			screen.getByRole("button", {
				name: "Click to browse or drop a file",
			}),
		).toBeDisabled();
		expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
		await user.keyboard("{Escape}");
		fireEvent.pointerDown(document.body);
		expect(screen.getByRole("dialog")).toBeVisible();
		expect(onSubmit).not.toHaveBeenCalled();
		expect(saveTopicDocument).toHaveBeenCalledOnce();
		complete?.("source-1");
		await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("source-1"));
	});
	it("keeps entered notes and the dialog open after a failed save, then retries", async () => {
		vi.mocked(saveTopicSource).mockRejectedValueOnce(
			new Error("Storage unavailable"),
		);
		const onSubmit = vi.fn();
		render(
			<TopicSourceEditor
				topicId="alpha"
				kind="note"
				onSubmit={onSubmit}
			/>,
		);
		const user = userEvent.setup();
		await user.type(screen.getByLabelText("Title (required)"), "Budget");
		await user.type(screen.getByLabelText("Note (required)"), "$50,000");
		await user.click(screen.getByRole("button", { name: "Save source" }));
		expect(await screen.findByText("Storage unavailable")).toBeVisible();
		expect(screen.getByLabelText("Note (required)")).toHaveValue("$50,000");
		expect(onSubmit).not.toHaveBeenCalled();
		await user.click(screen.getByRole("button", { name: "Save source" }));
		await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("source-1"));
	});
	it("warns about shared edits and submits the version the owner inspected", async () => {
		render(
			<TopicSourceEditor
				topicId="alpha"
				kind="note"
				source={source}
				onSubmit={vi.fn()}
			/>,
		);
		expect(screen.getByText(/Changes apply to every topic/)).toBeVisible();
		await userEvent.click(
			screen.getByRole("button", { name: "Save source" }),
		);
		await waitFor(() =>
			expect(saveTopicSource).toHaveBeenCalledWith(
				actions,
				expect.objectContaining({
					expectedVersion: 2,
					sourceId: "source-1",
				}),
			),
		);
	});
	it("unlinks a source only from the current topic", async () => {
		vi.mocked(usePixel).mockReturnValue({
			status: "SUCCESS",
			data: { topicId: "alpha", sources: [source] },
			refresh,
			update: vi.fn(),
		});
		render(
			<TopicSources
				topicId="alpha"
				isSample={false}
				isArchived={false}
			/>,
		);
		await userEvent.click(
			screen.getByRole("button", {
				name: "Remove Approved budget from this topic",
			}),
		);
		await waitFor(() =>
			expect(linkTopicSource).toHaveBeenCalledWith(
				actions,
				"alpha",
				"source-1",
				true,
			),
		);
		expect(
			await screen.findByText(/other topic links are preserved/),
		).toBeVisible();
	});
	it("distinguishes failed reads from an empty collection and allows retry", async () => {
		vi.mocked(usePixel).mockReturnValue({
			status: "ERROR",
			data: undefined,
			error: new Error("Connection failed"),
			refresh,
			update: vi.fn(),
		});
		render(
			<TopicSources
				topicId="alpha"
				isSample={false}
				isArchived={false}
			/>,
		);
		expect(screen.getByText("Connection failed")).toBeVisible();
		expect(screen.queryByText("No sources yet")).toBeNull();
		await userEvent.click(screen.getByRole("button", { name: "Retry" }));
		expect(refresh).toHaveBeenCalledOnce();
	});
	it("prevents writes to archived and sample topics", () => {
		const { rerender } = render(
			<TopicSources topicId="alpha" isSample={false} isArchived />,
		);
		expect(
			screen.getByRole("button", { name: "Upload documents" }),
		).toBeDisabled();
		rerender(<TopicSources topicId="alpha" isSample isArchived={false} />);
		expect(screen.getByRole("button", { name: "Add note" })).toBeDisabled();
	});
});
