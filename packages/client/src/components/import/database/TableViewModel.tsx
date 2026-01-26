import { type ChangeEvent, useEffect, useState } from "react";
import {
	Box,
	Button,
	Checkbox,
	FormControlLabel,
	Stack,
	TextField,
	Typography,
} from "@semoss/ui";

const TableViewSelector = ({ tables = [], views = [], onApply, onClose }) => {
	const [tableSearch, setTableSearch] = useState("");
	const [viewSearch, setViewSearch] = useState("");
	const [selectedTables, setSelectedTables] = useState<string[]>([]);
	const [selectedViews, setSelectedViews] = useState<string[]>([]);

	// Filter dynamically as search changes
	const filteredTables = tables.filter((t) =>
		t.toLowerCase().includes(tableSearch.toLowerCase()),
	);
	const filteredViews = views.filter((v) =>
		v.toLowerCase().includes(viewSearch.toLowerCase()),
	);
	const isApplyDisabled =
		selectedTables.length === 0 && selectedViews.length === 0;

	// When tables/views data changes (or search changes), keep only valid selections
	useEffect(() => {
		// If there are no current selections, select all by default
		setSelectedTables((prev) =>
			prev.length === 0 ? tables : prev.filter((t) => tables.includes(t)),
		);
		setSelectedViews((prev) =>
			prev.length === 0 ? views : prev.filter((v) => views.includes(v)),
		);
	}, [tables, views]);

	const handleSelectAll = (type: "tables" | "views", checked: boolean) => {
		if (type === "tables") {
			setSelectedTables(checked ? filteredTables : []);
		} else {
			setSelectedViews(checked ? filteredViews : []);
		}
	};

	const handleSelectItem = (
		type: "tables" | "views",
		name: string,
		checked: boolean,
	) => {
		if (type === "tables") {
			setSelectedTables((prev) =>
				checked ? [...prev, name] : prev.filter((t) => t !== name),
			);
		} else {
			setSelectedViews((prev) =>
				checked ? [...prev, name] : prev.filter((v) => v !== name),
			);
		}
	};

	const handleApply = () => {
		onApply({
			tables: selectedTables,
			views: selectedViews,
		});
	};

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				alignItems: "flex-end",
				p: 2,
			}}
		>
			<Box
				sx={{
					display: "flex",
					gap: 2,
					width: "100%",
					justifyContent: "center",
					mb: 2,
				}}
			>
				{/* Select Tables */}
				<div>
					<Typography
						variant="subtitle1"
						sx={{ fontWeight: 500, mb: 0.5 }}
					>
						Select Tables:
					</Typography>
					<TextField
						size="small"
						placeholder="Search tables..."
						fullWidth
						value={tableSearch}
						onChange={(e) => setTableSearch(e.target.value)}
						sx={{ mb: 1 }}
					/>
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							maxHeight: 180,
							overflowY: "auto",
						}}
					>
						<FormControlLabel
							control={
								<Checkbox
									checked={
										filteredTables.length > 0 &&
										selectedTables.length ===
											filteredTables.length
									}
									onChange={(
										e: ChangeEvent<HTMLInputElement>,
									) =>
										handleSelectAll(
											"tables",
											e.target.checked,
										)
									}
								/>
							}
							label="(Select all)"
							sx={{ mb: 0, marginLeft: 0 }}
						/>
						{filteredTables.map((table) => (
							<FormControlLabel
								key={table}
								control={
									<Checkbox
										checked={selectedTables.includes(table)}
										onChange={(
											e: ChangeEvent<HTMLInputElement>,
										) =>
											handleSelectItem(
												"tables",
												table,
												e.target.checked,
											)
										}
									/>
								}
								label={table}
								sx={{ mb: 0, marginLeft: 0 }}
							/>
						))}
					</Box>
				</div>

				{/* Select Views */}
				<div>
					<Typography
						variant="subtitle1"
						sx={{ fontWeight: 500, mb: 0.5 }}
					>
						Select Views:
					</Typography>
					<TextField
						size="small"
						placeholder="Search views..."
						fullWidth
						value={viewSearch}
						onChange={(e) => setViewSearch(e.target.value)}
						sx={{ mb: 1 }}
					/>
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							maxHeight: 180,
							overflowY: "auto",
						}}
					>
						<FormControlLabel
							control={
								<Checkbox
									checked={
										filteredViews.length > 0 &&
										selectedViews.length ===
											filteredViews.length
									}
									onChange={(
										e: ChangeEvent<HTMLInputElement>,
									) =>
										handleSelectAll(
											"views",
											e.target.checked,
										)
									}
								/>
							}
							label="(Select all)"
							sx={{ mb: 0, marginLeft: 0 }}
						/>
						{filteredViews.map((view) => (
							<FormControlLabel
								key={view}
								control={
									<Checkbox
										checked={selectedViews.includes(view)}
										onChange={(
											e: ChangeEvent<HTMLInputElement>,
										) =>
											handleSelectItem(
												"views",
												view,
												e.target.checked,
											)
										}
									/>
								}
								label={view}
								sx={{ mb: 0, marginLeft: 0 }}
							/>
						))}
					</Box>
				</div>
			</Box>
			<Stack spacing={2} direction="row" justifyContent="flex-end">
				<Button
					size="small"
					variant="text"
					onClick={onClose}
					data-testid="model-upload-close-button"
				>
					Close
				</Button>
				<Button
					size="small"
					variant="contained"
					disabled={isApplyDisabled}
					onClick={handleApply}
					data-testid="model-upload-submit-button"
				>
					Apply
				</Button>
			</Stack>
		</Box>
	);
};

export default TableViewSelector;
