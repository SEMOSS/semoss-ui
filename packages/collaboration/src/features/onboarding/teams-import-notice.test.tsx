import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { TeamsImportNotice } from "./teams-import-notice";

afterEach(cleanup);

describe("Teams import recovery", () => {
	it.each([
		"1 Teams chat could not be read.",
		"1 Teams chat could not be read. Readable chats were kept; failed chats will be retried on the next import.",
	])(
		"keeps partial results without repeating the summary: %s",
		(teamsError) => {
			render(
				<TeamsImportNotice
					counts={{
						teamsMessages: 24,
						teamsChatsSkipped: 1,
						teamsError,
						teamsReauthNeeded: false,
					}}
				/>,
			);
			expect(screen.getByRole("alert")).toHaveTextContent(
				"Read 24 Teams messages. Skipped 1 chat.",
			);
			expect(screen.getByRole("alert")).toHaveTextContent(
				"Skipped chats will be retried on your next import.",
			);
			expect(screen.getByRole("alert")).not.toHaveTextContent("Sign out");
			expect(
				screen.queryByText("Teams import details"),
			).not.toBeInTheDocument();
		},
	);

	it("reports all failed chats without claiming successful Teams reads", () => {
		render(
			<TeamsImportNotice
				counts={{ teamsMessages: 0, teamsChatsSkipped: 3 }}
			/>,
		);
		expect(screen.getByRole("alert")).toHaveTextContent(
			"Read 0 Teams messages. Skipped 3 chats.",
		);
	});

	it("asks for sign-in only for an explicit authentication failure, preserving partial results", () => {
		render(
			<TeamsImportNotice
				counts={{
					teamsMessages: 8,
					teamsChatsSkipped: 2,
					teamsReauthNeeded: true,
				}}
			/>,
		);
		expect(screen.getByRole("alert")).toHaveTextContent(
			"Read 8 Teams messages. Skipped 2 chats.",
		);
		expect(screen.getByRole("alert")).toHaveTextContent("Sign out");
	});

	it("does not infer expired login from a source-level or legacy 403 error", () => {
		render(
			<TeamsImportNotice
				counts={{ teamsError: "GET request returned HTTP 403" }}
			/>,
		);
		expect(screen.getByRole("alert")).toHaveTextContent(
			"Check your Teams access and import again.",
		);
		expect(screen.getByRole("alert")).not.toHaveTextContent("Sign out");
	});

	it("offers sign-in for a source-level authentication failure", () => {
		render(
			<TeamsImportNotice
				counts={{
					teamsError: "GET request returned HTTP 401",
					teamsReauthNeeded: true,
				}}
			/>,
		);
		expect(screen.getByRole("alert")).toHaveTextContent("Sign out");
	});

	it("shows no warning when Teams succeeded or was not selected", () => {
		const { rerender } = render(<TeamsImportNotice counts={{}} />);
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		rerender(
			<TeamsImportNotice
				counts={{ teamsMessages: 24, teamsChatsSkipped: 0 }}
			/>,
		);
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	it.each([0, 2])(
		"keeps provider diagnostics with %i skipped chats",
		async (teamsChatsSkipped) => {
			const user = userEvent.setup();
			const { container } = render(
				<TeamsImportNotice
					counts={{
						teamsError: "Forbidden <script>example</script>",
						teamsChatsSkipped,
					}}
				/>,
			);
			await user.click(screen.getByText("Teams import details"));
			expect(container.querySelector("details")).toHaveAttribute("open");
			expect(container.querySelector("script")).toBeNull();
			expect(screen.getByRole("alert")).toHaveTextContent(
				"Forbidden <script>example</script>",
			);
		},
	);
});
