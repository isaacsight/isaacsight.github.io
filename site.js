// Respect visitor preferences; navigation and project reading work without JavaScript.
document.querySelectorAll('details').forEach(section => {
  section.addEventListener('toggle', () => {
    section.classList.toggle('is-open', section.open);
  });
});


/* The Press — interactive self-portrait loops drawn from a real photo (no generation). Modes: halftone, ascii, slices, wave. */
(function(){
  var cv=document.getElementById('press-canvas'); if(!cv) return;
  var ctx=cv.getContext('2d'), W=cv.width, H=cv.height, N=72, cell=W/N;
  var inks=[{name:'Acid on black',bg:'#20201e',dot:'#e8ff65'},{name:'Riso blue + pink',bg:'#ff6fae',dot:'#0f3fd8'},{name:'Ink on paper',bg:'#faf9f6',dot:'#20201e'},{name:'CMYK',bg:'#faf9f6',dot:['#00b4ff','#ff2d9b','#ffe600','#20201e']},{name:'Night print',bg:'#0b1026',dot:'#f1efe8'}];
  var modes=['particles','halftone','ascii','slices','wave'], modeNames={particles:'Particles',halftone:'Halftone',ascii:'ASCII',slices:'Slices',wave:'Wave'};
  var ink=0, mode=0, lum=null, src=null, mouse={x:-9999,y:-9999}, ripples=[], reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CH=' .:-=+*#%@', P=[], prev=0;
  var img=new Image(); img.src='/assets/about-halftone-src.jpg';
  img.onload=function(){
    var off=document.createElement('canvas'); off.width=N; off.height=N; var o=off.getContext('2d'); o.drawImage(img,0,0,N,N);
    var d=o.getImageData(0,0,N,N).data; lum=new Float32Array(N*N); for(var i=0;i<N*N;i++) lum[i]=d[i*4]/255;
    src=document.createElement('canvas'); src.width=W; src.height=H; src.getContext('2d').drawImage(img,0,0,W,H);
    P=[]; for(var j=0;j<N;j++) for(var i=0;i<N;i++){ var dark=1-lum[j*N+i]; if(dark<0.08) continue; P.push({hx:(i+0.5)*cell,hy:(j+0.5)*cell,x:(i+0.5)*cell,y:(j+0.5)*cell,vx:0,vy:0,r:dark*cell*0.62,i:i,j:j}); }
    requestAnimationFrame(draw);
  };
  function pos(e){ var r=cv.getBoundingClientRect(); return {x:(e.clientX-r.left)/r.width*W, y:(e.clientY-r.top)/r.height*H}; }
  cv.addEventListener('pointermove',function(e){ var p=pos(e); mouse.x=p.x; mouse.y=p.y; });
  cv.addEventListener('pointerleave',function(){ mouse.x=-9999; mouse.y=-9999; });
  cv.addEventListener('pointerdown',function(e){ var p=pos(e); ripples.push({x:p.x,y:p.y,t:performance.now()}); if(ripples.length>6) ripples.shift(); });
  cv.addEventListener('click',function(){ ink=(ink+1)%inks.length; label(); });
  function label(){ var l=document.getElementById('press-label'); if(l) l.textContent=modeNames[modes[mode]]+' · '+inks[ink].name; }
  var b1=document.getElementById('press-ink'); if(b1) b1.addEventListener('click',function(){ ink=(ink+1)%inks.length; label(); ripples.push({x:W/2,y:H/2,t:performance.now()}); });
  var b2=document.getElementById('press-mode'); if(b2) b2.addEventListener('click',function(){ mode=(mode+1)%modes.length; label(); });
  var b3=document.getElementById('press-save'); if(b3) b3.addEventListener('click',function(){ var a=document.createElement('a'); a.download='isaac-hernandez-'+modes[mode]+'.png'; a.href=cv.toDataURL('image/png'); a.click(); });
  function tint(k,i,j){ return Array.isArray(k.dot)?k.dot[(i+j)%k.dot.length]:k.dot; }
  function swell(cx,cy,now){ // cursor + ripple multiplier and push, shared by modes
    var m=1, px=0, py=0, dx=cx-mouse.x, dy=cy-mouse.y, dist=Math.sqrt(dx*dx+dy*dy);
    if(dist<140){ var f=1-dist/140; m+=f*1.1; px=dx/(dist+1)*f*10; py=dy/(dist+1)*f*10; }
    for(var q=0;q<ripples.length;q++){ var rp=ripples[q], age=(now-rp.t)/1000; if(age>1.6) continue; var rr=age*520, ddx=cx-rp.x, ddy=cy-rp.y, dd=Math.sqrt(ddx*ddx+ddy*ddy); m+=Math.max(0,1-Math.abs(dd-rr)/60)*(1-age/1.6)*1.4; }
    return [m,px,py];
  }
  function halftone(now,k){ var br=reduce?0:Math.sin(now/900)*0.04;
    for(var j=0;j<N;j++) for(var i=0;i<N;i++){ var dark=1-lum[j*N+i], cx=(i+0.5)*cell, cy=(j+0.5)*cell, s=swell(cx,cy,now), r=dark*cell*0.62*(1+br)*s[0]; if(r<0.4) continue;
      ctx.fillStyle=tint(k,i,j); ctx.beginPath(); ctx.arc(cx+s[1],cy+s[2],Math.min(r,cell*1.4),0,6.2832); ctx.fill(); } }
  function ascii(now,k){ ctx.font='bold '+(cell*1.05)+'px ui-monospace,Menlo,monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    for(var j=0;j<N;j++) for(var i=0;i<N;i++){ var v=lum[j*N+i], dark=1-v, cx=(i+0.5)*cell, cy=(j+0.5)*cell, s=swell(cx,cy,now);
      var drift=reduce?0:Math.sin(now/700+j*0.35)*0.18;                  // rows shimmer like a scrolling terminal
      var idx=Math.min(CH.length-1,Math.floor((dark*s[0]+drift)*(CH.length-1))); if(idx<=0) continue;
      ctx.fillStyle=tint(k,i,j); ctx.globalAlpha=0.55+dark*0.45; ctx.fillText(CH[idx],cx+s[1],cy+s[2]); }
    ctx.globalAlpha=1; }
  function slices(now,k){ // horizontal bands of the photo slide on a loop; cursor tears them further; ink = overlay colour
    var bands=36, bh=H/bands; ctx.drawImage(src,0,0);
    for(var b=0;b<bands;b++){ var y=b*bh, ph=now/1000+b*0.6, base=reduce?0:Math.sin(ph)*18*Math.sin(now/2600+b);
      var dy=Math.abs((y+bh/2)-mouse.y), tear=dy<120?(1-dy/120)*(mouse.x-W/2)*0.35:0; var off=base+tear;
      ctx.drawImage(src,0,y,W,bh,off,y,W,bh); }
    ctx.globalCompositeOperation='multiply'; ctx.fillStyle=Array.isArray(k.dot)?k.dot[0]:k.dot; ctx.globalAlpha=0.28; ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation='screen'; ctx.fillStyle=k.bg; ctx.globalAlpha=0.25; ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1; }
  function wave(now,k){ // liquid warp: columns of the photo ride a sine; cursor adds a local whirl
    var cols=120, cw=W/cols;
    for(var c=0;c<cols;c++){ var x=c*cw, t=now/1000, dx=x-mouse.x, near=Math.max(0,1-Math.abs(dx)/160);
      var dy=(reduce?0:Math.sin(t*1.6+c*0.12)*14)+near*Math.sin(t*9+c*0.4)*26; var sc=1+near*0.12;
      ctx.drawImage(src,x,0,cw,H, x-(cw*sc-cw)/2, dy, cw*sc, H); }
    ctx.globalCompositeOperation='multiply'; ctx.fillStyle=Array.isArray(k.dot)?k.dot[1]:k.dot; ctx.globalAlpha=0.22; ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1; }
  function particles(now,k){ var dt=Math.min(32,now-prev||16)/16; prev=now;
    for(var n=0;n<P.length;n++){ var p=P[n];
      var dx=p.x-mouse.x, dy=p.y-mouse.y, d2=dx*dx+dy*dy;                 // cursor repels within 170px
      if(d2<28900){ var d=Math.sqrt(d2)+0.01, f=(1-d/170)*9; p.vx+=dx/d*f; p.vy+=dy/d*f; }
      for(var q=0;q<ripples.length;q++){ var rp=ripples[q], age=(now-rp.t)/1000; if(age>0.5) continue; var ex=p.x-rp.x, ey=p.y-rp.y, ed=Math.sqrt(ex*ex+ey*ey)+0.01; if(ed<260){ var g=(1-ed/260)*(1-age/0.5)*18; p.vx+=ex/ed*g; p.vy+=ey/ed*g; } }
      p.vx+=(p.hx-p.x)*0.035*dt; p.vy+=(p.hy-p.y)*0.035*dt;             // spring home
      p.vx*=0.86; p.vy*=0.86; p.x+=p.vx*dt; p.y+=p.vy*dt;
      var sp=Math.min(1.8,1+Math.sqrt(p.vx*p.vx+p.vy*p.vy)*0.08);        // moving dots swell a little
      ctx.fillStyle=tint(k,p.i,p.j); ctx.beginPath(); ctx.arc(p.x,p.y,p.r*sp,0,6.2832); ctx.fill(); } }
  function draw(now){ var k=inks[ink]; ctx.fillStyle=k.bg; ctx.fillRect(0,0,W,H);
    ({particles:particles,halftone:halftone,ascii:ascii,slices:slices,wave:wave})[modes[mode]](now,k);
    ripples=ripples.filter(function(rp){ return now-rp.t<1600; }); requestAnimationFrame(draw); }
})();
