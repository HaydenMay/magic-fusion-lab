import * as THREE from 'three';
import { ParticleBank } from './particles.ts';
import { coreMaterial, Ribbon, shockMaterial } from './materials.ts';
import { ORIGIN, TARGET, palette, type Quality } from './scene.ts';
import { timings, type SpellId, type CastEffect } from './playback.ts';

const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const ease=(x:number)=>x*x*(3-2*x);
const TAU=Math.PI*2;
const random=(a:number,b:number)=>{const n=Math.sin(a*127.1+b*311.7)*43758.5453;return (n-Math.floor(n))-.5;};

export function createSpell(scene:THREE.Scene,camera:THREE.Camera,bank:ParticleBank,id:SpellId,quality:Quality):CastEffect{
  const isFire=id==='fire',isBolt=id==='lightning',isFusion=id==='fusion';
  const density=quality==='high'?1:.55;
  const timing=timings[id];const color=palette[id];
  const group=new THREE.Group();scene.add(group);
  const sphere=new THREE.IcosahedronGeometry(1,4);
  const mainMat=coreMaterial(isFire?0xff3e0b:isBolt?0x2a79df:0x8b35dc,isFire?0xffb321:isBolt?0x89dfff:0x28ddf0,isFusion);
  const main=new THREE.Mesh(sphere,mainMat);group.add(main);
  const impactMat=coreMaterial(isFire?0xee3f0a:isBolt?0x2776d9:0x6828c5,isFire?0xff9d28:isBolt?0x89ddff:0x36e6ef,isFusion);
  const impact=new THREE.Mesh(sphere,impactMat);impact.position.copy(TARGET);group.add(impact);
  const light=new THREE.PointLight(color,0,14,1.6);group.add(light);
  const hitLight=new THREE.PointLight(color,0,17,1.6);hitLight.position.copy(TARGET);group.add(hitLight);
  const haloGroup=new THREE.Group();haloGroup.position.copy(ORIGIN);group.add(haloGroup);
  const haloMaterial=new THREE.MeshBasicMaterial({color:isFusion?0xffa24a:color,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
  const haloGeometry=new THREE.TorusGeometry(.75,.012,5,80);
  const halos=Array.from({length:3},(_,i)=>{const m=new THREE.Mesh(haloGeometry,haloMaterial);m.rotation.set(i*.7,i*.9,.3);haloGroup.add(m);return m;});
  const sealMat=shockMaterial(color);const seal=new THREE.Mesh(new THREE.PlaneGeometry(2,2),sealMat);seal.rotation.x=-Math.PI/2;seal.position.set(ORIGIN.x,.09,ORIGIN.z);group.add(seal);
  const shocks=Array.from({length:3},(_,i)=>{const mat=shockMaterial(isFusion&&i===1?0xffa347:color);const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),mat);mesh.rotation.x=-Math.PI/2;mesh.position.set(TARGET.x,.1+i*.02,TARGET.z);group.add(mesh);return mesh;});

  const stream=bank.create({color:isFire?0xff6514:isBolt?0x49baff:0x9b54ff,rate:isBolt?100:270,size:isBolt?[.06,.14]:[.18,.47],life:[.3,.8],speed:[.15,.8],force:isFire?1.4:.3,radius:.2},ORIGIN,density);
  const sparks=bank.create({color:isFire?0xffbb49:isBolt?0x8cefff:0xf4b1ff,rate:120,size:[.035,.075],life:[.5,1.2],speed:[.7,2],force:isFire?.5:-.1,sharp:true,radius:.18},ORIGIN,density);
  const explosion=bank.create({color:isFire?0xff7d1f:isBolt?0x6aeaff:0xbca5ff,size:isFire?[.25,.6]:[.1,.35],life:[.45,1.15],speed:[1.3,4.6],force:.4,burst:240,radius:.25},TARGET,density);
  const debris=bank.create({color:isFire?0xffb94f:isBolt?0xa5fcff:0xffad57,size:[.035,.085],life:[.6,1.7],speed:[2,6],force:-1.8,burst:190,sharp:true,radius:.35},TARGET,density);
  const particles=[stream,sparks,explosion,debris];
  const ribbons:Ribbon[]=[];const paths:THREE.Vector3[][]=[];
  const count=isBolt?17:isFusion?20:13;
  for(let i=0;i<count;i++){
    const a=isFire?(i%2?0xff2c08:0xff8d26):isBolt?(i%3?0x389dff:0x8eefff):(i%2?0x26cfff:0xff762d);
    const r=new Ribbon(isBolt?34:48,a,isFire?0xffd684:isBolt?0xeaffff:0xd9bcff);group.add(r.mesh);r.hide();ribbons.push(r);paths.push(Array.from({length:r.count},()=>new THREE.Vector3()));
  }
  let triggered=false,disposed=false;
  const head=new THREE.Vector3();
  function draw(i:number,width:number,opacity:number,time:number){ribbons[i].update(paths[i],width,opacity,time,camera);}
  function hideAll(){ribbons.forEach(r=>r.hide());}

  function update(time:number,_dt:number){
    const charge=clamp(time/timing.release),fly=clamp((time-timing.release)/(timing.impact-timing.release));
    const hitAge=time-timing.impact;const hit=clamp(hitAge/(timing.end-timing.impact));
    const beforeHit=time<timing.impact;const charging=time<timing.release;
    const fade=1-ease(clamp((hitAge-.4)/(timing.end-timing.impact-.4)));
    mainMat.uniforms.uTime.value=time;impactMat.uniforms.uTime.value=time*1.2;
    head.lerpVectors(ORIGIN,TARGET,ease(fly));head.y+=Math.sin(fly*Math.PI)*(isFire?.8:isFusion?.55:0);
    main.position.copy(head);main.visible=beforeHit&&(!isBolt||charging);
    const mainScale=charging?.04+Math.pow(charge,1.5)*(isFusion?.68:isFire?.6:.38):isFusion?.63:.58;
    main.scale.setScalar(mainScale*(1+Math.sin(time*25)*.025));main.rotation.set(time*.3,time*.8,time*.2);
    mainMat.uniforms.uOpacity.value=clamp(charge*2);
    impact.visible=hitAge>=0;
    const impactSize=isBolt?.3+Math.sin(clamp(hitAge/.65)*Math.PI)*.55:isFusion?(hitAge<.15?.6*(1-hitAge/.2):.4+Math.pow(clamp((hitAge-.15)/.55),.7)*1.15):.45+Math.pow(clamp(hitAge/.5),.6)*.9;
    impact.scale.setScalar(impactSize);impactMat.uniforms.uOpacity.value=fade*(isFire?.8:1);
    impact.rotation.set(time*.4,-time*.8,time*.3);
    light.position.copy(head);light.intensity=beforeHit?(charging?charge*16:24):0;
    hitLight.intensity=hitAge>=0?Math.max(0,1-hitAge/1.8)*(isFusion?42:34):0;
    haloGroup.visible=charging||time<timing.release+.25;haloGroup.scale.setScalar(.35+charge*.9);
    haloMaterial.opacity=charging?charge*.65:clamp(1-(time-timing.release)/.25)*.5;
    halos.forEach((h,i)=>{h.rotation.x=time*(i%2?1:-1)+i;h.rotation.y=time*.8+i;});
    seal.scale.setScalar(.8+charge*.45);sealMat.uniforms.uOpacity.value=beforeHit?.3+charge*.4:fade*.15;
    sealMat.uniforms.uTime.value=time;
    stream.move(head);sparks.move(head);
    stream.rate(beforeHit?(charging?100*charge:isBolt?0:330):0);sparks.rate(beforeHit?(charging?95*charge:160):0);
    if(hitAge>=0&&!triggered){triggered=true;explosion.burst();debris.burst();stream.stop();sparks.stop();}
    shocks.forEach((s,i)=>{
      const t=hitAge-i*.12;const alive=t>=0&&t<1.6+i*.2;s.visible=alive;
      s.scale.setScalar(.3+Math.max(t,0)*(isFusion?3.6:2.8)*(1-i*.16));
      s.material.uniforms.uOpacity.value=alive?Math.pow(1-clamp(t/(1.6+i*.2)),2)*.85:0;s.material.uniforms.uTime.value=time;
    });
    hideAll();
    if(isFire){
      // Flame tongues close around the seed, then unravel into a corkscrew wake.
      for(let i=0;i<5;i++){
        const points=paths[i];
        points.forEach((p,j)=>{const u=j/(points.length-1);const a=i/5*TAU+time*5-u*6;const radius=(charging?.55*Math.sin(u*Math.PI)*charge:(.1+u*.48)*Math.sin(u*Math.PI));
          if(charging)p.set(ORIGIN.x+Math.cos(a)*radius,ORIGIN.y+(u-.5)*1.8*charge,ORIGIN.z+Math.sin(a)*radius);
          else p.set(head.x-u*Math.min(fly*7,3.8),head.y+Math.cos(a)*radius+u*.2,head.z+Math.sin(a)*radius);
        });
        if(beforeHit)draw(i,charging?.09*charge:.15,(charging?charge:1)*.8,time);
      }
      if(hitAge>=0){
        for(let i=5;i<13;i++){
          const a=(i-5)/8*TAU;const points=paths[i];const spread=.5+clamp(hitAge/.8)*2;
          points.forEach((p,j)=>{const u=j/(points.length-1);const r=Math.sin(u*Math.PI*.9)*spread;const angle=a+u*1.4+time*.4;p.set(TARGET.x+Math.cos(angle)*r,TARGET.y+Math.sin(u*Math.PI)*(.8+hitAge*.6)-u*.8,TARGET.z+Math.sin(angle)*r);});
          draw(i,.16*(1-hit*.6),fade*.65,time);
        }
      }
    }else if(isBolt){
      const seed=Math.floor(time*24);
      if(charging){
        for(let i=0;i<3;i++){
          const points=paths[i];points.forEach((p,j)=>{const u=j/(points.length-1),a=u*TAU+time*3+i*2,r=.3+charge*.6;p.set(ORIGIN.x+Math.cos(a)*r,ORIGIN.y+Math.sin(a)*r,Math.sin(u*TAU*3+time*4)*.2);});draw(i,.025+charge*.02,charge,time);
        }
      }else if(time<timing.decay){
        for(let i=0;i<4;i++){
          const points=paths[i];points.forEach((p,j)=>{const u=j/(points.length-1),envelope=Math.sin(u*Math.PI);p.lerpVectors(ORIGIN,TARGET,u*clamp(fly*1.3));p.y+=random(j+i*73,seed)*envelope*(i===0?.8:1.6);p.z+=random(j+i*91,seed+4)*envelope*(i===0?.6:1.4);});draw(i,i===0?.055:.028,.7+Math.sin(time*80+i)*.2,time);
        }
        for(let i=4;i<9;i++){
          const points=paths[i];const root=paths[0][7+(i-4)*4];points.forEach((p,j)=>{const u=j/(points.length-1);p.copy(root);p.x+=u*(.4+(i%3)*.5);p.y-=u*(.6+(i%2)*.3);p.z+=(i%2?1:-1)*u*.7;p.y+=random(j+i*19,seed)*Math.sin(u*Math.PI)*.3;});draw(i,.018,.65,time);
        }
      }
      if(hitAge>=0){
        for(let i=9;i<17;i++){
          const a=(i-9)/8*TAU,reach=1.6+clamp(hitAge/.5)*1.1;const points=paths[i];
          points.forEach((p,j)=>{const u=j/(points.length-1);p.set(TARGET.x+Math.cos(a)*u*reach,TARGET.y*(1-u)+.12,TARGET.z+Math.sin(a)*u*reach);p.x+=random(j+i*33,seed)*Math.sin(u*Math.PI)*.35;p.z+=random(j+i*7,seed)*Math.sin(u*Math.PI)*.35;});draw(i,.025,fade*(.5+.5*Math.sin(time*30+i)**2),time);
        }
      }
    }else{
      // Two parent energies become a single six-strand plasma helix.
      for(let i=0;i<6;i++){
        const points=paths[i];const parity=i%2?1:-1;
        points.forEach((p,j)=>{const u=j/(points.length-1);const a=i/6*TAU+time*5*parity-u*(charging?6:10);const r=(charging?Math.sin(u*Math.PI)*(.3+charge*.65):Math.sin(u*Math.PI)*(.28+u*.5));
          if(charging)p.set(ORIGIN.x+Math.cos(a)*r,ORIGIN.y+(u-.5)*2.2*charge,Math.sin(a)*r);
          else p.set(head.x-u*Math.min(fly*7,4.6),head.y+Math.cos(a)*r,head.z+Math.sin(a)*r);
        });if(beforeHit)draw(i,charging?.065:.095,charging?charge*.9:.9,time);
      }
      if(hitAge>=0){
        // A compressed seed unfolds into interlocked solar petals and electric spokes.
        const expansion=ease(clamp((hitAge-.12)/.72));
        for(let i=6;i<20;i++){
          const points=paths[i],a=(i-6)/14*TAU;
          points.forEach((p,j)=>{const u=j/(points.length-1);const r=(.15+expansion*2.8)*Math.sin(u*Math.PI);const angle=a+Math.sin(u*Math.PI)*.5+time*.3;const jag=isFusion&&i%3===0?random(j+i,Math.floor(time*14))*.12:0;
            p.set(TARGET.x+Math.cos(angle)*r,TARGET.y+Math.sin(u*TAU)*(.25+expansion*.7)+jag,TARGET.z+Math.sin(angle)*r);
          });draw(i,i%3===0?.04:.09,fade*(.4+expansion*.5),time);
        }
      }
    }
  }
  function dispose(){
    if(disposed)return;disposed=true;particles.forEach(p=>p.dispose());ribbons.forEach(r=>r.dispose());
    sphere.dispose();mainMat.dispose();impactMat.dispose();haloGeometry.dispose();haloMaterial.dispose();seal.geometry.dispose();sealMat.dispose();shocks.forEach(s=>{s.geometry.dispose();s.material.dispose();});
    group.removeFromParent();light.dispose();hitLight.dispose();
  }
  return {update,dispose};
}
