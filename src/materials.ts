import * as THREE from 'three';

const noise=`
float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.3,.7));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){return noise(p)*.55+noise(p*2.03)*.28+noise(p*4.1)*.17;}
`;

export function coreMaterial(a:number,b:number,fusion=false){
  return new THREE.ShaderMaterial({
    uniforms:{uTime:{value:0},uOpacity:{value:1},uA:{value:new THREE.Color(a)},uB:{value:new THREE.Color(b)},uFusion:{value:fusion?1:0}},
    vertexShader:`uniform float uTime;varying vec3 vP;varying vec3 vN;varying vec3 vV;${noise}
      void main(){vP=position;float n=fbm(position*3.+vec3(0,-uTime*2.,uTime*.5));vec3 p=position+normal*(n-.5)*.23;vec4 mv=modelViewMatrix*vec4(p,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`uniform float uTime;uniform float uOpacity;uniform vec3 uA;uniform vec3 uB;uniform float uFusion;varying vec3 vP;varying vec3 vN;varying vec3 vV;${noise}
      void main(){float n=fbm(vP*4.+vec3(uTime*.5,-uTime*1.8,uTime));float cracks=pow(1.-abs(n*2.-1.),8.);float rim=pow(1.-abs(dot(normalize(vN),normalize(vV))),2.);float band=sin(vP.y*19.+atan(vP.z,vP.x)*4.-uTime*8.)*.5+.5;vec3 col=mix(uA*.28,uB*.78,clamp(n*.9+band*uFusion*.6,0.,1.));col+=mix(uA,uB,.28)*cracks*.7+uA*rim*.9;gl_FragColor=vec4(col,uOpacity);}`,
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  });
}

export class Ribbon {
  mesh:THREE.Mesh<THREE.BufferGeometry,THREE.ShaderMaterial>;
  private positions:Float32Array;
  private side=new THREE.Vector3();private tangent=new THREE.Vector3();
  count:number;
  constructor(count:number,a:number,b:number){
    this.count=count;const geometry=new THREE.BufferGeometry();this.positions=new Float32Array(count*6);const uv=new Float32Array(count*4);const indices=[];
    for(let i=0;i<count;i++){uv.set([i/(count-1),0,i/(count-1),1],i*4);if(i<count-1){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}}
    geometry.setAttribute('position',new THREE.BufferAttribute(this.positions,3).setUsage(THREE.DynamicDrawUsage));geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));geometry.setIndex(indices);
    const material=new THREE.ShaderMaterial({
      uniforms:{uA:{value:new THREE.Color(a)},uB:{value:new THREE.Color(b)},uOpacity:{value:1},uTime:{value:0}},
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:`varying vec2 vUv;uniform vec3 uA;uniform vec3 uB;uniform float uOpacity;uniform float uTime;void main(){float edge=pow(max(0.,1.-abs(vUv.y*2.-1.)),1.7);float taper=sin(vUv.x*3.14159265);float flicker=.8+.2*sin(vUv.x*40.-uTime*16.);vec3 col=mix(uA,uB,pow(edge,5.)*.4);gl_FragColor=vec4(col*(.8+edge*1.2),edge*taper*uOpacity*flicker);}`,
      transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
    });
    this.mesh=new THREE.Mesh(geometry,material);this.mesh.frustumCulled=false;
  }
  update(points:THREE.Vector3[],width:number,opacity:number,time:number,camera:THREE.Camera){
    for(let i=0;i<this.count;i++){
      const p=points[i];this.tangent.subVectors(points[Math.min(i+1,this.count-1)],points[Math.max(0,i-1)]).normalize();
      this.side.subVectors(camera.position,p).cross(this.tangent).normalize();
      const w=width*(.35+.65*Math.sin(i/(this.count-1)*Math.PI));
      this.positions.set([p.x+this.side.x*w,p.y+this.side.y*w,p.z+this.side.z*w,p.x-this.side.x*w,p.y-this.side.y*w,p.z-this.side.z*w],i*6);
    }
    this.mesh.geometry.attributes.position.needsUpdate=true;this.mesh.material.uniforms.uOpacity.value=opacity;this.mesh.material.uniforms.uTime.value=time;this.mesh.visible=opacity>.002;
  }
  hide(){this.mesh.visible=false;}
  dispose(){this.mesh.geometry.dispose();this.mesh.material.dispose();this.mesh.removeFromParent();}
}

export function shockMaterial(color:number){return new THREE.ShaderMaterial({
  uniforms:{uColor:{value:new THREE.Color(color)},uOpacity:{value:0},uTime:{value:0}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`varying vec2 vUv;uniform vec3 uColor;uniform float uOpacity;uniform float uTime;void main(){float r=length(vUv-.5)*2.;float ring=smoothstep(.72,.91,r)*(1.-smoothstep(.91,1.,r));float a=atan(vUv.y-.5,vUv.x-.5);float streak=.75+.25*sin(a*27.+uTime*4.);gl_FragColor=vec4(uColor*2.,ring*uOpacity*streak);}`,
  transparent:true,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false,
});}
