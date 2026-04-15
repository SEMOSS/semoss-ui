import { Heart, Star } from "lucide-react";
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
	const [hoverValue, setHoverValue] = useState<number | null>(null);

	const { size, value, max, type } = data;

	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	const handleChange = (newValue: number) => {
		setData("value", newValue, true);
		listeners.onChange();
	};

	const iconSize = size === "small" ? 16 : 24;
	const IconComponent = type === "heart" ? Heart : Star;

	return (
		<div 
			{...attrs} 
			className="flex flex-col items-center"
		>
			<div className="flex gap-1">
				{Array.from({ length: max }, (_, i) => {
					const rating = i + 1;
					const isActive = rating <= (hoverValue ?? value);

					return (
						<button
							key={i}
							type="button"
							onClick={() => handleChange(rating)}
							onMouseEnter={() => setHoverValue(rating)}
							onMouseLeave={() => setHoverValue(null)}
							className="p-0 bg-transparent border-none cursor-pointer focus:outline-none hover:opacity-80 transition-opacity"
							aria-label={`${rating} ${type === "heart" ? "hearts" : "stars"}`}
						>
							<IconComponent
								size={iconSize}
								fill={isActive ? (type === "heart" ? "#f87171" : "#facc15") : "none"}
								stroke={isActive ? (type === "heart" ? "#f87171" : "#facc15") : "currentColor"}
								className={!isActive ? "text-muted-foreground" : ""}
								style={{ width: iconSize, height: iconSize }}
							/>
						</button>
					);
				})}
			</div>
		</div>
	);
});
