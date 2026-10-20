import './style.css';
import * as THREE from 'three';
import { createWorld, ORIGIN, TARGET, type Quality } from './scene.ts';
import { ParticleBank } from './particles.ts';
import { Playback, type SpellId } from './playback.ts';
import { createSpell } from './spells.ts';

const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
function activate(button:HTMLElement,action:()=>void){
  let lastTouch=-Infinity;
  button.addEventListener('pointerup',event=>{
    if(event.pointerType!=='touch')return;
    lastTouch=performance.now();action();
  });
  button.addEventListener('click',event=>{
    if(event.detail!==0&&performance.now()-lastTouch<800)return;
    action();
  });
}
const descriptions:Record<SpellId,{name:string;description:string;type:string;index:string;color:string}>={
  fire:{name:'Pyroclasm',description:'A molten heart. A trail of embers. A beautiful collapse.',type:'THERMAL',index:'01',color:'#e3a367'},
  lightning:{name:'Thunderstrike',description:'A moment of stillness. Then the sky comes apart.',type:'ELECTRICAL',index:'02',color:'#83d6eb'},
  fusion:{name:'Helios',description:'Two forces, one new phenomenon. The birth of an electric sun.',type:'SPELL WEAVING',index:'03',color:'#c1a1ef'},
};
let cleanup=()=>{};
function showError(message:string){el('loading').style.display='none';el('error-message').textContent=message;el('error').hidden=false;}
activate(el('reload'),()=>location.reload());

try{
  const phone=matchMedia('(pointer: coarse)').matches||Math.min(innerWidth,innerHeight)<600;
  let quality:Quality=phone?'mobile':'high';let selected:SpellId='fire';let slow=false;
  const qualityInput=el<HTMLSelectElement>('quality');qualityInput.value=quality;
  const world=createWorld(el('viewport'),quality);const bank=new ParticleBank(world.scene);
  const playback=new Playback(id=>createSpell(world.scene,world.camera,bank,id,quality));
  let ready=false,raf=0,last=performance.now(),fpsFrames=0,fpsStart=last,fps=0,elapsed=0,disposed=false;
  const cast=()=>{playback.cast(selected);el('cast-label').textContent='Cast again';};
  document.querySelectorAll<HTMLButtonElement>('[data-spell]').forEach(button=>activate(button,()=>{
    selected=button.dataset.spell as SpellId;const s=descriptions[selected];
    document.documentElement.style.setProperty('--accent',s.color);el('spell-name').textContent=s.name;el('spell-description').textContent=s.description;el('spell-type').textContent=s.type;el('spell-index').textContent=`EXPERIMENT ${s.index}`;
    document.querySelectorAll('[data-spell]').forEach(b=>{const active=(b as HTMLElement).dataset.spell===selected;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  }));
  activate(el('cast'),cast);
  qualityInput.addEventListener('change',()=>{quality=qualityInput.value as Quality;playback.clear();world.setQuality(quality);});
  activate(el('reset'),world.reset);
  activate(el('speed'),()=>{slow=!slow;el('speed').setAttribute('aria-pressed',String(slow));});
  const resize=()=>world.resize();window.addEventListener('resize',resize);
  const observer=new ResizeObserver(resize);observer.observe(el('viewport'));
  const contextLost=(e:Event)=>{e.preventDefault();cancelAnimationFrame(raf);showError('The graphics connection was interrupted. Close other heavy tabs, then tap Try again to reopen the laboratory.');};
  world.renderer.domElement.addEventListener('webglcontextlost',contextLost);
  const phaseLabels={idle:'READY TO CAST',charge:'GATHERING ENERGY',release:'ENERGY RELEASED',impact:'ELEMENTAL REACTION',decay:'DISSIPATING'};
  let previousPhase='';
  const originTag=new THREE.Vector3(ORIGIN.x,-.35,ORIGIN.z+.45),targetTag=new THREE.Vector3(TARGET.x,-.35,TARGET.z+.45);
  function frame(now:number){
    if(disposed)return;
    try{
      const dt=Math.min((now-last)/1000,.05);last=now;elapsed+=dt;
      if(document.hidden){raf=requestAnimationFrame(frame);return;}
      const step=dt*(slow?.5:1);playback.update(step);bank.update(step);world.render(elapsed);
      fpsFrames++;
      if(now-fpsStart>=700){fps=Math.round(fpsFrames*1000/(now-fpsStart));el('fps').textContent=`${fps} FPS`;fpsFrames=0;fpsStart=now;}
      if(previousPhase!==playback.phase){previousPhase=playback.phase;el('phase').textContent=phaseLabels[playback.phase];}
      el('progress').style.width=`${playback.progress*100}%`;
      for(const [name,point]of [['origin-tag',originTag],['target-tag',targetTag]] as const){const p=world.project(point);const tag=el(name);tag.style.left=`${p.x}px`;tag.style.top=`${p.y}px`;tag.style.display=p.visible?'block':'none';}
      if(!ready){ready=true;el('loading').style.opacity='0';setTimeout(()=>el('loading').style.display='none',650);}
      raf=requestAnimationFrame(frame);
    }catch(error){console.error(error);showError('A graphics error interrupted the experiment. Try Mobile quality after reloading, or open this page in an up-to-date browser.');}
  }
  // Read-only diagnostics make performance and ownership visible in any browser console.
  const gl=world.renderer.getContext();const ext=gl.getExtension('WEBGL_debug_renderer_info');
  const gpu=ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);
  Object.assign(window,{__lab:{stats:()=>({ready,selected,active:playback.id,phase:playback.phase,time:playback.time,quality,fps,...bank.stats,geometries:world.renderer.info.memory.geometries,textures:world.renderer.info.memory.textures,drawCalls:world.renderer.info.render.calls,camera:world.camera.position.toArray(),gpu})}});
  raf=requestAnimationFrame(frame);
  cleanup=()=>{if(disposed)return;disposed=true;cancelAnimationFrame(raf);observer.disconnect();window.removeEventListener('resize',resize);playback.clear();bank.dispose();world.dispose();};
  window.addEventListener('pagehide',e=>{if(!e.persisted)cleanup();});
  if(import.meta.hot)import.meta.hot.dispose(cleanup);
}catch(error){
  console.error(error);cleanup();showError('This experiment needs WebGL 2. Open it in a recent Safari, Chrome, or Edge with graphics acceleration enabled. If memory is low, close other tabs and tap Try again.');
}
