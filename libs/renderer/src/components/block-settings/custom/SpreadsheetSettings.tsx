import React, { useState,useEffect } from 'react';
import { Autocomplete, TextField, Stack} from '@semoss/ui';
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


function SpreadsheetSettingsComponent<D extends BlockDef = BlockDef>({
            id,
            paths,
            userId,
            connections,
        }: SpreadsheetSettingsProps<D>){
            const [connectionValue, setConnectionValue] = useState('');
            const [actionValue, setActionValue] = useState('');
            const [jiraData, setJiraData] = useState<any>(null);
            const { state } = useBlocks();
            const { data, setData } = useBlockSettings(id);
            const handleMouseDownChange = (event): void => {
                let dropDownOption;
                if(event && event.target && event.target.innerText === "Read Sheet") {
                    dropDownOption = "showReadSheetForm";
                }
                else if(event && event.target && event.target.innerText === "Create Sheet") {
                    dropDownOption = "showCreateSheetForm";
                }
                else if(event && event.target && event.target.innerText === "Update Sheet") {
                    dropDownOption = "showUpdateSheetForm";
                }
                else if(event && event.target && event.target.innerText === "Delete Sheet") { 
                    dropDownOption = "showDeleteSheetForm";
                }
                else{
                    dropDownOption = "showListedSheets";
                }
                paths.map(path=>{
                    const value = dropDownOption === path ? true : false;
                    setData(path, value as PathValue<D["data"], typeof path>);
                })             
            };


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
                        name="SPREADSHEET_ACTION"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <Stack spacing={1}>
                                <div>Actions</div>
                                <Autocomplete
                                    options={[{ value: "Read Sheet" }, { value: "Create Sheet" },{ value: "Update Sheet" },{ value: "Delete Sheet" },{ value: "List all Sheets" }]}
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

        };
export const SpreadsheetSettings = observer(SpreadsheetSettingsComponent);