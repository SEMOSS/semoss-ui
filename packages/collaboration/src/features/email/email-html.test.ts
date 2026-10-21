import { createEditor } from "lexical";
import {
	EMAIL_HTML_CONFIG,
	EMAIL_NODES,
	exportEmailHtml,
	writeEmailEditor,
} from "./email-editor-config";
import {
	draftText,
	emailDocument,
	hasDisplayContent,
	plainTextEmail,
	sanitizeDraftHtml,
	teamsHtml,
} from "./email-html";
import { readDisplayBody } from "./message-body";

it("preserves email layout in an isolated document and loads remote images only on consent", () => {
	const html =
		'<html><head><style>td { color: red }</style></head><body><table><tr><td style="padding:12px">Hello</td></tr></table><img src="https://example.com/logo.png" alt="Logo"><img src="cid:one" alt="Embedded logo"></body></html>';
	const blocked = emailDocument(html, false);
	expect(blocked.hasImages).toBe(true);
	expect(blocked.html).toContain("<table>");
	expect(blocked.html).toContain("td { color: red }");
	expect(blocked.html).toContain("[Logo]");
	expect(blocked.html).not.toContain("<img");
	expect(blocked.html).toContain("img-src 'none'");
	const loaded = emailDocument(html, true).html;
	expect(loaded).toContain('src="https://example.com/logo.png"');
	expect(loaded).toContain('referrerpolicy="no-referrer"');
	expect(loaded).not.toContain('src="cid:');
});

it("strips active content and keeps safe links without importing host styles", () => {
	const input =
		'<style>body{color:red}</style><script>notContent</script><form><input></form><iframe></iframe><a href="https://example.com" target="_top">Visit</a>';
	const html = emailDocument(input, false).html;
	expect(html).not.toMatch(/<(script|form|input|iframe)\b/);
	expect(html).not.toContain("_top");
	expect(html).toContain('rel="noopener noreferrer"');
	expect(teamsHtml(input)).not.toContain("<style");
	expect(hasDisplayContent("<script>notContent</script>", "email")).toBe(
		false,
	);
});

it("preserves Teams quotes, mentions and code, replacing unsupported media", () => {
	const html = teamsHtml(
		'<p>Hello <at id="0">Pat</at></p><blockquote>Earlier reply</blockquote><pre><code>  x\n    y</code></pre><img src="https://example.com/image"><attachment id="1"></attachment>',
	);
	expect(html).toContain('data-mention="true">Pat');
	expect(html).toContain("<blockquote>Earlier reply</blockquote>");
	expect(html).toContain("  x\n    y");
	expect(html).toContain("Media or card — open in Teams");
	expect(html).not.toContain("<img");
});

it("validates meaningful content, escapes plain input and rejects invalid optional display payloads", () => {
	expect(draftText("<p><br></p>", "html")).toBe("");
	expect(draftText("<p>&nbsp;</p>", "html")).toBe("");
	expect(draftText("<p>Hello</p>", "html")).toBe("Hello");
	expect(plainTextEmail("<em>literal</em>")).toContain(
		"&lt;em&gt;literal&lt;/em&gt;",
	);
	expect(
		readDisplayBody({
			contentType: "html",
			content: "a".repeat(128 * 1024 + 1),
		}),
	).toBeUndefined();
	expect(readDisplayBody(undefined)).toBeUndefined();
	expect(
		sanitizeDraftHtml(
			'<span style="color:red;font-size:18px;position:fixed">Hi</span>',
		),
	).toContain("font-size: 18px");
	expect(
		sanitizeDraftHtml('<span style="position:fixed">Hi</span>'),
	).not.toContain("position");
});

it("round trips rich editor formatting as self-contained email HTML", () => {
	const editor = createEditor({
		namespace: "email-test",
		nodes: EMAIL_NODES,
		html: EMAIL_HTML_CONFIG,
		onError: (error) => {
			throw error;
		},
	});
	writeEmailEditor(
		editor,
		'<h2 style="text-align:center;color:rgb(0, 0, 255)">Heading</h2><p><strong>Bold</strong><em>Italic</em><u>Underline</u><span style="color:rgb(255, 0, 0);font-size:24px">Large red</span><a href="https://example.com">Link</a></p><ul><li>Bullet</li></ul><ol><li>Number</li></ol><blockquote>Quote</blockquote><table><tr><th>Head</th><td>Cell</td></tr></table>',
		"html",
	);
	const html = exportEmailHtml(editor);
	for (const tag of [
		"h2",
		"strong",
		"em",
		"u",
		"a",
		"ul",
		"ol",
		"blockquote",
		"table",
		"td",
	])
		expect(html).toContain(`<${tag}`);
	expect(html).toContain("font-size: 24px");
	expect(html).toContain("color: rgb(255, 0, 0)");
	expect(html).toContain("border-collapse: collapse");
	expect(html).toContain("text-align: center");
	expect(html).toContain("color: rgb(0, 0, 255)");
	expect(html).not.toContain("class=");
});

it("preserves paragraph boundaries and link destinations when preparing a draft for revision", () => {
	expect(
		draftText(
			'<p>Hello Alex,</p><p><br></p><p>Read the <a href="https://example.com/agenda">agenda</a>.</p><ul><li>Friday</li><li>Noon</li></ul>',
			"html",
			true,
		),
	).toBe(
		"Hello Alex,\n\nRead the agenda (https://example.com/agenda).\nFriday\nNoon",
	);
	expect(draftText("<p><br></p>", "html", true)).toBe("");
});
