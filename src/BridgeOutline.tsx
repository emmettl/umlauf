import { useEffect, useState } from 'react'
import { localPoint, screenPoint, type Point } from './ostkreuz-model'

interface BridgeData {
 metadata:{stationId:string;heightMetres:null}
 origin:Point
 bridge:{id:string;geometry:{type:'MultiPolygon';coordinates:Point[][][]}}
}
export function BridgeOutline({separation,visible,onStatus,tilt=1}:{separation:number;tilt?:number;visible:boolean;onStatus:(status:'ready'|'unavailable')=>void}){
 const [data,setData]=useState<BridgeData>()
 useEffect(()=>{
  const controller=new AbortController()
  fetch(`${import.meta.env.BASE_URL}data/ostkreuz-bridge.json`,{signal:controller.signal}).then(async response=>{
   if(!response.ok)throw new Error('Bridge source unavailable')
   const next:BridgeData=await response.json()
   if(next.metadata.stationId!=='de:11000:900120003'||next.metadata.heightMetres!==null||next.bridge.geometry.type!=='MultiPolygon')throw new Error('Bridge source mismatch')
   setData(next);onStatus('ready')
  }).catch(error=>{if(error.name!=='AbortError')onStatus('unavailable')})
  return()=>controller.abort()
 },[onStatus])
 if(!data||!visible)return null
 return <g data-testid="official-bridge-outline" data-source-id={data.bridge.id} pointerEvents="none">
  <title>Official ATKIS bridge footprint; vertical placement is illustrative</title>
  {data.bridge.geometry.coordinates.map((polygon,i)=><path key={i} d={polygon.map(ring=>ring.map((point,j)=>`${j?'L':'M'}${screenPoint(localPoint(point,data.origin),2,separation,tilt).join(',')}`).join(' ')+'Z').join(' ')} fill="#b8d9ba" fillOpacity=".09" fillRule="evenodd" stroke="#b8d9ba" strokeOpacity=".65" strokeWidth="1.4"/>)}
 </g>
}
