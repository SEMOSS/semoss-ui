import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Delete } from "@mui/icons-material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
    AccordionActions,
    AccordionDetails,
    AccordionSummary,
    Input,
} from "@mui/material";

import {
    Accordion,
    Button,
    MenuItem,
    Select,
    styled,
    TextField,
    Table,
} from "@semoss/ui";

import CustomAccordianBlock from "./CustomAccordianBlock";
import { useBlockSettings, useFrame } from "../../../../../hooks";
import { EchartVisualizationBlockDef } from "../../VisualizationBlock";

const StyledSelect = styled(Select)(() => ({
    width: "100%",
}));
interface Rules {
    rule: string;
    comparator: string;
    values: Array<number>;
}
interface GridBlockColumnSettingsProps {
    /** Id of the block */
    id: string;
    option: any;
    updateChart: any;
}
export const ColorByValue = observer(
    ({ updateChart, option, id }: GridBlockColumnSettingsProps) => {
        const [selectorQuery, setSelectorQuery] = useState("");
        const [appliedRules, setAppliedRules] = useState<Rules[]>([]);
        const [selectedData, setSelectedData] = useState({
            selectedColor: "",
            selectedComparator: "",
            selectedColumn: "",
            selectedData: [],
        });
        const [comparatorSection, setComparatorSection] = useState(true);
        const { data, setData } =
            useBlockSettings<EchartVisualizationBlockDef>(id);
        const framHeaders = data?.columns;
        useEffect(() => {}, [selectedData, appliedRules]);
        useEffect(() => {}, [selectorQuery]);
        const frameValue = useFrame(data.frame?.name, {
            selector:
                selectorQuery === ""
                    ? `Select(${selectedData.selectedColumn}).as([${selectedData.selectedColumn}])`
                    : selectorQuery,
            limit: 50,
        });
        const accordianExpanded = false;
        const comparator = [
            "is Equal To",
            "is Not Equal To",
            "is Less Than",
            "is Less Than or Equal To",
            "is Greater Than",
            "is Greater Than or Equal To",
        ];
        const updateColor = (e) => {
            setSelectedData((prev) => ({
                ...prev,
                selectedColor: e.target.value,
            }));
        };
        const handleSelect = (value) => {
            let SelectedData = selectedData.selectedData;
            if (value[0] === undefined) {
                SelectedData[0] = Number(value.target.value);
            } else {
                if (SelectedData.includes(value[0])) {
                    const index = SelectedData.indexOf(value[0]);
                    SelectedData.splice(index, 1);
                } else {
                    SelectedData.push(value[0]);
                }
            }
            setSelectedData((prev) => ({
                ...prev,
                selectedData: SelectedData,
            }));
        };
        const updateFields = (e) => {
            if (e.target.name === "comparator") {
                if (
                    e.target.value === "is Equal To" ||
                    e.target.value === "is Not Equal To"
                ) {
                    setComparatorSection(true);
                    let selectorData = "";

                    setSelectedData((prev) => ({
                        ...prev,
                        selectedComparator: e.target.value,
                        selectedData: [],
                    }));
                    selectorData = `Select(${selectedData.selectedColumn}).as([${selectedData.selectedColumn}])`;
                    setSelectorQuery(selectorData);
                } else {
                    setComparatorSection(false);
                    let selectorData = "";

                    setSelectedData((prev) => ({
                        ...prev,
                        selectedComparator: e.target.value,
                        selectedData: [],
                    }));
                    selectorData = `Select(Max(${selectedData.selectedColumn}),Min(${selectedData.selectedColumn}))`;
                    setSelectorQuery(selectorData);
                }
            } else {
                let index = e.target.value;
                let headerName = framHeaders[index]?.name;
                let selectorData = "";
                setSelectedData((prev) => ({
                    ...prev,
                    selectedColumn: headerName,
                    selectedData: [],
                }));
                if (
                    selectedData.selectedComparator === "is Equal To" ||
                    selectedData.selectedComparator === "is Not Equal To" ||
                    selectedData.selectedComparator === ""
                ) {
                    selectorData = `Select(${headerName}).as([${headerName}])`;
                } else {
                    selectorData = `Select(Max(${headerName}),Min(${headerName}))`;
                }
                setSelectorQuery(selectorData);
            }
        };
        const applyRules = () => {
            let selectedColumns = selectedData.selectedColumn;
            let selectedComparator = selectedData.selectedComparator;
            let selectedDataList = selectedData.selectedData;
            switch (selectedComparator) {
                case "is Equal To":
                    const newRules: Rules = {
                        rule: selectedColumns,
                        comparator: "==",
                        values: selectedDataList,
                    };
                    setAppliedRules((prev) => [...prev, newRules]);
                    break;
                case "is Not Equal To":
                    const newRules1: Rules = {
                        rule: selectedColumns,
                        comparator: "!=",
                        values: selectedDataList,
                    };
                    setAppliedRules((prev) => [...prev, newRules1]);
                    break;
                case "is Less Than":
                    const newRules2: Rules = {
                        rule: selectedColumns,
                        comparator: "<",
                        values: selectedDataList,
                    };
                    setAppliedRules((prev) => [...prev, newRules2]);
                    break;
                case "is Less Than or Equal To":
                    const newRules3: Rules = {
                        rule: selectedColumns,
                        comparator: "<=",
                        values: selectedDataList,
                    };
                    setAppliedRules((prev) => [...prev, newRules3]);
                    break;
                case "is Greater Than":
                    const newRules4: Rules = {
                        rule: selectedColumns,
                        comparator: ">",
                        values: selectedDataList,
                    };
                    setAppliedRules((prev) => [...prev, newRules4]);
                    break;
                case "is Greater Than or Equal To":
                    const newRules5: Rules = {
                        rule: selectedColumns,
                        comparator: ">=",
                        values: selectedDataList,
                    };
                    setAppliedRules((prev) => [...prev, newRules5]);
                    break;
            }
        };
        const handleDeleteRow = (rule, index) => {
            let existingRules = appliedRules;
            existingRules.splice(index, 1);
            setAppliedRules((prevRules) =>
                prevRules.filter((_, i) => i !== index),
            );
        };
        const getAccordianDetails = (
            <div
                style={{
                    display: "block",
                    border: "1px solid gray",
                    padding: "0.5rem",
                    width: "100%",
                }}
            >
                <table
                    style={{
                        width: "100%",
                        textAlign: "left",
                        borderColor: "#000000",
                    }}
                >
                    <thead>
                        <th>Column</th>
                        <th>Applied Rules</th>
                        <th></th>
                        <th></th>
                    </thead>
                    <tbody>
                        {appliedRules.map((rule, index) => (
                            <tr key={index}>
                                <td>{rule.rule}</td>
                                <td>
                                    {`Having: ${rule.rule} ${
                                        rule.comparator
                                    } ${JSON.stringify(rule.values)}`}
                                </td>
                                <td
                                    onClick={() => {
                                        handleDeleteRow(rule, index);
                                    }}
                                >
                                    {" "}
                                    <Delete />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <Table children={""}></Table>
                <br />
                <div
                    style={{
                        width: "100%",
                        paddingTop: "0.5rem",
                    }}
                >
                    <label
                        style={{
                            paddingTop: "0.5rem",
                        }}
                        htmlFor="label-position"
                    >
                        Select Column to color
                    </label>
                    <StyledSelect
                        id="label-position"
                        label="Select Position"
                        onChange={updateFields}
                    >
                        <Select.Item key="-1" value="">
                            Select
                        </Select.Item>
                        {framHeaders &&
                        Array.isArray(framHeaders) &&
                        framHeaders.length > 0 ? (
                            framHeaders.map((header, index) => (
                                <Select.Item value={index} key={index}>
                                    {header.name}{" "}
                                </Select.Item>
                            ))
                        ) : (
                            <Select.Item value="" disabled>
                                No Options Available
                            </Select.Item>
                        )}
                    </StyledSelect>
                </div>
                <div
                    style={{
                        width: "100%",
                        paddingTop: "0.5rem",
                    }}
                >
                    <label
                        style={{
                            paddingTop: "0.5rem",
                        }}
                        htmlFor="label-position"
                    >
                        Select Color
                    </label>
                    <Input
                        type="color"
                        style={{
                            width: "40px",
                            height: "30px",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                        }}
                        onChange={updateColor}
                    ></Input>
                </div>
                <div
                    style={{
                        width: "100%",
                        paddingTop: "0.5rem",
                    }}
                >
                    <label
                        style={{
                            paddingTop: "0.5rem",
                        }}
                        htmlFor="label-position"
                    >
                        Select Column of Values
                    </label>
                    <StyledSelect
                        id="label-position"
                        label="Select Position"
                        onChange={updateFields}
                    >
                        <Select.Item key="-1" value="">
                            Select
                        </Select.Item>
                        {framHeaders &&
                        Array.isArray(framHeaders) &&
                        framHeaders.length > 0 ? (
                            framHeaders.map((header, index) => (
                                <Select.Item value={index} key={index}>
                                    {header.name}
                                </Select.Item>
                            ))
                        ) : (
                            <Select.Item value="" disabled>
                                No Options Available
                            </Select.Item>
                        )}
                    </StyledSelect>
                </div>
                <div
                    style={{
                        width: "100%",
                        paddingTop: "0.5rem",
                    }}
                >
                    <label
                        style={{
                            paddingTop: "0.5rem",
                        }}
                        htmlFor="label-position"
                    >
                        Select Comparator
                    </label>
                    <StyledSelect
                        id="label-position"
                        label="Select Position"
                        name="comparator"
                        onChange={updateFields}
                    >
                        <Select.Item key="-1" value="">
                            Select
                        </Select.Item>
                        {comparator.map((label, index) => {
                            return (
                                <Select.Item value={label} key={index}>
                                    {label}
                                </Select.Item>
                            );
                        })}
                    </StyledSelect>
                </div>
                <br />
                <div
                    style={{
                        width: "100%",
                        paddingTop: "0.5rem",
                        display: "flex",
                        justifyContent: "space-around",
                    }}
                >
                    <Button
                        onClick={() => {
                            updateChart(selectedData);
                            applyRules();
                        }}
                    >
                        Execute
                    </Button>
                </div>
                <div
                    style={{
                        width: "100%",
                        paddingTop: "0.5rem",
                        display: "flex",
                        justifyContent: "space-around",
                    }}
                >
                    {" "}
                    Selected Header
                </div>
                <div
                    style={{
                        maxHeight: "150px",
                        overflowY: "auto",
                        border: "1px solid #ccc",
                        borderRadius: "5px",
                        padding: "5px",
                    }}
                >
                    {comparatorSection &&
                        frameValue.data.values.map((item) => (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    marginBottom: "5px",
                                }}
                            >
                                <input
                                    type="checkbox"
                                    style={{ marginRight: "10px" }}
                                    onChange={() => handleSelect(item)}
                                />
                                {/*need to fix this <label>{item[0] ?? ''}</label> */}
                                <label></label>
                            </div>
                        ))}
                    {!comparatorSection && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                marginBottom: "5px",
                            }}
                        >
                            <label>
                                {" "}
                                Max: 0{/*frameValue?.data?.values[0]*/}
                            </label>
                            <br />
                            <label>
                                {" "}
                                Min: 0
                                {/*need to fix this : frameValue?.data?.values[1]*/}
                            </label>
                            <br />
                            <TextField
                                variant={"outlined"}
                                label="Select Font Size"
                                type="number"
                                id="font-size"
                                name="labelSize"
                                //value={selectedData[0]}
                                onChange={handleSelect}
                            ></TextField>
                        </div>
                    )}
                </div>
            </div>
        );

        return (
            <CustomAccordianBlock
                accordianExpanded={accordianExpanded}
                accordianSummaryProps={<ExpandMoreIcon />}
                accordianSummary="Color By Value"
                accordianDetails={getAccordianDetails}
            />
        );
    },
);
