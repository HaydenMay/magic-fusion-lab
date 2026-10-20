import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export type Quality = 'mobile' | 'high';
export const ORIGIN = new THREE.Vector3(-3.35, 1.3, 0);
export const TARGET = new THREE.Vector3(3.35, 1.3, 0);
export const palette = { fire: 0xff7636, lightning: 0x64dfff, fusion: 0xc19aff };

function engravings() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1024;
  const c = canvas.getContext('2d')!; c.translate(512, 512); c.strokeStyle = '#a9afa0'; c.lineWidth = 1.3;
  for (const r of [255, 266, 378, 392, 441, 455]) { c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.stroke(); }
  for (let i = 0; i < 64; i++) {
    c.save(); c.rotate(i * Math.PI / 32); c.beginPath(); c.moveTo(0, 441); c.lineTo(0, i % 4 === 0 ? 413 : 430); c.stroke();
    if (i % 4 === 0) { c.strokeRect(-4, 395, 8, 8); c.beginPath(); c.moveTo(-8, 362); c.lineTo(0, 351); c.lineTo(8, 362); c.moveTo(0, 351); c.lineTo(0, 374); c.stroke(); }
    c.restore();
  }
  for (let i = 0; i < 12; i++) {
    c.save(); c.rotate(i * Math.PI / 6); c.beginPath(); c.moveTo(0, 270); c.lineTo(0, 331); c.moveTo(-5, 314); c.lineTo(5, 314); c.stroke(); c.restore();
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createWorld(host: HTMLElement, initialQuality: Quality) {
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
  renderer.setClearColor(0x080e12); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x080e12, 0.025);
  const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = .07; controls.enablePan = false;
  controls.minDistance = 10; controls.maxDistance = 28; controls.minPolarAngle = .28; controls.maxPolarAngle = Math.PI * .46;
  controls.rotateSpeed = .65; controls.zoomSpeed = .75;
  scene.add(new THREE.HemisphereLight(0xa0c1d4, 0x102030, 1.5));
  const moon = new THREE.DirectionalLight(0x7eabc6, 2.6); moon.position.set(-3, 10, 5); scene.add(moon);
  const rim = new THREE.DirectionalLight(0x435e7d, 2); rim.position.set(5, 4, -7); scene.add(rim);
  const stone = new THREE.MeshStandardMaterial({ color: 0x17252b, roughness: .66, metalness: .55, flatShading: true });
  const edge = new THREE.MeshStandardMaterial({ color: 0x283940, roughness: .42, metalness: .7 });
  const brass = new THREE.MeshStandardMaterial({ color: 0x867452, roughness: .5, metalness: .8, emissive: 0x5a4527, emissiveIntensity: .16 });
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(7.4, 7.7, .55, 96), stone); floor.position.y = -.35; scene.add(floor);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(5.85, 5.85, .12, 96), edge); inner.position.y = -.06; scene.add(inner);
  const etching = new THREE.Mesh(new THREE.PlaneGeometry(14.8, 14.8), new THREE.MeshBasicMaterial({ map: engravings(), color: 0xd1b889, transparent: true, opacity: .36, depthWrite: false }));
  etching.rotation.x = -Math.PI / 2; etching.position.y = .012; scene.add(etching);
  for (const r of [5.9, 6.1, 7.25]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(r, .022, 5, 100), brass); ring.rotation.x = Math.PI / 2; ring.position.y = .035; scene.add(ring); }
  const jointGeo = new THREE.BoxGeometry(.012, .008, 1.1); const joints = new THREE.InstancedMesh(jointGeo, brass, 36); const d = new THREE.Object3D();
  for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2; d.position.set(Math.cos(a)*6.65,.015,Math.sin(a)*6.65); d.rotation.y = -a + Math.PI / 2; d.updateMatrix(); joints.setMatrixAt(i,d.matrix); } scene.add(joints);

  const monoliths: THREE.Group[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const g = new THREE.Group(); g.position.set(Math.cos(a)*6.8, 0, Math.sin(a)*6.8); g.rotation.y = -a;
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(.5,.64,.24,4), stone); plinth.rotation.y = Math.PI / 4; plinth.position.y = .12; g.add(plinth);
    const block = new THREE.Mesh(new THREE.CylinderGeometry(.22,.36,1.6,4), stone); block.rotation.y = Math.PI / 4; block.position.y = 1.16; block.rotation.z = (i%2 ? 1 : -1)*.07; g.add(block);
    const cap = new THREE.Mesh(new THREE.OctahedronGeometry(.16,0), new THREE.MeshBasicMaterial({ color: 0x82b8be })); cap.position.y = 2.18; cap.scale.y = 1.5; g.add(cap);
    const slit = new THREE.Mesh(new THREE.BoxGeometry(.012,.62,.014), new THREE.MeshBasicMaterial({ color: 0x688f95 })); slit.position.set(.265,1.2,0); g.add(slit);
    scene.add(g); monoliths.push(g);
  }
  for (const [index, point] of [ORIGIN, TARGET].entries()) {
    const base = new THREE.Group(); base.position.set(point.x,.07,point.z); scene.add(base);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(.9,1,.12,48),stone); disc.position.y = -.015; base.add(disc);
    for (const r of [.63,.82]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(r,.012,4,64), new THREE.MeshBasicMaterial({ color: index ? 0x75a6ac : 0xc49d68, transparent:true,opacity:.55 })); ring.rotation.x = Math.PI/2; ring.position.y = .07; base.add(ring); }
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(.2), new THREE.MeshStandardMaterial({color:0x8b9ca0,metalness:.8,roughness:.2,emissive:index?0x3e626c:0x684c2e,emissiveIntensity:.6})); gem.position.y = .32; gem.scale.y = 1.6; base.add(gem);
  }
  const dustCount = 160; const dustPositions = new Float32Array(dustCount*3);
  for(let i=0;i<dustCount;i++){dustPositions[i*3]=(Math.random()-.5)*27;dustPositions[i*3+1]=.5+Math.random()*9;dustPositions[i*3+2]=(Math.random()-.5)*24;}
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPositions,3));
  const dust = new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0x779a9e,size:.025,transparent:true,opacity:.5,depthWrite:false})); scene.add(dust);

  const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene,camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(512,512), .8, .65, 1); composer.addPass(bloom); composer.addPass(new OutputPass());
  let quality = initialQuality;
  let width = 0, height = 0;
  const isPortrait = () => host.clientWidth/host.clientHeight < .85;
  const home = () => {
    const damping=controls.enableDamping;controls.enableDamping=false;controls.update();
    const portrait=isPortrait(),compact=portrait&&host.clientHeight<700,landscape=host.clientHeight<500&&!portrait;
    controls.target.set(0,portrait?(compact?-2.9:-1.5):landscape?-1.4:.4,0);
    camera.position.set(portrait?10.8:9.5,portrait?(compact?12.3:13.5):10.3,portrait?20:15);
    controls.update();controls.enableDamping=damping;controls.saveState();
  };
  const resize = () => {
    const newWidth=host.clientWidth,newHeight=host.clientHeight;
    const changedOrientation = (width/height < .85) !== (newWidth/newHeight < .85);
    width=newWidth;height=newHeight;
    camera.aspect=width/height;camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='mobile'?1.25:1.75)); renderer.setSize(width,height,false);
    composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(width,height);
    if(quality==='mobile')bloom.setSize(Math.round(width*.65),Math.round(height*.65));
    if (changedOrientation) home();
  };
  home(); resize();
  const setQuality = (value: Quality) => { quality=value;bloom.strength=value==='high'?.95:.75;resize(); };
  const project = (point: THREE.Vector3) => { const p=point.clone().project(camera);return {x:(p.x*.5+.5)*width,y:(-p.y*.5+.5)*height,visible:p.z<1}; };
  renderer.info.autoReset=false;
  const render = (time:number) => { controls.update(); dust.rotation.y=time*.008; monoliths.forEach((g,i)=>{g.children[2].position.y=2.18+Math.sin(time*.7+i)*.09;g.children[2].rotation.y=time*.25;});renderer.info.reset();composer.render(); };
  const dispose = () => {
    controls.dispose(); bloom.dispose(); composer.dispose();
    const geometries=new Set<THREE.BufferGeometry>(), materials=new Set<THREE.Material>(), textures=new Set<THREE.Texture>();
    scene.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Points){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);const map=(m as THREE.MeshBasicMaterial).map;if(map)textures.add(map);}}});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();renderer.domElement.remove();
  };
  return {scene,camera,renderer,controls,resize,setQuality,reset:home,render,project,dispose};
}
