// Ingredients prepare directly at the bowl; no modal interrupts the kitchen.
function animateIngredient(name,amount,unit,onDone){
const bowl=document.getElementById('dropBowl');if(!bowl){onDone();return}const egg=name==='Egg',butter=name==='Butter',liquid=['Milk','Vanilla','Lemon juice','Honey'].includes(name);const scene=document.createElement('span');scene.className='in-bowl-animation '+(egg?'inline-egg':butter?'inline-butter':liquid?'inline-liquid':'inline-powder');scene.setAttribute('aria-hidden','true');scene.style.setProperty('--ingredient-color',name==='Cocoa'?'#a67c61':name==='Chocolate chips'?'#86604e':name==='Vanilla'?'#c59b72':name==='Lemon juice'?'#efd887':name==='Honey'?'#e8bc67':'#fff3d8');
scene.innerHTML=egg?`<svg class="inline-shells" viewBox="0 0 160 150"><g class="shell-left"><path d="M79 17C48 17 27 68 30 96l14-10 13 12 12-13 11 15Z" fill="#f6e4c5" stroke="#c7a883" stroke-width="2"/></g><g class="shell-right"><path d="M81 17c31 0 52 51 49 79l-14-10-13 12-12-13-11 15Z" fill="#ecd4ad" stroke="#c7a883" stroke-width="2"/></g></svg><i class="inline-egg-white"></i><i class="inline-yolk"></i>`:butter?`<span class="inline-source">${ingredientArt(name)}</span>${[0,1,2].map(i=>`<i class="inline-cube" style="--i:${i}"></i>`).join('')}`:`<span class="inline-source">${ingredientArt(name)}</span><span class="inline-stream">${liquid?'<i class="ribbon"></i>':Array.from({length:16},(_,i)=>`<i class="grain" style="--i:${i};--x:${i*13%35-17}px;--delay:${i%6*.08}s"></i>`).join('')}</span>`;
scene.innerHTML+='<i class="inline-ripple"></i>';bowl.appendChild(scene);const next=document.getElementById('next'),undo=document.getElementById('undoPour');if(next)next.disabled=true;if(undo)undo.disabled=true;document.getElementById('pourNote').textContent=egg?'Crack… plop!':butter?'In tumble the buttery cubes…':`Pouring the ${name.toLowerCase()}…`;setTimeout(()=>{scene.remove();if(next?.isConnected)next.disabled=false;if(undo?.isConnected)undo.disabled=false;onDone()},egg?1350:1100)
}
function kitchenDecor(){return `<div class="kitchen-backdrop" aria-hidden="true"><div class="kitchen-window"><div class="window-view"><i></i><b></b></div><div class="window-frame"></div><span class="curtain left"></span><span class="curtain right"></span><span class="window-sill"></span></div><div class="utensil-rail"><i></i><span>♧</span><b></b></div><div class="wood-counter"><i class="drawer d1"></i><i class="drawer d2"></i><i class="drawer d3"></i></div><div class="kitchen-plant"><i></i><b></b></div></div>`}
function addKitchen(){const work=document.getElementById('work');if(work&&!work.querySelector('.kitchen-backdrop'))work.insertAdjacentHTML('afterbegin',kitchenDecor())}
const renderKitchenBase=render;render=function(){renderKitchenBase();addKitchen()};
const baseBakeStage=bakeStage;bakeStage=function(){baseBakeStage();addKitchen()};
const baseDecorateStage=decorateStage;decorateStage=function(){baseDecorateStage();addKitchen()};
const baseIngredientStage=ingredientStage;ingredientStage=function(){baseIngredientStage();addKitchen()};
function shortFeedback(result,correctFrost,correctTop,r){const first=result.notes[0]?.[1];if(first)return first+(!correctFrost||!correctTop?' Next time, try my favorite '+r.frost.toLowerCase()+' and '+r.top.toLowerCase()+'.':' You remembered my favorite decorations!');return correctFrost&&correctTop?'Soft, sweet, and decorated just how I like it. I’ll be back for another!':'The bake tastes lovely; next time I’d love '+r.frost.toLowerCase()+' and '+r.top.toLowerCase()+'.'}
results=function(){clearTimers();const s=state,r=s.r,result=scoreBake(),correctFrost=s.frost===r.frost,correctTop=s.decor.some(x=>x.type===r.top);const points=Math.max(0,100-result.penalty-(correctFrost?0:10)-(correctTop?0:10)),stars=points>=97?5:points>=80?4:points>=60?3:points>=35?2:1;const feedback=shortFeedback(result,correctFrost,correctTop,r);const quote=stars===5?'Oh my whiskers. You made my whole day!':stars===4?'A little bite of happiness. Thank you, baker!':stars===3?'A cozy little treat! Shall we try another batch together?':'Every baker needs a practice batch. I’m cheering for you!';app.innerHTML=`<section class="pickup-scene" aria-label="Bakery pickup counter">
  <div class="pickup-character">
    <img src="paint/pickup-${r.animal}.webp" alt="${r.customer} holding a plate">
    <div class="pickup-bake">${plate().replace(/id="plate"[^>]*>/,'role="img" aria-label="Your decorated '+esc(r.name)+'">')}</div>
  </div>
  <div class="customer-speech" role="region" aria-label="Customer rating and feedback">
    <strong>${r.customer}</strong><h2>“${quote}”</h2>
    <div class="stars" aria-label="${stars} out of 5 stars">${'★'.repeat(stars)}${'☆'.repeat(5-stars)}</div>
    <p class="brief-feedback">${feedback}</p>
  </div>
  <div class="actions"><button class="quiet" id="again">Bake for ${r.customer.split(' ')[0]} again</button><button class="primary" id="choose">Meet another customer →</button></div>
</section>`;document.getElementById('again').onclick=()=>start(recipes.indexOf(r));document.getElementById('choose').onclick=book;app.scrollIntoView({block:'start',behavior:'instant'})};
// Redraw the recipe book after the illustration and customer upgrades are loaded.
book();
