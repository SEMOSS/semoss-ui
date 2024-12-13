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

export const CustomizeTitle = ({ updateChart, data }) => {
    const [titleData, setTitleData] = useState({
        titleName: '',
        alignment: 'center',
        titleSize: 16,
        titleColor: '#000000',
        titleFontWeight: 'normal',
        titleFontFamily: '',
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
    const Alignment = ['left', 'right', 'center'];
    const updateFields = (e) => {
        const { name, value } = e.target;
        setTitleData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };
    useEffect(() => {
        let option = data.option;
        setTitleData((prev) => ({
            ...prev,
            titleName: option['title'].text,
            titleFontWeight: option['title']['textStyle'].fontWeight,
            titleSize: option['title']['textStyle'].fontSize,
            titleFontFamily: option['title']['textStyle'].fontFamily,
            titleColor: option['title']['textStyle'].color,
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
                    Enter Chart Title
                </label>
                <TextField
                    variant={'outlined'}
                    id="font-weight"
                    label="Enter Chart Title"
                    name="titleName"
                    value={titleData.titleName}
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
                    style={{ paddingTop: '0.5rem' }}
                    htmlFor="label-position"
                >
                    Choose a alignment for the title
                </label>
                <StyledSelect
                    id="label-position"
                    label="Select Position"
                    name="alignment"
                    value={titleData.alignment}
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
                    Chart Title Size
                </label>
                <TextField
                    variant={'outlined'}
                    id="font-weight"
                    label="Enter Chart Title Size"
                    name="titleSize"
                    value={titleData.titleSize}
                    onChange={updateFields}
                ></TextField>
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
                    name="titleColor"
                    value={titleData.titleColor}
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
            <div
                style={{
                    width: '100%',
                    paddingTop: '0.5rem',
                }}
            >
                <label htmlFor="label-position">Select Font Weight</label>
                <StyledSelect
                    id="label-position"
                    label="Select Font Color"
                    name="titleFontWeight"
                    value={titleData.titleFontWeight}
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
                <label htmlFor="label-position">Select Font Family</label>
                <StyledSelect
                    id="label-position"
                    label="Select Font Family"
                    name="titleFontFamily"
                    value={titleData.titleFontFamily}
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
            <br />
            <div
                style={{
                    width: '100%',
                    paddingTop: '0.5rem',
                    display: 'flex',
                    justifyContent: 'space-around',
                }}
            >
                <Button onClick={() => updateChart(titleData)}>Execute</Button>
            </div>
        </div>
    );

    return (
        <CustomAccordianBlock
            accordianExpanded={accordianExpanded}
            accordianSummaryProps={<ExpandMoreIcon />}
            accordianSummary="Customize Title"
            accordianDetails={getAccordianDetails}
        />
    );
};
