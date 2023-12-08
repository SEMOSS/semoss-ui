import { useEffect, CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';
import { useBlock, usePixel } from '@/hooks';
import { BlockComponent, BlockDef } from '@/stores';
import { Autocomplete, TextField } from '@mui/material';

//* UI Builder Queries
//? =================
//? Fetch & List ALL User Engines
//* (database_id || app_id)
//* MyEngines(engineTypes=["MODEL", "VECTOR"]);
//? =================
//?  Query LLM Engines
//* LLM(engine = "e4449559-bcff-4941-ae72-0e3f18e06660", command = "Sample Question", paramValues = [ {} ] );
// LLM(engine = "2c6de0ff-62e0-4dd0-8380-782ac4d40245", command = "What year did Tom Brady when the super bowl last", context = "response" ) ;
// {"numberOfTokensInPrompt":22,"response":"As of my knowledge cutoff in October 2021, Tom Brady won his most recent Super Bowl in 2021. He led the Tampa Bay Buccaneers to victory in Super Bowl LV, which took place on February 7, 2021.","numberOfTokensInResponse":49,"messageId":"4afe7514-1ae2-4cb5-8bb8-eb50f16291b0","roomId":"8a61692e-ec2b-4009-8761-45f18be94066"}
// {{superBowlResponse.response}}
//? =================
// TODO Store the File Upload URL in the Vector DB -- needs to be dynamic (LATER)
//? File Upload
//* CreateEmbeddingsFromDocuments(engine="377e2321-90b7-4856-b3e2-9f6c28663049",filePaths=["fileName1.pdf","fileName2.pdf"]);
//? =================
// TODO Vector DB Query
//* VectorDatabaseQuery(engine=["377e2321-90b7-4856-b3e2-9f6c28663049"],command=["What is AI? How to use LLMs?"],limit=[1]);
//* VectorDatabaseQuery(engine=["{{SelectBlock.value.selectedVectorDB}}"], command=["{{TextFieldBlock.value}}"], limit=[1]);
//? =================
//? Render Output in Markdown
//* {{vectorDBQ.data.content}} - {{vectorDBQ.data.0.content}} (newest)
//? =================
//? List All Current Docs in Vector DB -- (if needed later on)
//* ListDocumentsInVectorDatabase (engine = "377e2321-90b7-4856-b3e2-9f6c28663049");
//? =================
//* Dynamic Pixel Query
//* VectorDatabaseQuery(engine=["{{SelectBlock.value}}"], command=["{{FileUploadBlock.name.path}}"], limit=[1]);
//? =================
//* Basic Logic Query Steps
// TODO 1. Upload & Process Document
//* CreateEmbeddingsFromDocuments ( engine= "{{engines--5538.value}}", filePaths = [ "{{file-upload--5198.name.path}}" ]);
//? =================
// TODO 2. Query Vector DB
//* VectorDatabaseQuery ( engine = "ENGINE_ID", command = ["QUERY_STRING"], limit=[1]);
//VectorDatabaseQuery (engine = "{{engines--5538.value}}", command = "what is the first 5 chapters", limit=[5]);
//* VectorDatabaseQuery ( engine = "{{engines--8537.value}}], command = "{{text-area--5173.value}}", limit=[1]);
//? =================
// TODO 3. Render Output in Markdown
//* {{vectorDBQ.data.content}} or {{vectorDBQ.data.0.content}}
// {{embedUserFileQueryVectorDB.data.content}}

//? Dynamic Pixel Query
//? This made the Text Area Block Dynamic ( Description )
// LLM(engine = "2c6de0ff-62e0-4dd0-8380-782ac4d40245", command = "{{text-area--5173.value}}", context = "response" ) ;
// TODO Fully Dynamic Query with Engine and Text Area
//* LLM(engine = "{{engines--8537.value}}", command = "{{text-area--5173.value}}", context = "response" ) ;

//* Vector DB - Sample Pixel Queries
/* 
    ## Add document(s) that have been uploaded to the insight ##
CreateEmbeddingsFromDocuments (engine = "377e2321-90b7-4856-b3e2-9f6c28663049", filePaths = ["fileName1.pdf", "fileName2.pdf"]);

    ## Perform a nearest neighbor search on the embedded documents ##
VectorDatabaseQuery (engine = "377e2321-90b7-4856-b3e2-9f6c28663049", command = "Sample Search Statement", limit = 5);

    ## List all the documents the vector database currently comprises of ##
ListDocumentsInVectorDatabase (engine = "377e2321-90b7-4856-b3e2-9f6c28663049");
*/

/* 
? =================
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

export interface EnginesBlockDef extends BlockDef<'engines'> {
    widget: 'engines';
    data: {
        style: CSSProperties;
        label: string;
        options: { label: string; value: string; database?: string }[];
        value: string;
    };
}

export const EnginesBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData } = useBlock<EnginesBlockDef>(id);

    const { data: enginesData, status: enginesStatus } = usePixel<EngineData[]>(
        `MyEngines(engineTypes=["MODEL", "VECTOR"]);`,
    );

    //? =================
    //* Fetch users engines (LLM & Vector DBs)
    useEffect(() => {
        if (enginesStatus === 'SUCCESS' && Array.isArray(enginesData)) {
            const options = enginesData.map((engine) => ({
                label: engine.app_name,
                value: engine.app_id,
                database: engine.database_id,
            }));
            setData('options', options);
            console.log('Render Users Engines: ', options);

            //? Checking that the current value exists in the new options
            if (!options.some((option) => option.database === data.value)) {
                setData('value', options.length > 0 ? options[0].database : '');
            }
        } else if (enginesStatus === 'ERROR') {
            console.error('Error fetching engines data');
        }
    }, [enginesData, enginesStatus, setData, data.value]);
    //? =================

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
            sx={{
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
