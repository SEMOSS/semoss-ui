import { TOKEN_TYPE_TEXT } from '../prompt.constants';
import { Token } from '../prompt.types';
import { PromptHoverToken } from './token';

export const PromptPreview = (props: {
    tokens: Token[];
    inputTypes: object;
}) => {
    const getTokenInputType = (token: Token) => {
        if (token.type === TOKEN_TYPE_TEXT || token.isHiddenPhraseInputToken) {
            return null;
        } else {
            // optional chaining prevents crash after step 2 changes
            return props.inputTypes[token?.linkedInputToken ?? token.index]
                ?.type;
        }
    };

    return (
        <>
            {Array.from(props.tokens, (token: Token) => (
                <PromptHoverToken
                    key={token.index}
                    token={token}
                    tokenInputType={getTokenInputType(token)}
                />
            ))}
        </>
    );
};
