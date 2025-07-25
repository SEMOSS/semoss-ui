import React, {
    useEffect,
    useState,
    forwardRef,
    useImperativeHandle,
    useRef,
    useMemo,
} from "react";
import {
    Box,
    Button,
    IconButton,
    InputAdornment,
    List,
    ListItemIcon,
    TextField,
    Typography,
    Chip,
} from "@semoss/ui";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Close";
import { Checkbox, ListItem, ListItemText, Slider } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import CloseIcon from "@mui/icons-material/Close";
import { ClickAwayListener } from "@mui/material";
import Paper from "@mui/material/Paper";
import Filter from "../../../assets/visualizationFilterBlock/FilterIcon.png";

interface ChipData {
    key: number;
    label: string;
}

export interface ChipsArrayHandle {
    getChips: () => ChipData[];
}

interface ChipsArrayProps {
    chips: ChipData[];
    onDelete: (chip: ChipData) => void;
}

const ChipsArray = forwardRef<ChipsArrayHandle, ChipsArrayProps>(
    ({ chips, onDelete }, ref) => {
        useImperativeHandle(ref, () => ({
            getChips: () => chips,
        }));

        return (
            <Paper
                component="ul"
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    listStyle: "none",
                    p: 0.5,
                    m: 0,
                }}
            >
                {chips.map((chip) => (
                    <li
                        key={chip.key}
                        style={{
                            display: "inline-block",
                            margin: 4,
                            listStyle: "none",
                            // maxHeight: "50%",
                        }}
                    >
                        <Chip
                            sx={{ m: 0.5 }}
                            label={chip.label}
                            onDelete={() => onDelete(chip)}
                        />
                    </li>
                ))}
            </Paper>
        );
    },
);

interface FilterComponentProps {
    resetKey?: string;
    mode?: string;
    listOptions?: string[];
    checkedValues?: string[];
    onApply: (value: any) => void;
    onReset?: () => void;
    showSearch?: boolean;
    multi?: boolean;
    filterLabel?: string;
    sliderSensitivity?: number;
    color?: "primary" | "secondary" | "success" | "warning" | "error";
    size?: "small" | "medium" | "large";
}

const IconComponent = ({ handleReset }: { handleReset: () => void }) => (
    <IconButton onClick={handleReset} size="small">
        <img src={Filter.toString()} alt="Filter Icon" />
    </IconButton>
);

// 👉 Separate Search Filter Header Component
const SearchFilterHeader = ({
    searchText,
    setSearchText,
    setChecked,
}: {
    searchText: string;
    setSearchText: (val: string) => void;
    setChecked: (val: string[]) => void;
}) => (
    <Box sx={{ alignItems: "center" }}>
        <TextField
            variant="outlined"
            size="small"
            placeholder="Search"
            value={searchText}
            onChange={(e) => {
                setSearchText(e.target.value);
            }}
            fullWidth
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <SearchIcon />
                    </InputAdornment>
                ),
                endAdornment: searchText && (
                    <InputAdornment position="end">
                        <IconButton
                            size="small"
                            onClick={() => {
                                setSearchText("");
                                setChecked([]);
                            }}
                        >
                            <ClearIcon />
                        </IconButton>
                    </InputAdornment>
                ),
            }}
        />
    </Box>
);

const FilterListComponent = ({
    listOptions,
    filteredOptions,
    multi,
    checked,
    setChecked,
}: {
    listOptions: string[];
    filteredOptions: string[];
    multi: boolean;
    checked: string[];
    setChecked: (val: string[]) => void;
}) => {
    const handleToggle = (value: string) => () => {
        if (!multi) {
            setChecked(checked.includes(value) ? [] : [value]);
            return;
        }

        if (value === "Select All") {
            setChecked(
                checked.length === listOptions.length ? [] : [...listOptions],
            );
        } else {
            const newChecked = checked.includes(value)
                ? checked.filter((c) => c !== value)
                : [...checked, value];
            setChecked(newChecked);
        }
    };

    const allChecked = checked.length === listOptions.length;
    const indeterminate = checked.length > 0 && !allChecked;

    return (
        <List sx={{ maxHeight: 200, overflowY: "auto" }} dense>
            {multi && (
                <ListItem key="select-all" onClick={handleToggle("Select All")}>
                    <ListItemIcon>
                        <Checkbox
                            edge="start"
                            checked={allChecked}
                            indeterminate={indeterminate}
                            tabIndex={-1}
                            disableRipple
                        />
                    </ListItemIcon>
                    <ListItemText primary="Select All" />
                </ListItem>
            )}

            {filteredOptions.map((option) => (
                <ListItem key={option} onClick={handleToggle(option)}>
                    <ListItemIcon>
                        <Checkbox
                            edge="start"
                            checked={checked.includes(option)}
                            tabIndex={-1}
                            disableRipple
                        />
                    </ListItemIcon>
                    <ListItemText primary={option} />
                </ListItem>
            ))}
        </List>
    );
};

