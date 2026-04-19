import { Heart, HeartOff, Star } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";

export interface RatingsBlockDef extends BlockDef<"ratings"> {
	widget: "ratings";
	data: {
		size: "small" | "large";
		type: "heart" | "star";
		value: number;
		max: number;
	};
	listeners: {
		preProcess: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
		onChange: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
}

export const RatingsBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, setData, listeners } = useBlock<RatingsBlockDef>(id);
	const [hovered, setHovered] = useState<number | null>(null);

	const { size, value, max, type } = data;

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	const handleChange = (newValue: number) => {
		setData("value", newValue, true);
		listeners.onChange();
	};

	const iconSize = size === "large" ? "size-8" : "size-5";
	const displayValue = hovered ?? value;

	return (
		<div {...attrs} className="flex flex-col items-center">
			<div className="flex items-center gap-0.5">
				{Array.from({ length: max }, (_, i) => {
					const index = i + 1;
					const filled = index <= displayValue;

					return (
						<button
							key={index}
							type="button"
							className="cursor-pointer p-0.5 focus:outline-none"
							onClick={() => handleChange(index)}
							onMouseEnter={() => setHovered(index)}
							onMouseLeave={() => setHovered(null)}
						>
							{type === "heart" ? (
								filled ? (
									<Heart
										className={`${iconSize} fill-rose-400 text-rose-400`}
									/>
								) : (
									<HeartOff
										className={`${iconSize} text-muted-foreground opacity-55`}
									/>
								)
							) : filled ? (
								<Star
									className={`${iconSize} fill-yellow-400 text-yellow-400`}
								/>
							) : (
								<Star
									className={`${iconSize} text-muted-foreground opacity-55`}
								/>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
});
