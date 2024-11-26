import {
    Accordion,
    Button,
    MenuItem,
    Select,
    styled,
    TextField,
} from '@semoss/ui';
import CustomAccordianBlock from './CustomAccordianBlock';
import {
    AccordionActions,
    AccordionDetails,
    AccordionSummary,
    Input,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useEffect, useState } from 'react';

const StyledSelect = styled(Select)(() => ({
    width: '100%',
}));

export const CustomizeValueLabels = ({ updateChart, option }) => {
    const [fieldData, setFieldData] = useState({
        labelPosition: '',
        labelSize: '15',
        labelLineLength: '15',
    });
    useEffect(() => {
        let pieindex = option['series']?.findIndex((opt) => opt.type === 'pie');
        setFieldData((prev) => ({
            ...prev,
            labelPosition: option['series'][pieindex]['label'].position,
            labelSize: option['series'][pieindex]['label'].fontSize,
            labelLineLength: option['series'][pieindex]['labelLine'].length,
        }));
    }, [option]);
    const accordianExpanded = false;
    const labelPositionValues = ['inside', 'outside'];
    const updateFields = (e) => {
        const { name, value } = e.target;
        setFieldData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const getAccordianDetails = (
        <div
            style={{
                display: 'block',
                border: '1px solid gray',
                padding: '0.5rem',
                width: '100%',
            }}
        >
            <div
                style={{
                    width: '100%',
                    paddingTop: '0.5rem',
                }}
            >
                <label
                    style={{
                        paddingTop: '0.5rem',
                    }}
                    htmlFor="label-position"
                >
                    Choose a position for the label
                </label>
                <StyledSelect
                    id="label-position"
                    label="Select Position"
                    name="labelPosition"
                    value={fieldData.labelPosition}
                    onChange={updateFields}
                >
                    <Select.Item key="-1" value="">
                        Select
                    </Select.Item>
                    {labelPositionValues.map((label, index) => {
                        return (
                            <Select.Item value={label} key={index}>
                                {label}
                            </Select.Item>
                        );
                    })}
                </StyledSelect>
            </div>
            <div
                style={{
                    width: '100%',
                    paddingTop: '0.5rem',
                }}
            >
                <label
                    style={{
                        paddingTop: '0.5rem',
                    }}
                    htmlFor="font-size"
                >
                    Select Font Size
                </label>
                <TextField
                    variant={'outlined'}
                    label="Select Font Size"
                    type="number"
                    id="font-size"
                    name="labelSize"
                    value={fieldData.labelSize}
                    onChange={updateFields}
                ></TextField>
            </div>
            <div
                style={{
                    width: '100%',
                    paddingTop: '0.5rem',
                }}
            >
                <label
                    style={{
                        paddingTop: '0.5rem',
                    }}
                    htmlFor="font-weight"
                >
                    Select label line length
                </label>
                <TextField
                    variant={'outlined'}
                    id="font-weight"
                    label="Select The Label Line Length"
                    name="labelLineLength"
                    value={fieldData.labelLineLength}
                    onChange={updateFields}
                ></TextField>
            </div>
            <br />
            <div
                style={{
                    width: '100%',
                    paddingTop: '0.5rem',
                    display: 'flex',
                    justifyContent: 'space-around',
                }}
            >
                <Button onClick={() => updateChart(fieldData)}>Execute</Button>
            </div>
        </div>
    );

    return (
        <CustomAccordianBlock
            accordianExpanded={accordianExpanded}
            accordianSummaryProps={<ExpandMoreIcon />}
            accordianSummary="Customize Label Values"
            accordianDetails={getAccordianDetails}
        />
    );
};
