import { useState, useEffect, useMemo, useRef } from "react";
import { observer } from "mobx-react-lite";
import styled from '@emotion/styled';
import { Autocomplete, TextField, Button } from "@mui/material";
import { useNotification } from "@semoss/ui";
import { useBlockSettings, useBlocksPixel, useFrameHeaders } from "../../../../../hooks";
import { BlockDef } from "../../../../../store";
import { EchartVisualizationBlockDef } from '../../VisualizationBlock';

// a styled section to maintain the basic styles for every element in the component
const StyledSubSection = styled("div")(() => ({
    display: "flex",
    justifyContent: "center",
    padding: "0.5rem",
    width: "100%",
}));

export const DendrogramFrameOperation = observer(
    <D extends BlockDef = BlockDef>({id}) => {
            const { data, setData } = useBlockSettings<EchartVisualizationBlockDef>(id);
            const notification = useNotification();
            const [frameField, setFrameField] = useState({dimensions:[], facet: ""});
            const [fieldsUpdated, setFieldsUpdated] = useState(false);
            // get all of the frames
            const getFrames = useBlocksPixel<string[]>("GetFrames();", {
                data: [],
            });
            const facetRef = useRef<HTMLDivElement>(null);
            // track the ref to debounce the input
            const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
            // options for the autocomplete
            const options = getFrames.status === "SUCCESS" ? getFrames.data : [];
            // using frameheaders hook to get the header details for the selected frame
            const frameHeaders = useFrameHeaders(data.frame?.name);      
            // fetch custom details about headers like alias, header, etc and assign to the variable for using it whenever required
            const columnsSelector = useMemo(() => {
                return frameHeaders.data.list.map((item) => {
                    return {
                        name: item.alias,
                        selector: item.header,
                        width: undefined,
                    };
                });
            }, [frameHeaders]);

            function updateFields(fieldName, fieldValue){
                if(fieldName === 'facet'){
                    let dimensionsList = frameField['dimensions'];
                    let facetExistsInDimensions = dimensionsList.some((item)=>item === fieldValue);
                    if(facetExistsInDimensions){
                        notification.add({
                            message: "Facet cannot be a dimension",
                            color:'error',
                        });
                        fieldValue = "";
                            setFrameField((prevField)=>{
                                return {
                                ...prevField,
                                [fieldName]: prevField[fieldName]
                                };
                            });
                    }
                    else{
                        setFrameField((prevField)=>{
                            return {
                            ...prevField,
                            [fieldName]: fieldValue
                            };
                        });
                    }
                }else{
                    setFrameField((prevField)=>{
                        return {
                        ...prevField,
                        [fieldName]: fieldValue
                        };
                    });
                }
                setFieldsUpdated(true);
            }
            useEffect(()=>{
                if(!fieldsUpdated) return;
                if(frameField['dimensions'].length){
                    let columnsSelectorToUpdate = [];
                    frameField['dimensions'].forEach((item)=>{
                     let name = columnsSelector.find((column) => column.selector === item);
                     if(name){
                        columnsSelectorToUpdate.push({
                            name: name.name,
                            selector: item,
                        });
                     }
                    });
                    setData('columns',columnsSelectorToUpdate);
                }
                else{
                    setData('columns', []);
                }
                if(frameField['facet']!=""){
                    let name = columnsSelector.find((column) => column.selector === frameField['facet']);
                    setData('facet.facetSelected', [{
                        name: name.name,
                        selector: frameField['facet'],
                        value: 0,
                    }]);
                    let columnsSelectorToUpdate = [];
                    frameField['dimensions'].forEach((item)=>{
                        let name = columnsSelector.find((column) => column.selector === item);
                        if(name){
                           columnsSelectorToUpdate.push({
                               name: name.name,
                               selector: item,
                           }); 
                        }
                    });
                    columnsSelectorToUpdate = [...columnsSelectorToUpdate, {
                        name: name.name,
                        selector: frameField['facet'],
                        value: 0,
                    }];
                    setData('columns',columnsSelectorToUpdate);
                }
                else{
                    setData('facet.facetSelected', []);
                }
            },[frameField]);

            useEffect(()=>{
                let dataColumns = data.columns;
                if(dataColumns?.length){
                    dataColumns = dataColumns.filter((item)=>item.selector !== data.facet['facetSelected']?.[0]?.selector);
                    let dimensions = dataColumns.map((item)=>{
                        return item.selector;
                    });
                    setFrameField((prevFrameField)=>{
                        return {
                            ...prevFrameField,
                            ['dimensions']: dimensions
                        }
                    });
                }
                if(data['facet']?.['facetSelected']?.length){
                    setFrameField((prevFrameField)=>{
                        return {
                            ...prevFrameField,
                            ['facet']: data.facet['facetSelected']?.[0]?.selector
                        }
                    });
                }
            },[]);
            const columnsOption = columnsSelector.map((item) => {
                return item.selector;
            })
    return (
        <>
                            <StyledSubSection>
                                <label htmlFor="Echart-Frame">Select a Frame</label>
                            </StyledSubSection>
                            <StyledSubSection>
                                <Autocomplete
                                    fullWidth
                                    id="Echart-Frame"
                                    multiple={false}
                                    disabled={getFrames.status !== "SUCCESS"}
                                    value={data.frame?.name}
                                    options={options}
                                    getOptionLabel={(option) => {
                                        return option;
                                    }}
                                    onChange={(_, value) => {
                                        // update the frame
                                        setData("frame.name", value);
                                    }}
                                    freeSolo={false}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            placeholder="Select frame"
                                            size="small"
                                            variant="outlined"
                                        />
                                    )}
                                />
                            </StyledSubSection>
                            <StyledSubSection>
                                <Autocomplete
                                    fullWidth
                                    id="Echart-Frame"
                                    multiple={true}
                                    disabled={getFrames.status !== "SUCCESS"}
                                    value={frameField.dimensions}
                                    options={columnsOption}
                                    getOptionLabel={(option) => {
                                        return option;
                                    }}
                                    onChange={(_, value) => {
                                        // update the fields in component
                                        updateFields('dimensions', value.length ? value : []);
                                    }}
                                    freeSolo={false}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            placeholder="Select Dimensions"
                                            size="small"
                                            variant="outlined"
                                        />
                                    )}
                                />
                            </StyledSubSection>
                            <StyledSubSection>
                                <Autocomplete
                                    fullWidth
                                    id="Echart-Facet"
                                    ref={facetRef}
                                    multiple={false}
                                    disabled={getFrames.status !== "SUCCESS"}
                                    value={frameField.facet}
                                    options={columnsOption}
                                    key={frameField.facet || "None"}
                                    blurOnSelect={true}
                                    getOptionLabel={(option) => {
                                        return option;
                                    }}
                                    onChange={(_, value) => {
                                        // update the fields in component
                                        updateFields('facet', value ? value : '');
                                    }}
                                    freeSolo={false}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            placeholder="Select facet"
                                            size="small"
                                            variant="outlined"
                                        />
                                    )}
                                />
                            </StyledSubSection>
        </>
    );
});