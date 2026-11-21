/* One Take v3 (REVIEW BUILD on GitHub Pages /boltz-review/onetake/ only; r5 frames + clean film tail v2).
   Scroll scrub: photo film (finish -> watch, live film2.json sheets) -> ~6-frame crossfade -> 3D's v3 CG move
   (120 frames, deliver/{phone,desktop}/baked, route baked in) -> hold on the settled piece -> range.
   Text is live HTML: "I can't believe I did that." on the finish, "Every kilometre of it." + stats on the route,
   "For those who earned it." on the hold (phone top 35%, desktop left 40%). */
(function(){
'use strict';
const mobile=matchMedia('(max-width:760px)').matches, reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const story=document.getElementById('story');
function paint(){ want=true; kick(); }
/* D-199: 3D r6 reframes the phone time (film 220-226, f001-f010) with a slight zoom-out; that invents a soft inpainted
   border (widest side, 1080-frame px, from 3D's planned_transforms.json). Screens taller than 9:16 crop it away; on
   9:16 screens (375x667 etc.) scale up just enough to keep it off-screen (max ~1.17x at f008, digits stay >=20 css px). */
// D-200: r7 values (3D reframed film 218-225 and eased f009-f013 back to identity at f014); widest left/right border in 1080 px.
const R6_P={218:3.1,219:11.5,220:19.8,221:26.0,222:30.1,223:35.2,224:36.3,225:39.3,226:39.3};
const R6_C=[39.3,42.9,46.3,49.9,55.5,61.0,66.4,72.7,79.9,87.7,65.8,43.8,21.9];
function r6k(side,vwN){ if(!(side>0)) return 1; return Math.max(1, vwN/(1080-2*(side+4))); }
function Film(canvas, fit){
  this.canvas=canvas;
  this.ctx=canvas?canvas.getContext('2d',{alpha:false,desynchronized:true}):null;
  this.fit=fit||'cover';
  this.meta=null; this.v=null; this.urls=[];
  this.bm=[]; this.blob=[]; this.dec=[]; this.proxy=null;
  this.atlases=this.bm; // (audit scripts read film.atlases)
  this.last=-1; this.shown=false; this.dir=1; this.cur=0; this.want=null; this.decoding=0;
  this.AHEAD=3; this.BEHIND=1; // window ~5 sheets of 4 frames
  this.drawn=null;
}
Film.prototype.attach=function(v, fmt){
  this.v=v; this.fmt=fmt; this.urls=v.sheets[fmt];
  this.meta={count:v.count, map:v.frames, perAtlas:v.per, cols:v.cols, rows:v.rows, atlases:this.urls, marks:v.marks};
  this.bm.length=this.urls.length;
};
Film.decode=function(blob){
  const viaImg=()=>new Promise((res)=>{const u=URL.createObjectURL(blob),im=new Image();im.src=u;
    (im.decode?im.decode():new Promise((a,b)=>{im.onload=a;im.onerror=b;})).then(()=>{im._u=u;res(im);},()=>{URL.revokeObjectURL(u);res(null);});});
  if(window.createImageBitmap) return createImageBitmap(blob).catch(viaImg);
  return viaImg();
};
Film.free=function(b){ if(!b) return; if(b.close) b.close(); else if(b._u) URL.revokeObjectURL(b._u); };
Film.prototype.fetchBlob=function(i){
  if(this.blob[i]) return this.blob[i];
  const p=fetch(this.urls[i]).then(r=>r.ok?r.blob():null).catch(()=>null);
  this.blob[i]=p; p.then(b=>{ if(!b){ this.fails=(this.fails||0)+1; if(this.fails<20) this.blob[i]=null; } });
  return p;
};
Film.prototype.loadProxy=function(){
  const u=this.v.proxy[this.fmt];
  return fetch(u).then(r=>r.ok?r.blob():null).then(b=>b&&Film.decode(b)).then(bmp=>{ if(bmp){this.proxy=bmp; this.last=-1;} }).catch(()=>{});
};
Film.prototype.inWin=function(i){ const c=this.cur, d=i-c; return this.dir>=0?(d>=-this.BEHIND&&d<=this.AHEAD):(d<=this.BEHIND&&d>=-this.AHEAD); };
Film.prototype.ensure=function(i){
  if(i<0||i>=this.urls.length||this.bm[i]||this.dec[i]) return this.dec[i]||Promise.resolve();
  this.decoding++;
  const p=this.fetchBlob(i).then(b=>b&&Film.decode(b)).then(bmp=>{
    this.dec[i]=null; this.decoding--; if(this.bg&&this.decoding===0) setTimeout(()=>this.pump(),0);
    if(!bmp) return;
    if(!this.inWin(i)&&this.ready){ Film.free(bmp); return; }
    this.bm[i]=bmp;
    if(this.want!=null){ this.last=-1; requestAnimationFrame(paint); }
    this.pump();
  });
  this.dec[i]=p; return p;
};
Film.prototype.pump=function(){
  if(!this.urls.length) return;
  const n=this.urls.length, c=this.cur, d=this.dir>=0?1:-1;
  // evict decoded sheets outside the window
  for(let i=0;i<n;i++) if(this.bm[i]&&!this.inWin(i)){ Film.free(this.bm[i]); this.bm[i]=null; }
  // decode the window, current sheet first, then in the scroll direction, then behind (max 2 decodes in flight)
  const order=[c]; for(let k=1;k<=this.AHEAD;k++) order.push(c+d*k); for(let k=1;k<=this.BEHIND;k++) order.push(c-d*k);
  for(const i of order){ if(this.decoding>=2) break; if(i>=0&&i<n&&!this.bm[i]&&!this.dec[i]) this.ensure(i); }
  // background: download (not decode) the rest in the scroll direction, one at a time
  if(this.bg&&!this._bgBusy&&this.decoding===0){
    let next=-1; for(let k=1;k<n;k++){ const a=c+d*k, b=c-d*k; if(a>=0&&a<n&&!this.blob[a]){next=a;break;} if(b>=0&&b<n&&!this.blob[b]){next=b;break;} }
    if(next>=0){ this._bgBusy=true; this.fetchBlob(next).then(()=>{ this._bgBusy=false; this.pump(); }); }
  }
};
Film.prototype.slotOf=function(idx){
  const map=this.meta.map; if(!this._inv){ this._inv=new Map(map.map((f,i)=>[f,i])); }
  if(this._inv.has(idx)) return {s:this._inv.get(idx)};
  let lo=-1; for(let i=0;i<map.length;i++){ if(map[i]<idx) lo=i; else break; }
  const hi=lo+1;
  if(lo<0) return {s:0};
  if(hi>=map.length||map[hi]-map[lo]>2) return {s:lo};
  return {s:lo,s2:hi,a:(idx-map[lo])/(map[hi]-map[lo])};
};
// source cell for a slot: full sheet, else proxy, else nearest decoded full frame
Film.prototype.src=function(slot){
  const v=this.v, per=v.per, ai=Math.floor(slot/per), l=slot-ai*per;
  const cell=(img,cols,w,h,k,q,s)=>({img,sx:(k%cols)*w,sy:Math.floor(k/cols)*h,sw:w,sh:h,q,s});
  const fs=a=>(v.sheetFrame&&v.sheetFrame[a])||v.frame; // a sheet keeps its frames' native size (phone watch-face hold is 720x1280)
  if(this.bm[ai]) return cell(this.bm[ai],v.cols,fs(ai)[0],fs(ai)[1],l,'full',slot);
  if(this.proxy) return cell(this.proxy,v.proxy.cols,v.proxy.frame[0],v.proxy.frame[1],slot,'proxy',slot);
  const n=this.meta.map.length;
  for(let k=1;k<n;k++){ for(const s of [slot-k,slot+k]){ if(s<0||s>=n) continue; const a=Math.floor(s/per); if(this.bm[a]) return cell(this.bm[a],v.cols,fs(a)[0],fs(a)[1],s-a*per,'near',s); } }
  return null;
};
Film.prototype.resize=function(){
  const c=this.canvas, r=Math.min(window.devicePixelRatio||1, 2);
  const w=c.clientWidth||innerWidth, h=c.clientHeight||innerHeight;
  if(c.width!==Math.round(w*r)||c.height!==Math.round(h*r)){
    c.width=Math.round(w*r); c.height=Math.round(h*r);
    this.last=-1;
  }
};
Film.prototype.draw=function(t){
  if(!this.v||!this.ctx) return;
  this.resize();
  const m=this.meta, n=m.count, idx=Math.max(0, Math.min(n-1, Math.round(t*(n-1))));
  const r=this.slotOf(idx), slot=r.s, blend=(r.s2!=null&&r.a>0.01)?{slot:r.s2,a:r.a}:null;
  // scroll direction + sliding window
  if(this.want!=null&&slot!==this.want) this.dir=slot>this.want?1:-1;
  this.want=slot; const ai=Math.floor(slot/m.perAtlas);
  if(ai!==this.cur){ this.cur=ai; }
  if(this.ready) this.pump();
  const main=this.src(slot); if(!main) return;
  let mix=this.mix; if(mix&&mix.a>0.01) mix={s:this.slotOf(mix.idx).s,a:mix.a}; else mix=null;
  const bs=blend?this.src(blend.slot):null, ms=mix?this.src(mix.s):null;
  const key=main.s+main.q+(bs?'|'+bs.s+bs.q+blend.a.toFixed(2):'')+(ms?'|'+ms.s+ms.q+mix.a.toFixed(2):'');
  if(key===this.last) return;
  const fw=this.v.frame[0], fh=this.v.frame[1], cw=this.canvas.width, ch=this.canvas.height;
  let scale=this.fit==='contain'?Math.min(cw/fw, ch/fh):Math.max(cw/fw, ch/fh);
  if(fw===720&&R6_P[idx]) scale*=r6k(R6_P[idx],cw/scale*1.5);
  const dw=fw*scale, dh=fh*scale, dx=(cw-dw)/2, dy=(ch-dh)/2, ctx=this.ctx;
  ctx.imageSmoothingQuality='high';
  ctx.fillStyle='#0f0f0e'; ctx.fillRect(0,0,cw,ch);
  const put=(c,a)=>{ ctx.globalAlpha=a; ctx.drawImage(c.img,c.sx,c.sy,c.sw,c.sh,dx,dy,dw,dh); ctx.globalAlpha=1; };
  put(main,1);
  if(bs) put(bs,blend.a);
  if(ms) put(ms,mix.a);
  this.last=key; this.drawn={idx, slot:main.s, want:slot, q:main.q};
  if(!this.shown){
    this.shown=true;
    const wrap=document.getElementById('filmWrap');
    if(wrap){ wrap.classList.add('has-film'); const st=wrap.closest('.stage'); if(st) st.style.background='#0f0f0e'; }
  }
};


/* ---------- CG sequence: one file per frame, low-res proxy atlas first, sliding decode window ---------- */
function Seq(canvas, fmt, ext){
  this.c=canvas; this.ctx=canvas.getContext('2d',{alpha:false}); this.fmt=fmt; this.ext=ext;
  this.N=120; this.blob=[]; this.bm=[]; this.dec=[]; this.cur=0; this.dir=1; this.proxy=null; this.inflight=0; this.last='';
  this.fw=fmt==='phone'?1080:1920; this.fh=fmt==='phone'?1920:1080; this.pw=fmt==='phone'?180:320; this.ph=fmt==='phone'?320:180;
}
Seq.prototype.url=function(i){ return '/boltz-review/onetake/cg/'+this.fmt+'/'+String(i+1).padStart(3,'0')+'.'+this.ext; };
Seq.prototype.loadProxy=function(){ return fetch('/boltz-review/onetake/cg/proxy-'+this.fmt+'.'+this.ext+'?v='+(this.fmt==='phone'?'r7':'r5')).then(r=>r.blob()).then(Film.decode).then(b=>{this.proxy=b; this.last='';}); };
Seq.prototype.fetch=function(i){ if(!this.blob[i]) this.blob[i]=fetch(this.url(i)).then(r=>r.ok?r.blob():null).catch(()=>null); return this.blob[i]; };
Seq.prototype.inWin=function(i){ const d=i-this.cur; return this.dir>=0?(d>=-3&&d<=10):(d<=3&&d>=-10); };
Seq.prototype.pump=function(){
  for(let i=0;i<this.N;i++) if(this.bm[i]&&!this.inWin(i)){ Film.free(this.bm[i]); this.bm[i]=null; }
  const order=[]; for(let k=0;k<=10;k++) order.push(this.cur+this.dir*k); for(let k=1;k<=3;k++) order.push(this.cur-this.dir*k);
  for(const i of order){ if(this.inflight>=3) break; if(i<0||i>=this.N||this.bm[i]||this.dec[i]) continue;
    this.inflight++; this.dec[i]=this.fetch(i).then(b=>b&&Film.decode(b)).then(bmp=>{ this.inflight--; this.dec[i]=null;
      if(bmp){ if(this.inWin(i)){ this.bm[i]=bmp; this.last=''; paint(); } else Film.free(bmp); } this.pump(); }); }
  // background: prefetch (not decode) every frame, coarse to fine, so a fast scroll never waits on the network
  if(!this._bg&&this.started){ this._bg=true; const ord=[]; for(const s of [8,4,2,1]) for(let i=0;i<this.N;i+=s) if(!ord.includes(i)) ord.push(i);
    let k=0; const next=()=>{ if(k>=ord.length) return; const i=ord[k++]; this.fetch(i).then(next); }; next(); next(); }
};
Seq.prototype.fitMix=function(i){ if(this.fmt!=='phone') return 0; const t=Math.max(0,Math.min(1,(i-40)/16)); return t*t*(3-2*t); };
// r5: 3D's phone route keeps >=115 px side margins, so only ease as far as needed to keep the route >=20 css px clear of the screen edge
Seq.prototype.routeScale=function(w,cov,con){ const r=Math.min(devicePixelRatio||1,2); return Math.max(con,Math.min(cov,(w/2-20*r)/(this.fw/2-115))); };
/* D-200: phone hold. Lucas: the plaque + medal should sit higher and a bit bigger. Over 3D's pull-back (f062-f102, riding the camera's own progress so it never reverses)
   ease a zoom (<=1.3x) and shift so the settled plaque+medal box (1080x1920 frame px, x 309-788, y 990-1665) is centred
   between the hold line's bottom and the order bar, medal >=24 css px clear of the bar, box >=16 css px inside the sides. */
const HOLD={x0:309,x1:788,y0:990,y1:1665,zmax:1.3,
  // 3D's camera pull-back as the route's width in frame px, f061 (845) to f102 (settled, 414). The zoom/shift ride the camera's own
  // progress t, so the apparent pull-back keeps 3D's easing (just ~30% shorter) and never reverses or kinks.
  pb:[845,842,839,835,829,823,815,805,794,784,771,757,741,724,707,689,672,653,636,619,601,583,567,552,537,523,509,497,485,474,464,455,447,441,435,430,425,422,419,417,415,414]};
HOLD.t=function(i){ const f=i+1; if(f<=61) return 0; if(f>=102) return 1; return (845-this.pb[f-61])/(845-414); };
Seq.prototype.holdT=function(w,h,s,r){
  if(this._ht&&this._ht.k===w+'x'+h+'x'+s) return this._ht;
  const cr=this.c.getBoundingClientRect(), be=document.getElementById('bEnd'), bar=document.querySelector('.bz-order-bar');
  const hbC=be?be.offsetTop+be.offsetHeight:innerHeight*0.25, br=bar&&bar.getBoundingClientRect(), btC=(br&&br.height&&br.top<innerHeight)?br.top:innerHeight;
  const hb=(hbC-cr.top)*r, bt=(btC-cr.top)*r, bw=(HOLD.x1-HOLD.x0)*s, bh=(HOLD.y1-HOLD.y0)*s;
  const z=Math.max(1,Math.min(HOLD.zmax,(bt-hb-2*24*r)/bh,(w-2*16*r)/bw));
  return this._ht={k:w+'x'+h+'x'+s,z,cx:w/2,cy:(hb+bt)/2};
};
Seq.prototype.draw=function(f){
  const i=Math.max(0,Math.min(this.N-1,Math.round(f)));
  if(i!==this.cur){ this.dir=i>this.cur?1:-1; this.cur=i; } this.pump();
  const c=this.c, r=Math.min(devicePixelRatio||1,2), w=Math.round((c.clientWidth||innerWidth)*r), h=Math.round((c.clientHeight||innerHeight)*r);
  if(c.width!==w||c.height!==h){ c.width=w; c.height=h; this.last=''; this._ht=null; }
  let img=null,sx=0,sy=0,sw=this.fw,sh=this.fh,q='';
  if(this.bm[i]){ img=this.bm[i]; q='f'+i; }
  else { for(let k=1;k<=2&&!img;k++) for(const j of [i-this.dir*k,i+this.dir*k]) if(this.bm[j]){ img=this.bm[j]; q='n'+j; break; }
    if(!img&&this.proxy){ img=this.proxy; sw=this.pw; sh=this.ph; sx=(i%12)*sw; sy=Math.floor(i/12)*sh; q='p'+i; } }
  if(!img||q===this.last) return; this.last=q; this.q=q;
  // Phones taller than 9:16 (every recent iPhone is ~9:19.5): 'cover' crops ~9% off each side of 3D's 1080x1920 frame,
  // which would clip the route (3D's side margin is 72 px). So the fit eases from cover (watch, matches the photo hand-off)
  // to width-fit (whole frame width) while the route draws (f41-f57), and the top/bottom bands repeat the frame's edge rows.
  const cov=Math.max(w/this.fw,h/this.fh), con=Math.min(w/this.fw,h/this.fh), fm=this.fitMix(i);
  const tgt=this.fmt==='phone'?this.routeScale(w,cov,con):cov; let s=(cov+(tgt-cov)*fm)*(this.fmt==='phone'&&i<R6_C.length?r6k(R6_C[i],w/cov):1), dw=this.fw*s, dh=this.fh*s, dx=(w-dw)/2, dy=(h-dh)/2; const ctx=this.ctx, k=sw/this.fw;
  if(this.fmt==='phone'&&i>=61){ const e=HOLD.t(i), H=this.holdT(w,h,s,r), ax=(HOLD.x0+HOLD.x1)/2, ay=(HOLD.y0+HOLD.y1)/2;
    const px=dx+ax*s+(H.cx-(dx+ax*s))*e, py=dy+ay*s+(H.cy-(dy+ay*s))*e; s*=(845-(845-H.z*414)*e)/(845-431*e); dw=this.fw*s; dh=this.fh*s; dx=px-ax*s; dy=py-ay*s; }
  ctx.imageSmoothingQuality='high'; ctx.fillStyle='#0f0f0e'; ctx.fillRect(0,0,w,h);
  if(dy>0.5) ctx.drawImage(img,sx,sy,sw,Math.max(1,2*k),dx,0,dw,dy+1);
  if(dy+dh<h-0.5) ctx.drawImage(img,sx,sy+sh-Math.max(1,2*k),sw,Math.max(1,2*k),dx,dy+dh-1,dw,h-(dy+dh)+1);
  if(dx>0.5) ctx.drawImage(img,sx,sy,Math.max(1,2*k),sh,0,dy,dx+1,dh);
  if(dx+dw<w-0.5) ctx.drawImage(img,sx+sw-Math.max(1,2*k),sy,Math.max(1,2*k),sh,dx+dw-1,dy,w-(dx+dw)+1,dh);
  ctx.drawImage(img,sx,sy,sw,sh,dx,dy,dw,dh); this.lt=[dx,dy,s,r];
};

/* ---------- timeline (story units 0..100) ---------- */
const U={photoEnd:40, xfEnd:42.6, cgEnd:90};   // ~6 CG frames of scroll for the crossfade (53.4 units / 119 frames = 0.45 per frame)
const cgU=f=>U.xfEnd+(f-1)/119*(U.cgEnd-U.xfEnd);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)), ramp=(u,a,b)=>clamp((u-a)/(b-a),0,1);
const fade=(u,a,b,c,d)=>Math.min(ramp(u,a,b),1-ramp(u,c,d));
const B1=document.getElementById('b1'), B2=document.getElementById('b2'), BE=document.getElementById('bEnd'), cue=document.getElementById('b0');
const cgC=document.getElementById('cg');
const film=new Film(document.getElementById('film'),'cover'); film.mix=null;
let seq=null, v=null, slots=null, target=0, cur=0, want=true, raf=0;
function progress(){ const r=story.getBoundingClientRect(), H=story.offsetHeight-innerHeight; return clamp(-r.top/H,0,1)*100; }
function render(u){
  // photo film: by slot, now through the clean tail to 226/228 (= 3D f001), holding on its last slot
  if(v){ const n=v.frames.length, s=Math.round(ramp(u,0,U.photoEnd)*(n-1)); film.draw(v.frames[s]/(v.count-1)); }
  const xf=ramp(u,U.photoEnd,U.xfEnd); cgC.style.opacity=xf.toFixed(3);
  if(seq&&(xf>0||u>U.photoEnd-3)){ seq.started=true; seq.draw(u<=U.xfEnd?0:clamp((u-U.xfEnd)/(U.cgEnd-U.xfEnd),0,1)*119); }
  const set=(el,a,dy)=>{ if(!el) return; el.style.opacity=a.toFixed(3); el.style.transform=(el.dataset.base||'')+' translateY('+((1-a)*dy).toFixed(1)+'px)'; el.style.visibility=a>0.001?'visible':'hidden'; };
  set(cue,1-ramp(u,1,3),0);
  set(B1,u<1?1:fade(u,-1,0,9,12),-12);
  set(B2,fade(u,cgU(28),cgU(33),cgU(64),cgU(68)),14);
  set(BE,ramp(u,cgU(103),cgU(110)),12);
  document.body.classList.toggle('story-done',u>99);
}
function tick(){ raf=0; target=progress(); const d=target-cur; cur=Math.abs(d)<0.02?target:cur+d*(mobile?0.32:0.22); render(cur); if(cur!==target||want){ want=false; kick(); } }
function kick(){ if(!raf) raf=requestAnimationFrame(tick); }
if(!reduce){
  addEventListener('scroll',kick,{passive:true}); addEventListener('resize',()=>{film.last=-1; if(seq){ seq.last=''; seq._ht=null; } kick();},{passive:true});
  const avifOk=new Promise(res=>{const im=new Image();im.onload=()=>res(im.width>0);im.onerror=()=>res(false);im.src='data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADrbWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAAAAAAAOcGl0bQAAAAAAAQAAAB5pbG9jAAAAAEQAAAEAAQAAAAEAAAETAAAAIQAAAChpaW5mAAAAAAABAAAAGmluZmUCAAAAAAEAAGF2MDFDb2xvcgAAAABqaXBycAAAAEtpcGNvAAAAFGlzcGUAAAAAAAAAAQAAAAEAAAAQcGl4aQAAAAADCAgIAAAADGF2MUOBAAwAAAAAE2NvbHJuY2x4AAEADQAGgAAAABdpcG1hAAAAAAAAAAEAAQQBAoMEAAAAKW1kYXQSAAoIGAAGiAhoNCAyExlHh4Yhh5555oAAAJBAyRxhQr4=';setTimeout(()=>res(false),1500);});
  Promise.all([fetch('/boltz-review/onetake/video/seq/film2.json?v=ft2').then(r=>r.json()),avifOk]).then(async ([man,AVIF])=>{
    const seg=man.segments.film; v=mobile?seg.phone:seg.desktop; film.attach(v,AVIF?'avif':'webp');
    seq=new Seq(cgC, mobile?'phone':'desktop', AVIF?'avif':'webp');
    await film.loadProxy(); await Promise.all([film.ensure(0),film.ensure(1)]); film.ready=true;
    seq.loadProxy();
    const goAll=()=>{removeEventListener('scroll',goAll); film.bg=true; film.pump(); seq.started=true; seq.pump();};
    addEventListener('scroll',goAll,{passive:true}); if(scrollY>0) goAll();
    window.__ot3={film,seq,U,render,get u(){return cur;}}; kick();
  }).catch(e=>console.warn(e));
  kick();
}
})();
