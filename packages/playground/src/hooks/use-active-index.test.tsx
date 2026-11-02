import { act, render, renderHook, screen } from "@testing-library/react";
import { useEffect } from "react";
import { expect, test, vi } from "vitest";
import { type ChunkStatus, useActiveIndex } from "./use-active-index";

interface HarnessPart {
	/** Stable key for the part. */
	id: string;

	/** Text parts report their own completion; tool parts only render. */
	type: "text" | "tool";
}

interface CaughtUpChunkProps {
	/** Status the text part's queue gives this chunk. */
	status: ChunkStatus;

	/** Reports the chunk caught up. */
	onComplete: () => void;
}

/** Stands in for a markdown chunk whose typewriter has caught up. */
const CaughtUpChunk = ({ status, onComplete }: CaughtUpChunkProps) => {
	useEffect(() => {
		if (status === "active") onComplete();
	}, [status, onComplete]);
	return <p>text</p>;
};

interface TextPartProps {
	/** Status the message queue gives this part. */
	status: ChunkStatus;

	/** Reports the part caught up. */
	onComplete: () => void;
}

/** Stands in for a text part: a nested queue over one chunk. */
const TextPart = ({ status, onComplete }: TextPartProps) => {
	const { chunkCallbacks, getChunkStatus } = useActiveIndex(
		1,
		status === "active",
		onComplete,
	);
	return (
		<CaughtUpChunk
			status={getChunkStatus(0)}
			onComplete={chunkCallbacks[0]}
		/>
	);
};

interface MessageHarnessProps {
	/** Parts in transcript order. */
	parts: HarnessPart[];

	/** Whether the message is still streaming. */
	isStreaming: boolean;
}

/** Stands in for a response message: a part renders once the queue reaches it. */
const MessageHarness = ({ parts, isStreaming }: MessageHarnessProps) => {
	const { chunkCallbacks, getChunkStatus } = useActiveIndex(
		parts.length,
		isStreaming,
	);
	return parts.map((part, idx) => {
		const status = getChunkStatus(idx);
		if (status === "not_started") return null;
		return part.type === "text" ? (
			<TextPart
				key={part.id}
				status={status}
				onComplete={chunkCallbacks[idx]}
			/>
		) : (
			<p key={part.id}>tool</p>
		);
	});
};

const TEXT_PART: HarnessPart = { id: "text", type: "text" };
const TOOL_PART: HarnessPart = { id: "tool", type: "tool" };

test("a part streamed in below caught up text is revealed", () => {
	const { rerender } = render(
		<MessageHarness parts={[TEXT_PART]} isStreaming />,
	);
	expect(screen.getByText("text")).toBeInTheDocument();

	rerender(<MessageHarness parts={[TEXT_PART, TOOL_PART]} isStreaming />);

	expect(screen.getByText("tool")).toBeInTheDocument();
});

test("the last item holds while streaming and finishes when streaming ends", () => {
	const { result, rerender } = renderHook(
		({ isActive }) => useActiveIndex(2, isActive),
		{ initialProps: { isActive: true } },
	);

	act(() => result.current.chunkCallbacks[0]());
	expect(result.current.getChunkStatus(0)).toBe("done");
	expect(result.current.getChunkStatus(1)).toBe("active");

	act(() => result.current.chunkCallbacks[1]());
	expect(result.current.getChunkStatus(1)).toBe("active");

	rerender({ isActive: false });
	expect(result.current.getChunkStatus(1)).toBe("done");
});

test("callbacks keep their identity until onComplete changes", () => {
	const first = vi.fn();
	const second = vi.fn();
	const { result, rerender } = renderHook(
		({ onComplete }) => useActiveIndex(1, true, onComplete),
		{ initialProps: { onComplete: first } },
	);
	const initial = result.current.chunkCallbacks[0];

	rerender({ onComplete: first });
	expect(result.current.chunkCallbacks[0]).toBe(initial);

	rerender({ onComplete: second });
	expect(result.current.chunkCallbacks[0]).not.toBe(initial);

	act(() => result.current.chunkCallbacks[0]());
	expect(second).toHaveBeenCalledTimes(1);
	expect(first).not.toHaveBeenCalled();
});
