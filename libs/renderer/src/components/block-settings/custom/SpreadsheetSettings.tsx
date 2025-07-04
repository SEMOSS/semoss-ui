import React, { useState,useEffect } from 'react';
import { Autocomplete, TextField, Stack, Button } from '@semoss/ui';
import { useBlocks, useBlockSettings } from "../../../hooks";
import { observer } from "mobx-react-lite";
import { Controller, useForm } from 'react-hook-form';
import {
    Block,
    BlockDef,
} from "../../../store";
import { Paths, PathValue } from "../../../types";

interface SpreadsheetSettingsProps<D extends BlockDef = BlockDef> {
    id: string;
    paths: Paths<Block<D>["data"], 4>[];
    userId: Paths<Block<D>["data"], 4>;
    connections: Paths<Block<D>["data"], 4>[];
}

type SpreadsheetSettingsForm = {
    SPREADSHEET_CONNECTION: string;
    SPREADSHEET_ACTION: string;
};


export const SpreadsheetSettings = observer(
    <D extends BlockDef = BlockDef>({
            id,
            paths,
            userId,
            connections,
        }: SpreadsheetSettingsProps<D>) =>{
            const [connectionValue, setConnectionValue] = useState('');
            const [actionValue, setActionValue] = useState('');
            const [jiraData, setJiraData] = useState<any>(null);
            const { state } = useBlocks();
            const { data, setData } = useBlockSettings(id);

            const handleMouseDownChange = (event): void => {
                let dropDownOption;
                if(event && event.target && event.target.innerText === "Read Sheet") {
                    console.log("Read Sheet clicked");
                    dropDownOption = "showReadSheetForm";
                }
                else if(event && event.target && event.target.innerText === "Write Sheet") {
                    dropDownOption = "showWriteSheetForm";
                }
                else if(event && event.target && event.target.innerText === "Update Sheet") {
                    console.log("Update Sheet clicked");
                    dropDownOption = "showUpdateSheetForm";
                }
                else {
                    dropDownOption = "showDeleteSheetForm";
                }
                //const dropDownOption = event.target.innerText === "Create new ticket" ? "showCreateJiraForm" : "listAllTickets";
                paths.map(path=>{
                    const value = dropDownOption === path ? true : false;
                    console.log(`Setting path ${path} to ${value}`);
                    setData(path, value as PathValue<D["data"], typeof path>);
                })             
            };

            useEffect(()=>{
                async function fetchData() {
                    const pixelCommand = `META | GetGoogleProfile()`;
                    const response = await state.runSideEffect(pixelCommand);
                    const output1 = response.pixelReturn[0].output as { userId: string }[];
                    const userData = output1.map((item: any) => item.userName);
                    const userDataId = output1.map((item: any) => item.id);
                    const finalData = userData.map((userId, index) => ({ user: userId, id: userDataId[index] }));
                    setJiraData(finalData);
                }
                fetchData();
            },[])

            useEffect(() => {
                // Restore persisted values for dropdowns when the block is selected again
                const persistedConnectionValue  = data.sheetConnectionValue;
                const persistedActionValue = data.sheetActionValue;
                if (persistedConnectionValue) {
                    setConnectionValue(persistedConnectionValue as string);
                }
                if (persistedActionValue) {
                    setActionValue(persistedActionValue as string);
                }
            }, [data.sheetConnectionValue, data.sheetActionValue]);
            

            const { getValues, handleSubmit, control, watch,reset } = useForm<SpreadsheetSettingsForm>({
                        defaultValues: {
                            SPREADSHEET_CONNECTION: '',
                            SPREADSHEET_ACTION: '',
                        },
                    });

            return (
                <Stack direction="column" spacing={2}>
                    <Controller
                        name="SPREADSHEET_CONNECTION"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <Stack spacing={1}>
                                <div>Connections</div>
                                <Autocomplete
                                    options={jiraData || []}
                                    getOptionLabel={(option) => option['user']}
                                    multiple={false}
                                    value={field.value || connectionValue || null}
                                    onChange={(event, newValue) => {
                                        field.onChange(newValue);
                                        setData(userId, newValue['id'] as PathValue<D["data"], typeof userId>);
                                        setConnectionValue(newValue);
                                        setData(connections[0], newValue as PathValue<D["data"], typeof connections[0]>);
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Connections"
                                            fullWidth
                                        />
                                    )}
                                />
                            </Stack>
                        )}
                    />
                    <Controller
                        name="SPREADSHEET_ACTION"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <Stack spacing={1}>
                                <div>Actions</div>
                                <Autocomplete
                                    options={[{ value: "Read Sheet" }, { value: "Write Sheet" },{ value: "Update Sheet" },{ value: "Delete Sheet" }]}
                                    getOptionLabel={(option) => option['value']}
                                    multiple={false}
                                    value={field.value || actionValue || null}
                                    onChange={(event, newValue) => {
                                        field.onChange(newValue);
                                        handleMouseDownChange({ target: { innerText: newValue['value'] } });
                                        setActionValue(newValue as string);
                                        setData(connections[1], newValue as PathValue<D["data"], typeof connections[1]>);
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Actions"
                                            fullWidth
                                        />
                                    )}
                                />
                            </Stack>
                        )}
                    />
                </Stack>
            );

        }
);