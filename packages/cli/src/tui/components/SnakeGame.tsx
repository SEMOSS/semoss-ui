import { Box, Text, useInput } from "ink";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

type Position = { x: number; y: number };
type Direction = "up" | "down" | "left" | "right";

interface SnakeGameProps {
	onExit: () => void;
	width?: number;
	height?: number;
}

const GAME_SPEED = 150; // ms between moves

export const SnakeGame: React.FC<SnakeGameProps> = ({
	onExit,
	width = 30,
	height = 15,
}) => {
	const [snake, setSnake] = useState<Position[]>([
		{ x: Math.floor(width / 2), y: Math.floor(height / 2) },
	]);
	const [direction, setDirection] = useState<Direction>("right");
	const [food, setFood] = useState<Position>({ x: 0, y: 0 });
	const [score, setScore] = useState(0);
	const [gameOver, setGameOver] = useState(false);
	const [highScore, setHighScore] = useState(0);
	const [paused, setPaused] = useState(false);

	// Generate random food position
	const generateFood = useCallback(
		(currentSnake: Position[]): Position => {
			let newFood: Position;
			do {
				newFood = {
					x: Math.floor(Math.random() * width),
					y: Math.floor(Math.random() * height),
				};
			} while (
				currentSnake.some(
					(seg) => seg.x === newFood.x && seg.y === newFood.y,
				)
			);
			return newFood;
		},
		[width, height],
	);

	// Track if food has been initialized
	const foodInitialized = useRef(false);

	// Initialize food
	useEffect(() => {
		if (!foodInitialized.current) {
			foodInitialized.current = true;
			setFood(generateFood(snake));
		}
	}, [generateFood, snake]);

	// Game loop
	useEffect(() => {
		if (gameOver || paused) return;

		const moveSnake = () => {
			setSnake((prevSnake) => {
				const head = prevSnake[0];
				let newHead: Position;

				switch (direction) {
					case "up":
						newHead = { x: head.x, y: head.y - 1 };
						break;
					case "down":
						newHead = { x: head.x, y: head.y + 1 };
						break;
					case "left":
						newHead = { x: head.x - 1, y: head.y };
						break;
					case "right":
						newHead = { x: head.x + 1, y: head.y };
						break;
				}

				// Check wall collision
				if (
					newHead.x < 0 ||
					newHead.x >= width ||
					newHead.y < 0 ||
					newHead.y >= height
				) {
					setGameOver(true);
					setHighScore((prev) => Math.max(prev, score));
					return prevSnake;
				}

				// Check self collision
				if (
					prevSnake.some(
						(seg) => seg.x === newHead.x && seg.y === newHead.y,
					)
				) {
					setGameOver(true);
					setHighScore((prev) => Math.max(prev, score));
					return prevSnake;
				}

				const newSnake = [newHead, ...prevSnake];

				// Check food collision
				if (newHead.x === food.x && newHead.y === food.y) {
					setScore((s) => s + 10);
					setFood(generateFood(newSnake));
					// Don't remove tail - snake grows
				} else {
					newSnake.pop(); // Remove tail
				}

				return newSnake;
			});
		};

		const interval = setInterval(moveSnake, GAME_SPEED);
		return () => clearInterval(interval);
	}, [direction, food, gameOver, paused, width, height, score, generateFood]);

	// Handle input
	useInput((input, key) => {
		if (key.escape || input === "q") {
			onExit();
			return;
		}

		if (gameOver) {
			if (input === "r") {
				// Restart game
				const initialSnake = [
					{ x: Math.floor(width / 2), y: Math.floor(height / 2) },
				];
				setSnake(initialSnake);
				setDirection("right");
				setFood(generateFood(initialSnake));
				setScore(0);
				setGameOver(false);
			}
			return;
		}

		if (input === "p" || input === " ") {
			setPaused((p) => !p);
			return;
		}

		// Prevent 180-degree turns
		if (key.upArrow && direction !== "down") {
			setDirection("up");
		} else if (key.downArrow && direction !== "up") {
			setDirection("down");
		} else if (key.leftArrow && direction !== "right") {
			setDirection("left");
		} else if (key.rightArrow && direction !== "left") {
			setDirection("right");
		}
	});

	// Render the game board
	const renderBoard = () => {
		const rows: React.ReactNode[] = [];

		// Top border
		rows.push(
			<Text key="top" color="cyan">
				{"┌" + "─".repeat(width) + "┐"}
			</Text>,
		);

		for (let y = 0; y < height; y++) {
			let row = "";
			for (let x = 0; x < width; x++) {
				const isHead = snake[0].x === x && snake[0].y === y;
				const isBody = snake
					.slice(1)
					.some((seg) => seg.x === x && seg.y === y);
				const isFood = food.x === x && food.y === y;

				if (isHead) {
					row += "█";
				} else if (isBody) {
					row += "▓";
				} else if (isFood) {
					row += "●";
				} else {
					row += " ";
				}
			}
			rows.push(
				<Box key={y}>
					<Text color="cyan">│</Text>
					<Text color={gameOver ? "red" : "green"}>{row}</Text>
					<Text color="cyan">│</Text>
				</Box>,
			);
		}

		// Bottom border
		rows.push(
			<Text key="bottom" color="cyan">
				{"└" + "─".repeat(width) + "┘"}
			</Text>,
		);

		return rows;
	};

	return (
		<Box flexDirection="column" alignItems="center">
			<Box marginBottom={1}>
				<Text bold color="cyan">
					🐍 SNAKE GAME 🐍
				</Text>
			</Box>

			<Box marginBottom={1}>
				<Text>
					Score: <Text color="yellow">{score}</Text>
					{"  "}
					High Score: <Text color="magenta">{highScore}</Text>
				</Text>
			</Box>

			<Box flexDirection="column">{renderBoard()}</Box>

			{paused && !gameOver && (
				<Box marginTop={1}>
					<Text color="yellow" bold>
						⏸ PAUSED - Press SPACE to resume
					</Text>
				</Box>
			)}

			{gameOver && (
				<Box marginTop={1} flexDirection="column" alignItems="center">
					<Text color="red" bold>
						💀 GAME OVER 💀
					</Text>
					<Text color="gray">
						Press R to restart or Q/ESC to exit
					</Text>
				</Box>
			)}

			{!gameOver && !paused && (
				<Box marginTop={1}>
					<Text color="gray">
						Arrow keys to move • P/SPACE to pause • Q/ESC to exit
					</Text>
				</Box>
			)}
		</Box>
	);
};
