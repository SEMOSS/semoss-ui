import { act, fireEvent, render, screen } from "@testing-library/react";
import type { AgentConfiguration } from "@/features/agents/types/agent";
import { animationClock } from "@/features/messages/test-utils/animation-clock";
import type { ConversationMessage } from "@/features/messages/types/message";
import { RoomThread } from "./room-thread";

const agent: AgentConfiguration = {
	name: "Research agent",
	description: "Research",
	system_prompt: "Research carefully.",
	mcp: [],
	skills: [],
	prompts: [],
};
function message(
	id: string,
	text: string,
	role: "user" | "assistant" = "user",
): ConversationMessage {
	return { id, role, parts: [{ type: "text", text }] };
}

function observeLayout() {
	const clock = animationClock();
	const callbacks = new Set<ResizeObserverCallback>();
	const disconnect = vi.fn();
	vi.stubGlobal(
		"ResizeObserver",
		class {
			constructor(callback: ResizeObserverCallback) {
				callbacks.add(callback);
			}
			observe() {}
			unobserve() {}
			disconnect = disconnect;
		},
	);
	return {
		...clock,
		disconnect,
		resize() {
			act(() => {
				for (const callback of callbacks)
					callback([], {} as ResizeObserver);
			});
			clock.advance(16);
		},
	};
}

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe("RoomThread", () => {
	it("cancels an in-flight follow animation immediately on upward input and does not resume on completion", () => {
		const layout = observeLayout();
		const props = {
			agent,
			roomId: "room-1",
			thread: [message("one", "First")],
			isLoadingHistory: false,
		};
		const { rerender } = render(
			<RoomThread {...props} phase="streaming" />,
		);
		const scroller = screen.getByRole("region", {
			name: "Conversation messages",
		});
		let height = 1000;
		Object.defineProperties(scroller, {
			scrollHeight: { configurable: true, get: () => height },
			clientHeight: { configurable: true, value: 400 },
		});
		layout.resize();
		height = 2000;
		layout.resize();
		fireEvent.wheel(scroller, { deltaY: -10 });
		const pausedTop = scroller.scrollTop;
		layout.advance(500);
		expect(scroller.scrollTop).toBe(pausedTop);
		rerender(<RoomThread {...props} phase="completed" />);
		height = 2200;
		layout.resize();
		layout.advance(500);
		expect(scroller.scrollTop).toBe(pausedTop);
		expect(
			screen.getByRole("button", { name: "Latest activity" }),
		).toBeVisible();
		expect(layout.pending()).toBe(0);
	});

	it("keeps one stable announcement region while thinking supplies contextual feedback", () => {
		observeLayout();
		const props = {
			agent,
			roomId: "room-1",
			isLoadingHistory: false,
			phase: "streaming" as const,
		};
		const { rerender } = render(<RoomThread {...props} thread={[]} />);
		const status = screen.getByRole("status");
		expect(status).toHaveTextContent("Waiting for response…");
		const thinking: ConversationMessage = {
			id: "live",
			role: "assistant",
			live: { phase: "streaming", hasObservationIssue: false },
			parts: [{ type: "thinking", text: "A plan", state: "active" }],
		};
		rerender(<RoomThread {...props} thread={[thinking]} />);
		expect(screen.getByRole("status")).toBe(status);
		expect(status).toHaveClass("sr-only");
		expect(status).toHaveTextContent("Thinking…");
		rerender(
			<RoomThread
				{...props}
				thread={[
					{
						...thinking,
						parts: [
							{ type: "text", text: "Answer", state: "active" },
						],
					},
				]}
			/>,
		);
		expect(status).not.toHaveClass("sr-only");
		expect(status).toHaveTextContent("Writing response…");
		rerender(
			<RoomThread
				{...props}
				phase="awaiting_approval"
				thread={[thinking]}
			/>,
		);
		expect(screen.getByRole("status")).toBe(status);
		expect(status).toHaveClass("sr-only");
		expect(status).toHaveTextContent("Your input is needed");
	});

	it("does not resume following when completion collapses content and the browser clamps a paused position", () => {
		const layout = observeLayout();
		render(
			<RoomThread
				agent={agent}
				roomId="room-1"
				thread={[message("one", "First")]}
				isLoadingHistory={false}
			/>,
		);
		const scroller = screen.getByRole("region", {
			name: "Conversation messages",
		});
		let height = 1200;
		Object.defineProperties(scroller, {
			scrollHeight: { configurable: true, get: () => height },
			clientHeight: { configurable: true, value: 400 },
		});
		layout.resize();
		scroller.scrollTop = 600;
		fireEvent.scroll(scroller);
		height = 800;
		scroller.scrollTop = 400;
		fireEvent.scroll(scroller);
		layout.resize();
		height = 1600;
		layout.resize();
		layout.advance(500);
		expect(scroller.scrollTop).toBe(400);
		expect(
			screen.getByRole("button", { name: "Latest activity" }),
		).toBeVisible();
	});

	it("follows actual growth, pauses immediately on upward scrolling, and resumes explicitly", () => {
		const layout = observeLayout();
		const globalScroll = vi.spyOn(Element.prototype, "scrollIntoView");
		const { unmount } = render(
			<RoomThread
				agent={agent}
				roomId="room-1"
				thread={[message("one", "First")]}
				isLoadingHistory={false}
			/>,
		);
		const scroller = screen.getByRole("region", {
			name: "Conversation messages",
		});
		let height = 1000;
		Object.defineProperties(scroller, {
			scrollHeight: { configurable: true, get: () => height },
			clientHeight: { configurable: true, value: 400 },
		});
		layout.resize();
		expect(scroller.scrollTop).toBe(600);
		// A small intentional scroll must pause, even inside the old 250px threshold.
		scroller.scrollTop = 540;
		fireEvent.scroll(scroller);
		expect(
			screen.getByRole("button", { name: "Latest activity" }),
		).toBeVisible();
		height = 1400;
		layout.resize();
		expect(scroller.scrollTop).toBe(540);
		fireEvent.click(
			screen.getByRole("button", { name: "Latest activity" }),
		);
		layout.advance(500);
		expect(scroller.scrollTop).toBe(1000);
		expect(
			screen.queryByRole("button", { name: "Latest activity" }),
		).toBeNull();
		height = 1500;
		layout.resize();
		layout.advance(500);
		expect(scroller.scrollTop).toBe(1100);
		// Browser clamping after a collapse is not an intentional upward scroll.
		height = 1200;
		scroller.scrollTop = 800;
		fireEvent.scroll(scroller);
		expect(
			screen.queryByRole("button", { name: "Latest activity" }),
		).toBeNull();
		expect(globalScroll).not.toHaveBeenCalled();
		unmount();
		expect(layout.pending()).toBe(0);
		expect(layout.disconnect).toHaveBeenCalled();
	});

	it("preserves a reading anchor when earlier content collapses and resets on room switches", () => {
		const layout = observeLayout();
		const thread = [message("one", "First")];
		const props = {
			agent,
			roomId: "room-1",
			thread,
			isLoadingHistory: false,
		};
		const { container, rerender } = render(<RoomThread {...props} />);
		const scroller = screen.getByRole("region", {
			name: "Conversation messages",
		});
		Object.defineProperties(scroller, {
			scrollHeight: { configurable: true, value: 1200 },
			clientHeight: { configurable: true, value: 400 },
		});
		layout.resize();
		const anchor = container.querySelector<HTMLElement>(
			"[data-scroll-anchor]",
		);
		if (!anchor) throw new Error("Missing reading anchor");
		let anchorTop = 40;
		vi.spyOn(anchor, "getBoundingClientRect").mockImplementation(
			() => new DOMRect(0, anchorTop, 300, 400),
		);
		scroller.scrollTop = 500;
		fireEvent.scroll(scroller);
		anchorTop = -60;
		layout.resize();
		expect(scroller.scrollTop).toBe(400);
		rerender(<RoomThread {...props} roomId="room-2" />);
		expect(scroller.scrollTop).toBe(800);
		expect(
			screen.queryByRole("button", { name: "Latest activity" }),
		).toBeNull();
	});

	it("resumes on submission and responds to viewport resizing", () => {
		const layout = observeLayout();
		const props = {
			agent,
			roomId: "room-1",
			thread: [message("one", "First")],
			isLoadingHistory: false,
		};
		const { rerender } = render(<RoomThread {...props} resumeSignal={0} />);
		const scroller = screen.getByRole("region", {
			name: "Conversation messages",
		});
		let viewportHeight = 400;
		Object.defineProperties(scroller, {
			scrollHeight: { configurable: true, value: 1200 },
			clientHeight: { configurable: true, get: () => viewportHeight },
		});
		layout.resize();
		scroller.scrollTop = 300;
		fireEvent.scroll(scroller);
		rerender(<RoomThread {...props} resumeSignal={1} />);
		layout.advance(500);
		expect(scroller.scrollTop).toBe(800);
		viewportHeight = 200;
		layout.resize();
		layout.advance(500);
		expect(scroller.scrollTop).toBe(1000);
		scroller.scrollTop = 300;
		fireEvent.scroll(scroller);
		viewportHeight = 500;
		layout.resize();
		expect(scroller.scrollTop).toBe(300);
		scroller.scrollTop = 700;
		fireEvent.scroll(scroller);
		viewportHeight = 400;
		layout.resize();
		layout.advance(500);
		expect(scroller.scrollTop).toBe(800);
	});

	it("keeps the reading position when opening details instead of following their new height", () => {
		const layout = observeLayout();
		render(
			<RoomThread
				agent={agent}
				roomId="room-1"
				isLoadingHistory={false}
				thread={[
					{
						id: "one",
						role: "assistant",
						parts: [
							{ type: "thinking", text: "Earlier reasoning" },
						],
					},
				]}
			/>,
		);
		const scroller = screen.getByRole("region", {
			name: "Conversation messages",
		});
		let height = 1200;
		Object.defineProperties(scroller, {
			scrollHeight: { configurable: true, get: () => height },
			clientHeight: { configurable: true, value: 400 },
		});
		layout.resize();
		fireEvent.click(screen.getByRole("button", { name: "Thinking" }));
		height = 1500;
		layout.resize();
		layout.advance(500);
		expect(scroller.scrollTop).toBe(800);
		expect(
			screen.getByRole("button", { name: "Latest activity" }),
		).toBeVisible();
	});

	it("jumps directly to received content with reduced motion and leaves no idle scroll loop", () => {
		const layout = observeLayout();
		vi.stubGlobal("matchMedia", () => ({
			matches: true,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		}));
		render(
			<RoomThread
				agent={agent}
				roomId="room-1"
				thread={[message("one", "First")]}
				isLoadingHistory={false}
			/>,
		);
		const scroller = screen.getByRole("region", {
			name: "Conversation messages",
		});
		let height = 1200;
		Object.defineProperties(scroller, {
			scrollHeight: { configurable: true, get: () => height },
			clientHeight: { configurable: true, value: 400 },
		});
		layout.resize();
		height = 1800;
		layout.resize();
		expect(scroller.scrollTop).toBe(1400);
		expect(layout.pending()).toBe(0);
	});

	it("keeps the visible paragraph in place when workbench resizing reflows earlier prose", () => {
		const layout = observeLayout();
		const { container } = render(
			<RoomThread
				agent={agent}
				roomId="room-1"
				thread={[
					message(
						"one",
						"First paragraph\n\nReading here",
						"assistant",
					),
				]}
				isLoadingHistory={false}
			/>,
		);
		const scroller = screen.getByRole("region", {
			name: "Conversation messages",
		});
		Object.defineProperties(scroller, {
			scrollHeight: { value: 1200 },
			clientHeight: { value: 400 },
		});
		layout.resize();
		const part = container.querySelector("[data-scroll-anchor]");
		if (!part) throw new Error("Missing part anchor");
		vi.spyOn(part, "getBoundingClientRect").mockReturnValue(
			new DOMRect(0, -200, 400, 800),
		);
		vi.spyOn(
			screen.getByText("First paragraph"),
			"getBoundingClientRect",
		).mockReturnValue(new DOMRect(0, -200, 400, 150));
		let top = -20;
		vi.spyOn(
			screen.getByText("Reading here"),
			"getBoundingClientRect",
		).mockImplementation(() => new DOMRect(0, top, 400, 100));
		scroller.scrollTop = 300;
		fireEvent.scroll(scroller);
		top = 60;
		layout.resize();
		expect(scroller.scrollTop).toBe(380);
	});

	it("retains part state by run-item key and reconciles to history without replay", () => {
		const layout = observeLayout();
		const thinking = {
			type: "thinking",
			text: "Reasoning",
			state: "complete",
			renderKey: "thought-1",
		} as const;
		const answer = {
			type: "text",
			text: "Settled answer",
			state: "active",
			renderKey: "answer-1",
		} as const;
		const live: ConversationMessage = {
			id: "agent-run:1",
			role: "assistant",
			live: { phase: "streaming", hasObservationIssue: false },
			parts: [thinking, answer],
		};
		const props = { agent, roomId: "room-1", isLoadingHistory: false };
		const { rerender } = render(<RoomThread {...props} thread={[live]} />);
		const trigger = screen.getByRole("button", { name: "Thinking" });
		fireEvent.click(trigger);
		rerender(
			<RoomThread
				{...props}
				thread={[
					{
						...live,
						parts: [
							{
								type: "text",
								text: "Earlier step",
								renderKey: "earlier",
							},
							thinking,
							answer,
						],
					},
				]}
			/>,
		);
		expect(screen.getByRole("button", { name: "Thinking" })).toBe(trigger);
		expect(trigger).toHaveAttribute("aria-expanded", "true");
		rerender(
			<RoomThread
				{...props}
				thread={[
					{
						id: "durable-1",
						role: "assistant",
						parts: [
							thinking,
							{
								...answer,
								text: "Settled answer with final text",
								state: "complete",
							},
						],
					},
				]}
			/>,
		);
		expect(
			screen.getAllByText("Settled answer with final text"),
		).toHaveLength(1);
		expect(screen.getAllByRole("article")).toHaveLength(1);
		layout.advance(200);
		expect(layout.pending()).toBe(0);
	});

	it("resumes without simulated scrolling when reduced motion is preferred", () => {
		vi.stubGlobal("matchMedia", () => ({
			matches: true,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		}));
		const layout = observeLayout();
		render(
			<RoomThread
				agent={agent}
				roomId="room-1"
				thread={[message("one", "First")]}
				isLoadingHistory={false}
			/>,
		);
		const scroller = screen.getByRole("region", {
			name: "Conversation messages",
		});
		Object.defineProperties(scroller, {
			scrollHeight: { value: 1000 },
			clientHeight: { value: 400 },
		});
		layout.resize();
		scroller.scrollTop = 100;
		fireEvent.scroll(scroller);
		fireEvent.click(
			screen.getByRole("button", { name: "Latest activity" }),
		);
		layout.advance(16);
		expect(scroller.scrollTop).toBe(600);
		expect(layout.pending()).toBe(0);
	});

	it("groups assistant continuations without merging copy actions or delegation cards", () => {
		observeLayout();
		const thread: ConversationMessage[] = [
			message("one", "First", "assistant"),
			message("two", "Second", "assistant"),
			{
				...message("delegation", "Request", "assistant"),
				delegationRequest: {
					requester: "Sam",
					question: "Please review",
				},
			},
			message("three", "After delegation", "assistant"),
			message("user", "Follow-up"),
			message("four", "Answer", "assistant"),
		];
		render(
			<RoomThread
				agent={agent}
				roomId="room-1"
				thread={thread}
				isLoadingHistory={false}
			/>,
		);
		expect(screen.getAllByText("Research agent")).toHaveLength(3);
		expect(
			screen.getAllByRole("button", { name: "Copy text" }),
		).toHaveLength(6);
		expect(screen.getByText("Second").closest("article")).toBe(
			screen.getByText("First").closest("article"),
		);
		expect(screen.getAllByRole("article")).toHaveLength(5);
	});
});
