import { describe, expect, it } from "vitest";
import {
	getLinkHost,
	getLinkText,
	parseRichText,
	type RichTextBlock,
	toMarkdownText,
	toSiteLink,
} from "./connector-rich-text";

/**
 * The blocks in a shape that is easy to compare: text as strings, and links
 * as their address and label.
 */
const shape = (blocks: RichTextBlock[]) =>
	blocks.map((block) =>
		block.kind === "divider"
			? "divider"
			: block.lines.map((line) =>
					line.map((piece) =>
						piece.kind === "text"
							? piece.text
							: { href: piece.href, label: piece.label },
					),
				),
	);

const read = (text: string) => shape(parseRichText(text));

describe("parseRichText", () => {
	it("keeps paragraphs and line breaks, cutting runs of blank lines to one", () => {
		expect(
			read("\n\nHi Ada,\r\n\r\n\r\n\r\nSee you\nat noon.\n\n"),
		).toEqual([[["Hi Ada,"], [], ["See you"], ["at noon."]]]);
		expect(read("  \n\n")).toEqual([]);
	});

	it("draws the rules a sender drew as dividers, never at either end", () => {
		const rule = "_".repeat(80);
		expect(
			read(
				[
					"Agenda attached.",
					"",
					rule,
					"Microsoft Teams meeting",
					"Click here to join the meeting<https://teams.microsoft.com/l/meetup-join/abc>",
					"Meeting ID: 123 456 789",
					rule,
					"",
				].join("\n"),
			),
		).toEqual([
			[["Agenda attached."]],
			"divider",
			[
				["Microsoft Teams meeting"],
				[
					"Click here to join the meeting",
					{ href: "https://teams.microsoft.com/l/meetup-join/abc" },
				],
				["Meeting ID: 123 456 789"],
			],
		]);
		expect(read("_____\nOnly this\n=====\n-----")).toEqual([
			[["Only this"]],
		]);
	});

	it("marks a link written after its text beside that text", () => {
		expect(
			read(
				"Download Teams<https://aka.ms/download> | Join on the web<https://aka.ms/web>",
			),
		).toEqual([
			[
				[
					"Download Teams",
					{ href: "https://aka.ms/download" },
					" | Join on the web",
					{ href: "https://aka.ms/web" },
				],
			],
		]);
	});

	it("turns text that already shows the address into the link", () => {
		expect(read("ada@example.com<mailto:ada@example.com>")).toEqual([
			[[{ href: "mailto:ada@example.com", label: "ada@example.com" }]],
		]);
		expect(
			read(
				"Mail Ada.Lovelace@Example.com<mailto:ada.lovelace@example.com> today",
			),
		).toEqual([
			[
				[
					"Mail ",
					{
						href: "mailto:ada.lovelace@example.com",
						label: "Ada.Lovelace@Example.com",
					},
					" today",
				],
			],
		]);
		expect(
			read("Visit www.example.com<https://www.example.com/>."),
		).toEqual([
			[
				[
					"Visit ",
					{
						href: "https://www.example.com/",
						label: "www.example.com",
					},
					".",
				],
			],
		]);
		expect(read("https://example.com<https://example.com>")).toEqual([
			[[{ href: "https://example.com", label: "https://example.com" }]],
		]);
	});

	it("writes an email after a name in parentheses, and a lone address whole", () => {
		expect(read("Ada Lovelace<mailto:ada@example.com>")).toEqual([
			[
				[
					"Ada Lovelace (",
					{
						href: "mailto:ada@example.com",
						label: "ada@example.com",
					},
					")",
				],
			],
		]);
		expect(read("See <https://example.com/docs> for more")).toEqual([
			[
				[
					"See ",
					{
						href: "https://example.com/docs",
						label: "https://example.com/docs",
					},
					" for more",
				],
			],
		]);
		expect(read("(<mailto:ada@example.com>)")).toEqual([
			[
				[
					"(",
					{
						href: "mailto:ada@example.com",
						label: "ada@example.com",
					},
					")",
				],
			],
		]);
	});

	it("links bare addresses without the sentence's punctuation", () => {
		expect(
			read("Notes: https://example.com/a, and (https://example.com/b)."),
		).toEqual([
			[
				[
					"Notes: ",
					{
						href: "https://example.com/a",
						label: "https://example.com/a",
					},
					", and (",
					{
						href: "https://example.com/b",
						label: "https://example.com/b",
					},
					").",
				],
			],
		]);
		const page = "https://en.wikipedia.org/wiki/Mercury_(planet)";
		expect(read(page)).toEqual([[[{ href: page, label: page }]]]);
	});

	it("drops the marks Outlook leaves for inline images", () => {
		expect(
			read(
				"Thanks,\n[cid:image001.png@01DB1234.ABCD5678]\nAda [cid:image002.jpg@01DB]",
			),
		).toEqual([[["Thanks,"], ["Ada"]]]);
	});
});

