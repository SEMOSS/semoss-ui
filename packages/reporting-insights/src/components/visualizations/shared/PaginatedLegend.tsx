import { useEffect, useState } from "react";
import type { LegendPayload } from "recharts";

interface PaginatedLegendProps {
	payload?: ReadonlyArray<LegendPayload>;
	pageSize?: number;
	// Shifts the centering baseline right so legend items align with the plot area
	// center rather than the full container center (which includes the Y-axis width).
	leftPadding?: number;
	// Recharts injects ~10 extra props via cloneElement (align, iconSize, layout, etc.)
	[key: string]: unknown;
}

export function PaginatedLegend({
	payload = [],
	pageSize = 10,
	leftPadding = 0,
}: PaginatedLegendProps) {
	const [page, setPage] = useState(0);
	const totalPages = Math.max(1, Math.ceil(payload.length / pageSize));

	useEffect(() => {
		setPage(0);
	}, [payload.length]);

	const safePage = Math.min(page, totalPages - 1);
	const visibleItems =
		payload.length > pageSize
			? payload.slice(safePage * pageSize, (safePage + 1) * pageSize)
			: payload;

	if (payload.length === 0) return null;

	const padStyle: React.CSSProperties =
		leftPadding > 0 ? { paddingLeft: leftPadding } : {};

	const itemList = (
		<ul
			style={{
				display: "flex",
				flexWrap: "wrap",
				justifyContent: "center",
				gap: "4px 12px",
				margin: 0,
				padding: 0,
				listStyle: "none",
			}}
		>
			{visibleItems.map((entry, i) => {
				const dotColor = entry.inactive
					? "#ccc"
					: (entry.color ?? "#ccc");
				return (
					<li
						key={`${entry.value ?? i}-${i}`}
						style={{
							display: "flex",
							alignItems: "center",
							gap: 4,
							fontSize: 11,
							color: entry.inactive ? "#ccc" : "#64748b",
						}}
					>
						<span
							style={{
								display: "inline-block",
								width: 8,
								height: 8,
								borderRadius: "50%",
								backgroundColor: dotColor,
								flexShrink: 0,
							}}
						/>
						<span>{entry.value}</span>
					</li>
				);
			})}
		</ul>
	);

	if (payload.length <= pageSize)
		return <div style={padStyle}>{itemList}</div>;

	const btnStyle: React.CSSProperties = {
		fontSize: 14,
		lineHeight: 1,
		color: "#64748b",
		background: "none",
		border: "none",
		padding: "0 3px",
	};

	return (
		<div style={padStyle}>
			{itemList}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					gap: 4,
					marginTop: 4,
				}}
			>
				<button
					type="button"
					onClick={() => setPage((p) => Math.max(0, p - 1))}
					disabled={safePage === 0}
					aria-label="Previous legend page"
					style={{
						...btnStyle,
						cursor: safePage === 0 ? "default" : "pointer",
						opacity: safePage === 0 ? 0.3 : 1,
					}}
				>
					‹
				</button>
				<span style={{ fontSize: 10, color: "#94a3b8" }}>
					{safePage + 1} / {totalPages}
				</span>
				<button
					type="button"
					onClick={() =>
						setPage((p) => Math.min(totalPages - 1, p + 1))
					}
					disabled={safePage === totalPages - 1}
					aria-label="Next legend page"
					style={{
						...btnStyle,
						cursor:
							safePage === totalPages - 1 ? "default" : "pointer",
						opacity: safePage === totalPages - 1 ? 0.3 : 1,
					}}
				>
					›
				</button>
			</div>
		</div>
	);
}
