import { Knex } from 'knex';
import { 
    DirectusRequest, 
    DirectusResponse
} from '../types/directus-api';
import { ItemWithUsage, UsageLocation, UsageSummary } from '../types/common';
import { ServiceFactory } from '../factories/ServiceFactory';

/**
 * Handler for retrieving item details with usage tracking across M2A relationships
 * This is the core functionality that native Directus API cannot provide
 */
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
     * Optimized to batch load usage data for better performance
     */
    private async loadItems(
        collection: string, 
        ids: (number | string)[], 
        fields?: string,
        accountability?: any
    ): Promise<ItemWithUsage[]> {
        const database = this.serviceFactory.getDatabase();
        
        try {
            this.logger?.debug(`Loading items from collection ${collection}:`, { ids, fields });
            
            // Build field selection
            const fieldList = this.parseFields(fields);
            const query = database.select(fieldList).from(collection).whereIn('id', ids);
            const items = await query;
            
            this.logger?.info(`Loaded ${items.length} items from ${collection}`);
            
            // Batch load all usage information for performance
            const allUsageLocations = await this.batchGetUsageLocations(database, collection, ids);
            
            // Map items with their usage information
            const itemsWithUsage: ItemWithUsage[] = items.map(item => {
                if (!item || !item.id) {
                    this.logger?.warn(`Skipping invalid item:`, item);
                    return null;
                }
                
                const usageLocations = allUsageLocations.get(String(item.id)) || [];
                const usageSummary = this.buildUsageSummary(usageLocations);
                
                return {
                    ...item,
                    usage_locations: usageLocations,
                    usage_summary: usageSummary
                };
            }).filter(Boolean) as ItemWithUsage[];
            
            return itemsWithUsage;
        } catch (error) {
            this.logger?.error(`Failed to load items from collection ${collection}:`, error);
            throw error;
        }
    }
    
    /**
     * Parse field selection string/array into proper field list
     */
    private parseFields(fields?: string | string[]): string[] {
        if (!fields) return ['*'];
        
        if (typeof fields === 'string') {
            if (fields === '*' || fields.includes('*.*')) {
                return ['*'];
            }
            return fields.split(',')
                .map(f => f.trim())
                .filter(f => !f.includes('.')) || ['*'];
        }
        
        if (Array.isArray(fields)) {
            const filtered = fields.filter(f => typeof f === 'string' && !f.includes('.'));
            return filtered.length > 0 ? filtered : ['*'];
        }
        
        return ['*'];
    }
    
    /**
     * Batch load usage locations for multiple items for better performance
     */
    private async batchGetUsageLocations(
        database: Knex, 
        collection: string, 
        itemIds: (number | string)[]
    ): Promise<Map<string, UsageLocation[]>> {
        const usageMap = new Map<string, UsageLocation[]>();
        
        try {
            // Initialize map with empty arrays
            itemIds.forEach(id => usageMap.set(String(id), []));
            
            // Batch load page usages
            const pageUsages = await this.batchFindPageUsages(database, collection, itemIds);
            pageUsages.forEach((locations, itemId) => {
                const existing = usageMap.get(itemId) || [];
                usageMap.set(itemId, [...existing, ...locations]);
            });
            
            // Batch load expandable usages
            const expandableUsages = await this.batchFindExpandableUsages(database, collection, itemIds);
            expandableUsages.forEach((locations, itemId) => {
                const existing = usageMap.get(itemId) || [];
                usageMap.set(itemId, [...existing, ...locations]);
            });
            
            return usageMap;
        } catch (error) {
            this.logger?.warn(`Failed to batch get usage locations:`, error);
            return usageMap;
        }
    }
    
    /**
     * Batch find usage in pages via pages_m2a junction table
     */
    private async batchFindPageUsages(
        database: Knex, 
        collection: string, 
        itemIds: (number | string)[]
    ): Promise<Map<string, UsageLocation[]>> {
        const usageMap = new Map<string, UsageLocation[]>();
        
        try {
            const stringIds = itemIds.map(id => String(id));
            
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
                .whereIn('m2a.item', stringIds);
            
            // Group results by item ID
            results.forEach((row: any) => {
                const itemId = String(row.item);
                const location: UsageLocation = {
                    id: row.page_id || row.pages_id,
                    collection: 'pages',
                    title: row.page_title || `Page ${row.page_id || row.pages_id}`,
                    status: row.page_status || 'draft',
                    field: 'content',
                    sort: row.sort || 0,
                    path: row.page_slug ? `/${row.page_slug}` : undefined,
                    edit_url: row.page_id ? `/admin/content/pages/${row.page_id}` : undefined,
                    junction_id: row.id
                };
                
                if (!usageMap.has(itemId)) {
                    usageMap.set(itemId, []);
                }
                usageMap.get(itemId)!.push(location);
            });
            
            return usageMap;
        } catch (error) {
            this.logger?.warn(`Failed to batch find page usages:`, error);
            return usageMap;
        }
    }
    
    /**
     * Batch find usage in expandable blocks via expandable_expandable junction table
     */
    private async batchFindExpandableUsages(
        database: Knex,
        collection: string,
        itemIds: (number | string)[]
    ): Promise<Map<string, UsageLocation[]>> {
        const usageMap = new Map<string, UsageLocation[]>();
        
        try {
            const stringIds = itemIds.map(id => String(id));
            
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
                .whereIn('ee.item', stringIds);
            
            // Group results by item ID
            results.forEach((row: any) => {
                const itemId = String(row.item);
                const location: UsageLocation = {
                    id: row.parent_id || row.expandable_id,
                    collection: 'expandable',
                    title: `Expandable Block ${row.parent_id || row.expandable_id} (${row.area || row.parent_area})`,
                    status: row.parent_status || 'draft',
                    field: row.area || 'main',
                    sort: row.sort || 0,
                    edit_url: row.parent_id ? `/admin/content/expandable/${row.parent_id}` : undefined,
                    junction_id: row.id,
                    area: row.area || row.parent_area
                };
                
                if (!usageMap.has(itemId)) {
                    usageMap.set(itemId, []);
                }
                usageMap.get(itemId)!.push(location);
            });
            
            return usageMap;
        } catch (error) {
            this.logger?.warn(`Failed to batch find expandable usages:`, error);
            return usageMap;
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
