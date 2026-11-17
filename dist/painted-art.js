// Keep each illustration inside the existing scalable interaction area.
function paintedSprite(file, label, size = 94) {
  const inset = (100 - size) / 2;
  return `<svg viewBox="0 0 100 100" role="img" aria-label="${esc(label)}"><image href="paint/${file}.webp" x="${inset}" y="${100-size}" width="${size}" height="${size}" preserveAspectRatio="xMidYMax meet"/></svg>`;
}
const ingredientPaint = {
  Flour:['flour',98], Sugar:['sugar',86], 'Baking powder':['powder',66],
  'Baking soda':['soda',72], Salt:['salt',50], Cocoa:['cocoa',77],
  'Chocolate chips':['chips',94], Cinnamon:['cinnamon',55], Butter:['butter',80],
  Egg:['egg',57], Milk:['milk',100], Vanilla:['vanilla',50],
  'Lemon juice':['lemonjuice',65], Honey:['honey',82]
};
ingredientArt = name => paintedSprite(ingredientPaint[name][0], name, ingredientPaint[name][1]);
animalArt = kind => paintedSprite(kind,kind+' bakery customer',99);
pawsArt = () => '';
pipingArt = type => paintedSprite(({Strawberry:'pinkpipe',Vanilla:'whitepipe',Chocolate:'brownpipe','Lemon glaze':'yellowpipe'})[type],type+' piping bag');
toppingDish = type => paintedSprite(({Sprinkles:'sprinkles',Strawberries:'berries','Chocolate chips':'morsels',Flowers:'flowers'})[type],type+' dish');
const detailTopping = toppingArt;
toppingArt = type => type==='Strawberries' ? paintedSprite('strawberry',type) : detailTopping(type);

const workingBowl = mixtureBowl;
mixtureBowl = function(kind, smooth) {
  const bowl = workingBowl(kind,smooth);
  const painted = `<image href="paint/${kind==='dry'?'pinkbowl':'bluebowl'}.webp" x="38" y="57" width="284" height="185" preserveAspectRatio="none"/>`;
  return bowl.replace(/<ellipse cx="180" cy="235"[\s\S]*?(?=<ellipse[^>]*class="batter")/, painted)
             .replace(/<g fill="#6d7187">[\s\S]*?<\/svg>/,'</svg>');
};
// Map the batter plane into the four inner corners of each painted tin.
function deepPanArt(p, amount, color='#e3c49a') {
  const loaf=p.id==='loaf';
  const rim=loaf ? [[.052,.511],[.707,.039],[.952,.196],[.305,.682]]
                 : [[.052,.601],[.300,.049],[.946,.102],[.805,.686]];
  const floor=loaf ? [[.202,.644],[.705,.305],[.774,.348],[.305,.682]]
                   : [[.152,.623],[.340,.264],[.885,.297],[.805,.686]];
  const f=foodClamp(amount), spread=Math.min(1,Math.sqrt(f*2.2));
  const corners=floor.map(([x,y],i)=>[x+(rim[i][0]-x)*f,y+(rim[i][1]-y)*f]);
  const center=corners.reduce(([x,y],[a,b])=>[x+a/4,y+b/4],[0,0]);
  const pts=corners.map(([x,y])=>[(center[0]+(x-center[0])*spread)*300,(center[1]+(y-center[1])*spread)*200]);
  const mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2].join(' ');
  let path='M'+mid(pts[3],pts[0]);
  pts.forEach((a,i)=>{const b=pts[(i+1)%4];path+=' L'+[a[0]*.97+pts[(i+3)%4][0]*.03,a[1]*.97+pts[(i+3)%4][1]*.03].join(' ')+' Q'+a.join(' ')+' '+[a[0]*.97+b[0]*.03,a[1]*.97+b[1]*.03].join(' ')});
  const id='panSurface'+illustrationId++;
  return `<svg viewBox="0 0 300 200" role="img" aria-label="${p.name}"><defs><linearGradient id="${id}" x2=".25" y2="1"><stop stop-color="${foodBlend(color,'#81583c',.28)}"/><stop offset=".38" stop-color="${color}"/><stop offset="1" stop-color="${foodBlend(color,'#fff1cf',.24)}"/></linearGradient></defs><image href="paint/${p.id}.webp" width="300" height="200" preserveAspectRatio="none"/>${amount>0?`<path d="${path}Z" fill="url(#${id})" stroke="${foodBlend(color,'#8f6950',.23)}" stroke-width="1"/>`:''}</svg>`;
}
const movingPan = panArt;
panArt = function(p, contents=[], color) {
  if(p.id==='square' || p.id==='loaf') return deepPanArt(p,contents[0]||0,color);
  if (!contents.some(Boolean)) return paintedSprite(p.id,p.name,99).replace('0 0 100 100','0 0 100 72').replace('height="99"','height="71"');
  const live = movingPan(p,contents,color);
  // Paint the steel under the live liquid. Retain the batter shapes and highlights.
  const layer = live.replace(/<(path|ellipse|rect)\b[^>]*\/>/g, mark =>
    mark.includes('fill="'+color+'"') || mark.includes('stroke="#fff') || mark.includes('fill="#fff5d8"') ? mark : '');
  const paintId='panBatter'+illustrationId++;
  const pattern=`<defs><pattern id="${paintId}" width="1" height="1" patternContentUnits="objectBoundingBox"><rect width="1" height="1" fill="${color}"/><image href="paint/smooth-batter.webp" width="1" height="1" preserveAspectRatio="none" opacity=".75" style="mix-blend-mode:multiply"/></pattern></defs>`;
  return layer.replaceAll('fill="'+color+'"','fill="url(#'+paintId+')"').replace(/(<svg[^>]*>)/,`$1${pattern}<image href="paint/${p.id}.webp" x="3" y="14" width="294" height="170" preserveAspectRatio="none"/>`);
};
const simulatedBake = art;
art = function(recipe, quality, frosting, preview) {
  if (preview || !state || state.r!==recipe || state.stage<7) return paintedSprite(recipe.id,recipe.name);
  const visual = bakeAppearance(state);
  const shape = state.pan?.shape || recipe.id;
  const height = 148 * visual.rise;
  const filter = visual.burned?'brightness(.48) saturate(.8)':visual.raw?'brightness(1.15) saturate(.65)':'none';
  const flavor = state.icingPaths?.at(-1)?.type;
  const frosted = state.stage>=8 && flavor;
  const finish = {'Lemon glaze':'lemon', Strawberry:'strawberry', Chocolate:'chocolate', Vanilla:'vanilla'};
  const ratios={cookie:376/286,cupcake:369/358,brownie:393/302,lemon:457/348,cake:442/290};
  const width=Math.min(190,height*ratios[shape]), h=width/ratios[shape];
  const y=75-height+(height-h)/2;
  // The same base image and bounds are used before and after a stroke.
  const base=`<image class="baked-base" href="paint/bare-${shape}.webp" x="${-width/2}" y="${y}" width="${width}" height="${h}" style="filter:${filter}"/>`;
  const caps={cookie:[.87,.55,.08],cupcake:[.88,.60,-.22],brownie:[.91,.56,.01],lemon:[.96,.64,-.02],cake:[.99,.56,-.08]};
  const [scale,depth,offset]=caps[shape];
  const icing=frosted?`<image href="paint/icing-${shape}-${finish[flavor]}.webp" x="${-width*scale/2}" y="${y+h*offset}" width="${width*scale}" height="${h*depth}" preserveAspectRatio="none"/>`:'';
  return `<svg viewBox="-108 -98 216 196" style="overflow:visible" role="img" aria-label="${esc(recipe.name+': '+visual.description)}" data-food-rise="${visual.rise}" data-food-color="${visual.color}" data-food-defects="${visual.flags.join('|')}">${base}${icing}</svg>`;

};
book();

