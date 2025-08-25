export class ServiceFactory {
    private services: Map<string, any> = new Map();
    
    constructor(private context: any) {}
    
    getService(name: string): any {
        if (!this.services.has(name)) {
            this.services.set(name, this.createService(name));
        }
        return this.services.get(name);
    }
    
    /**
     * Creates an ItemsService instance for the specified collection
     * @param collection - The collection name  
     * @param context - Request context with accountability and schema
     * @returns ItemsService instance
     */
    getItemsService(collection: string, context?: any): any {
        // Directus provides services in multiple ways, we need to handle all cases
        let ItemsService;
        
        // Try to get ItemsService from context
        if (this.context.services?.ItemsService) {
            ItemsService = this.context.services.ItemsService;
        } else if (this.context.ItemsService) {
            ItemsService = this.context.ItemsService;
        } else if (typeof this.context.getService === 'function') {
            ItemsService = this.context.getService('ItemsService');
        } else {
            // Last resort: try to import from Directus
            try {
                const { ItemsService: DirectusItemsService } = require('@directus/api');
                ItemsService = DirectusItemsService;
            } catch (error) {
                throw new Error(`ItemsService not available in Directus context: ${error.message}`);
            }
        }
        
        if (!ItemsService) {
            throw new Error('ItemsService not found in Directus context');
        }
        
        const serviceOptions = {
            accountability: context?.accountability || null,
            schema: context?.schema || this.context.schema,
            knex: this.context.database
        };
        
        return new ItemsService(collection, serviceOptions);
    }
    
    /**
     * Get the Knex database instance
     * @returns Knex database instance
     */
    getDatabase(): any {
        return this.context.database;
    }
    
    /**
     * Get the logger instance
     * @returns Logger instance
     */
    getLogger(): any {
        return this.context.logger;
    }
    
    /**
     * Get the schema instance
     * @returns Schema instance
     */
    getSchema(): any {
        return this.context.schema;
    }
    
    /**
     * Create service instances based on name
     * @param name - Service name
     * @returns Service instance
     */
    private createService(name: string): any {
        switch (name) {
            case 'database':
                return this.context.database;
            case 'logger':
                return this.context.logger;
            case 'schema':
                return this.context.schema;
            default:
                this.context.logger?.warn(`Unknown service requested: ${name}`);
                return null;
        }
    }
}

export interface ServiceConfig {
    lazy?: boolean;
    singleton?: boolean;
}
