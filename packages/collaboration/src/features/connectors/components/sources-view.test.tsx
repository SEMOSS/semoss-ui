import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
	getMail,
	listCalendarEvents,
	listMail,
	listMailFolders,
	listTeamsChats,
} from "../api/microsoft";
import { SourcesView } from "./sources-view";

vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ actions: {}, insightId: "insight" }),
}));
vi.mock("../api/microsoft", async (importOriginal) => ({
	...(await importOriginal<typeof import("../api/microsoft")>()),
	listMail: vi.fn(),
	listMailFolders: vi.fn(),
	getMail: vi.fn(),
	listTeamsChats: vi.fn(),
	listCalendarEvents: vi.fn(),
}));

beforeEach(() => {
	vi.mocked(listMail).mockReset();
	vi.mocked(listMailFolders).mockReset();
	vi.mocked(getMail).mockReset();
	vi.mocked(listTeamsChats).mockReset();
	vi.mocked(listCalendarEvents).mockReset();
});

it("loads headers, then selected text, and imports only after an explicit action", async () => {
	const user = userEvent.setup();
	const onImport = vi.fn();
	const mail = {
		uid: "native-mail",
		subject: "Today note",
		from: "sender@example.com",
		unread: true,
		hasAttachments: false,
	};
	vi.mocked(listMail).mockResolvedValue({
		folder: "inbox",
		count: 1,
		messages: [mail],
	});
	vi.mocked(listMailFolders).mockResolvedValue({ count: 0, folders: [] });
	vi.mocked(getMail).mockResolvedValue({
		...mail,
		body: "Actual selected content",
	});
	render(<SourcesView onImport={onImport} />);
	expect(listMail).not.toHaveBeenCalled();
	expect(listTeamsChats).not.toHaveBeenCalled();
	expect(listCalendarEvents).not.toHaveBeenCalled();
	await user.click(screen.getByRole("button", { name: "Load email" }));
	await screen.findByRole("button", { name: "Read Today note" });
	expect(listMail).toHaveBeenCalledWith(
		{},
		expect.objectContaining({ sinceDays: 7 }),
	);
	expect(getMail).not.toHaveBeenCalled();
	await user.click(screen.getByRole("button", { name: "Read Today note" }));
	await screen.findByText("Actual selected content");
	expect(onImport).not.toHaveBeenCalled();
	await user.click(screen.getByRole("button", { name: "Add to Work" }));
	expect(onImport).toHaveBeenCalledWith(
		expect.objectContaining({
			sourceKind: "outlook",
			nativeId: "native-mail",
			body: "Actual selected content",
		}),
	);
});

it("shows permission failures without presenting fictional source results", async () => {
	const user = userEvent.setup();
	vi.mocked(listMail).mockRejectedValue(
		new Error("Mail.Read permission required"),
	);
	vi.mocked(listMailFolders).mockResolvedValue({ count: 0, folders: [] });
	render(<SourcesView onImport={vi.fn()} />);
	await user.click(screen.getByRole("button", { name: "Load email" }));
	await waitFor(() =>
		expect(screen.getByRole("alert")).toHaveTextContent(
			"Mail.Read permission required",
		),
	);
	expect(
		screen.queryByRole("button", { name: "Add to Work" }),
	).not.toBeInTheDocument();
});

it("passes the selected date range through the source loader only after explicit search", async () => {
	const user = userEvent.setup();
	vi.mocked(listMail).mockResolvedValue({
		folder: "inbox",
		count: 0,
		messages: [],
	});
	vi.mocked(listMailFolders).mockResolvedValue({ count: 0, folders: [] });
	render(<SourcesView onImport={vi.fn()} />);
	const range = screen.getByRole("combobox", { name: "Date range" });
	expect(range).toHaveTextContent("Last 7 days");
	range.focus();
	await user.keyboard("{Enter}");
	expect(
		screen.getAllByRole("option").map((option) => option.textContent),
	).toEqual(["Last day", "Last 7 days", "Last 30 days", "Last 90 days"]);
	await user.keyboard("{ArrowDown}{Enter}");
	expect(range).toHaveTextContent("Last 30 days");
	expect(listMail).not.toHaveBeenCalled();
	await user.click(screen.getByRole("button", { name: "Load email" }));
	await waitFor(() =>
		expect(listMail).toHaveBeenCalledWith(
			{},
			expect.objectContaining({ sinceDays: 30 }),
		),
	);
});
