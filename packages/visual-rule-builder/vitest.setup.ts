import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock canvas getContext
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
	fillRect: vi.fn(),
	clearRect: vi.fn(),
	getImageData: vi.fn(() => ({
		data: new Array(4),
	})),
	putImageData: vi.fn(),
	createImageData: vi.fn(() => ({})),
	setTransform: vi.fn(),
	drawImage: vi.fn(),
	save: vi.fn(),
	fillText: vi.fn(),
	restore: vi.fn(),
	beginPath: vi.fn(),
	moveTo: vi.fn(),
	lineTo: vi.fn(),
	stroke: vi.fn(),
	arc: vi.fn(),
	scale: vi.fn(),
	rotate: vi.fn(),
	translate: vi.fn(),
	clip: vi.fn(),
	fill: vi.fn(),
	measureText: vi.fn(() => ({ width: 0 })),
	transform: vi.fn(),
	rect: vi.fn(),
	setLineDash: vi.fn(),
	// biome-ignore lint/suspicious/noExplicitAny: Canvas mock requires any type
})) as any;
