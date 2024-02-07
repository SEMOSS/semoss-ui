import { styled } from '@/component-library';
import { Env } from '@/env';

const StyledIframe = styled('iframe')(() => ({
    flex: '1',
    height: '100%',
    width: '100%',
    border: 'none',
}));

interface CodeRendererProps {
    /** Id of the app to render */
    appId: string;
}

/**
 * Render an app based on an id
 */
export const CodeRenderer = (props: CodeRendererProps) => {
    const { appId } = props;

    // return the app
    return <StyledIframe src={`${Env.MODULE}/public_home/${appId}/portals/`} />;
};
