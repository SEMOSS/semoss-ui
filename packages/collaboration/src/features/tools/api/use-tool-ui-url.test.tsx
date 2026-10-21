import { renderHook } from "@testing-library/react";
import type { ConversationTool } from "@/features/messages/types/message";
import { useToolUiUrl } from "./use-tool-ui-url";

const query = vi.hoisted(() => vi.fn(() => ({ data: undefined })));
vi.mock("@semoss/sdk/react", () => ({ usePixel: query }));
beforeEach(() => query.mockClear());
it.each([
	"component://email-compose",
	"component://mail/compose",
	" COMPONENT://unknown ",
	"component://",
])("never frames or looks up native resource %s", (resourceURI) => {
	const tool: ConversationTool = {
		id: "tool",
		name: "tool",
		title: "tool",
		parentMessageId: "message",
		status: "COMPLETED",
		arguments: {},
		uiUrl: "https://stale.test/ui",
		metadata: { SMSS_ENGINE_ID: "project", SMSS_MCP_UI: { resourceURI } },
	};
	expect(renderHook(() => useToolUiUrl(tool)).result.current).toBeUndefined();
	expect(query).toHaveBeenCalledWith("");
});
it("refuses an explicit component uiUrl without looking up its portal", () => {
	const tool: ConversationTool = {
		id: "tool",
		name: "tool",
		title: "tool",
		parentMessageId: "message",
		status: "COMPLETED",
		arguments: {},
		uiUrl: "component://memory",
		metadata: {
			SMSS_ENGINE_ID: "project",
			SMSS_MCP_UI: { resourceURI: "index.html" },
		},
	};
	expect(renderHook(() => useToolUiUrl(tool)).result.current).toBeUndefined();
	expect(query).toHaveBeenCalledWith("");
});
