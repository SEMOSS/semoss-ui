import React, { useState,useEffect } from 'react';
import { Select, MenuItem, styled, Button } from '@semoss/ui';
import { useBlocks, useBlockSettings } from "../../../hooks";
import { observer } from "mobx-react-lite";
import {
    Block,
    BlockDef,
} from "../../../store";
import { Paths, PathValue } from "../../../types";

const StyledDropdownContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  width: '100%',
});

const StyledDropdown = styled('div')({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '8px',
});

const StyledSelect = styled(Select)({
  width: '200px',
});

interface JiraSettingsProps<D extends BlockDef = BlockDef> {
    id: string;
    paths: Paths<Block<D>["data"], 4>[];
    userId: Paths<Block<D>["data"], 4>;
}

export const JiraSettings = observer(
    <D extends BlockDef = BlockDef>({
            id,
            paths,
            userId,
        }: JiraSettingsProps<D>) =>{
            const [dropdown1Value, setDropdown1Value] = useState<string>('');
            const [dropdown2Value, setDropdown2Value] = useState<string>('');
            const [jiraData, setJiraData] = useState<any>(null);
            const { state } = useBlocks();
            const { data, setData } = useBlockSettings(id);

            const handleMouseDownChange = (event): void => {
                console.log("Mouse down on dropdown2, event:",event.target.innerText);
                console.log("Dropdown2 value:", dropdown2Value);
                const dropDownOption = event.target.innerText === "Create new ticket" ? "showCreateJiraForm" : "listAllTickets";
                paths.map(path=>{
                    const value = dropDownOption === path ? true : false;
                    console.log(`Setting path ${path} to ${value}`);
                    setData(path, value as PathValue<D["data"], typeof path>);
                })             
            };

            useEffect(()=>{
                async function fetchData() {
                    const pixelCommand = `META | JiraGet()`;
                    const response = await state.runSideEffect(pixelCommand);
                    const output1 = response.pixelReturn[0].output as { userId: string }[];
                    const userData = output1.map((item: any) => item.userId);
                    const userDataId = output1.map((item: any) => item.primaryId);
                    const finalData = userData.map((userId, index) => ({ user: userId, id: userDataId[index] }));
                    setJiraData(finalData);
                }
                fetchData();
            },[])

            return (
                <StyledDropdownContainer>
                    <div>Connections</div>  
                    <StyledDropdown>
                        <StyledSelect
                        id="dropdown1"
                        value={dropdown1Value}
                        label={"Connections"}
                        onChange={(event) => {setDropdown1Value(event.target.value as string);setData(userId, event.target.value['id'] as PathValue<D["data"], typeof userId>)}}
                        >
                        {jiraData && jiraData.map((data: string) => (
                            <MenuItem key={data['id']} value={data}>{data['user']}</MenuItem>
                        ))}
                        </StyledSelect>
                    </StyledDropdown>
                    
                    <div>Actions</div>
                    <StyledDropdown>
                        <StyledSelect
                        id="dropdown2"
                        value={dropdown2Value}
                        label={"Actions"}
                        onChange={(event) => setDropdown2Value(event.target.value as string)}
                        >
                        <MenuItem value="List all tickets" onClick={(event)=>handleMouseDownChange(event)}>List all tickets</MenuItem>
                        <MenuItem value="Create new jira" onClick={(event)=>handleMouseDownChange(event)}>Create new ticket</MenuItem>
                        </StyledSelect>
                    </StyledDropdown>              
                    </StyledDropdownContainer>
            );

        }
);

