export interface ContextChartProps {
	tokensUsed?: number;
	tokensMax?: number;
}

/**
 * Renders a pie chart showing the percentage of context used.
 *
 * @component
 */

import { Cpu, HelpCircle } from "lucide-react";
import { useState } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";

export const ContextChart = ({ tokensUsed, tokensMax }: ContextChartProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const contextUsedPercent =
		tokensMax > 0 ? (tokensUsed / tokensMax) * 100 : undefined;

	if (contextUsedPercent === undefined || contextUsedPercent < 10)
		return null;

	const roundedPercent = Math.ceil(contextUsedPercent);
	const radius = 8;
	const cx = 9;
	const cy = 9;
	const angle = (roundedPercent / 100) * 360;
	const radians = (angle * Math.PI) / 180;
	const x = cx + radius * Math.cos(radians - Math.PI / 2);
	const y = cy + radius * Math.sin(radians - Math.PI / 2);
	const largeArc = angle > 180 ? 1 : 0;

	const formatTokens = (tokens: number) => {
		if (tokens >= 1000000) {
			return `${(tokens / 1000000).toFixed(1)}m`;
		}
		if (tokens >= 1000) {
			return `${(tokens / 1000).toFixed(1)}k`;
		}
		return tokens.toString();
	};

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger asChild>
				{/** biome-ignore lint/a11y/noStaticElementInteractions: element is interactive */}
				<div
					className="relative"
					onMouseEnter={() => setIsOpen(true)}
					onMouseLeave={() => setIsOpen(false)}
				>
					<div className="flex cursor-pointer items-center gap-2">
						{/** biome-ignore lint/a11y/noSvgWithoutTitle: hover status is applied to provide description for interactive svg */}
						<svg width={18} height={18} viewBox="0 0 18 18">
							<circle
								cx={cx}
								cy={cy}
								r={radius}
								className={
									roundedPercent >= 75
										? "fill-destructive opacity-10"
										: "fill-muted"
								}
							/>
							<path
								d={`M ${cx} ${cy} L ${cx} ${cy - radius} A ${radius} ${radius} 0 ${largeArc} 1 ${x} ${y} Z`}
								className={
									roundedPercent >= 75
										? "fill-destructive"
										: "fill-muted-foreground"
								}
							/>
						</svg>
					</div>
				</div>
			</DropdownMenuTrigger>

			<DropdownMenuContent
				side="top"
				align="center"
				className="w-70 border-gray-200 bg-white"
				onMouseEnter={() => setIsOpen(true)}
				onMouseLeave={() => setIsOpen(false)}
			>
				<div className="flex flex-col gap-2 p-3">
					{/* Header with Memory title and help icon */}
					<div className="flex items-center gap-1.5">
						<p className="font-semibold text-base text-card-foreground">
							Memory
						</p>
						<Tooltip>
							<TooltipTrigger asChild>
								<HelpCircle className="h-3.5 w-3.5 shrink-0 cursor-help stroke-[2.5] text-muted-foreground" />
							</TooltipTrigger>
							<TooltipContent side="right" className="max-w-xs">
								<p className="text-sm">
									Memory refers to the context window
									available for your conversation. Tokens
									represent the smallest units of text that
									the AI processes. As you use tokens in your
									conversation, the available memory
									decreases.
								</p>
							</TooltipContent>
						</Tooltip>
					</div>

					{/* Tokens left section */}
					<div className="flex w-full items-center gap-1.5">
						<Cpu className="h-5 w-5 shrink-0 text-muted-foreground" />
						<div className="flex w-full items-center">
							<p className="font-medium text-muted-foreground text-sm">
								Tokens used
							</p>
						</div>
						{/*Tokens used / max section */}
						<div className="text-right">
							<p className="items-center justify-between whitespace-nowrap font-medium text-muted-foreground text-sm">
								{formatTokens(tokensUsed)} /{" "}
								{formatTokens(tokensMax)}
							</p>
						</div>
					</div>
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
