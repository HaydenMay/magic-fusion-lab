import * as THREE from 'three';
import { BatchedRenderer, ParticleSystem, ConstantValue, IntervalValue, ColorRange, SphereEmitter, RenderMode, ColorOverLife, Gradient, SizeOverLife, PiecewiseBezier, Bezier, ApplyForce, Vector3 as QVec3, Vector4 as QVec4 } from 'three.quarks';

export type ParticleSpec = { color: number; rate?: number; size: [number,number]; life: [number,number]; speed: [number,number]; radius?: number; force?: number; burst?: number; sharp?: boolean };

function texture(sharp: boolean) {
  const c = document.createElement('canvas'); c.width=c.height=64;
  const x=c.getContext('2d')!;
  const glow=x.createRadialGradient(32,32,0,32,32,32);
  glow.addColorStop(0,'rgba(255,255,255,1)');glow.addColorStop(sharp?.12:.18,'rgba(255,255,255,.85)');glow.addColorStop(sharp?.3:.5,'rgba(255,255,255,.2)');glow.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=glow;x.fillRect(0,0,64,64);
  const t=new THREE.CanvasTexture(c);return t;
}

export class ParticleBank {
  batch=new BatchedRenderer();
  private geometry=new THREE.PlaneGeometry(1,1);
  private textures=[texture(false),texture(true)];
  private materials=this.textures.map(map=>new THREE.MeshBasicMaterial({map,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
  private systems=new Set<ParticleSystem>();
  constructor(scene:THREE.Scene){scene.add(this.batch);}
  create(spec:ParticleSpec,position:THREE.Vector3,density:number){
    const col=new THREE.Color(spec.color);
    const rate=new ConstantValue((spec.rate??0)*density);
    const system=new ParticleSystem({
      duration:20,looping:false,autoDestroy:false,worldSpace:true,
      shape:new SphereEmitter({radius:spec.radius??.12,thickness:1}),
      startLife:new IntervalValue(...spec.life),startSize:new IntervalValue(...spec.size),startSpeed:new IntervalValue(...spec.speed),
      startColor:new ColorRange(new QVec4(col.r*2.8,col.g*2.8,col.b*2.8,1),new QVec4(col.r*4.5,col.g*4.5,col.b*4.5,.9)),
      emissionOverTime:rate,
      emissionBursts:spec.burst?[{time:0,count:new ConstantValue(Math.round(spec.burst*density)),cycle:1,interval:.1,probability:1}]:[],
      material:this.materials[spec.sharp?1:0],instancingGeometry:this.geometry,renderMode:RenderMode.BillBoard,
      behaviors:[
        new ColorOverLife(new Gradient([[new QVec3(1,1,1),0],[new QVec3(.4,.3,.3),1]],[[0,0],[.9,.08],[.7,.35],[0,1]])),
        new SizeOverLife(new PiecewiseBezier([[new Bezier(.35,1,.55,0),0]])),
        new ApplyForce(new QVec3(0,spec.force??.5,0),new ConstantValue(1)),
      ],
    });
    system.emitter.position.copy(position);this.batch.addSystem(system);this.systems.add(system);this.batch.parent!.add(system.emitter);
    if(spec.burst)system.pause();
    let disposed=false;
    return {
      system,
      move:(p:THREE.Vector3)=>system.emitter.position.copy(p),
      rate:(r:number)=>{rate.value=r*density;},
      burst:()=>system.restart(),
      stop:()=>{rate.value=0;},
      dispose:()=>{if(disposed)return;disposed=true;system.dispose();this.systems.delete(system);},
    };
  }
  update(dt:number){this.batch.update(Math.min(Math.max(0,dt),.05));}
  get stats(){return {systems:this.systems.size,particles:[...this.systems].reduce((n,s)=>n+s.particleNum,0),batches:this.batch.batches.length};}
  dispose(){
    this.systems.forEach(s=>s.dispose());this.systems.clear();
    for(const b of this.batch.batches){b.dispose();for(const m of Array.isArray(b.material)?b.material:[b.material])m.dispose();}
    this.batch.removeFromParent();this.geometry.dispose();this.materials.forEach(m=>m.dispose());this.textures.forEach(t=>t.dispose());
  }
}
