// The visible pan and the flow grid share a 300 × 200 coordinate system.
const flowWidth=150, flowHeight=100;
const interiors={
  square:[[15,121],[89,10],[284,20],[242,138]],
  loaf:[[16,103],[212,8],[286,39],[92,137]],
  sheet:[[23,166],[53,15],[255,14],[278,163]]
};
function insidePan(p,x,y) {
  if(p.id==='muffin'){
    const col=Math.round((x-60)/87),row=Math.round((y-51)/78);
    if(col<0||col>2||row<0||row>1)return -1;
    return ((x-60-col*87)/35)**2+((y-51-row*78)/29)**2<1?row*3+col:-1;
  }
  if(p.id==='round')return ((x-150)/133)**2+((y-79)/55)**2<1?0:-1;
  const poly=interiors[p.id];
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const [a,b]=poly[i],[c,d]=poly[j];
    if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)inside=!inside;
  }
  if(!inside)return -1;
  return p.id==='sheet'?Math.min(2,Math.max(0,Math.floor((x-15)/90)))+(y>90?3:0):0;
}
function createFlow(p){
  const grid=new Float32Array(flowWidth*flowHeight),zone=new Int8Array(grid.length),areas=Array(p.wells).fill(0);
  for(let i=0;i<grid.length;i++){
    zone[i]=insidePan(p,(i%flowWidth)*2+1,Math.floor(i/flowWidth)*2+1);
    if(zone[i]>=0)areas[zone[i]]++;
  }
  return {p,grid,zone,areas,change:new Float32Array(grid.length),age:0,dirty:true};
}
function deposit(flow,x,y,cell,amount){
  const hits=[];let sum=0;
  for(let j=Math.floor(y/2)-3;j<=Math.floor(y/2)+3;j++)for(let i=Math.floor(x/2)-3;i<=Math.floor(x/2)+3;i++){
    const k=j*flowWidth+i,w=Math.exp(-((2*i+1-x)**2+(2*j+1-y)**2)/12);
    if(flow.zone[k]===cell){hits.push([k,w]);sum+=w}
  }
  for(const [k,w] of hits)flow.grid[k]+=amount*flow.areas[cell]*w/sum;
  flow.age=0;flow.dirty=true;
}
function spread(flow,dt){
  // Only move batter down a local height gradient. Walled wells cannot exchange batter.
  const {grid,zone,change}=flow,sheet=flow.p.id==='sheet';
  const steps=Math.ceil(dt/(sheet?7:1.45)),rate=dt/Math.max(1,steps)/(sheet?7:1.45)*.22;
  for(let step=0;step<steps;step++){
    change.fill(0);
    for(let k=0;k<grid.length-flowWidth;k++){
      if(zone[k]<0)continue;
      for(let n=k+1;n<=k+flowWidth;n+=flowWidth-1){
        if(zone[n]<0 || (flow.p.id==='muffin'&&zone[n]!==zone[k]))continue;
        const diff=grid[k]-grid[n],transfer=Math.sign(diff)*Math.max(0,Math.abs(diff)-(sheet?.16:.0002))*rate;
        change[k]-=transfer;change[n]+=transfer;
      }
    }
    for(let k=0;k<grid.length;k++)grid[k]+=change[k];
  }
  flow.age+=dt;flow.dirty=true;
}
function flowArt(s,heat=0){
  const f=s.flow;
  if(!f || f.p.id!==s.pan.id)return panArt(s.pan,s.panContents,batterAppearance('combined',s).color);
  if(!f.canvas){f.canvas=document.createElement('canvas');f.canvas.width=300;f.canvas.height=200}
  if(f.dirty||heat!==f.heat){
    const ctx=f.canvas.getContext('2d'),img=ctx.createImageData(300,200);
    const pigment=batterAppearance('combined',s).color;
    const base=[1,3,5].map(i=>parseInt(pigment.slice(i,i+2),16));
    const cocoa=(s.amounts.Cocoa||0)>0, toasted=cocoa?[103,54,34]:[205,145,76];
    const set=foodClamp((heat-.15)/.82),brown=foodClamp((heat-.4)/.68),burn=foodClamp((heat-1.12)*1.8);
    for(let y=1;y<199;y++)for(let x=1;x<299;x++){
      const gx=(x-.5)/2,gy=(y-.5)/2,k=Math.floor(gy)*flowWidth+Math.floor(gx);
      if(f.zone[k]<0)continue;
      const a=gx%1,b=gy%1,g=f.grid;
      const h=(1-b)*(g[k]*(1-a)+g[k+1]*a)+b*(g[k+flowWidth]*(1-a)+g[k+flowWidth+1]*a);
      if(h<.016)continue;
      const dome=1-Math.exp(-h*1.6),lift=Math.round(set*dome*(f.p.id==='sheet'?4:15));
      const noise=Math.sin(x*127.1+y*311.7)*43758.5453,grain=noise-Math.floor(noise)-.5;
      const slope=foodClamp((g[k+1]-g[k])*.32+(g[k+flowWidth]-g[k])*.22,-.15,.15);
      const shade=1+slope+grain*(.035+.13*set)-.12*(1-dome);
      const rgb=base.map((c,i)=>(c*(1-brown)+toasted[i]*brown)*shade*(1-burn*.52));
      // Small toasted pores emerge with heat; chocolate flecks stay with the dough.
      const cx=Math.floor(x/16),cy=Math.floor(y/13),seed=Math.sin(cx*71+cy*137)*1357;
      const jitter=seed-Math.floor(seed);
      const speck=(x%16-4-jitter*7)**2+(y%13-4-jitter*4)**2*1.6;
      const chip=s.amounts['Chocolate chips']>0 && jitter>.26 && speck<7;
      const pore=speck<1.1 && jitter>.48;
      if(chip || pore)for(let i=0;i<3;i++)rgb[i]*=chip?.49:1-.28*set;
      for(let z=lift;z>=0;z--){
        const index=((y-z)*300+x)*4;
        if(index<0)continue;
        const side=z===lift?1:.8;
        for(let i=0;i<3;i++)img.data[index+i]=rgb[i]*side;
        img.data[index+3]=Math.min(255,h*3400);
      }
    }
    ctx.putImageData(img,0,0);f.url=f.canvas.toDataURL();f.dirty=false;f.heat=heat;
  }
  return `<svg viewBox="0 0 300 200" preserveAspectRatio="none" role="img" aria-label="${s.pan.name} with ${heat?'baking':'poured'} batter"><image href="paint/${s.pan.id}.webp" width="300" height="200" preserveAspectRatio="none"/><image href="${f.url}" width="300" height="200"/></svg>`;
}
