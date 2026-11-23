import { expect, it } from "vitest";
import { readableToolTitle } from "./tool-title";

it("names the skill and twin file tools by what they do, and words the rest from the tool's name", () => {
	expect(readableToolTitle(undefined, "UseSkillInAssistant")).toBe(
		"Digital Twin Skills",
	);
	expect(readableToolTitle(undefined, "SaveToDigitalTwin")).toBe(
		"Add a File to This Twin",
	);
	expect(readableToolTitle(undefined, "RemoveFromDigitalTwin")).toBe(
		"Remove a File From This Twin",
	);
	expect(readableToolTitle(null, "SearchMail")).toBe("Search Mail");
});

it("names those tools the same way in a chat saved with the title the server used to send", () => {
	expect(
		readableToolTitle("Use Skill In Assistant", "UseSkillInAssistant"),
	).toBe("Digital Twin Skills");
	expect(readableToolTitle("Save To Digital Twin", "SaveToDigitalTwin")).toBe(
		"Add a File to This Twin",
	);
	// a tool with no name of its own here keeps the title its call carries
	expect(readableToolTitle("Search mail", "SearchMail")).toBe("Search Mail");
});

it("leaves the titles the server sends for those tools as they are", () => {
	for (const title of [
		"Digital Twin Skills",
		"Add a File to This Twin",
		"Remove a File From This Twin",
	])
		expect(readableToolTitle(title, "AnyTool")).toBe(title);
});
