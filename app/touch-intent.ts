/** A second contact may become a spell swipe, but a committed camera drag never does. */
export type RightIntent = 'pending' | 'look' | 'skill-up' | 'skill-down';
export function rightIntent(current:RightIntent,double:boolean,dx:number,dy:number):RightIntent {
  if(current!=='pending')return current;
  if(Math.hypot(dx,dy)<=8)return 'pending';
  if(double&&Math.abs(dy)>Math.abs(dx)*1.5){
    return Math.abs(dy)>28?(dy<0?'skill-up':'skill-down'):'pending';
  }
  return 'look';
}
export function nearbyTap(previous:{x:number;y:number}|null,x:number,y:number){
  return previous!==null&&Math.hypot(previous.x-x,previous.y-y)<=40;
}
