import { CSSProperties, useState } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

import { CircularProgress, Button, styled } from '@mui/material';

import ReactJson from 'react-json-view';
import jsonLogic from 'json-logic-js';

export interface JsonBlockDef extends BlockDef<'JSON'> {
    widget: 'JSON';
    data: {
        text: Record<any, string>;
        loading?: boolean;
        disabled?: boolean;
    };
    listeners: {
        onClick: true;
    };
}

const StyledContainer = styled('div')(({ theme }) => ({
    padding: '4px',
}));

export const JsonBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, listeners } = useBlock<JsonBlockDef>(id);
    const [rule, setRule] = useState({
        and: [
            { '==': [{ var: 'age' }, 25] },
            { '==': [{ var: 'city' }, 'New York'] },
        ],
    });

    const handleRuleChange = (newRule) => {
        console.log(newRule.updated_src);
        setRule(newRule.updated_src);
    };

    const evaluateRule = (data) => {
        return jsonLogic.apply(rule, data);
    };

    console.log(rule);

    return (
        <StyledContainer {...attrs}>
            <div>
                <ReactJson
                    src={rule}
                    onEdit={handleRuleChange}
                    theme={'bright:inverted'}
                    displayObjectSize={false}
                    displayDataTypes={false}
                />
                <button
                    onClick={() =>
                        console.log(evaluateRule({ age: 25, city: 'New York' }))
                    }
                >
                    Evaluate Rule
                </button>
            </div>
            );
        </StyledContainer>
    );
});
