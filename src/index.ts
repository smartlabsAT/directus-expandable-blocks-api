import { defineEndpoint } from '@directus/extensions-sdk';

export default defineEndpoint({
    id: 'expandable-blocks-api',
    handler: (router) => {
        router.get('/', (req, res) => {
            res.json({ status: 'ok' });
        });
    }
});
