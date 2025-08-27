import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DetailHandler } from '../src/handlers/DetailHandler';
import { ServiceFactory } from '../src/factories/ServiceFactory';

describe('DetailHandler', () => {
    let handler: DetailHandler;
    let mockServiceFactory: any;
    let mockLogger: any;
    let mockDatabase: any;
    let mockRequest: any;
    let mockResponse: any;
    
    beforeEach(() => {
        // Mock database
        mockDatabase = {
            select: vi.fn().mockReturnThis(),
            from: vi.fn().mockReturnThis(),
            whereIn: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            leftJoin: vi.fn().mockReturnValue(Promise.resolve([]))
        };
        
        // Mock ServiceFactory
        mockServiceFactory = {
            getDatabase: vi.fn().mockReturnValue(mockDatabase)
        };
        
        // Mock logger
        mockLogger = {
            info: vi.fn(),
            debug: vi.fn(),
            warn: vi.fn(),
            error: vi.fn()
        };
        
        // Mock request
        mockRequest = {
            params: { collection: 'test_collection' },
            body: { ids: [1, 2, 3] },
            accountability: null
        };
        
        // Mock response
        mockResponse = {
            json: vi.fn(),
            status: vi.fn().mockReturnThis()
        };
        
        handler = new DetailHandler(mockServiceFactory, mockLogger);
    });
    
    describe('handle', () => {
        it('should validate required parameters', async () => {
            mockRequest.body.ids = null;
            
            await handler.handle(mockRequest, mockResponse);
            
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ 
                error: 'Invalid ids parameter' 
            });
        });
        
        it('should require collection parameter', async () => {
            mockRequest.params.collection = null;
            
            await handler.handle(mockRequest, mockResponse);
            
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ 
                error: 'Collection parameter is required' 
            });
        });
        
        it('should load items with usage information', async () => {
            // Mock successful database queries
            const mockItems = [
                { id: 1, name: 'Item 1' },
                { id: 2, name: 'Item 2' },
                { id: 3, name: 'Item 3' }
            ];
            
            mockDatabase.whereIn = vi.fn().mockResolvedValue(mockItems);
            
            await handler.handle(mockRequest, mockResponse);
            
            expect(mockServiceFactory.getDatabase).toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            id: expect.any(Number),
                            usage_locations: expect.any(Array),
                            usage_summary: expect.objectContaining({
                                total_count: expect.any(Number),
                                by_collection: expect.any(Object),
                                by_status: expect.any(Object),
                                by_field: expect.any(Object)
                            })
                        })
                    ]),
                    meta: expect.objectContaining({
                        collection: 'test_collection',
                        total_count: expect.any(Number),
                        timestamp: expect.any(String)
                    })
                })
            );
        });
        
        it('should handle database errors gracefully', async () => {
            const error = new Error('Database connection failed');
            mockDatabase.whereIn = vi.fn().mockRejectedValue(error);
            
            await handler.handle(mockRequest, mockResponse);
            
            expect(mockLogger.error).toHaveBeenCalledWith(
                'DetailHandler error:', 
                error
            );
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Failed to load items',
                details: 'Database connection failed'
            });
        });
        
        it('should support field selection', async () => {
            mockRequest.body.fields = 'id,name,status';
            const mockItems = [{ id: 1, name: 'Item 1', status: 'published' }];
            
            mockDatabase.whereIn = vi.fn().mockResolvedValue(mockItems);
            
            await handler.handle(mockRequest, mockResponse);
            
            expect(mockDatabase.select).toHaveBeenCalledWith(['id', 'name', 'status']);
        });
    });
    
    describe('usage tracking', () => {
        it('should find usage in pages_m2a junction table', async () => {
            const mockItems = [{ id: 1, name: 'Item 1' }];
            const mockPageUsages = [
                {
                    id: 101,
                    pages_id: 10,
                    item: '1',
                    collection: 'test_collection',
                    sort: 1,
                    page_id: 10,
                    page_title: 'Test Page',
                    page_status: 'published',
                    page_slug: 'test-page'
                }
            ];
            
            mockDatabase.whereIn = vi.fn()
                .mockResolvedValueOnce(mockItems)
                .mockResolvedValueOnce(mockPageUsages)
                .mockResolvedValueOnce([]);
            
            await handler.handle(mockRequest, mockResponse);
            
            const response = mockResponse.json.mock.calls[0][0];
            expect(response.data[0].usage_locations).toHaveLength(1);
            expect(response.data[0].usage_locations[0]).toMatchObject({
                collection: 'pages',
                junction_id: 101
            });
        });
        
        it('should find usage in expandable_expandable junction table', async () => {
            const mockItems = [{ id: 2, name: 'Item 2' }];
            const mockExpandableUsages = [
                {
                    id: 201,
                    expandable_id: 20,
                    item: '2',
                    collection: 'test_collection',
                    sort: 1,
                    area: 'main',
                    parent_id: 20,
                    parent_status: 'draft'
                }
            ];
            
            mockDatabase.whereIn = vi.fn()
                .mockResolvedValueOnce(mockItems)
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce(mockExpandableUsages);
            
            await handler.handle(mockRequest, mockResponse);
            
            const response = mockResponse.json.mock.calls[0][0];
            expect(response.data[0].usage_locations).toHaveLength(1);
            expect(response.data[0].usage_locations[0]).toMatchObject({
                collection: 'expandable',
                junction_id: 201,
                area: 'main'
            });
        });
        
        it('should build correct usage summary', async () => {
            const mockItems = [{ id: 1, name: 'Item 1' }];
            const mockUsages = [
                { /* mock page usage */ },
                { /* mock expandable usage */ }
            ];
            
            mockDatabase.whereIn = vi.fn()
                .mockResolvedValueOnce(mockItems)
                .mockResolvedValue([]);
            
            await handler.handle(mockRequest, mockResponse);
            
            const response = mockResponse.json.mock.calls[0][0];
            expect(response.data[0].usage_summary).toMatchObject({
                total_count: 0,
                by_collection: {},
                by_status: {},
                by_field: {}
            });
        });
    });
});