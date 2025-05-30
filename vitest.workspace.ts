import { defineWorkspace } from 'vitest/config'

//explicitly define each workspace
export default defineWorkspace([
    'packages/*',
    'libs/*'
]);