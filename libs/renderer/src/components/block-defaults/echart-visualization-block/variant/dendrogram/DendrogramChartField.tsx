import {useState, useEffect, useMemo} from 'react';
import {observer} from 'mobx-react-lite';
import { computed } from 'mobx';
import {IconButton, styled} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { MenuItem, Select } from '@semoss/ui';
import {useBlock, useBlocks, useBlockSettings} from '../../../../../hooks';
import { BlockDef } from '../../../../../store';
import { EchartVisualizationBlockDef } from '../../VisualizationBlock';
import { getValueByPath } from '@/utility';

const StyledMainContainer = styled('div')(({theme})=>({
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        backgroundColor: theme.palette.background.paper,
}));

const StyledSection = styled('div')<{justifyContent: string;}>(({theme, justifyContent})=>({
        display: 'flex',
        justifyContent: justifyContent ?? 'center',
        width:'100%'
}))

export const DendrogramChartField = observer(
    <D extends BlockDef = BlockDef>({id, facetListData})=>{
    const { data, setData } = useBlockSettings<EchartVisualizationBlockDef>(id);
    const [dropDownValue, setDropDownValue] = useState("");
    const [facetList, setFacetList] = useState<string[]>([]);
    const [navigationDetails, setNavigationDetails] = useState({prev:'',next:''});
    const [dendrogramFacetUpdated, setDendrogramFacetUpdated] = useState(false);
    const computedValue = useMemo(() => {
        return computed(() => {
            if (!data) {
                return "";
            }
            const v = getValueByPath(data, "facet.facetSelected");
            if (typeof v === "undefined") {
                return "";
            } else if (typeof v === "string") {
                return v;
            }
            return JSON.stringify(v, null, 2);
        });
    }, [data, "facet.facetSelected"]).get();
    useEffect(()=>{
            setFacetList((prevList: string[])=>facetListData.map((item)=> item instanceof Array ? item[0] : item));
            setDendrogramFacetUpdated(false);
    },[facetListData]);
    useEffect(()=>{
        if(dendrogramFacetUpdated) return;
        try{
            let facetSelected = JSON.parse(computedValue);
            if(facetSelected.length > 0){
                if(facetSelected[0]!=undefined && facetSelected[0]?.value !== undefined && facetSelected[0]?.value !== dropDownValue){
                    findAndUpdateNavigationDetails(facetSelected[0].value);
                    setDropDownValue(facetSelected[0].value);
                }
            }
            else{
                setDropDownValue('');
                setNavigationDetails({prev: null, next: null});
            }
        }
        catch(e){
            console.log(e);
        }
    },[computedValue, facetListData]);

    function findAndUpdateNavigationDetails(value){
        let index = facetList.findIndex((item)=>isNaN(parseInt(value)) ? item == value : parseInt(item) == parseInt(value));
        if(index !== -1){
            let prev = index - 1 >= 0 ? facetList[index - 1] : null;
            let next = index + 1 < facetList.length ? facetList[index + 1] : null;
            setNavigationDetails({prev: prev, next: next});
        }
        else{
            setNavigationDetails({prev: null, next: null});
        }
    }

    function updateField(e){
        setDendrogramFacetUpdated(true);
        let newvalue = (e.target.value instanceof Array) ? e.target.value[0] : e.target.value;
        if(e.target.value == '' || e.target.value == null) return;
        let prevValue = dropDownValue;
        try{
        let facetData = JSON.parse(computedValue);
        facetData = [
            {
                ...facetData[0],
                value: newvalue,
            }
        ];
        setData('facet.facetSelected', facetData);
        setDropDownValue((prevValue)=>(e.target.value instanceof Array) ? e.target.value[0] : e.target.value);
        findAndUpdateNavigationDetails((e.target.value instanceof Array) ? e.target.value[0] : e.target.value);
        }
        catch(e){
            setDropDownValue(prevValue);
            console.log(e);
        }
    }
    console.log(facetList, 'facetList');
    return (
        <StyledMainContainer>
            <StyledSection justifyContent='start'>
                <IconButton onClick={(e)=>updateField({target: {value: navigationDetails.prev}})} size='small'><ChevronLeftIcon/>{navigationDetails.prev}</IconButton>
            </StyledSection>
            <StyledSection justifyContent='center'>
                <Select
                name='Select Field'
                fullWidth
                value={dropDownValue}
                onChange={(e)=>updateField(e)}
                >
                    {facetList.length > 0 && facetList.map((item, index) => (
                        <MenuItem key={index} value={item.toString()}>
                            {item}
                        </MenuItem>
                    ))}
                </Select>
            </StyledSection>
            <StyledSection justifyContent='end'>
            <IconButton onClick={(e)=>updateField({target: {value: navigationDetails.next}})} size='small'>{navigationDetails.next}<ChevronRightIcon/></IconButton>
            </StyledSection>
        </StyledMainContainer>
    )
});