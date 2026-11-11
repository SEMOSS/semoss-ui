import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { getMail } from "@/features/connectors/api/microsoft";
import type { OutlookMail } from "@/features/connectors/api/microsoft-schemas";
import { MailReader } from "./mail-reader";

const insight = vi.hoisted(() => ({ actions: {} }));
vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useInsight: () => insight,
}));
vi.mock("@/features/connectors/api/microsoft", () => ({
	getMail: vi.fn(),
	safeSourceUrl: (value: string | undefined) =>
		value?.startsWith("https://") ? value : undefined,
}));
// the body's sandboxed frame is covered where it lives
vi.mock("@/features/email/source-message-body", () => ({
	SourceMessageBody: ({ body }: { body: { content: string } }) => (
		<p>{body.content}</p>
	),
}));

const read = vi.mocked(getMail);
const email: OutlookMail = {
	uid: "m1",
	messageId: undefined,
	subject: "RE: Renewal pricing",
	from: "ava.reed@example.com",
	to: "owner@example.com, team@example.com",
	cc: undefined,
	receivedDate: "2026-11-09T15:00:00Z",
	sentDate: undefined,
	unread: false,
	hasAttachments: false,
	body: "Plain text of the email",
	webLink: "https://outlook.office.com/mail/id/m1",
};

beforeEach(() => {
	vi.clearAllMocks();
	read.mockResolvedValue(email);
});
afterEach(cleanup);

it("shows the email as Outlook has it, with its sender named as the list named them", async () => {
	render(<MailReader messageId="m1" senderName="Ava Reed" count={1} />);
	expect(screen.getByRole("status")).toHaveTextContent("Loading email…");
	expect(
		await screen.findByRole("heading", { name: "RE: Renewal pricing" }),
	).toBeVisible();
	expect(read).toHaveBeenCalledExactlyOnceWith(insight.actions, "m1");
	expect(screen.getByText("Ava Reed")).toBeVisible();
	// without a formatted body the email's text stands in
	expect(screen.getByText("Plain text of the email")).toBeVisible();
	expect(
		screen.getByRole("link", { name: "Open in Outlook" }),
	).toHaveAttribute("href", "https://outlook.office.com/mail/id/m1");
	expect(screen.queryByText(/emails in this conversation/)).toBeNull();
});

it("says when it shows only the newest email of a conversation", async () => {
	render(<MailReader messageId="m1" count={3} />);
	expect(
		await screen.findByText(
			"This is the newest of 3 emails in this conversation. Adding it files the whole conversation.",
		),
	).toBeVisible();
});

it("says when the email could not be read and reads it again", async () => {
	read.mockRejectedValueOnce(new Error("Graph timed out"));
	render(<MailReader messageId="m1" count={1} />);
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Graph timed out",
	);
	await userEvent
		.setup()
		.click(screen.getByRole("button", { name: "Try again" }));
	expect(
		await screen.findByRole("heading", { name: "RE: Renewal pricing" }),
	).toBeVisible();
	expect(read).toHaveBeenCalledTimes(2);
});
