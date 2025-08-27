import { describe, it, expect, vi } from 'vitest';
import endpoint from '../src/index';

describe('Health Endpoint', () => {
    it('should return health status', () => {
        const mockRouter = {
            use: vi.fn(),
            get: vi.fn(),
            post: vi.fn()
        };
        
        const mockContext = {
            services: {},
            database: {},
            logger: {
                info: vi.fn(),
                warn: vi.fn(),
                error: vi.fn(),
                debug: vi.fn()
            },
            schema: {}
        };
        
        // Execute the endpoint handler
        (endpoint as any).handler(mockRouter, mockContext);
        
        // Find the health endpoint handler
        const healthCall = mockRouter.get.mock.calls.find(
            call => call[0] === '/health'
        );
        
        expect(healthCall).toBeDefined();
        
        // Test the health endpoint handler
        const healthHandler = healthCall[1];
        const mockReq = {};
        const mockRes = { json: vi.fn() };
        
        healthHandler(mockReq, mockRes);
        
        expect(mockRes.json).toHaveBeenCalledWith({
            status: 'ok',
            version: '1.0.0',
            description: 'Expandable Blocks API - Relation/Usage Tracking'
        });
    });
});