import { styled } from '@semoss/ui';
import { Env } from '@/env';

const StyledIframe = styled('iframe')(() => ({
    flex: '1',
    height: '100%',
    width: '100%',
    border: 'none',
}));

interface RendererProps {
    /** appId of the app to render */
    appId: string;
}

/**
 * Render an app based on an id
 */
export const Renderer = (props: RendererProps) => {
    const { appId } = props;

    if (!appId) {
        return <>Missing ID</>;
    }

    // return the app
    return <StyledIframe src={`${Env.MODULE}/public_home/${appId}/portals/`} />;
};
