import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Autocomplete } from "./index";
import { Box } from "../Box/index";
import Stack from "@mui/material/Stack";

const meta: Meta<typeof Autocomplete> = {
    title: "Components/Autocomplete",
    component: Autocomplete,
};

export default meta;

type Story = StoryObj<typeof Autocomplete>;

const films = [
    { label: "The Shawshank Redemption", year: 1994 },
    { label: "The Godfather", year: 1972 },
    { label: "The Godfather: Part II", year: 1974 },
    { label: "The Dark Knight", year: 2008 },
    { label: "12 Angry Men", year: 1957 },
    { label: "Schindler's List", year: 1993 },
    { label: "Pulp Fiction", year: 1994 },
    {
        label: "The Lord of the Rings: The Return of the King",
        year: 2003,
    },
    { label: "The Good, the Bad and the Ugly", year: 1966 },
    { label: "Fight Club", year: 1999 },
    {
        label: "The Lord of the Rings: The Fellowship of the Ring",
        year: 2001,
    },
    {
        label: "Star Wars: Episode V - The Empire Strikes Back",
        year: 1980,
    },
    { label: "Forrest Gump", year: 1994 },
    { label: "Inception", year: 2010 },
    {
        label: "The Lord of the Rings: The Two Towers",
        year: 2002,
    },
];

const films2 = [
    { label: "One Flew Over the Cuckoo's Nest", year: 1975 },
    { label: "Goodfellas", year: 1990 },
    { label: "The Matrix", year: 1999 },
    { label: "Seven Samurai", year: 1954 },
    {
        label: "Star Wars: Episode IV - A New Hope",
        year: 1977,
    },
    { label: "City of God", year: 2002 },
    { label: "Se7en", year: 1995 },
    { label: "The Silence of the Lambs", year: 1991 },
];

const Example = () => {
    const [selected, setSelected] = useState<string>(films[0].label);
    const [inputValue, setInputValue] = useState("");

    const [values, setValue] = useState<{ label: string; year: number }[]>([
        films[2],
    ]);

    return (
        <Stack spacing={2}>
            <Autocomplete
                label="Select Movie"
                id="combo-box-demo"
                options={films.map((val) => val.label)}
                value={selected}
                onChange={(event, value) => {
                    setSelected(value ? value : "");
                }}
                inputValue={inputValue}
                isOptionEqualToValue={(option, value) => {
                    return option === value;
                }}
                onInputChange={(event, newInputValue) => {
                    setInputValue(newInputValue);
                }}
            />
            <Box>Value: {selected}</Box>
            <Autocomplete
                label="Select Movies"
                multiple
                id="fixed-tags-demo"
                value={[...values]}
                defaultValue={[...values]}
                onChange={(event, newValue) => {
                    setValue([...newValue] as {
                        label: string;
                        year: number;
                    }[]);
                }}
                options={films2}
                isOptionEqualToValue={(option, value) => {
                    return option === value;
                }}
                style={{ width: 500 }}
            />
            <Box>Values: {values.map((v) => `${v.label} `)}</Box>
        </Stack>
    );
};

export const Default: Story = {
    render: () => <Example />,
};
