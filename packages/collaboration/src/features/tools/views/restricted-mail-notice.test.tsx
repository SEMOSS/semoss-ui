import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RestrictedMailNotice } from "./restricted-mail-notice";

const item = {
	messageId: "private-message-id",
	threadId: "private-thread-id",
	subject: "Project update",
	code: "THREAD_MUTED",
	message: "This email belongs to a muted thread.",
	topicMatch: "linked",
};

function output(status: string, items: unknown[], note?: string): string {
	return JSON.stringify({
		items: [],
		restrictedMail: { status, note, items },
	});
}

it("shows reasons in a keyboard-accessible dialog without exposing identities", async () => {
	const user = userEvent.setup();
	render(
		<RestrictedMailNotice
			output={output(
				"searched",
				[
					item,
					{
						...item,
						messageId: "blocked-id",
						code: "NEVER_INGEST",
						subject: "Must not appear",
						message: "A global rule blocked this email.",
						topicMatch: "unknown",
					},
					{
						...item,
						messageId: "ignored-id",
						subject: null,
						code: "IGNORED",
						message: "This email is ignored.",
						topicMatch: "not_scoped",
					},
				],
				"Mailbox matches were checked against known rules.",
			)}
		/>,
	);
	expect(
		screen.getByText("3 restricted emails were reported."),
	).toBeVisible();
	expect(screen.getByText(/best-effort/)).toBeVisible();
	expect(screen.getByText(/Mailbox matches/)).toBeVisible();
	const trigger = screen.getByRole("button", { name: "View Restrictions" });
	trigger.focus();
	await user.keyboard("{Enter}");
	const dialog = screen.getByRole("dialog", { name: "Restricted Mail" });
	expect(within(dialog).getByText("Project update")).toBeVisible();
	expect(within(dialog).getByText(item.message)).toBeVisible();
	expect(
		within(dialog).getByText("Linked to the searched topic."),
	).toBeVisible();
	expect(within(dialog).getByText(/connection.*unknown/)).toBeVisible();
	expect(within(dialog).getByText(/not scoped to a topic/)).toBeVisible();
	expect(within(dialog).getAllByText("Restricted email")).toHaveLength(2);
	expect(dialog).not.toHaveTextContent("Must not appear");
	expect(dialog).not.toHaveTextContent("private-message-id");
	expect(dialog).not.toHaveTextContent("private-thread-id");
	await user.keyboard("{Escape}");
	expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	expect(trigger).toHaveFocus();
});

it.each([
	["searched", "best-effort"],
	["partial", "was incomplete"],
	["unavailable", "was unavailable"],
	["not_searched", "was not performed"],
])(
	"reports %s coverage without claiming that no restriction exists",
	(status, text) => {
		render(<RestrictedMailNotice output={output(status, [])} />);
		expect(
			screen.getByText("No restricted emails were reported."),
		).toBeVisible();
		expect(screen.getByText(new RegExp(text))).toBeVisible();
		expect(
			screen.queryByRole("button", { name: "View Restrictions" }),
		).toBeNull();
	},
);

it.each([
	undefined,
	'{"items":[],"restrictedMail":{"status":"searched","items":[',
	JSON.stringify({ items: [] }),
	JSON.stringify({ restrictedMail: { status: "new_status", items: [] } }),
	JSON.stringify({ restrictedMail: { status: "searched", items: [{}] } }),
])(
	"reports unavailable diagnostics for incomplete or invalid output",
	(value) => {
		render(<RestrictedMailNotice output={value} />);
		expect(
			screen.getByText(/Restricted-mail details are unavailable/),
		).toBeVisible();
		expect(
			screen.queryByText("No restricted emails were reported."),
		).toBeNull();
	},
);
