import { ServiceFactory } from '../factories/ServiceFactory';

export class ItemLoader {
    constructor(private serviceFactory: ServiceFactory) {}
    
    async loadItems(collection: string, ids: number[], fields?: string | string[], context?: any): Promise<any[]> {
        try {
            const itemsService = this.serviceFactory.getItemsService(collection, context);
            
            const queryOptions: any = {};
            
            // Parse fields if provided
            if (fields) {
                if (typeof fields === 'string') {
                    if (fields.trim()) {
                        queryOptions.fields = fields.split(',').map(f => f.trim()).filter(f => f.length > 0);
                    }
                } else if (Array.isArray(fields)) {
                    queryOptions.fields = fields;
                }
            }
            
            // Load items using Directus ItemsService
            const items = await itemsService.readMany(ids, queryOptions);
            
            // Ensure we return an array even if no items found
            return Array.isArray(items) ? items : [];
            
        } catch (error) {
            const logger = this.serviceFactory.getLogger();
            logger?.error(`Failed to load items from ${collection}:`, error);
            
            // Return empty array on error to prevent complete failure
            return [];
        }
    }
    
    async loadItem(collection: string, id: number, fields?: string[], context?: any): Promise<any | null> {
        try {
            const itemsService = this.serviceFactory.getItemsService(collection, context);
            
            const queryOptions: any = {};
            if (fields && fields.length > 0) {
                queryOptions.fields = fields;
            }
            
            const item = await itemsService.readOne(id, queryOptions);
            return item;
            
        } catch (error) {
            const logger = this.serviceFactory.getLogger();
            logger?.warn(`Failed to load item ${id} from ${collection}:`, error);
            return null;
        }
    }
    
    async loadItemsByFilter(collection: string, filter: any, fields?: string[], context?: any): Promise<any[]> {
        try {
            const itemsService = this.serviceFactory.getItemsService(collection, context);
            
            const queryOptions: any = {
                filter: filter
            };
            
            if (fields && fields.length > 0) {
                queryOptions.fields = fields;
            }
            
            const items = await itemsService.readByQuery(queryOptions);
            return Array.isArray(items) ? items : [];
            
        } catch (error) {
            const logger = this.serviceFactory.getLogger();
            logger?.error(`Failed to load items from ${collection} with filter:`, filter, error);
            return [];
        }
    }
}
