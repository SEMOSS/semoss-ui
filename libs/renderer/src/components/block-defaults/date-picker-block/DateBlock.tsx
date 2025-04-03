import { observer } from "mobx-react-lite";
import { CSSProperties } from "react";
import { useBlock } from "../../../hooks";
import { BlockDef, BlockComponent } from "../../../store";
import { styled } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DateField } from "@mui/x-date-pickers/DateField";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { Typography } from "@mui/material";
import dayjs from "dayjs";

const StyledContainer = styled("div")(({ theme }) => ({
    padding: "4px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
}));

const StyledLabel = styled(Typography)(({ theme }) => ({
    fontSize: "14px",
    fontWeight: 500,
}));

export interface DateBlockDef extends BlockDef<"date"> {
    widget: "date";
    data: {
        style: CSSProperties;
        label: string;
        value: string; // ISO string
        variant: "field" | "picker" | "calendar";
        format: string;
        disabled: boolean;
        required: boolean;
        fullWidth: boolean;
        placeholder: string;
        clearable: boolean;
        size: "small" | "medium";
        disableFuture: boolean;
        disablePast: boolean;
        minDate: string; // ISO string
        maxDate: string; // ISO string
        views: ("year" | "month" | "day")[];
    };
    listeners: {
        onChange: true;
    };
}

export const DateBlock: BlockComponent = observer(({ id }) => {
    try {
        const { attrs, data, setData } = useBlock<DateBlockDef>(id);

        // Parse the value string to a dayjs object, default to null if invalid
        const dateValue = data.value ? dayjs(data.value) : null;

        // Parse min and max dates if provided
        const minDate = data.minDate ? dayjs(data.minDate) : undefined;
        const maxDate = data.maxDate ? dayjs(data.maxDate) : undefined;

        const handleChange = (newValue: dayjs.Dayjs | null) => {
            // Convert to ISO string for storage or empty string if no value
            setData("value", newValue ? newValue.toISOString() : "");
        };

        // Common props for all date components
        const commonProps = {
            value: dateValue,
            onChange: handleChange,
            disabled: data.disabled,
            format: data.format || undefined,
            disableFuture: data.disableFuture,
            disablePast: data.disablePast,
            minDate: minDate,
            maxDate: maxDate,
        };

        // Field-specific props
        const fieldProps = {
            ...commonProps,
            slotProps: {
                textField: {
                    size: data.size,
                    fullWidth: data.fullWidth,
                    placeholder: data.placeholder,
                    variant: "outlined" as const,
                    required: data.required,
                },
            },
            clearable: data.clearable,
        };

        // Render the appropriate date component based on variant
        const renderDateComponent = () => {
            switch (data.variant) {
                case "field":
                    return <DateField {...fieldProps} />;
                case "calendar":
                    return <DateCalendar {...commonProps} views={data.views} />;
                case "picker":
                default:
                    return <DatePicker {...fieldProps} views={data.views} />;
            }
        };

        return (
            <StyledContainer {...attrs} style={data.style}>
                {data.label && <StyledLabel>{data.label}</StyledLabel>}
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    {renderDateComponent()}
                </LocalizationProvider>
            </StyledContainer>
        );
    } catch (error) {
        console.error("Error in DateBlock:", error);
        return <div>Error loading Date component</div>;
    }
});
