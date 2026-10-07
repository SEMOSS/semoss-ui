import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import type { SourceAttachment } from "@/features/connectors/types";
import { ToolWorkbenchContext } from "@/features/tools/tool-workbench.context";
import type { ToolWorkbenchContextValue } from "@/features/tools/types/tool-workbench";
import { WorkComposerSession } from "./work-composer-session";
import { WorkEmailContext } from "./work-email.context";
import { WorkEmailAttachments } from "./work-email-attachments";
import {
	WorkThreadContext,
	type WorkThreadContextValue,
} from "./work-thread-context";

const state = createInitialCollaborationState();
const thread = state.threads[0];
const sourceUid =
	thread.source?.kind === "outlook" ? thread.source.nativeId : undefined;
const budget: SourceAttachment = {
	id: "a1",
	name: "Budget.xlsx",
	size: 2048,
	isFile: true,
	messageId: "m1",
};
const scan: SourceAttachment = {
	id: "a2",
	name: "scan.pdf",
	size: 4096,
	isFile: true,
	messageId: "m1",
};
const link: SourceAttachment = {
	id: "a3",
	name: "Plan.docx",
	isFile: false,
	messageId: "m1",
};

function renderAttachments(
	attachments: SourceAttachment[],
	composer = new WorkComposerSession(),
) {
	const session = {
		previewAttachment: vi.fn().mockResolvedValue({
			insightId: "download-area",
			path: "Budget-abc123.xlsx.txt",
			name: "Budget.xlsx (text)",
		}),
		downloadAttachment: vi.fn().mockResolvedValue(undefined),
	};
	const openFile = vi.fn();
	render(
		<WorkEmailContext.Provider
			value={{
				thread,
				workspace: state.workspaces[thread.id],
				composer,
				allowedSources: new Set(),
				openEmail: vi.fn(),
			}}
		>
			<WorkThreadContext.Provider
				value={{ session } as unknown as WorkThreadContextValue}
			>
				<ToolWorkbenchContext.Provider
					value={{ openFile } as unknown as ToolWorkbenchContextValue}
				>
					<WorkEmailAttachments
						attachments={attachments}
						webLink="https://outlook.office.com/mail/m1"
					/>
				</ToolWorkbenchContext.Provider>
			</WorkThreadContext.Provider>
		</WorkEmailContext.Provider>,
	);
	return { session, openFile, composer };
}

it("queues a file for the next message without reading it", () => {
	const { composer, session } = renderAttachments([budget, scan]);
	expect(screen.getByText("Attachments · 2")).toBeInTheDocument();
	expect(
		screen.getByText("2.0 KB · Assistant reads its text"),
	).toBeInTheDocument();
	expect(screen.getByText("4.0 KB")).toBeInTheDocument();
	const attach = screen.getByRole("button", {
		name: "Attach Budget.xlsx to your next message",
	});
	fireEvent.click(attach);
	expect(composer.getSnapshot().selected).toEqual(["a1"]);
	expect(
		screen.getByRole("button", {
			name: "Remove Budget.xlsx from your next message",
		}),
	).toHaveAttribute("aria-pressed", "true");
	expect(screen.getByRole("status")).toHaveTextContent(
		"Budget.xlsx will go to Assistant with your next message.",
	);
	fireEvent.click(
		screen.getByRole("button", {
			name: "Remove Budget.xlsx from your next message",
		}),
	);
	expect(composer.getSnapshot().selected).toEqual([]);
	expect(session.previewAttachment).not.toHaveBeenCalled();
	expect(session.downloadAttachment).not.toHaveBeenCalled();
});

it("opens a preview from the download area in the dock", async () => {
	const { session, openFile } = renderAttachments([budget]);
	fireEvent.click(screen.getByRole("button", { name: "Open Budget.xlsx" }));
	await waitFor(() =>
		expect(openFile).toHaveBeenCalledWith(
			"Budget-abc123.xlsx.txt",
			"Budget.xlsx (text)",
			"download-area",
		),
	);
	expect(session.previewAttachment).toHaveBeenCalledWith(sourceUid, budget);
	expect(screen.getByRole("status")).toHaveTextContent(
		"Budget.xlsx is open in the side panel.",
	);
});

it("shows why a download failed", async () => {
	const { session } = renderAttachments([scan]);
	session.downloadAttachment.mockRejectedValueOnce(
		new Error("scan.pdf is larger than the 10 MB attachment limit."),
	);
	fireEvent.click(screen.getByRole("button", { name: "Download scan.pdf" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"scan.pdf is larger than the 10 MB attachment limit.",
	);
});

it("sends links and attached emails to Outlook instead", () => {
	renderAttachments([link]);
	expect(
		screen.getByRole("link", { name: "Open Plan.docx in Outlook" }),
	).toHaveAttribute("href", "https://outlook.office.com/mail/m1");
	expect(
		screen.queryByRole("button", { name: /Attach Plan\.docx/ }),
	).not.toBeInTheDocument();
});

it("stops at five attached files", () => {
	const composer = new WorkComposerSession();
	composer.setSelected(["x1", "x2", "x3", "x4", "x5"]);
	renderAttachments([budget], composer);
	expect(
		screen.getByRole("button", {
			name: "Attach Budget.xlsx to your next message",
		}),
	).toBeDisabled();
});
