import type { MotionStudyEdition } from '@motionstudies/core/edition'
export const BERLIN_EDITION = {
  id:'berlin',
  // Empty catalogue number is deliberate: this first proof remains unnumbered.
  identity:{series:'Motion Studies',catalogueNumber:'',title:'Umlauf',placeName:'Berlin',descriptor:'A Berlin motion study'},
  timezone:'Europe/Berlin',languageStorageKey:'umlauf-language',defaultNetworkTime:8*3600,
  theme:{background:'#090e14',ink:'#e9ede9',muted:'#8e999b',line:'#25343c',primary:'#82e5c5',secondary:'#ffb36b',panel:'#0c1118',air:'#93aed2',roadLight:'#c4c4a6',roadHeavy:'#b29f84'},
  data:{opening:{network:'berlin-morning.json',layouts:[{id:'geographic',label:'Geography',kind:'geographic'},{id:'diagram',label:'Circulation',kind:'topological',artifact:'ring-layout.json'}]}},
} satisfies MotionStudyEdition
