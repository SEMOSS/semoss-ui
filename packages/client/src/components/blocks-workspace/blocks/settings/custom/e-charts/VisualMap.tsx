import { Search } from "@mui/icons-material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import type { BlockDef } from "@semoss/renderer";
import {
	IconButton,
	InputAdornment,
	Stack,
	styled,
	TextField,
} from "@semoss/ui";
import { VisualMapConstant } from "./VisualMapConstant";

export const VisualMap = observer(
	<D extends BlockDef = BlockDef>({ selectedItem, handleClose }) => {
		const StyledMain = styled("div")(() => ({
			width: "100%",
			height: "100%",
			marginTop: "1px",
		}));
		const StyledVisualMapSection = styled("div")(() => ({
			width: "95%",
			left: "8%",
			top: "1%",
			position: "relative",
			maxHeight: "530px",
			overflowY: "auto",
		}));

		const StyledSpanHeader = styled("span")(() => ({
			fontSize: "1rem",
			color: "#808080",
			marginTop: "5px",
			position: "relative",
			display: "block",
			wordWrap: "break-word",
			whiteSpace: "normal",
		}));

		const [search, setSearch] = useState("");
		const [filteredData, setFilteredData] = useState(VisualMapConstant);
		const searchInputRef = useRef<HTMLInputElement | null>(null);

		useEffect(() => {
			setTimeout(() => {
				searchInputRef.current?.focus();
			}, 0);
		}, [search]);

		const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
			setSearch(e.target.value);
			const searchValue = e.target.value;
			if (searchValue === "") {
				setFilteredData(VisualMapConstant);
				return;
			}
			const filtered = Object.entries(VisualMapConstant).reduce(
				(acc, [key, value]) => {
					const filteredItems = Array.isArray(value)
						? value.filter((item) =>
								item.name
									.toLowerCase()
									.includes(searchValue.toLowerCase()),
							)
						: [];
					if (filteredItems.length > 0) {
						acc[key] = filteredItems;
					}
					return acc;
				},
				{} as typeof VisualMapConstant,
			);

			setFilteredData(filtered);
		};

		function handleSelectItem(item: any) {
			selectedItem(item);
		}

		return (
			<StyledMain>
				<StyledVisualMapSection>
					<span
						style={{
							color: "#0471F0",
							display: "block",
						}}
					>
						Select Visual
					</span>
					<CloseOutlinedIcon
						sx={{ color: "#808080" }}
						style={{
							position: "absolute",
							marginLeft: "84%",
							zIndex: 10,
						}}
						onClick={() => {
							handleClose();
						}}
					/>
					<StyledSpanHeader>
						Select a chart type for your data visualization
					</StyledSpanHeader>
				</StyledVisualMapSection>
				<hr
					style={{ marginTop: "20px", border: "1px solid #E0E0E0" }}
				/>
				<StyledVisualMapSection>
					<Stack paddingTop={2} width={"85%"}>
						<TextField
							inputRef={searchInputRef}
							placeholder="Search"
							size="small"
							sx={{
								"& .MuiOutlinedInput-root": {
									borderRadius: "7px",
								},
							}}
							value={search}
							onChange={handleSearch}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<Search />
									</InputAdornment>
								),
								endAdornment: (
									<InputAdornment position="end">
										<IconButton
											size="small"
											// onClick={(e) =>
											//     setMenuAnchorEl(e.currentTarget)
											// }
										></IconButton>
									</InputAdornment>
								),
							}}
						/>
					</Stack>
					{Object.entries(filteredData).map(([key, value]) => (
						<Stack key={key} paddingTop={2} width={"85%"}>
							<StyledSpanHeader>{key}</StyledSpanHeader>
							{value?.map((item, index) => (
								<div
									key={index}
									style={{
										display: "flex",
										alignItems: "center",
										marginTop: "15px",
										cursor: item?.option
											? "pointer"
											: "default",
									}}
									onClick={() => {
										if (item?.option) {
											handleSelectItem(item);
										}
									}}
								>
									<div
										style={{
											display: "flex",
											alignItems: "center",
										}}
									>
										{item.icon}
									</div>
									<span
										style={{
											marginLeft:
												item.icon?.type === "img"
													? "30px"
													: "38px",
											display: "flex",
											alignItems: "center",
											color: item?.option
												? "#000000"
												: "#808080",
										}}
									>
										{item.label}
									</span>
								</div>
							))}
						</Stack>
					))}
				</StyledVisualMapSection>
			</StyledMain>
		);
	},
);
