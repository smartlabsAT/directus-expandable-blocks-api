import { ServiceFactory } from '../factories/ServiceFactory';
import { ItemLoader } from './ItemLoader';

export class PathBuilderService {
    private itemLoader: ItemLoader;
    private logger: any;
    
    constructor(private serviceFactory: ServiceFactory) {
        this.itemLoader = new ItemLoader(serviceFactory);
        this.logger = serviceFactory.getLogger();
    }
    
    async buildPath(collection: string, itemId: number | string): Promise<string[]> {
        try {
            const pathItems = await this.buildHierarchicalPath(collection, itemId);
            return pathItems.map(item => this.getItemDisplayName(item));
        } catch (error) {
            this.logger?.warn(`Failed to build path for ${collection}:${itemId}:`, error);
            return [];
        }
    }
    
    private async buildHierarchicalPath(collection: string, itemId: number | string): Promise<any[]> {
        const path = [];
        const visited = new Set(); // Prevent infinite loops
        
        let currentItem = await this.getItem(collection, itemId);
        
        while (currentItem && !visited.has(`${collection}:${currentItem.id}`)) {
            visited.add(`${collection}:${currentItem.id}`);
            path.unshift(currentItem);
            
            // Check for parent relationship
            const parentId = this.getParentId(currentItem);
            if (parentId) {
                currentItem = await this.getItem(collection, parentId);
            } else {
                break;
            }
        }
        
        return path;
    }
    
    private async getItem(collection: string, id: number | string): Promise<any | null> {
        try {
            // Define fields to load based on collection type
            const fields = this.getPathFields(collection);
            return await this.itemLoader.loadItem(collection, Number(id), fields);
        } catch (error) {
            this.logger?.warn(`Failed to load item ${id} from ${collection}:`, error);
            return null;
        }
    }
    
    private getPathFields(collection: string): string[] {
        // Define which fields to load for building paths
        const baseFields = ['id', 'title', 'name', 'status'];
        
        switch (collection) {
            case 'pages':
                return [...baseFields, 'slug', 'parent'];
            case 'expandable':
                return [...baseFields, 'area', 'parent'];
            case 'categories':
                return [...baseFields, 'slug', 'parent_category'];
            default:
                return [...baseFields, 'parent'];
        }
    }
    
    private getParentId(item: any): number | string | null {
        // Check different possible parent field names
        if (item.parent) return item.parent;
        if (item.parent_id) return item.parent_id;
        if (item.parent_category) return item.parent_category;
        if (item.parent_page) return item.parent_page;
        
        return null;
    }
    
    private getItemDisplayName(item: any): string {
        // Get the best display name for the item
        if (item.title) return item.title;
        if (item.name) return item.name;
        if (item.slug) return item.slug;
        if (item.area) return item.area;
        
        // Fallback to ID
        return `Item ${item.id}`;
    }
    
    async buildFullPath(collection: string, itemId: number | string, separator: string = ' > '): Promise<string> {
        const pathItems = await this.buildPath(collection, itemId);
        return pathItems.join(separator);
    }
    
    async buildUrlPath(collection: string, itemId: number | string): Promise<string> {
        try {
            const pathItems = await this.buildHierarchicalPath(collection, itemId);
            
            // For pages, build URL path from slugs
            if (collection === 'pages') {
                const slugs = pathItems
                    .map(item => item.slug)
                    .filter(slug => slug && slug.length > 0);
                
                return slugs.length > 0 ? `/${slugs.join('/')}` : '/';
            }
            
            // For other collections, return basic path
            const lastItem = pathItems[pathItems.length - 1];
            if (lastItem?.slug) {
                return `/${lastItem.slug}`;
            }
            
            return '';
            
        } catch (error) {
            this.logger?.warn(`Failed to build URL path for ${collection}:${itemId}:`, error);
            return '';
        }
    }
    
    async getParentItems(collection: string, itemId: number | string): Promise<any[]> {
        try {
            const pathItems = await this.buildHierarchicalPath(collection, itemId);
            // Return all items except the current one (last item)
            return pathItems.slice(0, -1);
        } catch (error) {
            this.logger?.warn(`Failed to get parent items for ${collection}:${itemId}:`, error);
            return [];
        }
    }
    
    async getRootItem(collection: string, itemId: number | string): Promise<any | null> {
        try {
            const pathItems = await this.buildHierarchicalPath(collection, itemId);
            return pathItems.length > 0 ? pathItems[0] : null;
        } catch (error) {
            this.logger?.warn(`Failed to get root item for ${collection}:${itemId}:`, error);
            return null;
        }
    }
}
