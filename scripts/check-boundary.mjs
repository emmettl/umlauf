import { checkEditionBoundary } from '@motionstudies/data/edition-boundary'

await checkEditionBoundary({ directories: ['src', 'scripts'] })
console.log('umlauf uses pinned npm releases and declared public imports.')
