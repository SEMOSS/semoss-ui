import {
    Accordion,
    Button,
    MenuItem,
    Select,
    styled,
    TextField,
} from '@semoss/ui';
import CustomAccordianBlock from './CustomAccordianBlock';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useEffect, useState } from 'react';

const StyledSelect = styled(Select)(() => ({
    width: '100%',
}));

export const LineValueLabel = ({ updateChart, data }) => {
    const [LabelData, setLabelData] = useState({
        labelPosition: 'top',
        labelSize: 16,
        labelColor: '#000000',
        labelAngle: 0,
        labelFontFamily: '',
    });
    const fontWeights = [
        'bold',
        'normal',
        '100',
        '200',
        '300',
        '400',
        '500',
        '600',
        '700',
        '800',
        '900',
    ];
    const fontFamilys = [
        'Arail',
        'Arail Black',
        'Arail Narrow',
        'Calibri',
        'Century Gothic',
        'Comic Sans MS',
        'Courier New',
        'Garamond',
        'Georgia',
        'Helvetica',
        'Inter',
        'Open Sans',
        'Sans-Serif',
        'Segoe UI',
        'Times New Roman',
        'Verdana',
    ];
    const accordianExpanded = false;
    const Alignment = [
        'top',
        'bottom',
        'left',
        'right',
        'inside',
        'insideTop',
        'insideBottom',
        'insideLeft',
        'insideRight',
        'insideTopLeft',
        'insideTopRight',
        'insideBottomLeft',
        'insideBottomRight',
    ];
    const updateFields = (e) => {
        const { name, value } = e.target;
        setLabelData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };
    useEffect(() => {
        let option = data.option;
        setLabelData((prev) => ({
            ...prev,
            labelPosition: option['series'][0]['label'].position,
            labelAngle: option['series'][0]['label'].rotate,
            labelSize: option['series'][0]['label'].fontSize,
            labelFontFamily: option['series'][0]['label'].fontFamily,
            labelColor: option['series'][0]['label'].color,
        }));
    }, []);
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
                    style={{ paddingTop: '0.5rem' }}
                    htmlFor="label-position"
                >
                    Choose a possition for the Value Label
                </label>
                <StyledSelect
                    id="label-position"
                    label="Select Position"
                    name="labelPosition"
                    value={LabelData.labelPosition}
                    onChange={updateFields}
                >
                    <Select.Item key="-1" value="">
                        Select
                    </Select.Item>
                    {Alignment.map((label, index) => {
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
                    style={{ paddingTop: '0.5rem' }}
                    htmlFor="label-position"
                >
                    Rotate label by certain degree
                </label>
                <TextField
                    variant={'outlined'}
                    label="Rotate Label"
                    type="number"
                    id="rotate-label"
                    name="labelAngle"
                    onChange={updateFields}
                ></TextField>
            </div>
            <div
                style={{
                    width: '100%',
                    paddingTop: '0.5rem',
                }}
            >
                <label htmlFor="label-position">Select Font</label>
                <StyledSelect
                    id="label-position"
                    label="Select Font Family"
                    name="labelFontFamily"
                    value={LabelData.labelFontFamily}
                    onChange={updateFields}
                >
                    <Select.Item key="-1" value="">
                        Select
                    </Select.Item>
                    {fontFamilys.map((label, index) => {
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
                <label htmlFor="label-position">Select Font Size</label>
                <StyledSelect
                    id="label-position"
                    label="Select Font Size"
                    name="labelSize"
                    value={LabelData.labelSize}
                    onChange={updateFields}
                >
                    <Select.Item key="-1" value="">
                        Select
                    </Select.Item>
                    {fontWeights.map((label, index) => {
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
                <label style={{ paddingTop: '0.5rem' }} htmlFor="Dummy-input">
                    Font Color
                </label>
                <input
                    type="color"
                    name="labelColor"
                    value={LabelData.labelColor}
                    onChange={updateFields}
                    style={{
                        width: '40px',
                        height: '30px',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                    }}
                ></input>
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
                <Button onClick={() => updateChart(LabelData)}>Execute</Button>
            </div>
        </div>
    );

    return (
        <CustomAccordianBlock
            accordianExpanded={accordianExpanded}
            accordianSummaryProps={<ExpandMoreIcon />}
            accordianSummary="Customize Value Label"
            accordianDetails={getAccordianDetails}
        />
    );
};
