// processRequest.spec.ts
// Note: Simple test to validate that vitest is working
import { processRequest } from './processRequest';
import { describe, it, expect } from 'vitest';

describe('processRequest', () => {
    it('Calls Function with process request', () => {
        expect(processRequest).toBeDefined();
    });
});
