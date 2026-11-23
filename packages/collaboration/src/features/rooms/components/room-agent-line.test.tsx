import { cleanup, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, expect, it } from "vitest";
import { RoomAgentLine } from "./room-agent-line";

afterEach(cleanup);

/** The line under the chat's title, and the paragraphs the chat's details show, as text. */
function read(
	name: string,
	about?: ComponentProps<typeof RoomAgentLine>["about"],
) {
	const line = render(<RoomAgentLine name={name} about={about} />).container
		.textContent;
	cleanup();
	render(<RoomAgentLine name={name} about={about} part="details" />);
	const details = screen
		.getAllByRole("paragraph")
		.map((paragraph) => paragraph.textContent);
	cleanup();
	return { line, details };
}

it("says a person's own twin is private to them and what it works with", () => {
	expect(read("Ryan's Digital Twin", { kind: "mainTwin" })).toEqual({
		line: "Ryan's Digital Twin · Private to you",
		// the sentence opens with "Private to you", so the name stands alone over it
		details: [
			"Ryan's Digital Twin",
			"Private to you. Works with your mail, Teams, calendar, files, work and routines.",
		],
	});
});

it("says whose twin a shared one is, and that it sees nothing of the reader's own", () => {
	const details =
		"It answers only from what its owner shared with it. It cannot see your mail, calendar, or files unless you bring them into this chat.";
	// the details repeat the line, which a narrow header cuts short
	expect(
		read("Renewals Twin", { kind: "sharedTwin", ownerName: "Dana" }),
	).toEqual({
		line: "Renewals Twin · Shared by Dana",
		details: ["Renewals Twin · Shared by Dana", details],
	});
	// the server could not tell whose it is
	expect(read("Renewals Twin", { kind: "sharedTwin" })).toEqual({
		line: "Renewals Twin · Shared with you",
		details: ["Renewals Twin · Shared with you", details],
	});
});

it("says a twin the person shares answers from the copies they gave it", () => {
	expect(read("Renewals Twin", { kind: "ownTwin" })).toEqual({
		line: "Renewals Twin · A twin you share",
		details: [
			"Renewals Twin · A twin you share",
			"It answers only from the copies you gave it.",
		],
	});
});

it("says any other agent can use the person's work in this chat", () => {
	expect(read("Research assistant", { kind: "agent" })).toEqual({
		line: "Research assistant · AI agent",
		details: [
			"Research assistant · AI agent",
			"It can use your mail, Teams, calendar, files and work in this chat.",
		],
	});
});

it("says only that it is an AI agent when nothing is known of it", () => {
	// what a delegated task's room, or one whose agent has not loaded, hands it
	expect(read("Agent")).toEqual({
		line: "Agent · AI agent",
		details: ["Agent · AI agent"],
	});
});
