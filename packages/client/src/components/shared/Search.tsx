import NorthEastIcon from "@mui/icons-material/NorthEast";
import Autocomplete from "@mui/material/Autocomplete";
import Chip from "@mui/material/Chip";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { debounced, Env, usePixel } from "@semoss/sdk/react";
import {
	Box,
	Card,
	Divider,
	Grid,
	Link,
	List,
	Paper,
	Popper,
	Skeleton,
	Stack,
	Typography,
} from "@semoss/ui";
import BRAIN from "@/assets/img/BRAIN.png";
import { useRootStore } from "@/hooks";
import { ENGINE_IMAGES } from "@/pages/import/import.constants";

// Categories we can search
const categories = [
	{ name: "All", type: "All" },
	{ name: "Apps", type: "PROJECT" },
	{ name: "Model", type: "MODEL" },
	{ name: "Vector", type: "VECTOR" },
	{ name: "Database", type: "DATABASE" },
	{ name: "Function", type: "FUNCTION" },
	{ name: "Storage", type: "STORAGE" },
];

const CatalogItem = ({
	title,
	description = "Sample description",
	icon = "",
	id = "",
}) => (
	<Card
		sx={{
			width: "100%",
			boxShadow: "none",
			backgroundColor: "transparent",
			"&:hover": {
				boxShadow: "none",
				backgroundColor: "transparent",
			},
			"& :last-child": {
				paddingBottom: 0,
			},
			"&.MuiPaper-root": {
				overflow: "visible",
			},
			"&.MuiCard-root": {
				overflow: "visible",
			},
			"&.MuiPaper-root.MuiCard-root": {
				overflow: "visible",
			},
		}}
		data-testid={`catalog-item-${id}`}
	>
		<Card.Content
			sx={{
				paddingLeft: "0px",
				margin: 0,
				"&.MuiCardContent-root:last-child": {
					paddingBottom: 0,
				},
			}}
		>
			<Grid
				container
				alignItems="center"
				justifyContent={"space-between"}
			>
				<Grid item xs={1}>
					<img
						src={icon}
						alt={`${title} icon`}
						style={{ width: "40px", height: "40px", zIndex: 9999 }}
					/>
				</Grid>
				<Grid item xs={9}>
					<Typography
						variant="h5"
						sx={{
							fontSize: "16px",
							color: "#212121",
							fontFamily: "Inter",
							fontWeight: 400,
							lineHeight: "21.344px",
							display: "flex",
						}}
					>
						{title}
					</Typography>
					<Typography
						variant="body2"
						sx={{ color: "rgba(0, 0, 0, 0.60)", fontSize: "12px" }}
					>
						{description}
					</Typography>
				</Grid>
				<Grid item xs={2} container justifyContent="flex-end">
					{/* <IconButton>
                        <CallMadeIcon />
                    </IconButton> */}
					<NorthEastIcon sx={{ color: "rgba(0, 0, 0, 0.54)" }} />
				</Grid>
			</Grid>
		</Card.Content>
	</Card>
);
const CatalogItemSkeleton = () => (
	<Card
		sx={{
			marginBottom: "5px",
			width: "100%",
			boxShadow: "none",
			backgroundColor: "transparent",
			"&:hover": {
				boxShadow: "none",
				backgroundColor: "transparent",
			},
			"& :last-child": {
				paddingBottom: 0,
			},
		}}
	>
		<Card.Content
			sx={{
				padding: "5px 16px",
				margin: 0,
				"&.MuiCardContent-root:last-child": {
					paddingBottom: 0,
				},
			}}
		>
			<Grid container alignItems="center" justifyContent="space-between">
				<Grid item xs={1}>
					<Skeleton variant="rectangular" width={40} height={40} />
				</Grid>
				<Grid item xs={9}>
					<Skeleton
						variant="rectangular"
						width="80%"
						height={20}
						sx={{ mb: 1 }}
					/>
					<Skeleton variant="rectangular" width="60%" height={16} />
				</Grid>
				<Grid item xs={2} container justifyContent="flex-end">
					<Skeleton variant="rectangular" width={24} height={24} />
				</Grid>
			</Grid>
		</Card.Content>
	</Card>
);

function CustomPopper(props) {
	return <Popper {...props} placement="bottom-start" />;
}

interface SearchProps {
	// biome-ignore lint/suspicious/noExplicitAny: params's value can't be predicted
	renderInput: (params: any) => React.ReactNode;
}