// Painted food surfaces share the live ingredient palette and measured volume.
function paintedSurface(file, v, opacity = 1) {
  return `<image href="paint/${file}.webp" x="${180-v.rx}" y="${v.cy-v.ry}" width="${2*v.rx}" height="${2*v.ry}" preserveAspectRatio="none" opacity="${opacity}"/>`;
}
batterTextureSvg = function(v) {
  if (v.empty) return '';
  const isWet = v.kind==='wet' && !v.combined;
  const powder = v.kind==='dry';
  const smooth = foodClamp(v.progress);
  const base = powder ? 'powder-surface' : isWet && v.egg ? 'egg-surface' : 'soft-batter';
  const finish = powder ? 'powder-surface' : 'smooth-batter';
  const texture = paintedSurface(base,v) + paintedSurface(finish,v,smooth);
  const tint = v.cocoa ? 'sepia(.45) brightness(.64)' : isWet && !v.egg ? 'saturate(.35) brightness(1.12)' : 'none';
  const chips = Array.from({length:Math.min(v.chips,14)},(_,i)=>{
    const x=175+Math.cos(i*2.4)*v.rx*(.2+i%4*.17);
    const y=v.cy-4+Math.sin(i*2.4)*v.ry*.56;
    return `<image href="paint/chip-piece.webp" x="${x}" y="${y}" width="10" height="8"/>`;
  }).join('');
  return `<g class="batter-texture"><g style="filter:${tint}">${texture}</g>${chips}</g>`;
};
surfaceSwirl = () => '';

function ovenRackBake() {
  const s=state, pan=s.pan;
  if (!pan) return art(s.r,.7);
  if(s.flow){
    const heat=s.bakeProgress/s.r.time*(s.temp/s.r.temp)**2;
    const elapsed=s.bakeProgress-(s.flow.lastBakeMinute||0);
    if(elapsed>0 && heat<.4 && s.flow.age<6000)spread(s.flow,Math.min(50,elapsed*160)*(1-heat/.4));
    s.flow.lastBakeMinute=s.bakeProgress;
    return flowArt(s,heat);
  }
  const tin=panArt(pan,s.panContents,batterAppearance('combined',s).color);
  const progress=foodClamp(s.bakeProgress/s.r.time);
  const multiple=pan.wells===6;
  const treats=s.panContents.map((fill,index)=>{
    if (!fill) return '';
    const width=multiple ? 63 : pan.id==='loaf' ? 160 : 220;
    const height=(multiple ? 55 : 125)*foodClamp(fill,.4,1.15)*(.68+.32*progress);
    const center=multiple ? 63+index%3*86 : 150;
    const bottom=multiple ? 92+Math.floor(index/3)*65 : 145;
    return `<svg x="${center-width/2}" y="${bottom-height}" width="${width}" height="${height}" viewBox="-108 -98 216 196" opacity="${foodClamp(progress*3)}">${art(s.r,.7).replace(/^<svg[^>]*>|<\/svg>$/g,'')}</svg>`;
  }).join('');
  return tin.replace('</svg>',treats+'</svg>');
}
refreshOvenAppearance = function() {
  const food=document.querySelector('.inoven-food');
  if(food) food.innerHTML=ovenRackBake();
};
