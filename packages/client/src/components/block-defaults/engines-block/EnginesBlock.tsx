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
// LLM(engine = "{{engines--8537.value}}", command = "{{text-area--5173.value}}", context = "response" ) ;
// {"numberOfTokensInPrompt":34,"response":"Business chemistry is a concept developed by Deloitte that helps individuals and teams understand their individual working styles and preferences, as well as how these styles interact with others. It is based on four primary business preferences, namely Pioneer, Driver, Integrator, and Guardian. Each preference represents different strengths, communication styles, and ways of working.\n\nTo understand how business chemistry works, you first need to determine your own and your team members' preferences. You can do this through personality quizzes or assessments specifically designed for business chemistry. Once you understand the preferences within your team, you can use this knowledge to improve team performance in several ways:\n\n1. Enhance communication: By understanding the different communication and decision-making styles of team members, you can tailor your communicat=ion approach to be more effective and impactful. For example, some team members may prefer succinct and direct communication, while others may appreciate a more detailed and collaborative approach.\n\n2. Build effective teams: By consciously bringing together individuals with different business chemistry preferences, you can create diverse teams that can complement each other's strengths and weaknesses. This can lead to more innovative solutions, better problem-solving, and enhanced team dynamics.\n\n3. Manage conflict: Conflict can arise when people with different working styles and preferences come together. By understanding each team member's preferred approach to problem-solving and conflict resolution, you can navigate conflicts more effectively and reach mutually beneficial resolutions.\n\n4. Adapt leadership styles: Effective leaders understand and adapt their leadership styles to suit the preferences of their team members. By recognizing the different strengths and preferences within your team, you can adjust your leadership approach to provide the necessary support and motivation for each individual.\n\n5. Improve team dynamics: Business chemistry can help team members appreciate and respect each other's differences, fostering a more inclusive and collaborative work environment. This can lead to increased trust, better teamwork, and ultimately improved performance.\n\nRemember that business chemistry is not a definitive categorization but rather a tool to promote understanding and collaboration. It should be used as a starting point for discussions and ongoing efforts to improve team dynamics and performance.","numberOfTokensInResponse":411,"messageId":"5f70faf3-fa0a-4eb3-bed4-fccd2edbe3eb","roomId":"6ba98d57-02d7-4bad-989c-af19a9797d81"}
//* {{testUserInput.response}}

// TODO: Have the response based on the File Uploaded by the User
//? =================
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
//* VectorDatabaseQuery (engine = "{{engines--5538.value}}", command = "what is the first 5 chapters", limit=[5]);
//* VectorDatabaseQuery ( engine = "{{engines--8537.value}}], command = "{{text-area--5173.value}}", limit=[1]);
//? =================
// TODO 3. Render Output in Markdown
//* {{vectorDBQ.data.content}} or {{vectorDBQ.data.0.content}}
// {{embedUserFileQueryVectorDB.data.content}}

//? Dynamic Pixel Query
//? This made the Text Area Block Dynamic ( Description )
// LLM(engine = "2c6de0ff-62e0-4dd0-8380-782ac4d40245", command = "{{text-area--5173.value}}", context = "response" ) ;
// TODO Fully Dynamic Query with Engine and Text Area
// I am querying the LLM Engine with the Text Area Block from the Users Input, this is directly rendering within the Markdown block, but I need the next 1-2 queries to be dynamic as well. For the file upload block, read the file and then query the Vector DB with the file content. and also the engines based on what is selected in the Engines Block and at the time of pressing the submit button
//* LLM(engine = "{{engines--8537.value}}", command = "{{text-area--5173.value}}", context = "response", ) ;

// After the LLM Query, what is the next step based on my previous comment?
// TODO Query Vector DB with the File Content
// write out the proper query for the Vector DB Query based on the file content useing the VectorDatabaseQuery pixel or the CreateEmbeddingsFromDocuments pixel?
// Generate next pixel query based on the file content, write out the entire line for the pixel query on the next line
// VectorDatabaseQuery ( engine = "{{engines--8537.value}}", command = "{{text-area--5173.value}}", limit=[1]);
// TODO Render THE NEXT QUERY AFTER THE LLM CALL... look at it with fresh eyes!
//? ================= Stopped on Friday -- TAKING BREAK =================
// LLM(engine = "{{engines--8537.value}}", command = "{{text-area--5173.value}}", context = "response" );
// LLM(engine = "{{engines--8537.value}}", command = "{{text-area--5173.value}}", context = "response" );

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
