import { useMemo } from 'react';

import {
    DesignerStore,
    Block,
    Query,
    StateStoreImplementation,
    Registry,
} from '@/stores';
import { Designer } from '@/components/designer';
import { Blocks, Renderer } from '@/components/blocks';
import { DefaultBlocks } from '@/components/block-defaults';
import { RunPixel } from '@/types';

interface BlocksBuilderProps {
    /** Injected callback to execute pixel */
    run: RunPixel;

    /** Queries rendered in the insight */
    queries: Record<string, Query>;

    /** Blocks rendered in the insight */
    blocks: Record<string, Block>;

    /** Blocks rendered in the insight */
    customBlocks: Registry;

    /** Editor mode */
    editMode: boolean;
}

export const BlocksBuilder = ({
    run,
    blocks,
    queries,
    customBlocks,
    editMode,
}: BlocksBuilderProps) => {
    // create a new blocks store
    const state = useMemo(() => {
        return new StateStoreImplementation(
            {
                blocks: {
                    'page-1': {
                        id: 'page-1',
                        widget: 'page',
                        parent: null,
                        data: {
                            style: {
                                fontFamily: 'roboto',
                            },
                        },
                        listeners: {},
                        slots: {
                            content: {
                                name: 'content',
                                children: [
                                    'select--2600',
                                    'select--7167',
                                    'button--5010',
                                    'text--4132',
                                    'markdown--3068',
                                ],
                            },
                        },
                    },
                    'select--2600': {
                        id: 'select--2600',
                        widget: 'select',
                        parent: {
                            id: 'page-1',
                            slot: 'content',
                        },
                        data: {
                            style: {},
                            label: 'Engine',
                            options: [
                                {
                                    label: 'GPT3-Turbo',
                                    value: '2c6de0ff-62e0-4dd0-8380-782ac4d40245',
                                },
                                {
                                    label: 'Sample',
                                    value: '377e2321-90b7-4856-b3e2-9f6c28663049',
                                },
                                {
                                    label: 'TextEmbeddings BAAI-Large-En-V1.5',
                                    value: 'e4449559-bcff-4941-ae72-0e3f18e06660',
                                },
                            ],
                            value: 'e4449559-bcff-4941-ae72-0e3f18e06660',
                        },
                        listeners: {
                            onChange: [],
                        },
                        slots: {},
                    },
                    'select--7167': {
                        id: 'select--7167',
                        widget: 'select',
                        parent: {
                            id: 'page-1',
                            slot: 'content',
                        },
                        data: {
                            style: {},
                            label: 'Engine',
                            options: [
                                {
                                    label: 'GPT3-Turbo',
                                    value: '2c6de0ff-62e0-4dd0-8380-782ac4d40245',
                                },
                                {
                                    label: 'Sample',
                                    value: '377e2321-90b7-4856-b3e2-9f6c28663049',
                                },
                                {
                                    label: 'TextEmbeddings BAAI-Large-En-V1.5',
                                    value: 'e4449559-bcff-4941-ae72-0e3f18e06660',
                                },
                            ],
                            value: '377e2321-90b7-4856-b3e2-9f6c28663049',
                        },
                        listeners: {
                            onChange: [],
                        },
                        slots: {},
                    },
                    'button--5010': {
                        id: 'button--5010',
                        widget: 'button',
                        parent: {
                            id: 'page-1',
                            slot: 'content',
                        },
                        data: {
                            style: {
                                width: '100%',
                                height: 'auto',
                                border: '4px solid pink',
                                fontSize: '1rem',
                                backgroundColor: 'oldlace',
                                color: 'navy',
                            },
                            label: 'Ask',
                        },
                        listeners: {
                            onClick: [
                                // {
                                //     message: 'RUN_QUERY',
                                //     payload: {
                                //         id: 'vectorDBOutput',
                                //     },
                                // },
                            ],
                        },
                        slots: {},
                    },
                    'text--4132': {
                        id: 'text--4132',
                        widget: 'text',
                        parent: {
                            id: 'page-1',
                            slot: 'content',
                        },
                        data: {
                            style: {},
                            text: 'Response:',
                        },
                        listeners: {},
                        slots: {
                            test: {
                                name: 'test',
                                children: [],
                            },
                        },
                    },
                    'markdown--3068': {
                        id: 'markdown--3068',
                        widget: 'markdown',
                        parent: {
                            id: 'page-1',
                            slot: 'content',
                        },
                        data: {
                            style: {
                                display: 'block',
                                outline: '100%',
                                width: '100%',
                                height: 'fit-content',
                                padding: '0.5rem 2rem',
                                color: 'navy',
                                backgroundColor: 'oldlace',
                                border: '4px solid pink',
                            },
                            markdown: '{{vectorDBOutput.data.0.content}}',
                        },
                        listeners: {},
                        slots: {
                            test: {
                                name: 'test',
                                children: [],
                            },
                        },
                    },
                },
                queries: {
                    vectorDBOutput: {
                        id: 'vectorDBOutput',
                        isInitialized: true,
                        isLoading: false,
                        error: null,
                        query: 'VectorDatabaseQuery ( engine = [ "377e2321-90b7-4856-b3e2-9f6c28663049" ] , command = [ "What is AI? How to use LLMs?" ] , limit = [ 1 ] ) ;',
                        data: [
                            {
                                Score: 0.8921626806259155,
                                doc_index:
                                    '1420-deloitte-independence_208_text',
                                content:
                                    'Appendix N includes guidance on relevant communication topics, suggested communication cycles and information on where to access templates to assist with communications. Long Association with Restricted Entities 9.56 A Member Firm shall implement a process for monitoring the rotation requirements of its audit Partners. Identification and Monitoring of Associated Entities and Member Firm Investments 9.57 A Member Firm shall implement a process for identifying entities that are Associated Entities in accordance with Appendix M and monitoring their compliance with this Section 1420. 9.58 With the exception of Financial Interests that are passive in nature (e.g., investments held in a Member Firm pension plan), Member Firms shall analyze whether or not a Member Firm investment creates an Associated Entity and document the conclusion. Outside Investors in Member Firms 9.59 Where an Associated Entity is not wholly owned by a Member Firm, the process referred to in paragraph 9.57 shall also include the identification and monitoring of any outside investors that are not Member Firms or current Partners of a Member Firm to ensure the relationship is permissible under paragraphs 2.84 and 2.85 of this Section 1420. Member Firm Transactions 9.60 When acquiring another entity (e.g., through a stock transaction, asset purchase, talent hire, etc.), a Member Firm shall conduct due diligence to ensure all interests and relationships of the target are identified and assessed under this Section 1420 prior to the closing date of the transaction. As required under OM 10, Mergers, Investments, Acquisitions and Divestments, the Director of Independence shall oversee due diligence as it relates to independence matters. Such due diligence includes an assessment of services provided by the target and business, financial and employment relationships of the target and individuals who will become Partners of the Member Firm, as applicable. The Member Firm shall document the procedures performed, findings and actions taken. 9.61 When disposing of a business, a Member Firm, in consultation with the Director of Independence, shall ensure the business is adequately separated such that it will no longer be considered an Associated Entity of the Member Firm. The Member Firm shall document the analysis of the separation and the resulting conclusion. Additional guidance regarding Associated Entities of a Member Firm can be found in Appendix M.',
                                tokens: 450,
                                url: 'https://www.deloitteindependence.gov/Documents/1420_deloitte_independence.pdf',
                            },
                        ],
                        mode: 'manual',
                    },
                },
                run: run,
            },
            {
                onQuery: async ({ query }) => {
                    console.log('running', query);
                    const response = await run(query);
                    console.log(response);

                    if (response.errors.length) {
                        throw new Error(response.errors.join(''));
                    }

                    return {
                        data: response.pixelReturn[0].output,
                    };
                },
            },
        );
    }, [blocks, queries, run]);

    /** Find the root */
    const rootId = useMemo<string>(() => {
        for (const key in blocks) {
            if (
                Object.prototype.hasOwnProperty.call(blocks, key) &&
                blocks[key]?.parent === null
            ) {
                return key;
            }
        }

        return '';
    }, [blocks]);

    /**
     * Have the designer control the blocks
     */
    const designer = useMemo(() => {
        const d = new DesignerStore(state);

        // set the rendered one
        d.setRendered(rootId);

        // return the store
        return d;
    }, [state, rootId]);

    /**
     * Add external blocks to the registry
     */
    const defaultBlocks = useMemo(() => {
        if (customBlocks) {
            return { ...DefaultBlocks, ...customBlocks };
        }
        return DefaultBlocks;
    }, [customBlocks]);

    return (
        <Blocks state={state} registry={defaultBlocks}>
            {editMode ? (
                <Designer designer={designer}>
                    <Renderer id={rootId} />
                </Designer>
            ) : (
                <Renderer id={rootId} />
            )}
        </Blocks>
    );
};
