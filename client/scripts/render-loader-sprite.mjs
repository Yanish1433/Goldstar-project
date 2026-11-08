// Offline render of the loader's walking-boots sprite sheet (run by hand; the output is committed).
//   PW_DIR=<dir with node_modules/playwright-core> CHROME_PATH=<chrome.exe> node scripts/render-loader-sprite.mjs <boot.glb> [outDir]
// One seamless walk cycle of a PAIR of boots in side profile (heel strike -> roll -> flat -> heel lift/toe-off with the
// pivot switching heel->ball -> swing with lift), transparent background, studio + rim light, baked contact shadows.
// Writes loader-walk.webp (6x4 sheet, 2x density) and sprite.json (geometry numbers the inline CSS is built on).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import sharp from 'sharp';

const glb = path.resolve(process.argv[2]);
const outDir = path.resolve(process.argv[3] || 'public/loader');
const req = createRequire(path.resolve(process.env.PW_DIR || '.') + '/');
const { chromium } = req('playwright-core');
const threeDir = path.resolve(import.meta.dirname, '../../node_modules/three');
const FW = 600;
const FH = 400;
const COLS = 6;
const ROWS = 4;
const N = COLS * ROWS;
const PPU = 340; // px per boot length (2x density: 170 CSS px)

const html = `<!doctype html><body style="margin:0"><canvas id=c width=${FW} height=${FH}></canvas>
<script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script>
<script type="module">
import * as T from 'three'; import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'; import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
const FW=${FW},FH=${FH},N=${N},PPU=${PPU};
const r=new T.WebGLRenderer({canvas:c,antialias:true,alpha:true,preserveDrawingBuffer:true});
r.setClearColor(0x000000,0);r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.15;r.outputColorSpace=T.SRGBColorSpace;
const s=new T.Scene();s.environment=new T.PMREMGenerator(r).fromScene(new RoomEnvironment(),0.04).texture;s.environmentIntensity=1.0;
const key=new T.DirectionalLight(0xfff3e6,2.0);key.position.set(-1.5,3,3);s.add(key);
const rimA=new T.DirectionalLight(0xffd9b0,3.6);rimA.position.set(2.5,1.6,-3);s.add(rimA);
const rimB=new T.DirectionalLight(0xffffff,2.2);rimB.position.set(-3,1.2,-2.5);s.add(rimB);
const fill=new T.DirectionalLight(0xffb27a,0.9);fill.position.set(3,0.4,2);s.add(fill);
const g=await new Promise((res,rej)=>{const L=new GLTFLoader();L.setMeshoptDecoder(MeshoptDecoder);L.load('/model.glb',res,undefined,rej)});
const raw=g.scene;let bb=new T.Box3().setFromObject(raw);let sz=bb.getSize(new T.Vector3());
const holder=new T.Group();holder.add(raw);
if(sz.z>sz.x){holder.rotation.y=Math.PI/2;}
holder.updateMatrixWorld(true);bb=new T.Box3().setFromObject(holder);sz=bb.getSize(new T.Vector3());
let hp=0,np=0,hn=0,nn=0;const c0=bb.getCenter(new T.Vector3());const v=new T.Vector3();
holder.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i+=7){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);if(v.x>c0.x+sz.x*0.25){hp+=v.y;np++}else if(v.x<c0.x-sz.x*0.25){hn+=v.y;nn++}}});
const flip=(hp/np)>(hn/nn);
const norm=new T.Group();norm.add(holder);
if(flip)norm.rotation.y=Math.PI;
norm.updateMatrixWorld(true);bb=new T.Box3().setFromObject(norm);sz=bb.getSize(new T.Vector3());const ctr=bb.getCenter(new T.Vector3());
const k=1/sz.x;const boot=new T.Group();boot.add(norm);norm.position.set(-ctr.x,-bb.min.y,-ctr.z);
boot.scale.setScalar(k);
const A=[new T.Group(),new T.Group()];A[0].add(boot);A[1].add(boot.clone(true));
A[0].position.z=0.17;A[1].position.z=-0.17;s.add(A[0],A[1]);
window.__info={size:sz.toArray().map(x=>x*k),flip,heelAvg:hn/nn,toeAvg:hp/np};
const sc=document.createElement('canvas');sc.width=sc.height=128;const sg=sc.getContext('2d');const gr=sg.createRadialGradient(64,64,6,64,64,62);gr.addColorStop(0,'rgba(26,11,5,0.75)');gr.addColorStop(1,'rgba(26,11,5,0)');sg.fillStyle=gr;sg.fillRect(0,0,128,128);
const stex=new T.CanvasTexture(sc);
const sh=[0,1].map(i=>{const m=new T.Mesh(new T.PlaneGeometry(1.15,0.34),new T.MeshBasicMaterial({map:stex,transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(0,0.002,A[i].position.z);m.renderOrder=-1;s.add(m);return m});
const az=0.12,el=0.30;const cam=new T.OrthographicCamera(-FW/2/PPU,FW/2/PPU,FH/2/PPU,-FH/2/PPU,0.1,50);
const baseRow=${FH - 64};const ty=((baseRow-FH/2)/PPU)/Math.cos(el);const tgt=new T.Vector3(0,ty,0);
cam.position.set(tgt.x+10*Math.sin(az)*Math.cos(el),tgt.y+10*Math.sin(el),tgt.z+10*Math.cos(az)*Math.cos(el));cam.lookAt(tgt);cam.updateMatrixWorld(true);
const px=(x,y,z)=>{const p=new T.Vector3(x,y,z).project(cam);return [(p.x+1)/2*FW,(1-p.y)/2*FH]};
const a=0.28,ph=-0.42,pb=0.30,TH_HEEL=0.30,TH_TOE=-0.35,STANCE=0.6;
const sm=x=>x*x*(3-2*x);
const R=(th,x,y)=>[x*Math.cos(th)-y*Math.sin(th),x*Math.sin(th)+y*Math.cos(th)];
const x0=f=>a-2*a*(f/STANCE);
function pose(f){
  if(f<STANCE){let th,pv;
    if(f<0.12){th=TH_HEEL*(1-sm(f/0.12));pv=ph}else if(f<0.38){th=0;pv=ph}else{th=TH_TOE*sm((f-0.38)/0.22);pv=pb}
    const [rx,ry]=R(th,pv,0);return {x:x0(f)+pv-rx,y:-ry,th}}
  const u=(f-STANCE)/(1-STANCE);
  const [sx,sy]=R(TH_TOE,pb,0),[ex,ey]=R(TH_HEEL,ph,0);
  const Ps={x:-a+pb-sx,y:-sy},Pe={x:a+ph-ex,y:-ey};
  const m=sm(u);const th=TH_TOE+(TH_HEEL-TH_TOE)*sm(Math.pow(u,0.9));
  return {x:Ps.x+(Pe.x-Ps.x)*m,y:Ps.y+(Pe.y-Ps.y)*u+0.13*Math.pow(Math.sin(Math.PI*u),0.9),th};
}
const outs=[];
for(let i=0;i<N;i++){
  for(let fi=0;fi<2;fi++){
    const f=((i/N)+(fi?0.5:0))%1;const P=pose(f);
    A[fi].position.x=P.x;A[fi].position.y=P.y;A[fi].rotation.z=P.th;
    const [hx,hy]=R(P.th,ph,0),[tx,ty2]=R(P.th,pb+0.2,0);
    const lift=Math.max(0,Math.min(P.y+hy,P.y+ty2));
    sh[fi].position.x=P.x+0.02;sh[fi].material.opacity=Math.max(0,0.95*(1-lift/0.16));sh[fi].scale.set(1+lift*2.2,1+lift*1.5,1);
  }
  r.render(s,cam);outs.push(c.toDataURL('image/png'));
}
const flatX=x0(0.12);
window.__geo={near:px(flatX,0,0.17),far:px(flatX,0,-0.17),ppu:PPU,a,stance:STANCE,stride:Math.abs(px(a,0,0)[0]-px(-a,0,0)[0]),ground:px(0,0,0)};
window.__out=outs;window.__done=true;
</script>`;
const mime = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.glb': 'model/gltf-binary' };
const srv = http.createServer((q, s) => {
  let f;
  if (q.url === '/') {
    s.setHeader('content-type', 'text/html');
    return s.end(html);
  }
  if (q.url === '/model.glb') f = glb;
  else if (q.url.startsWith('/three/')) f = path.join(threeDir, q.url.slice(7));
  else {
    s.statusCode = 404;
    return s.end();
  }
  try {
    s.setHeader('content-type', mime[path.extname(f)] || 'application/octet-stream');
    s.end(fs.readFileSync(f));
  } catch {
    s.statusCode = 404;
    s.end();
  }
}).listen(0);
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: FW, height: FH } });
p.on('console', (m) => m.type() === 'error' && console.log('browser:', m.text()));
p.on('pageerror', (e) => console.log('pageerror', e.message));
await p.goto(`http://localhost:${srv.address().port}/`);
await p.waitForFunction('window.__done', null, { timeout: 180000 });
const outs = await p.evaluate('window.__out');
const info = await p.evaluate('window.__info');
const geo = await p.evaluate('window.__geo');
await b.close();
srv.close();
console.log(info, geo);
const frames = outs.map((d) => Buffer.from(d.split(',')[1], 'base64'));
fs.mkdirSync(outDir, { recursive: true });
const sheet = sharp({ create: { width: FW * COLS, height: FH * ROWS, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(
  frames.map((input, i) => ({ input, left: (i % COLS) * FW, top: Math.floor(i / COLS) * FH })),
);
await sheet.webp({ quality: Number(process.env.WEBP_Q || 72), alphaQuality: Number(process.env.WEBP_AQ || 75), effort: 6, smartSubsample: true }).toFile(path.join(outDir, 'loader-walk.webp'));
fs.writeFileSync(path.join(outDir, 'sprite.json'), JSON.stringify({ frame: [FW, FH], cols: COLS, rows: ROWS, frames: N, ...geo, info }, null, 1));
if (process.env.PREVIEW) {
  await sharp({ create: { width: FW * 4, height: FH * 2, channels: 4, background: '#FF5A1F' } })
    .composite([0, 3, 6, 9, 12, 15, 18, 21].map((fi, j) => ({ input: frames[fi], left: (j % 4) * FW, top: Math.floor(j / 4) * FH })))
    .png()
    .toFile(process.env.PREVIEW);
}
console.log('size', fs.statSync(path.join(outDir, 'loader-walk.webp')).size);
