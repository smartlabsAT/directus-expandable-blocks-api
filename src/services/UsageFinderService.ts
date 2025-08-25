import { ServiceFactory } from '../factories/ServiceFactory';
import { UsageLocation } from '../types/common';

export class UsageFinderService {
    private database: any;
    private logger: any;
    
    constructor(private serviceFactory: ServiceFactory) {
        this.database = serviceFactory.getDatabase();
        this.logger = serviceFactory.getLogger();
    }
    
    async findUsageLocations(collection: string, itemId: number | string): Promise<UsageLocation[]> {
        const usages: UsageLocation[] = [];
        
        try {
            // Find usage in M2A junction tables
            const m2aUsages = await this.findM2AUsages(collection, itemId);
            usages.push(...m2aUsages);
            
            // Find usage in direct relation fields
            const directUsages = await this.findDirectRelationUsages(collection, itemId);
            usages.push(...directUsages);
            
            // Find usage in translation tables
            const translationUsages = await this.findTranslationUsages(collection, itemId);
            usages.push(...translationUsages);
            
        } catch (error) {
            this.logger?.error(`Error finding usage locations for ${collection}:${itemId}:`, error);
        }
        
        return usages;
    }
    
    private async findM2AUsages(collection: string, itemId: number | string): Promise<UsageLocation[]> {
        const usages: UsageLocation[] = [];
        
        try {
            // Query pages_m2a junction table
            const pagesUsage = await this.queryPagesM2AUsage(collection, itemId);
            usages.push(...pagesUsage);
            
            // Query expandable_expandable junction table
            const expandableUsage = await this.queryExpandableUsage(collection, itemId);
            usages.push(...expandableUsage);
            
            // Add more M2A table queries as needed
            // const otherUsage = await this.queryOtherM2AUsage(collection, itemId);
            // usages.push(...otherUsage);
            
        } catch (error) {
            this.logger?.warn(`Failed to find M2A usages for ${collection}:${itemId}:`, error);
        }
        
        return usages;
    }
    
    private async queryPagesM2AUsage(collection: string, itemId: number | string): Promise<UsageLocation[]> {
        try {
            const results = await this.database
                .select([
                    'p.id',
                    'p.title',
                    'p.status',
                    'p.slug',
                    'pm.sort',
                    'pm.collection as junction_collection',
                    'pm.item as junction_item'
                ])
                .from('pages as p')
                .join('pages_m2a as pm', 'p.id', 'pm.pages_id')
                .where('pm.collection', collection)
                .where('pm.item', itemId)
                .orderBy('pm.sort');
            
            return results.map((row: any) => ({
                id: row.id,
                collection: 'pages',
                title: row.title || `Page ${row.id}`,
                status: row.status || 'draft',
                field: 'content', // Default field for M2A relations
                sort: row.sort || 0,
                path: row.slug ? `/${row.slug}` : undefined,
                edit_url: `/admin/content/pages/${row.id}`
            }));
            
        } catch (error) {
            this.logger?.warn(`Failed to query pages_m2a usage:`, error);
            return [];
        }
    }
    
    private async queryExpandableUsage(collection: string, itemId: number | string): Promise<UsageLocation[]> {
        try {
            const results = await this.database
                .select([
                    'e.id',
                    'e.area',
                    'e.title',
                    'e.status',
                    'ee.sort',
                    'ee.collection as junction_collection',
                    'ee.item as junction_item'
                ])
                .from('expandable as e')
                .join('expandable_expandable as ee', 'e.id', 'ee.expandable_id')
                .where('ee.collection', collection)
                .where('ee.item', itemId)
                .orderBy('ee.sort');
            
            return results.map((row: any) => ({
                id: row.id,
                collection: 'expandable',
                title: row.title || row.area || `Expandable ${row.id}`,
                status: row.status || 'draft',
                field: 'expandable', // Default field for expandable relations
                sort: row.sort || 0,
                edit_url: `/admin/content/expandable/${row.id}`
            }));
            
        } catch (error) {
            this.logger?.warn(`Failed to query expandable_expandable usage:`, error);
            return [];
        }
    }
    
    private async findDirectRelationUsages(collection: string, itemId: number | string): Promise<UsageLocation[]> {
        const usages: UsageLocation[] = [];
        
        try {
            // This would query for direct foreign key references
            // Implementation depends on your schema structure
            
            // Example: Find pages that directly reference this item in a field
            // const directReferences = await this.database
            //     .select(['id', 'title', 'status', 'field_name'])
            //     .from('some_table')
            //     .where('field_name', itemId);
            
        } catch (error) {
            this.logger?.warn(`Failed to find direct relation usages:`, error);
        }
        
        return usages;
    }
    
    private async findTranslationUsages(collection: string, itemId: number | string): Promise<UsageLocation[]> {
        const usages: UsageLocation[] = [];
        
        try {
            // Check if this item is used in translation contexts
            // This is collection-specific logic
            
            if (collection.endsWith('_translations')) {
                // Handle translation collections differently
                const baseCollection = collection.replace('_translations', '');
                // Query logic for translated content usage
            }
            
        } catch (error) {
            this.logger?.warn(`Failed to find translation usages:`, error);
        }
        
        return usages;
    }
    
    async findUsageCount(collection: string, itemId: number | string): Promise<number> {
        try {
            const usages = await this.findUsageLocations(collection, itemId);
            return usages.length;
        } catch (error) {
            this.logger?.error(`Failed to count usages for ${collection}:${itemId}:`, error);
            return 0;
        }
    }
    
    async isItemUsed(collection: string, itemId: number | string): Promise<boolean> {
        const count = await this.findUsageCount(collection, itemId);
        return count > 0;
    }
}
