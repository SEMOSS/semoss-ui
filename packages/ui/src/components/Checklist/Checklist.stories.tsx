import React, { ComponentProps, useState } from "react";
import { StarOutlined } from "@mui/icons-material";
import { Box } from "../../";
import { Checklist } from "./";
import { StoryFn } from "@storybook/react";
import { Search } from "../Search";
import { styled } from "../../";

export default {
    title: "Components/Checklist",
    component: Checklist,
    argTypes: {},
};

const StyledSearch = styled(Search)({
    width: "100%",
    padding: "0px 5px 0px 5px",
});

const ExampleList = [
    {
        primary: "Primary 1",
        secondary: "Secondary 1",
        checked: false,
    },
    {
        primary: "Primary 2",
        secondary: "Secondary 2",
        checked: false,
    },
    {
        primary: "Primary 3",
        secondary: "Secondary 3",
        checked: false,
    },
    {
        primary: "Primary 4",
        secondary: "Secondary 4",
        checked: false,
    },
    {
        primary: "Primary 5",
        secondary: "Secondary 5",
        checked: false,
    },
];

const Template: StoryFn<ComponentProps<typeof Checklist>> = (args) => {
    const [listSearch, setListSearch] = useState("");
    const [checked, setChecked] = useState(false);

    const handleChange = (event) => {
        if (event.target.name === "all") {
            setChecked((check) => !check);
            ExampleList.forEach((val) => {
                val.checked = !val.checked;
            });
        } else {
            const filtered = ExampleList.find(
                (obj) => obj.primary == event.target.name,
            );
            filtered && filtered.checked == !filtered.checked;
        }
    };

    return (
        <Box sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}>
            <Checklist {...args}>
                <StyledSearch
                    size={"small"}
                    value={listSearch}
                    onChange={(e) => {
                        setListSearch(e.target.value);
                    }}
                />
                <Checklist.Item divider>
                    <Checklist.ItemButton
                        name="all"
                        onChange={handleChange}
                        checked={checked}
                    />
                    <Checklist.ItemText primary="Select All" />
                </Checklist.Item>

                {ExampleList.map((val, id) => {
                    if (
                        val.primary
                            .toLowerCase()
                            .includes(listSearch.toLowerCase()) ||
                        val.secondary
                            .toLowerCase()
                            .includes(listSearch.toLowerCase())
                    ) {
                        return (
                            <Checklist.Item
                                key={id}
                                divider
                                secondaryAction={
                                    val.primary == "Primary 1" ? (
                                        <StarOutlined />
                                    ) : (
                                        ""
                                    )
                                }
                            >
                                <Checklist.ItemButton
                                    checked={val.checked}
                                    onChange={handleChange}
                                    name={val.primary}
                                />
                                <Checklist.ItemText
                                    primary={val.primary}
                                    secondary={val.secondary}
                                />
                            </Checklist.Item>
                        );
                    }
                })}
            </Checklist>
        </Box>
    );
};

// Default
export const Default = Template.bind({});
