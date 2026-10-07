import { fireEvent, render, screen } from "@testing-library/react";
import { ThreadMessage } from "../collaboration/components/thread-message";

it("renders an image-only email instead of an empty message and resets image consent per message", () => {
	const props = {
		name: "Pat",
		channel: "email" as const,
		isIncluded: true,
		isEmpty: true,
	};
	const message = {
		id: "one",
		fromId: "p",
		at: "2026-09-28T12:00:00Z",
		text: "",
		displayBody: {
			contentType: "html" as const,
			content: '<img src="https://example.com/logo.png" alt="Logo">',
		},
	};
	const { rerender } = render(<ThreadMessage {...props} message={message} />);
	expect(screen.queryByText(/Nothing to read/)).not.toBeInTheDocument();
	const frame = screen.getByTitle("Email from Pat");
	expect(frame).toHaveAttribute(
		"sandbox",
		"allow-same-origin allow-popups allow-popups-to-escape-sandbox",
	);
	expect(frame.getAttribute("srcdoc")).not.toContain("<img");
	fireEvent.click(screen.getByRole("button", { name: "Load images" }));
	expect(frame.getAttribute("srcdoc")).toContain("<img");
	rerender(<ThreadMessage {...props} message={{ ...message, id: "two" }} />);
	expect(screen.getByRole("button", { name: "Load images" })).toBeVisible();
});

it("renders Teams rich text with the real thread message and retains source metadata", () => {
	render(
		<ThreadMessage
			name="Pat"
			channel="teams"
			isIncluded={false}
			isEmpty={false}
			message={{
				id: "t",
				fromId: "p",
				at: "2026-09-28T12:00:00Z",
				text: "Hello",
				webLink: "https://teams.microsoft.com/chat",
				displayBody: {
					contentType: "html",
					content:
						"<p>Hello <at>Alex</at></p><blockquote>Quote</blockquote><pre>  code</pre>",
					attachments: [{ name: "Report.pdf" }],
				},
			}}
		/>,
	);
	expect(screen.getByText("Alex")).toHaveAttribute("data-mention", "true");
	expect(screen.getByText("Quote").tagName).toBe("BLOCKQUOTE");
	expect(screen.getByText("Excluded")).toBeVisible();
	expect(screen.getByRole("link", { name: "Open in Teams" })).toHaveAttribute(
		"href",
		"https://teams.microsoft.com/chat",
	);
	expect(screen.getByText("Report.pdf — open in Teams")).toBeVisible();
});
