import { defineEndpoint } from '@directus/extensions-sdk';
import { ServiceFactory } from './factories/ServiceFactory';
import { MetadataHandler } from './handlers/MetadataHandler';
import { SearchHandler } from './handlers/SearchHandler';
import { DetailHandler } from './handlers/DetailHandler';
import { errorHandler } from './middleware/error-handler';
import { securityHeaders, corsMiddleware } from './middleware/security-headers';
import { rateLimitMiddleware } from './middleware/rate-limit';

export default defineEndpoint({
    id: 'expandable-blocks-api',
    handler: (router, context) => {
        const serviceFactory = new ServiceFactory(context);
        const metadataHandler = new MetadataHandler(serviceFactory, context.logger);
        const searchHandler = new SearchHandler(serviceFactory, context.logger);
        const detailHandler = new DetailHandler(serviceFactory, context.logger);
        
        // Apply middleware
        router.use(corsMiddleware());
        router.use(securityHeaders());
        router.use(rateLimitMiddleware());
        
        // Routes
        router.get('/health', (req, res) => {
            res.json({ status: 'ok', version: '1.0.0' });
        });
        
        router.get('/:collection/metadata', (req, res, next) => {
            metadataHandler.handle(req, res).catch(next);
        });
        
        router.get('/:collection/search', (req, res, next) => {
            searchHandler.handle(req, res).catch(next);
        });
        
        router.post('/:collection/detail', (req, res, next) => {
            detailHandler.handle(req, res).catch(next);
        });
        
        // Error handler
        router.use(errorHandler(context));
    }
});
