import { act, renderHook } from "@testing-library/react";
import { getMail, listMail, listMailFolders } from "../api/microsoft";
import type { MailSearchFilters } from "../types";
import { useSources } from "./use-sources";

vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ actions: {}, insightId: "insight" }),
}));
vi.mock("../api/microsoft", async (importOriginal) => ({
	...(await importOriginal<typeof import("../api/microsoft")>()),
	listMail: vi.fn(),
	listMailFolders: vi.fn(),
	getMail: vi.fn(),
}));

const filters: MailSearchFilters = {
	folder: "inbox",
	subject: "",
	from: "",
	unreadOnly: false,
	sinceDays: 7,
};
const mail = {
	uid: "mail",
	body: "Actual body",
	unread: false,
	hasAttachments: false,
};

beforeEach(() => {
	vi.mocked(listMail).mockReset();
	vi.mocked(listMailFolders).mockReset();
	vi.mocked(getMail).mockReset();
});

it("does not load any mailbox on mount and retains prior data on refresh failure", async () => {
	const { result } = renderHook(() => useSources());
	expect(listMail).not.toHaveBeenCalled();
	vi.mocked(listMail)
		.mockResolvedValueOnce({ folder: "inbox", count: 1, messages: [mail] })
		.mockRejectedValueOnce(new Error("Permission expired"));
	vi.mocked(listMailFolders).mockResolvedValue({ count: 0, folders: [] });
	await act(() => result.current.loadMail(filters));
	await act(() => result.current.loadMail(filters));
	expect(result.current.mail).toHaveLength(1);
	expect(result.current.loads.mail.error).toBe("Permission expired");
});

it("keeps successful email results and reports a failed optional folder load", async () => {
	vi.mocked(listMail).mockResolvedValue({
		folder: "inbox",
		count: 1,
		messages: [mail],
	});
	vi.mocked(listMailFolders).mockRejectedValue(new Error("Folder failure"));
	const { result } = renderHook(() => useSources());
	await act(() => result.current.loadMail(filters));
	expect(result.current.mail).toHaveLength(1);
	expect(result.current.folderError).toContain(
		"Custom folders could not be loaded",
	);
});

it("ignores a previous selection that finishes after a newer one", async () => {
	let finish: ((value: typeof mail) => void) | undefined;
	vi.mocked(getMail)
		.mockReturnValueOnce(
			new Promise((resolve) => {
				finish = resolve;
			}),
		)
		.mockResolvedValueOnce({ ...mail, uid: "new" });
	const { result } = renderHook(() => useSources());
	let old: Promise<void> | undefined;
	act(() => {
		old = result.current.selectMail("old");
	});
	await act(() => result.current.selectMail("new"));
	await act(async () => {
		finish?.({ ...mail, uid: "old" });
		await old;
	});
	expect(result.current.selected?.nativeId).toBe("new");
});

it("retains the selected message folder while another folder is loaded", async () => {
	let finish: ((value: typeof mail) => void) | undefined;
	vi.mocked(getMail).mockReturnValueOnce(
		new Promise((resolve) => {
			finish = resolve;
		}),
	);
	vi.mocked(listMail).mockResolvedValue({
		folder: "sentitems",
		count: 0,
		messages: [],
	});
	vi.mocked(listMailFolders).mockResolvedValue({ count: 0, folders: [] });
	const { result } = renderHook(() => useSources());
	let selection: Promise<void> | undefined;
	act(() => {
		selection = result.current.selectMail("mail");
	});
	await act(() =>
		result.current.loadMail({ ...filters, folder: "sentitems" }),
	);
	await act(async () => {
		finish?.(mail);
		await selection;
	});
	expect(result.current.selected?.folder).toBe("inbox");
});
