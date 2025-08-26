import { Search } from "@mui/icons-material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import {
	IconButton,
	InputAdornment,
	Stack,
	styled,
	TextField,
} from "@semoss/ui";
import { VisualMapConstant } from "./VisualMapConstant";

interface VisualMapProps {
	selectedItem: (item) => void;
	handleClose: () => void;
}

export const VisualMap = observer(
	({ selectedItem, handleClose }: VisualMapProps) => {
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

		const StyledVisualSpan = styled("span")(() => ({
			color: "#0471F0",
			display: "block",
		}));

		const StyledCloseOutlinedIcon = styled(CloseOutlinedIcon)(() => ({
			position: "absolute",
			marginLeft: "84%",
			zIndex: 10,
		}));

		const Styledhr = styled("hr")(() => ({
			marginTop: "20px",
			border: "1px solid #E0E0E0",
		}));

		const StyledVisualMapValueSection = styled("div")(
			({ cursor }: { cursor: boolean }) => ({
				display: "flex",
				alignItems: "center",
				marginTop: "15px",
				cursor: cursor ? "pointer" : "default",
			}),
		);

		const StyledVisualMapValueSectionIcon = styled("div")(() => ({
			display: "flex",
			alignItems: "center",
		}));

		const StyledVisualMapValueSectionSpan = styled("span")(
			({ type, item }: { type: string; item: boolean }) => ({
				marginLeft: type === "img" ? "30px" : "38px",
				color: item ? "#000000" : "#808080",
				display: "flex",
				alignItems: "center",
			}),
		);

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

		function handleSelectItem(item) {
			selectedItem(item);
		}

		return (
			<StyledMain>
				<StyledVisualMapSection>
					<StyledVisualSpan>Select Visual</StyledVisualSpan>
					<StyledCloseOutlinedIcon
						sx={{ color: "#808080" }}
						onClick={() => {
							handleClose();
						}}
					/>
					<StyledSpanHeader>
						Select a chart type for your data visualization
					</StyledSpanHeader>
				</StyledVisualMapSection>
				<Styledhr />
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
										<IconButton size="small"></IconButton>
									</InputAdornment>
								),
							}}
						/>
					</Stack>
					{Object.entries(filteredData).map(([key, value]) => (
						<Stack key={key} paddingTop={2} width={"85%"}>
							<StyledSpanHeader>{key}</StyledSpanHeader>
							{value?.map((item) => (
								<StyledVisualMapValueSection
									key={item.name || item.label}
									cursor={
										Object.hasOwn(item, "option") &&
										Object.keys(item.option).length > 0
									}
									onClick={() => {
										if (item?.option) {
											handleSelectItem(item);
										}
									}}
								>
									<StyledVisualMapValueSectionIcon>
										{item.icon}
									</StyledVisualMapValueSectionIcon>
									<StyledVisualMapValueSectionSpan
										type={item.icon?.type}
										item={
											Object.hasOwn(item, "option") &&
											Object.keys(item.option).length > 0
										}
									>
										{item.label}
									</StyledVisualMapValueSectionSpan>
								</StyledVisualMapValueSection>
							))}
						</Stack>
					))}
				</StyledVisualMapSection>
			</StyledMain>
		);
	},
);
