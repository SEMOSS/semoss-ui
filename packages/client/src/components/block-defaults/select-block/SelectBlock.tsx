import { useEffect, CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';
import { useBlock, usePixel } from '@/hooks';
import { BlockComponent, BlockDef } from '@/stores';
import { Autocomplete, TextField } from '@mui/material';

//* UI Builder Queries
//? =================
// Fetch & List ALL User Engines
//* (database_id || app_id && app_name)
//* MyEngines(engineTypes=["MODEL", "VECTOR"]);
//? =================
//  Query LLM Engines
//* LLM(engine = "2c6de0ff-62e0-4dd0-8380-782ac4d40245", command = "Sample Question", paramValues = [ {} ] );
//* LLM(engine = "e4449559-bcff-4941-ae72-0e3f18e06660", command = "Sample Question", paramValues = [ {} ] );
//? =================
// TODO Store the File Upload URL in the Vector DB -- needs to be dynamic (LATER)
//* CreateEmbeddingsFromDocuments (engine = "377e2321-90b7-4856-b3e2-9f6c28663049", filePaths = ["fileName1.pdf", "fileName2.pdf"]);
//? =================
// TODO Dynamic Query (LATER)
//* VectorDatabaseQuery(engine=["{{SelectBlock.value.selectedVectorDB}}"], command=["{{TextFieldBlock.value}}"], limit=[1]);
//? =================
// Static Query (now)
//* VectorDatabaseQuery(engine=["377e2321-90b7-4856-b3e2-9f6c28663049"],command=["What is AI? How to use LLMs?"],limit=[1]);
//? =================
// List All Current Docs in Vector DB -- (if needed later on)
//* ListDocumentsInVectorDatabase (engine = "377e2321-90b7-4856-b3e2-9f6c28663049");
//? =================
// TODO Update MarkdownBlock w/ Response/Content/Output
//* {{VectorDatabaseQuery.pixelReturn[0].output[0].content}}
//? =================

//* MyEngines(engineTypes=["MODEL", "VECTOR"]);
//? =================
//* CreateEmbeddingsFromDocuments(engine="377e2321-90b7-4856-b3e2-9f6c28663049",filePaths=["fileName1.pdf","fileName2.pdf"]);
//? =================
//* VectorDatabaseQuery(engine=["377e2321-90b7-4856-b3e2-9f6c28663049"],command=["What is AI? How to use LLMs?"],limit=[1]);
//* VectorDatabaseQuery(engine=["{{SelectBlock.value.selectedVectorDB}}"],command=["{{TextFieldBlock.value}}"],limit=[1]);
//? =================
//* Before Pulling Dev
//* {{vectorDBOutput.data.0.content}}
//* {{vectorDBQ.data.0.content}}
//* After Pulling Dev
//* {{vectorDBQ.pixelReturn.0.output.0.content}}
//* {{vectorDBQ.pixelReturn[0].output[0].content}}
//? =================
// if you have to use
//* ListDocumentsInVectorDatabase (engine = "377e2321-90b7-4856-b3e2-9f6c28663049");
//* {{ListDocumentsInVectorDatabase.pixelReturn[0].output[0].fileName}};

/* 
? =================
//* VectorDatabaseQuery(engine=["377e2321-90b7-4856-b3e2-9f6c28663049"],command=["What is AI? How to use LLMs?"],limit=[1]);
? JSON Response/Content/Output from the VectorDatabaseQuery pixel:
* [
*   {
*       "Score": 0.8900909423828125, 
*       "doc_index": "1420-deloitte-independence_208_text", 
*       "content": "", 
*       "tokens": , 
*       "url": "",
*    }
* ]
? =================
*/

//* Structure the data fetched from pixel script
export interface EngineData {
    database_type: string;
    database_id: string;
    app_name: string;
    app_type: string;
    app_id: string;
    app_sub_type: string;
}

export interface SelectBlockDef extends BlockDef<'select'> {
    widget: 'select';
    data: {
        style: CSSProperties;
        label: string;
        options: { label: string; value: string; database?: string }[];
        value: string;
    };
}

export const SelectBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData } = useBlock<SelectBlockDef>(id);

    const { data: enginesData, status: enginesStatus } = usePixel<EngineData[]>(
        `MyEngines(engineTypes=["MODEL", "VECTOR"]);`,
    );

    //* Fetch users engines (LLM & Vector DBs)
    useEffect(() => {
        if (enginesStatus === 'SUCCESS' && Array.isArray(enginesData)) {
            const options = enginesData.map((engine) => ({
                label: engine.app_name,
                value: engine.app_id,
                database: engine.database_id,
            }));
            setData('options', options);
            // console.log('enginesData: ', enginesData);

            //? Checking that the current value exists in the new options
            if (!options.some((option) => option.database === data.value)) {
                setData('value', options.length > 0 ? options[0].database : '');
            }
        } else if (enginesStatus === 'ERROR') {
            console.error('Error fetching engines data');
        }
    }, [enginesData, enginesStatus, setData, data.value]);

    const handleChange = (_, newValue) => {
        setData('value', newValue?.database || '');
    };

    const isOptionEqualToValue = (option, value) =>
        option.database === value?.database;

    const selectedOption =
        data.options.find((option) => option.database === data.value) || null;

    return (
        <Autocomplete
            disableClearable
            options={data.options}
            value={selectedOption}
            getOptionLabel={(option) => option.label || ''}
            isOptionEqualToValue={isOptionEqualToValue}
            onChange={handleChange}
            style={{
                cursor: 'pointer',
                width: '100%',
                ...data.style,
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={data.label || 'Select Option'}
                    variant="outlined"
                />
            )}
            {...attrs}
        />
    );
});
