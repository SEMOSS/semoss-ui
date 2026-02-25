import { useState } from "react";

export interface CommandHistory {
	history: string[];
	currentIndex: number;
	addCommand: (command: string) => void;
	navigateUp: () => string | null;
	navigateDown: () => string | null;
	reset: () => void;
}

export function useCommandHistory(): CommandHistory {
	const [history, setHistory] = useState<string[]>([]);
	const [currentIndex, setCurrentIndex] = useState<number>(-1);

	const addCommand = (command: string) => {
		if (command.trim()) {
			setHistory((prev) => [...prev, command]);
			setCurrentIndex(-1); // Reset to no selection
		}
	};

	const navigateUp = (): string | null => {
		if (history.length === 0) return null;

		const newIndex =
			currentIndex === -1
				? history.length - 1
				: Math.max(0, currentIndex - 1);

		setCurrentIndex(newIndex);
		return history[newIndex];
	};

	const navigateDown = (): string | null => {
		if (currentIndex === -1) return null;

		const newIndex = currentIndex + 1;

		if (newIndex >= history.length) {
			setCurrentIndex(-1);
			return "";
		}

		setCurrentIndex(newIndex);
		return history[newIndex];
	};

	const reset = () => {
		setCurrentIndex(-1);
	};

	return {
		history,
		currentIndex,
		addCommand,
		navigateUp,
		navigateDown,
		reset,
	};
}
