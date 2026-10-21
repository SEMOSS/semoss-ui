import { cleanup, render, screen, waitFor } from "@testing-library/react";
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
		await userEvent.upload(
			screen.getByLabelText("Upload topic documents"),
			file,
		);
		await waitFor(() =>
			expect(saveTopicDocument).toHaveBeenCalledWith(
				actions,
				"insight-1",
				"alpha",
				file,
			),
		);
		expect(await screen.findByText("1 document added.")).toBeVisible();
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
