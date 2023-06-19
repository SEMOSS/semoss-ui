import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "../Checkbox/index";
import * as React from "react";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import FormGroup from "@mui/material/FormGroup";
import FormHelperText from "@mui/material/FormHelperText";

const meta: Meta<typeof Checkbox> = {
    title: "Components/Checkbox",
    component: Checkbox,
    args: {
        defaultChecked: false,
        disabled: false,
        color: "secondary",
    },
    argTypes: {
        color: {
            options: [
                "secondary",
                "primary",
                "error",
                "info",
                "warning",
                "success",
                "default",
            ],
            contorl: { type: "select" },
        },
    },
};

export default meta;

type Story = StoryObj<typeof Checkbox>;

const label = { inputProps: { "aria-label": "Checkbox demo" } };

const IntermediateExample = () => {
    const [checked, setChecked] = React.useState([true, false]);

    const handleChange1 = (event: React.ChangeEvent<HTMLInputElement>) => {
        setChecked([event.target.checked, event.target.checked]);
    };

    const handleChange2 = (event: React.ChangeEvent<HTMLInputElement>) => {
        setChecked([event.target.checked, checked[1]]);
    };

    const handleChange3 = (event: React.ChangeEvent<HTMLInputElement>) => {
        setChecked([checked[0], event.target.checked]);
    };

    return (
        <div>
            <FormControlLabel
                label="Parent"
                control={
                    <Checkbox
                        checked={checked[0] && checked[1]}
                        indeterminate={checked[0] !== checked[1]}
                        onChange={handleChange1}
                    />
                }
            />
            <Box sx={{ display: "flex", flexDirection: "column", ml: 3 }}>
                <FormControlLabel
                    label="Child 1"
                    control={
                        <Checkbox
                            checked={checked[0]}
                            onChange={handleChange2}
                        />
                    }
                />
                <FormControlLabel
                    label="Child 2"
                    control={
                        <Checkbox
                            checked={checked[1]}
                            onChange={handleChange3}
                        />
                    }
                />
            </Box>
        </div>
    );
};

const CheckBoxErrorExample = () => {
    const [state, setState] = React.useState({
        gilad: true,
        jason: false,
        antoine: false,
    });

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setState({
            ...state,
            [event.target.name]: event.target.checked,
        });
    };

    const { gilad, jason, antoine } = state;
    const error = [gilad, jason, antoine].filter((v) => v).length !== 2;

    return (
        <Box sx={{ display: "flex" }}>
            <FormControl sx={{ m: 3 }} component="fieldset" variant="standard">
                <FormLabel component="legend">Assign responsibility</FormLabel>
                <FormGroup>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={gilad}
                                onChange={handleChange}
                                name="gilad"
                            />
                        }
                        label="Gilad Gray"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={jason}
                                onChange={handleChange}
                                name="jason"
                            />
                        }
                        label="Jason Killian"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={antoine}
                                onChange={handleChange}
                                name="antoine"
                            />
                        }
                        label="Antoine Llorca"
                    />
                </FormGroup>
                <FormHelperText>Be careful</FormHelperText>
            </FormControl>
            <FormControl
                required
                error={error}
                component="fieldset"
                sx={{ m: 3 }}
                variant="standard"
            >
                <FormLabel component="legend">Pick two</FormLabel>
                <FormGroup>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={gilad}
                                onChange={handleChange}
                                name="gilad"
                            />
                        }
                        label="Gilad Gray"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={jason}
                                onChange={handleChange}
                                name="jason"
                            />
                        }
                        label="Jason Killian"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={antoine}
                                onChange={handleChange}
                                name="antoine"
                            />
                        }
                        label="Antoine Llorca"
                    />
                </FormGroup>
                <FormHelperText>You can display an error</FormHelperText>
            </FormControl>
        </Box>
    );
};

export const Default: Story = {
    render: (args) => <Checkbox {...label} {...args} />,
};

export const Indeterminate: Story = {
    render: () => <IntermediateExample />,
};

export const Error: Story = {
    render: () => <CheckBoxErrorExample />,
};
