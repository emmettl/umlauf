import { positionForTrain, type NetworkSnapshot, type NetworkTrain } from '@motionstudies/core/domain/network'

export interface StationNode {id:string;name:string;description:string;longitude:number;latitude:number;locationType:string;parentId:string;levelId:string|null;platform:string|null}
export interface StationPlatform extends StationNode {routes:string[]}
export interface StationPathway {id:string;from:string;to:string;mode:number;bidirectional:boolean;traversalSeconds:number|null;lengthMetres:number|null}
export interface StationCall {id:string;trainId:string;route:string;headsign:string;platformId:string;arrival:number;departure:number;callIndex:number}
export interface StationData {
  metadata:{stationId:string;name:string;sourceSha256:string;networkSha256:string;note:string;serviceDate:string}
  origin:[number,number]
  levels:{id:string;index:number;name:string}[]
  nodes:StationNode[];platforms:StationPlatform[];pathways:StationPathway[];calls:StationCall[]
}
export type Point=readonly[number,number]
export function localPoint(point:Point,origin:Point):Point {
 return [(point[0]-origin[0])*111320*Math.cos(origin[1]*Math.PI/180),(point[1]-origin[1])*111320]
}
export function screenPoint(point:Point,level:number,separation:number):Point {
 return [450+point[0]*1.28+point[1]*0.82,382+point[0]*0.43-point[1]*0.7-level*72*separation]
}
export function samplePath(points:readonly Point[],progress:number):Point {
 if(points.length<2)throw new Error('A route path needs at least two points')
 const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]))
 let remaining=lengths.reduce((a,b)=>a+b,0)*Math.max(0,Math.min(1,progress))
 for(let i=0;i<lengths.length;i++){
  if(remaining<=lengths[i] && lengths[i]>0){const f=remaining/lengths[i];return [points[i][0]+(points[i+1][0]-points[i][0])*f,points[i][1]+(points[i+1][1]-points[i][1])*f]}
  remaining-=lengths[i]
 }
 return points.at(-1)!
}
export function localTrainPoint(train:NetworkTrain,time:number,network:NetworkSnapshot,origin:Point):Point|undefined {
 const position=positionForTrain(train,time)
 if(!position)return
 const from=network.stops[position.fromStop]
 if(position.fromStop===position.toStop)return localPoint([from[0],from[1]],origin)
 const pathId=train.pathSegments?.[position.segmentIndex??-1]
 const path=pathId===undefined||pathId===null?undefined:network.paths?.[pathId]
 if(!path)return
 return samplePath(path.map(p=>localPoint(p,origin)),position.progress)
}
// Reciprocal GTFS rows describe a shared physical connector. Preserve every
// source ID in the display group; do not count the two directions as two lifts.
export function verticalConnections(data:StationData,mode:'all'|'stairs'|'lifts') {
 const nodes=new Map(data.nodes.map(n=>[n.id,n]))
 const groups=new Map<string,{from:StationNode;to:StationNode;mode:number;sourceIds:string[]}>()
 for(const p of data.pathways){
  if(![2,4,5].includes(p.mode) || (mode==='stairs'&&p.mode===5) || (mode==='lifts'&&p.mode!==5))continue
  const from=nodes.get(p.from),to=nodes.get(p.to)
  if(!from?.levelId||!to?.levelId||from.levelId===to.levelId)continue
  const key=[p.from,p.to].sort().join('|')+`:${p.mode}`
  const group=groups.get(key)??{from,to,mode:p.mode,sourceIds:[]};group.sourceIds.push(p.id);groups.set(key,group)
 }
 return [...groups.values()]
}