describe("toMarkdownText", () => {
	it("keeps the lines of a paragraph and the blank lines between them", () => {
		expect(toMarkdownText("Hi all,\n\n\n\nThanks\nAda\n")).toBe(
			"Hi all,\n\nThanks  \nAda",
		);
		expect(toMarkdownText("  \n")).toBe("");
	});

	it("turns the bullets a mail client wrote into one list", () => {
		expect(
			toMarkdownText(
				"The demo covers:\n\n\u2022        Ingestion\n\n\u2022        Validation\no   Rules\n\nThen questions.",
			),
		).toBe(
			"The demo covers:\n\n- Ingestion\n- Validation\n  - Rules\n\nThen questions.",
		);
		// a numbered list after a bulleted one stays a list of its own
		expect(toMarkdownText("\u2022  Last point\n\n3. Next step")).toBe(
			"- Last point\n\n3. Next step",
		);
	});

	it("writes links the way Markdown links them", () => {
		expect(
			toMarkdownText(
				[
					"Join the meeting<https://teams.microsoft.com/l/meetup-join/abc>",
					"ada@example.com<mailto:ada@example.com> | www.example.com<http://www.example.com/>",
					"Ada Lovelace<mailto:ada@example.com>",
					"See https://example.com/a.",
				].join("\n"),
			),
		).toBe(
			[
				"Join the meeting ([teams.microsoft.com](https://teams.microsoft.com/l/meetup-join/abc))  ",
				"ada@example.com | [www.example.com](http://www.example.com/)  ",
				"Ada Lovelace (ada@example.com)  ",
				"See <https://example.com/a>.",
			].join("\n"),
		);
	});

	it("draws dividers and drops the marks of inline images", () => {
		expect(
			toMarkdownText(
				`Agenda.\n${"_".repeat(40)}\nJoin<https://teams.microsoft.com/l/x>\n[cid:image001.png@01DB]\n`,
			),
		).toBe(
			"Agenda.\n\n---\n\nJoin ([teams.microsoft.com](https://teams.microsoft.com/l/x))",
		);
	});

	it("keeps text from turning into markup it never had", () => {
		expect(
			toMarkdownText(
				"Press <Enter> to send.\n    Indented line\n# not a heading\n--\n~~~",
			),
		).toBe(
			"Press \\<Enter> to send.  \nIndented line  \n\\# not a heading  \n\\--  \n\\~~~",
		);
	});
});

describe("links", () => {
	it("reads an address the way text shows it", () => {
		expect(getLinkText("mailto:ada@example.com?subject=Hi")).toBe(
			"ada@example.com",
		);
		expect(getLinkText("https://www.example.com/")).toBe("www.example.com");
		expect(getLinkText("https://example.com/a/")).toBe("example.com/a");
	});

	it("names the host a link goes to", () => {
		expect(
			getLinkHost("https://teams.microsoft.com/l/meetup-join/abc"),
		).toBe("teams.microsoft.com");
		expect(getLinkHost("not a link")).toBe("not a link");
	});

	it("names a link by its site, in brackets when its address needs them", () => {
		expect(toSiteLink("https://teams.microsoft.com/l/x")).toBe(
			"[teams.microsoft.com](https://teams.microsoft.com/l/x)",
		);
		expect(toSiteLink("https://en.wikipedia.org/wiki/A_(b)")).toBe(
			"[en.wikipedia.org](<https://en.wikipedia.org/wiki/A_(b)>)",
		);
	});
});