export const Search = observer(({ renderInput }: SearchProps) => {
	// TODO: navigation should be done through callback
	const location = useLocation();
	const { configStore } = useRootStore();
	const searchValue = configStore.store.globalSearch || "";
	const [open, setOpen] = useState(false);
	const [selectedCategories, setSelectedCategories] = useState([
		{ name: "All", type: "" },
	]);

	const [inputValue, setInputValue] = useState("");

	let data = [];

	const isAll = selectedCategories.some(
		(category) => category.name === "All",
	);

	const result = usePixel(`
        MyEngineProject(metaKeys = ${JSON.stringify(
			[],
		)}, metaFilters=[{}], filterWord=["${searchValue}"], type=[[${
			isAll ? "" : selectedCategories.map((x) => `"${x.type}"`)
		}]]);
        `);

	if (result.data !== null && Array.isArray(result.data)) {
		data = result.data.map((x) => {
			return {
				...x,
				label: x.project_name || x.database_name,
				id: x.project_id || x.database_id,
				section: x.database_type || "APP",
				description: x.project_id || x.database_id,
			};
		});
	}

	useEffect(() => {
		configStore.setGlobalSearch("");
	}, [location?.pathname]);

	// biome-ignore lint/correctness/noUnusedFunctionParameters: this is a debounced function that needs to accept these parameters
	const debouncedSet = debounced((event, newInputValue) => {
		configStore.setGlobalSearch(newInputValue);
	}, 300);

	const handleInputChange = (event, newInputValue, reason) => {
		if (reason === "clear") {
			setSelectedCategories([{ name: "All", type: "" }]);
		}
		setInputValue(newInputValue);
		debouncedSet(event, newInputValue);
	};

	const recentSearchItem = localStorage.getItem(
		`recent-searches--${configStore.store.userEpoch}`,
	);

	const highlightMatch = (label: string, search: string) => {
		if (!search) return label;
		const idx = label.toLowerCase().indexOf(search.toLowerCase());
		if (idx === -1) return label;
		return (
			<span style={{ whiteSpace: "pre" }}>
				<span>{label.substring(0, idx)}</span>
				<span
					style={{
						background: "#EBF4FE",
						color: "#212121",
						borderRadius: "0",
						height: "21px",
						display: "inline-block",
					}}
				>
					{label.substring(idx, idx + search.length)}
				</span>
				<span>{label.substring(idx + search.length)}</span>
			</span>
		);
	};

	const handleCategoryToggle = (category) => {
		setSelectedCategories((prev) =>
			prev.some((c) => c.name === category.name)
				? prev.filter((c) => c.name !== category.name)
				: [...prev, category],
		);
	};

	const limitOptionsPerGroup = (options, maxPerGroup = 3) => {
		const grouped = {};
		options.forEach((opt) => {
			const group = opt.section || "";
			if (!grouped[group]) grouped[group] = [];
			if (grouped[group].length < maxPerGroup) {
				grouped[group].push(opt);
			}
		});

		return Object.values(grouped).flat();
	};

	const findDBImage = (appType: string, appSubType: string) => {
		const obj = ENGINE_IMAGES[appType]?.find(
			(ele) => ele.name === appSubType,
		);

		if (!obj) {
			console.warn("No image found:", appType, appSubType);
			return BRAIN;
		}

		return obj.icon;
	};

	const recentSearches = useMemo(() => {
		return configStore.getRecentSearches();
	}, [configStore.store.userEpoch, recentSearchItem]);

	// Limit the number of options per group to 3
	data = limitOptionsPerGroup(data, 3);

	/**
	 * Gets url for menu item click
	 *
	 * @param option - Object for engine and project interface
	 * @returns url
	 */
	const getEngineProjectHref = (option) => {
		const href = `${window.location.origin}${window.location.pathname}#`;

		if (option.type === "APP" || option.section === "APP") {
			const id = option.id ? option.id : option.project_id;

			return `${href}/app/${id}/view`;
		} else {
			const id = option.id ? option.id : option.database_id;
			const type = option.type ? option.type : option.database_type;

			return `${href}/engine/${type.toLowerCase()}/${id}`;
		}
	};

	return (
		<Autocomplete
			freeSolo
			open={open}
			onOpen={() => setOpen(true)}
			// onBlur={() => setOpen(false)}
			onClose={() => setOpen(false)}
			groupBy={(option) => option.section || ""}
			inputValue={inputValue}
			onInputChange={handleInputChange}
			options={!searchValue?.trim() ? [] : data}
			PopperComponent={CustomPopper}
			getOptionKey={(option) => option.id || option.label}
			getOptionLabel={(option) =>
				typeof option === "string" ? option : option.label
			}
			renderInput={renderInput}
			// biome-ignore lint/correctness/noUnusedFunctionParameters: props is required as first parameter
			renderOption={(props, option) => (
				<Link
					key={option.label}
					href={getEngineProjectHref(option)}
					rel="noopener noreferrer"
					color="inherit"
					underline="none"
					target="_blank"
				>
					<List.Item
						disablePadding
						disableGutters
						key={option.label}
						sx={{
							padding: "0px !important",
							flexDirection: "column",
							"&.MuiListItem-root": {
								padding: "0px !important",
							},
						}}
					>
						<List.ItemButton
							sx={{
								width: "100%",
								padding: "0px !important",
								"&.MuiListItemButton-root": {
									padding: "0px !important",
								},
							}}
							onClick={() => {
								configStore.setRecentSearch({
									label: option.label,
									id: option.id,
									type: option.section,
								});
								configStore.setGlobalSearch(""); // Clear search after selection
							}}
						>
							<CatalogItem
								icon={
									option.project_type
										? `${Env.MODULE}/api/project-${option.id}/projectImage/download`
										: findDBImage(
												option.app_type,
												option.app_subtype,
											)
								}
								title={highlightMatch(
									option.label,
									searchValue,
								)}
								description={`${option.description}nonono`}
								id={option.id}
							/>
						</List.ItemButton>
					</List.Item>
				</Link>
			)}
			noOptionsText={"No results found"}
			renderGroup={(params) => (
				<Stack direction={"column"} gap={0.5}>
					<Typography variant={"body2"} color="secondary">
						{params.group.charAt(0).toUpperCase() +
							params.group.slice(1).toLowerCase()}
					</Typography>
					<Divider />
					<div>{params.children}</div>
				</Stack>
			)}
			PaperComponent={({ children }) => (
				<Paper>
					<Box sx={{ p: 2 }}>
						<Typography variant="body2" sx={{ mb: 1 }}>
							I'm searching for
						</Typography>
						<Box
							sx={{
								display: "flex",
								gap: 1,
								flexWrap: "wrap",
								mb: 2,
							}}
						>
							{categories.map((category) => {
								const { name } = category;
								const isSelected = selectedCategories.some(
									(c) => c.name === name,
								);
								return (
									<Chip
										key={name}
										label={name}
										size="small"
										sx={{
											backgroundColor: isSelected
												? "#C4C4C4"
												: "unset",
											border: isSelected
												? "1px solid #C4C4C4"
												: "1px solid #E0E0E0",
											color: isSelected
												? "#ffffff"
												: "#000",
										}}
										clickable
										onMouseDown={(e) => e.preventDefault()}
										onClick={() => {
											handleCategoryToggle(category);
										}}
									/>
								);
							})}
						</Box>
						{result.status === "LOADING" ? (
							<>
								<CatalogItemSkeleton />
								<CatalogItemSkeleton />
								<CatalogItemSkeleton />
							</>
						) : (
							children
						)}
						<Divider sx={{ borderColor: "#DDE1E6" }} />
						{!searchValue && (
							<Typography
								variant="subtitle2"
								sx={{ mb: 1, mt: 1, color: "#9E9E9E" }}
							>
								Recents
							</Typography>
						)}
						{!searchValue &&
							recentSearches.map(({ label, id, type }) => (
								<Link
									key={label}
									href={getEngineProjectHref({
										label,
										id,
										type,
									})}
									rel="noopener noreferrer"
									color="inherit"
									underline="none"
									target="_blank"
								>
									<Stack
										sx={{ mb: 0.5 }}
										alignItems={"center"}
										direction={"row"}
										gap={1}
										onMouseDown={(e) => e.preventDefault()}
										onClick={() => {
											configStore.setRecentSearch({
												label,
												id,
												type,
											});
										}}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="19"
											height="16"
											viewBox="0 0 19 16"
											fill="none"
										>
											<title>Recent search icon</title>
											<path
												d="M11.2507 4.66667H10.0007V8.83333L13.5673 10.95L14.1673 9.94167L11.2507 8.20833V4.66667ZM10.834 0.5C8.84486 0.5 6.93721 1.29018 5.53068 2.6967C4.12416 4.10322 3.33398 6.01088 3.33398 8H0.833984L4.13398 11.3583L7.50065 8H5.00065C5.00065 6.4529 5.61523 4.96917 6.7092 3.87521C7.80316 2.78125 9.28689 2.16667 10.834 2.16667C12.3811 2.16667 13.8648 2.78125 14.9588 3.87521C16.0527 4.96917 16.6673 6.4529 16.6673 8C16.6673 9.5471 16.0527 11.0308 14.9588 12.1248C13.8648 13.2188 12.3811 13.8333 10.834 13.8333C9.22565 13.8333 7.76732 13.175 6.71732 12.1167L5.53398 13.3C6.89232 14.6667 8.75065 15.5 10.834 15.5C12.8231 15.5 14.7308 14.7098 16.1373 13.3033C17.5438 11.8968 18.334 9.98912 18.334 8C18.334 6.01088 17.5438 4.10322 16.1373 2.6967C14.7308 1.29018 12.8231 0.5 10.834 0.5Z"
												fill="#9E9E9E"
											/>
										</svg>
										<Typography
											variant="body2"
											sx={{ cursor: "pointer" }}
										>
											{label}
										</Typography>
									</Stack>
								</Link>
							))}
					</Box>
				</Paper>
			)}
		/>
	);
});
