import type { InsightActions } from "@/lib/pixel";
import { downloadMailAttachmentIsolated } from "./mail-attachment-download";
import { downloadStagedAttachment, stageMailAttachment } from "./microsoft";

const sdk = vi.hoisted(() => ({
	initialize: vi.fn<() => Promise<boolean>>(),
	destroy: vi.fn(),
	instances: [] as {
		insightId: string;
		isReady: boolean;
		actions: { run: ReturnType<typeof vi.fn> };
		initialize: ReturnType<typeof vi.fn>;
	}[],
}));

vi.mock("@semoss/sdk", () => ({
	Insight: class {
		insightId = `isolated-download-${sdk.instances.length + 1}`;
		isReady = false;
		actions = { run: vi.fn() };
		destroy = sdk.destroy;
		initialize = vi.fn(async () => {
			this.isReady = await sdk.initialize();
		});
		constructor() {
			sdk.instances.push(this);
		}
	},
}));
vi.mock("./microsoft", () => ({
	stageMailAttachment: vi.fn(),
	downloadStagedAttachment: vi.fn(),
}));

const attachment = { id: "file", name: "report.pdf", isFile: true };
function owner(insightId = "bound-room-insight") {
	return {
		insightId,
		actions: { run: vi.fn() } as unknown as InsightActions,
	};
}

beforeEach(() => {
	sdk.instances.length = 0;
	sdk.initialize.mockReset().mockResolvedValue(true);
	sdk.destroy.mockReset();
	vi.mocked(downloadStagedAttachment).mockReset().mockResolvedValue();
	vi.mocked(stageMailAttachment)
		.mockReset()
		.mockImplementation(
			async (_actions, insightId, sourceUid, attachmentId, name) => ({
				insightId,
				sourceUid,
				attachmentId,
				name,
				filePath: `unique-${name}`,
				size: 100,
			}),
		);
});

it("uses an unbound insight for both staging and export, never the room's actions", async () => {
	const parent = owner();
	expect(sdk.instances).toHaveLength(0);
	await downloadMailAttachmentIsolated(parent, "mail", attachment);
	const isolated = sdk.instances[0];
	expect(isolated?.initialize).toHaveBeenCalledWith({ disableRoom: true });
	expect(stageMailAttachment).toHaveBeenCalledWith(
		isolated?.actions,
		"isolated-download-1",
		"mail",
		"file",
		"report.pdf",
	);
	expect(downloadStagedAttachment).toHaveBeenCalledWith(
		isolated?.actions,
		expect.objectContaining({ insightId: "isolated-download-1" }),
	);
	expect(parent.actions.run).not.toHaveBeenCalled();
	// The SDK's resolved promise means a browser handoff, not completed bytes.
	expect(sdk.destroy).not.toHaveBeenCalled();
});

it("shares initialization and file staging for concurrent downloads in one parent scope", async () => {
	const parent = owner();
	let ready: ((value: boolean) => void) | undefined;
	sdk.initialize.mockReturnValueOnce(
		new Promise((resolve) => {
			ready = resolve;
		}),
	);
	const first = downloadMailAttachmentIsolated(parent, "mail", attachment);
	const second = downloadMailAttachmentIsolated(parent, "mail", attachment);
	expect(sdk.instances).toHaveLength(1);
	expect(stageMailAttachment).not.toHaveBeenCalled();
	ready?.(true);
	await Promise.all([first, second]);
	expect(sdk.initialize).toHaveBeenCalledTimes(1);
	expect(stageMailAttachment).toHaveBeenCalledTimes(1);
	expect(downloadStagedAttachment).toHaveBeenCalledTimes(2);
});

it("creates a separate download area after the parent insight changes without destroying in-flight downloads", async () => {
	const parent = owner();
	await downloadMailAttachmentIsolated(parent, "mail", attachment);
	await downloadMailAttachmentIsolated(
		{ ...parent, insightId: "next-account-insight" },
		"mail",
		attachment,
	);
	expect(sdk.instances).toHaveLength(2);
	expect(stageMailAttachment).toHaveBeenNthCalledWith(
		2,
		sdk.instances[1]?.actions,
		"isolated-download-2",
		"mail",
		"file",
		"report.pdf",
	);
	expect(sdk.destroy).not.toHaveBeenCalled();
});

it("reports initialization failure and only retries after a new explicit call", async () => {
	const parent = owner();
	sdk.initialize.mockResolvedValueOnce(false);
	await expect(
		downloadMailAttachmentIsolated(parent, "mail", attachment),
	).rejects.toThrow("Could not prepare the attachment download");
	expect(stageMailAttachment).not.toHaveBeenCalled();
	expect(sdk.initialize).toHaveBeenCalledTimes(1);
	await downloadMailAttachmentIsolated(parent, "mail", attachment);
	expect(sdk.initialize).toHaveBeenCalledTimes(2);
	expect(downloadStagedAttachment).toHaveBeenCalledTimes(1);
});
