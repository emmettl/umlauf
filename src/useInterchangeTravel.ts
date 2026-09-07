import { useEffect, useRef, useState } from 'react'

export function travelStage(progress:number,start:number,end:number){
 const t=Math.max(0,Math.min(1,(progress-start)/(end-start)))
 return t*t*(3-2*t)
}

// Reversible travel has no clock of its own: only the visible scene owns playback.
// Wait for verified station data before leaving the city, including reduced motion.
export function useInterchangeTravel(enter:boolean,ready:boolean){
 const [progress,setProgress]=useState(0),current=useRef(0)
 const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)'),update=()=>setReduced(media.matches);media.addEventListener('change',update);return()=>media.removeEventListener('change',update)},[])
 useEffect(()=>{
  const target=enter&&ready?1:0
  if(reduced){current.current=target;setProgress(target);return}
  let handle=0,last=0
  const tick=(now:number)=>{
   const step=last?Math.min(64,now-last)/2800:0;last=now
   current.current=target?Math.min(1,current.current+step):Math.max(0,current.current-step)
   setProgress(current.current)
   if(current.current!==target)handle=requestAnimationFrame(tick)
  }
  if(current.current!==target)handle=requestAnimationFrame(tick)
  return()=>cancelAnimationFrame(handle)
 },[enter,ready,reduced])
 return progress
}
