// Selected factual measurements reviewed against DB InfraGO's 31 August 2026
// station record; source receipt and limits: docs/engineering-review.json.
const netBuiltLength:Readonly<Record<string,number>>={'3':152,'4':152,'5':152,'6':152,'11':155,'12':155}
const source='https://www.dbinfrago.com/web/bahnhoefe/leistungen/stationsnutzung/stationshalt/stationsausstattung/Berlin-Ostkreuz-12670236'
export function PlatformFacts({platform}:{platform:string|null|undefined}){
 const length=platform?netBuiltLength[platform]:undefined
 return <div className="platform-facts" data-testid="platform-facts">
  {length?<><span><b>{length} m</b> net built length</span><span><b>96 cm</b> above rail</span><a href={source} target="_blank" rel="noreferrer">DB · 31 Aug 2026 ↗</a></>:<span>Select a platform to inspect its dimensions.</span>}
 </div>
}
