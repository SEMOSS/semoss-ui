import * as ProgressPrimitive from "@radix-ui/react-progress";
import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A bar filled to its value out of `max` (100 unless it is a number above 0).
 * The value is kept between 0 and `max`, since Radix reports it as the bar's
 * `aria-valuenow` and drops one out of range; without a finite value the bar
 * is indeterminate.
 */
function Progress({
	className,
	value,
	max = 100,
	...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
	const limit = Number.isFinite(max) && max > 0 ? max : 100;
	const current =
		typeof value === "number" && Number.isFinite(value)
			? Math.min(Math.max(value, 0), limit)
			: null;
	return (
		<ProgressPrimitive.Root
			data-slot="progress"
			value={current}
			max={limit}
			className={cn(
				"relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
				className,
			)}
			{...props}
		>
			<ProgressPrimitive.Indicator
				data-slot="progress-indicator"
				className="h-full w-full flex-1 bg-primary transition-all"
				style={{
					transform: `translateX(-${100 - ((current ?? 0) / limit) * 100}%)`,
				}}
			/>
		</ProgressPrimitive.Root>
	);
}

export { Progress };
