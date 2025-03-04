// Simple test to validate that vitest is working
import { describe, it, expect, test } from 'vitest';

describe('vitest setup check', () => {
    it('should run a basic test', () => {
        //an easy passing test
        expect(1 + 1).toBe(2);
    });

    //test to exact error message
    // test('failing test', async () => {
    //     // toThrow returns a promise now, so you HAVE to await it
    //     await expect(1 + 1).rejects.toThrow('reject test');
    // });
});
