import { Knex } from 'knex';
import { 
    DirectusRequest, 
    DirectusResponse, 
    Logger,
    PagesM2ARow,
    ExpandableExpandableRow 
} from '../types/directus-api';
import { ItemWithUsage, UsageLocation, UsageSummary } from '../types/common';
import { ServiceFactory } from '../factories/ServiceFactory';

export class DetailHandler {
    constructor(private serviceFactory: ServiceFactory, private logger: any) {}
    
    async handle(req: DirectusRequest, res: DirectusResponse): Promise<void> {
        const { collection } = req.params;
        const { ids, fields } = req.body;
        
        if (!ids || !Array.isArray(ids)) {
            res.status(400).json({ error: 'Invalid ids parameter' });
            return;
        }
        
        if (!collection) {
            res.status(400).json({ error: 'Collection parameter is required' });
            return;
        }
        
        try {
            this.logger?.info(`DetailHandler: Loading items for collection ${collection}, ids: ${ids.join(', ')}`);
            this.logger?.debug('Request context:', { 
                hasAccountability: !!req.accountability, 
                hasSchema: !!req.schema,
                serviceFactoryContext: !!this.serviceFactory 
            });
            
            const items = await this.loadItems(collection, ids, fields, req.accountability);
            
            this.logger?.info(`DetailHandler: Successfully loaded ${items.length} items`);
            res.json({ 
                data: items,
                meta: {
                    collection,
                    total_count: items.length,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            this.logger?.error('DetailHandler error:', error);
            res.status(500).json({ 
                error: 'Failed to load items', 
                details: error instanceof Error ? error.message : 'Unknown error' 
            });
        }
    }
    
    /**
     * Load items from the specified collection with usage information
     */
    private async loadItems(
        collection: string, 
        ids: (number | string)[], 
        fields?: string,
        accountability?: any
    ): Promise<ItemWithUsage[]> {
        const database = this.serviceFactory.getDatabase();
        
        try {
            // Load items directly from database using Knex instead of ItemsService to avoid schema issues
            this.logger?.debug(`Loading items from collection ${collection} using direct database query:`, { ids, fields });
            
            let query = database.select('*').from(collection).whereIn('id', ids);
            
            // If specific fields are requested, select only those
            if (fields) {
                let fieldList: string[];
                if (typeof fields === 'string') {
                    // Handle Directus special syntax like '*.*' 
                    if (fields === '*' || fields.includes('*.*')) {
                        fieldList = ['*'];  // Just select all fields from the main table
                    } else {
                        fieldList = fields.split(',').map(f => f.trim()).filter(f => !f.includes('.'));
                    }
                } else if (Array.isArray(fields)) {
                    // Filter out relation fields (those with dots) for direct SQL query
                    fieldList = fields.filter(f => typeof f === 'string' && !f.includes('.'));
                    if (fieldList.length === 0) {
                        fieldList = ['*'];
                    }
                } else {
                    fieldList = ['*'];
                }
                query = database.select(fieldList).from(collection).whereIn('id', ids);
            }
            
            const items = await query;
            
            this.logger?.info(`Loaded ${items.length} items from ${collection} via direct database query`);
            
            // For each item, get usage information
            const itemsWithUsage: ItemWithUsage[] = [];
            
            for (const item of items) {
                if (!item || !item.id) {
                    this.logger?.warn(`Skipping invalid item:`, item);
                    continue;
                }
                
                const usageLocations = await this.getUsageLocations(database, collection, item.id);
                const usageSummary = this.buildUsageSummary(usageLocations);
                
                itemsWithUsage.push({
                    ...item,
                    usage_locations: usageLocations,
                    usage_summary: usageSummary
                });
            }
            
            return itemsWithUsage;
        } catch (error) {
            this.logger?.error(`Failed to load items from collection ${collection}:`, error);
            throw error;
        }
    }
    
    /**
     * Find where an item is being used across different collections
     */
    private async getUsageLocations(database: Knex, collection: string, itemId: number | string): Promise<UsageLocation[]> {
        const locations: UsageLocation[] = [];
        
        try {
            this.logger?.debug(`Finding usage for ${collection}:${itemId}`);
            
            // Check pages_m2a table for usage in pages
            const pageUsages = await this.findPageUsages(database, collection, itemId);
            locations.push(...pageUsages);
            
            // Check expandable_expandable table for usage in expandable blocks
            const expandableUsages = await this.findExpandableUsages(database, collection, itemId);
            locations.push(...expandableUsages);
            
            // Additional usage checks can be added here for other junction tables
            
            this.logger?.debug(`Found ${locations.length} usage locations for ${collection}:${itemId}`);
            
            return locations;
        } catch (error) {
            this.logger?.warn(`Failed to get usage locations for ${collection}:${itemId}:`, error);
            return [];
        }
    }
    
    /**
     * Find usage in pages via pages_m2a junction table
     */
    private async findPageUsages(database: Knex, collection: string, itemId: number | string): Promise<UsageLocation[]> {
        try {
            const results = await database
                .select([
                    'm2a.id',
                    'm2a.pages_id',
                    'm2a.collection',
                    'm2a.item',
                    'm2a.sort',
                    'p.id as page_id',
                    'p.title as page_title',
                    'p.status as page_status',
                    'p.slug as page_slug'
                ])
                .from('pages_m2a as m2a')
                .leftJoin('pages as p', 'm2a.pages_id', 'p.id')
                .where('m2a.collection', collection)
                .where('m2a.item', itemId.toString());
            
            return results.map((row: any) => ({
                id: row.page_id || row.pages_id,
                collection: 'pages',
                title: row.page_title || `Page ${row.page_id || row.pages_id}`,
                status: row.page_status || 'draft',
                field: 'content', // Pages use M2A for main content
                sort: row.sort || 0,
                path: row.page_slug ? `/${row.page_slug}` : undefined,
                edit_url: row.page_id ? `/admin/content/pages/${row.page_id}` : undefined,
                junction_id: row.id
            }));
        } catch (error) {
            this.logger?.warn(`Failed to find page usages for ${collection}:${itemId}:`, error);
            return [];
        }
    }
    
    /**
     * Find usage in expandable blocks via expandable_expandable junction table
     */
    private async findExpandableUsages(database: Knex, collection: string, itemId: number | string): Promise<UsageLocation[]> {
        try {
            const results = await database
                .select([
                    'ee.id',
                    'ee.expandable_id',
                    'ee.collection',
                    'ee.item',
                    'ee.sort',
                    'ee.area',
                    'e.id as parent_id',
                    'e.status as parent_status',
                    'e.area as parent_area'
                ])
                .from('expandable_expandable as ee')
                .leftJoin('expandable as e', 'ee.expandable_id', 'e.id')
                .where('ee.collection', collection)
                .where('ee.item', itemId.toString());
            
            return results.map((row: any) => ({
                id: row.parent_id || row.expandable_id,
                collection: 'expandable',
                title: `Expandable Block ${row.parent_id || row.expandable_id} (${row.area || row.parent_area})`,
                status: row.parent_status || 'draft',
                field: row.area || 'main',
                sort: row.sort || 0,
                edit_url: row.parent_id ? `/admin/content/expandable/${row.parent_id}` : undefined,
                junction_id: row.id,
                area: row.area || row.parent_area
            }));
        } catch (error) {
            this.logger?.warn(`Failed to find expandable usages for ${collection}:${itemId}:`, error);
            return [];
        }
    }
    
    /**
     * Build usage summary statistics
     */
    private buildUsageSummary(usageLocations: UsageLocation[]): UsageSummary {
        const byCollection: Record<string, number> = {};
        const byStatus: Record<string, number> = {};
        const byField: Record<string, number> = {};
        
        for (const location of usageLocations) {
            // Count by collection
            byCollection[location.collection] = (byCollection[location.collection] || 0) + 1;
            
            // Count by status
            if (location.status) {
                byStatus[location.status] = (byStatus[location.status] || 0) + 1;
            }
            
            // Count by field/area
            if (location.field) {
                byField[location.field] = (byField[location.field] || 0) + 1;
            }
        }
        
        return {
            total_count: usageLocations.length,
            by_collection: byCollection,
            by_status: byStatus,
            by_field: byField
        };
    }
}
