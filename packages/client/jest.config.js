module.exports = {
    moduleNameMapper: {
        '^@/hooks': '<rootDir>/src/hooks/$1',
        '^@/contexts': '<rootDir>/src/contexts/$1',
        '^@/constants': '<rootDir>/src/constants/$1',
        '^@/stores': '<rootDir>/src/stores/$1',
        '^@/api': '<rootDir>/src/api/$1',
        '^@/env': '<rootDir>/src/env/$1',
        '^@/utility': '<rootDir>/src/utility/$1',
        '\\.svg$': '<rootDir>/spec/__mocks__/svgrMock.tsx',
        '@/components/(.*)$': '<rootDir>/src/components/$1',
        '@/assets/(.*)$': '<rootDir>/src/assets/$1',
        '\\.(css|less|geojson)$':
            '<rootDir>/spec/__mocks__/mockExportObject.js',
    },
    testEnvironment: 'jsdom',
    transformIgnorePatterns: ['!node_modules/'],
};