const FilterComponent: React.FC<FilterComponentProps> = ({
    resetKey,
    mode,
    listOptions = [],
    checkedValues = [],
    onApply,
    onReset,
    showSearch = true,
    multi = true,
    filterLabel = "",
    sliderSensitivity = 0,
    color = "primary",
    size = "medium",
}) => {
    const sortedOptions = listOptions
        .map((opt) => parseInt(opt, 10))
        .filter((n) => !isNaN(n))
        .sort((a, b) => a - b);

    const sliderMin = sortedOptions.length > 0 ? sortedOptions[0] : 0;
    const sliderMax =
        sortedOptions.length > 0
            ? sortedOptions[sortedOptions.length - 1]
            : 100;

    const defaultCheckedNums = checkedValues
        .map((v) => parseInt(v, 10))
        .filter((v) => !isNaN(v));

    const defaultRange =
        mode === "slider" && defaultCheckedNums.length > 0
            ? [Math.min(...defaultCheckedNums), Math.max(...defaultCheckedNums)]
            : [sliderMin, sliderMax];

    const [checked, setChecked] = useState<string[]>([]);
    const [range, setRange] = useState<number[]>(defaultRange);
    const [searchText, setSearchText] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggleDropdown = () => setDropdownOpen((prev) => !prev);
    const closeDropdown = () => setDropdownOpen(false);
    const chipsRef = useRef<ChipsArrayHandle>(null);
    const initialChips = useMemo(
        () =>
            listOptions.map((label, index) => ({
                key: index,
                label,
            })),
        [listOptions],
    );
    const [chipData, setChipData] = useState<ChipData[]>(initialChips);

    useEffect(() => {
        setSearchText("");
        if (mode === "checklist") {
            setChecked(checkedValues);
        }
        if (mode === "dropdown") {
            setChecked(checkedValues);
        }
        if (mode === "slider") {
            const checkedNums = checkedValues
                .map((v) => parseInt(v, 10))
                .filter((v) => !isNaN(v));
            setRange(
                checkedNums.length > 0
                    ? [Math.min(...checkedNums), Math.max(...checkedNums)]
                    : [sliderMin, sliderMax],
            );
        }
    }, [resetKey, mode, JSON.stringify(checkedValues)]);

    const handleSliderChange = (event: Event, newValue: number | number[]) => {
        setRange(newValue as number[]);
    };

    const handleApply = () => {
        let selected: string[] = [];

        if (mode === "checklist" || mode === "dropdown") {
            selected = checked;
        } else if (mode === "slider") {
            const [min, max] = range;
            const step = sliderSensitivity > 0 ? sliderSensitivity : 1;

            selected = listOptions.filter((opt) => {
                const num = parseInt(opt, 10);
                return (
                    !isNaN(num) &&
                    num >= min &&
                    num <= max &&
                    (num - min) % step === 0
                );
            });
        } else if (mode === "multiselect") {
            const remaining = chipsRef.current?.getChips() || [];

            const safeChipData = remaining.map((chip, index) => ({
                key: index,
                label: chip.label,
            }));

            selected = safeChipData.map((chip) => chip.label);

            setChipData(safeChipData);
        }

        onApply(selected);
    };
    const handleReset = () => {
        if (mode === "checklist" || mode === "dropdown") {
            setChecked([]);
        } else if (mode === "slider") {
            setRange([sliderMin, sliderMax]);
        }
        setSearchText("");

        if (onReset) {
            onReset();
        }
    };

    const filteredOptions = listOptions.filter((opt) =>
        opt.toLowerCase().includes(searchText.toLowerCase()),
    );

    return (
        <Box
            sx={{
                width: "100%",
                height: "100%",
                border: "1px solid #ccc",
                borderRadius: 1,
                p: 2,
                display: "flex",
                flexDirection: "column",
                gap: 2,
            }}
        >
            {(mode === "checklist" || mode === "multiselect") && (
                <Box
                    sx={{
                        display: "flex",
                        gap: 1,
                        alignItems: "center",
                        width: "100%",
                    }}
                >
                    {showSearch && (
                        <Box sx={{ flex: 1 }}>
                            <SearchFilterHeader
                                searchText={searchText}
                                setSearchText={setSearchText}
                                setChecked={setChecked}
                            />
                        </Box>
                    )}
                    <IconComponent handleReset={handleReset} />
                </Box>
            )}

            {mode === "checklist" && (
                <FilterListComponent
                    listOptions={listOptions}
                    filteredOptions={filteredOptions}
                    multi={multi}
                    checked={checked}
                    setChecked={setChecked}
                />
            )}
            {mode === "slider" && (
                <Box sx={{ px: 2 }}>
                    <Typography variant="body2" gutterBottom>
                        {range[0]} - {range[1]}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        <IconComponent handleReset={handleReset} />
                        <Slider
                            value={range}
                            onChange={handleSliderChange}
                            valueLabelDisplay="auto"
                            min={sliderMin}
                            max={sliderMax}
                            step={sliderSensitivity > 0 ? sliderSensitivity : 1}
                        />
                    </Box>
                </Box>
            )}

            {mode === "dropdown" && (
                <ClickAwayListener onClickAway={closeDropdown}>
                    <Box sx={{ position: "relative", width: "100%" }}>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                            }}
                        >
                            <Box
                                onClick={toggleDropdown}
                                sx={{
                                    border: "1px solid #ccc",
                                    borderRadius: 1,
                                    px: 1.5,
                                    py: 1,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    cursor: "pointer",
                                    minHeight: "40px",
                                    flex: 1,
                                }}
                            >
                                <Typography variant="body2">
                                    {filterLabel}
                                </Typography>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                    }}
                                >
                                    <ArrowDropDownIcon />
                                    <CloseIcon
                                        fontSize="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setChecked([]);
                                            closeDropdown();
                                        }}
                                        sx={{ cursor: "pointer" }}
                                    />
                                </Box>
                            </Box>

                            {/* Add icon beside dropdown */}
                            <IconComponent handleReset={handleReset} />
                        </Box>

                        {dropdownOpen && (
                            <Box
                                sx={{
                                    position: "relative",
                                    maxHeight: "100%",
                                    overflow: "visible",
                                    mt: 1,
                                    width: "100%",
                                    backgroundColor: "#fff",
                                    border: "1px solid #ccc",
                                    borderRadius: 1,
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                }}
                            >
                                <SearchFilterHeader
                                    searchText={searchText}
                                    setSearchText={setSearchText}
                                    setChecked={setChecked}
                                />
                                <FilterListComponent
                                    listOptions={listOptions}
                                    filteredOptions={filteredOptions}
                                    multi={multi}
                                    checked={checked}
                                    setChecked={setChecked}
                                />
                            </Box>
                        )}
                    </Box>
                </ClickAwayListener>
            )}

            {mode === "multiselect" && (
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        maxHeight: 200,
                        overflowY: "auto",
                    }}
                >
                    <ChipsArray
                        chips={chipData.filter((chip) =>
                            chip.label
                                .toLowerCase()
                                .includes(searchText.toLowerCase()),
                        )}
                        ref={chipsRef}
                        onDelete={(chipToDelete) => {
                            const updated = chipData.filter(
                                (chip) => chip.key !== chipToDelete.key,
                            );
                            setChipData(updated);
                        }}
                    />
                </Box>
            )}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    mt: 2,
                    alignItems: "center",
                    borderTop: "1px solid #ddd",
                    pt: 2,
                }}
            >
                <Button
                    variant="contained"
                    onClick={handleApply}
                    color={color}
                    size={size}
                >
                    Apply
                </Button>
            </Box>
        </Box>
    );
};

export default FilterComponent;
