/* FCI v7 — fixed-size hero swapped by story-card hover/focus + ticker clock + footer form. No autoplay. */
(function(){
"use strict";
var root=document.documentElement;
var reduceMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
try{
  var played=sessionStorage.getItem("fci-hero-played");
  if(!played && !reduceMotion){ root.classList.add("fci-anim"); }
  var done=function(){ try{sessionStorage.setItem("fci-hero-played","1");}catch(e){} };
  window.addEventListener("load",function(){ setTimeout(done,950); });
  window.addEventListener("pageshow",function(e){ if(e.persisted){ root.classList.remove("fci-anim"); } });
  if(reduceMotion){ root.classList.remove("fci-anim"); }
}catch(e){ if(!reduceMotion) root.classList.add("fci-anim"); }
root.classList.add("fci-js");

/* ---- announcement dismiss ---- */
var announce=document.getElementById("fci-announce");
var announceClose=document.getElementById("fci-announce-close");
try{
  if(announce && sessionStorage.getItem("fci-announce-off")==="1"){ announce.classList.add("is-hidden"); }
}catch(e){}
if(announceClose)announceClose.addEventListener("click",function(){
  announce.classList.add("is-hidden");
  try{sessionStorage.setItem("fci-announce-off","1");}catch(e){}
});

/* ---- mobile menu ---- */
var zone=document.getElementById("fci-header-zone");
var menuBtn=document.getElementById("fci-menu-btn");
var primaryNav=document.getElementById("fci-primarynav");
if(menuBtn&&zone){
  menuBtn.addEventListener("click",function(){
    var open=zone.classList.toggle("nav-open");
    menuBtn.setAttribute("aria-expanded",open?"true":"false");
  });
}

/* ---- hero + cards ---- */
var cards=Array.prototype.slice.call(document.querySelectorAll(".fci-card"));
var imgA=document.getElementById("fci-img-a"), imgB=document.getElementById("fci-img-b");
var stage=document.getElementById("fci-stage"), art=document.getElementById("fci-art");
var stageLink=document.getElementById("fci-stage-link");
var counter=document.getElementById("fci-counter");
var heroCat=document.getElementById("fci-hero-cat"), heroLoc=document.getElementById("fci-hero-loc");
var heroLink=document.getElementById("fci-hero-link"), heroDeck=document.getElementById("fci-hero-deck");
var readStory=document.getElementById("fci-readstory");
var live=document.getElementById("fci-live");
var active=0, showingA=true, hoverTimer=null;

function pad(n){return (n<10?"0":"")+n;}
function setCounter(i){ if(counter)counter.textContent=pad(i+1)+" / "+pad(cards.length); }
function swapArt(src,alt){
  if(!imgA||!imgB)return;
  var incoming=showingA?imgB:imgA, outgoing=showingA?imgA:imgB;
  var apply=function(){
    incoming.style.transition="none"; incoming.style.opacity="0";
    incoming.style.transform=reduceMotion?"none":"scale(1.03)";
    incoming.src=src; if(alt!==undefined){incoming.alt=alt;}
    void incoming.offsetWidth;
    incoming.style.transition=reduceMotion
      ?"opacity 200ms":"opacity 320ms cubic-bezier(0.77,0,0.175,1), transform 700ms cubic-bezier(0.23,1,0.32,1)";
    incoming.style.opacity="1";
    incoming.style.transform="scale(1)";
    incoming.classList.add("is-on");
    setTimeout(function(){ outgoing.classList.remove("is-on"); outgoing.style.opacity="0"; showingA=!showingA; }, reduceMotion?220:360);
  };
  try{
    var probe=new Image(); probe.decoding="async"; probe.src=src;
    if(probe.decode){ probe.decode().then(apply).catch(apply); } else { probe.onload=apply; probe.onerror=apply; }
  }catch(e){ apply(); }
}
function select(i,opts){
  opts=opts||{};
  if(!cards.length)return;
  if(i<0)i=0; if(i>cards.length-1)i=cards.length-1;
  if(i===active&&!opts.force){setCounter(i);return;}
  active=i;
  cards.forEach(function(t,k){
    var on=k===i;
    t.classList.toggle("is-active",on);
    var link=t.querySelector("[data-select]");
    if(link){ if(on)link.setAttribute("aria-current","true"); else link.removeAttribute("aria-current"); }
  });
  setCounter(i);
  var t=cards[i];
  var href=t.getAttribute("data-href"), artSrc=t.getAttribute("data-art"),
      alt=t.getAttribute("data-alt"),
      cat=t.getAttribute("data-cat"), loc=t.getAttribute("data-loc"),
      title=t.getAttribute("data-title"), deck=t.getAttribute("data-deck");
  if(stageLink)stageLink.href=href;
  if(heroCat&&cat)heroCat.textContent=cat;
  if(heroLoc&&loc)heroLoc.textContent=loc;
  if(heroLink){heroLink.href=href; heroLink.textContent=title;}
  if(heroDeck&&deck)heroDeck.textContent=deck;
  if(readStory)readStory.href=href;
  /* hero box has a fixed CSS height: swapping photo/text never resizes it */
  swapArt(artSrc,alt);
  if(opts.announce&&live){
    live.textContent="Showing story "+(i+1)+" of "+cards.length+": "+t.querySelector("h2").textContent.trim();
  }
}
var finePointer=window.matchMedia("(hover:hover) and (pointer:fine)").matches;
cards.forEach(function(t,i){
  var link=t.querySelector("[data-select]");
  if(finePointer){
    t.addEventListener("mouseenter",function(){
      clearTimeout(hoverTimer);
      hoverTimer=setTimeout(function(){select(i);},140);
    });
    t.addEventListener("mouseleave",function(){clearTimeout(hoverTimer);});
  }
  if(link){
    link.addEventListener("focus",function(){select(i,{announce:true});});
    link.addEventListener("click",function(){select(i);});
  }
  t.addEventListener("click",function(e){
    if(e.target.closest("a"))return;
    select(i,{announce:true});
  });
});
document.addEventListener("keydown",function(e){
  if(e.key!=="ArrowLeft"&&e.key!=="ArrowRight")return;
  var tag=(document.activeElement&&document.activeElement.tagName)||"";
  if(tag==="INPUT"||tag==="TEXTAREA")return;
  if(e.key==="ArrowRight")select((active+1)%cards.length,{announce:true});
  else select((active-1+cards.length)%cards.length,{announce:true});
});
// swipe on stage
if(stage){
  (function(){
    var sx=0,sy=0,dx=0,lock=null,moved=false;
    stage.addEventListener("pointerdown",function(e){
      if(e.pointerType!=="touch"&&e.pointerType!=="pen")return;
      sx=e.clientX;sy=e.clientY;dx=0;lock=null;moved=false;
    });
    stage.addEventListener("pointermove",function(e){
      if(sx===0)return;
      var ddx=e.clientX-sx, ddy=e.clientY-sy;
      if(lock===null){
        if(Math.abs(ddx)<10&&Math.abs(ddy)<10)return;
        lock=Math.abs(ddx)>Math.abs(ddy)?"x":"y";
      }
      if(lock!=="x")return;
      moved=true;
      var over=Math.max(0,Math.abs(ddx)-24);
      var rb=over*0.55/(1+over/120);
      var t=(Math.min(Math.abs(ddx),24)+rb)*(ddx<0?-1:1);
      if(art)art.style.transform="translateX("+t+"px)";
    },{passive:true});
    function end(e){
      if(sx===0)return;
      var w=stage.offsetWidth||320;
      if(e&&e.clientX!==undefined){dx=e.clientX-sx;}
      if(art){art.style.transition="transform 320ms cubic-bezier(0.32,0.72,0,1)";art.style.transform="translateX(0px)";
        setTimeout(function(){if(art){art.style.transition="";art.style.transform="";}},340);}
      if(moved&&lock==="x"){
        if(Math.abs(dx)>w*0.22){ select(active+(dx<0?1:-1),{announce:true}); }
      }
      sx=0;lock=null;moved=false;
    }
    stage.addEventListener("pointerup",end);
    stage.addEventListener("pointercancel",end);
    stage.addEventListener("pointermove",function(e){if(sx!==0)dx=e.clientX-sx;},{passive:true});
  })();
}
// preload rest on idle
function preloadRest(){
  cards.forEach(function(t,i){ if(i===0)return;
    var im=new Image(); im.decoding="async"; im.src=t.getAttribute("data-art"); });
}
if("requestIdleCallback" in window){requestIdleCallback(preloadRest,{timeout:2500});}
else{window.addEventListener("load",function(){setTimeout(preloadRest,1200);});}
setCounter(0);
if(cards[0]){var l0=cards[0].querySelector("[data-select]"); if(l0)l0.setAttribute("aria-current","true");}

/* ---- clock + markets ---- */
var dateEl=document.getElementById("fci-date"), timeEl=document.getElementById("fci-time"), pill=document.getElementById("fci-pill"), pillText=document.getElementById("fci-pill-text");
function fmtIST(d,opts){
  try{ return new Intl.DateTimeFormat("en-IN",Object.assign({timeZone:"Asia/Kolkata"},opts)).format(d); }
  catch(e){ return null; }
}
function marketOpen(){
  try{
    var ist=new Date(new Date().toLocaleString("en-US",{timeZone:"Asia/Kolkata"}));
    var day=ist.getDay(), mins=ist.getHours()*60+ist.getMinutes();
    return day>=1&&day<=5&&mins>=555&&mins<930;
  }catch(e){return false;}
}
function tickClock(){
  var d=new Date();
  var wd=fmtIST(d,{weekday:"short"}), dm=fmtIST(d,{day:"2-digit",month:"short",year:"numeric"}), tm=fmtIST(d,{hour:"numeric",minute:"2-digit",hour12:true});
  if(dateEl&&wd&&dm)dateEl.textContent=(wd+", "+dm).toUpperCase();
  if(timeEl&&tm)timeEl.textContent=tm.toUpperCase()+" IST";
  var open=marketOpen();
  if(pill){pill.classList.toggle("open",open);}
  if(pillText)pillText.textContent=open?"Markets open":"Markets closed";
  var now=new Date(); var ms=(60-now.getSeconds())*1000-now.getMilliseconds();
  setTimeout(function(){tickClock();},Math.min(ms+50,61000));
}
tickClock();
setInterval(function(){ if(document.visibilityState==="visible")tickClock(); },60000);

/* ---- reveal on scroll ---- */
var band=document.getElementById("fci-band");
if("IntersectionObserver" in window&&band){
  var bo=new IntersectionObserver(function(es){
    es.forEach(function(en){ if(en.isIntersecting){band.classList.add("is-in");bo.disconnect();} });
  },{threshold:0.1});
  bo.observe(band);
}else if(band){band.classList.add("is-in");}

/* ---- newsletter (Ref B: email + consent, rectangular, real states) ---- */
var form=document.getElementById("fci-form"), email=document.getElementById("fci-email"), msg=document.getElementById("fci-form-msg");
var consent=document.getElementById("fci-consent");
if(form)form.addEventListener("submit",function(e){
  e.preventDefault();
  var v=(email.value||"").trim();
  var ok=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  msg.classList.remove("ok");
  if(!ok){
    email.setAttribute("aria-invalid","true");
    msg.textContent="Enter a valid email address, like name@company.com";
    email.focus();
    return;
  }
  if(consent&&!consent.checked){
    msg.textContent="Please accept the Privacy Policy to subscribe.";
    consent.focus();
    return;
  }
  email.removeAttribute("aria-invalid");
  form.setAttribute("aria-busy","true");
  msg.textContent="Subscribing…";
  setTimeout(function(){
    form.removeAttribute("aria-busy");
    msg.classList.add("ok");
    msg.textContent="You are in. Check your inbox to confirm.";
    form.querySelector("button").setAttribute("aria-label","Subscribed");
  },700);
});

})();
