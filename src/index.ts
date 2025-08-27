import { defineEndpoint } from '@directus/extensions-sdk';
import type { EndpointConfig } from '@directus/extensions';
import { ServiceFactory } from './factories/ServiceFactory';
import { DetailHandler } from './handlers/DetailHandler';
import { errorHandler } from './middleware/error-handler';
import { securityHeaders, corsMiddleware } from './middleware/security-headers';
import { rateLimitMiddleware } from './middleware/rate-limit';

const endpoint: EndpointConfig = defineEndpoint({
    id: 'expandable-blocks-api',
    handler: (router, context) => {
        const serviceFactory = new ServiceFactory(context);
        const detailHandler = new DetailHandler(serviceFactory, context.logger);
        
        // Apply middleware
        router.use(corsMiddleware());
        router.use(securityHeaders());
        router.use(rateLimitMiddleware());
        
        // Routes
        router.get('/health', (req, res) => {
            res.json({ 
                status: 'ok', 
                version: '1.0.0',
                description: 'Expandable Blocks API - Relation/Usage Tracking'
            });
        });
        
        router.post('/:collection/detail', (req, res, next) => {
            detailHandler.handle(req, res).catch(next);
        });
        
        // Error handler
        router.use(errorHandler(context));
    }
});

export default endpoint;
