import { describe, expect, it, vi } from "vitest";
import { toViewerHost } from "./tool-view-host";

describe("tool-view save lifetime", () => {
	it("keeps the host's preparation and release callback when adapting a tool view", async () => {
		const release = vi.fn();
		const prepareSave = vi.fn(async () => release);
		const onSaved = vi.fn();
		const viewer = toViewerHost({ prepareSave, onSaved });
		expect(prepareSave).not.toHaveBeenCalled();
		const finish = await viewer.prepareSave?.();
		expect(prepareSave).toHaveBeenCalledTimes(1);
		viewer.onSaved?.({
			path: "event.md",
			name: "event.md",
			service: "outlook-calendar",
		});
		expect(onSaved).toHaveBeenCalledWith({
			path: "event.md",
			name: "event.md",
			source: "outlook-calendar",
		});
		if (finish) finish();
		expect(release).toHaveBeenCalledTimes(1);
	});
});
