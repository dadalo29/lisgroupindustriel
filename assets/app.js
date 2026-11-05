(function(){
  var L=document.documentElement.lang==='en'?'en':'fr';
  var T={fr:{h:'h',from:'Dakar',dist:'Distance routière',time:'Conduite estimée',gm:'Itinéraire via la Transgambienne (pont de Farafenni)',note:'Distance par la route calculée depuis Dakar (OpenStreetMap). Temps de conduite d\'un camion chargé estimé sur une moyenne de 50 km/h, hors pauses réglementaires, chargement et attente.',sending:'Envoi en cours…',ok:'Merci, votre demande a bien été envoyée. Nous revenons vers vous rapidement.',ko:'L\'envoi n\'a pas abouti. Écrivez-nous directement à ',subj:'Demande d\'offre de transport – ',copied:'Adresse copiée'},
         en:{h:'h',from:'Dakar',dist:'Road distance',time:'Est. driving time',gm:'Route via the Trans-Gambia Highway (Farafenni bridge)',note:'Road distance from Dakar (OpenStreetMap routing). Driving time for a loaded truck estimated at a 50 km/h average, excluding mandatory breaks, loading and waiting.',sending:'Sending…',ok:'Thank you, your request has been sent. We will get back to you shortly.',ko:'Sending failed. Please email us directly at ',subj:'Transport quote request – ',copied:'Address copied'}}[L];
  var nav=document.getElementById('nav'), burger=document.getElementById('burger');
  if(burger) burger.addEventListener('click',function(){var o=nav.classList.toggle('open');burger.setAttribute('aria-expanded',o?'true':'false');});

  /* ---------- Carte ---------- */
  var smap=document.querySelector('.smap');
  if(smap){
    var data=JSON.parse(document.getElementById('mapdata').textContent), byId={};
    data.forEach(function(d){byId[d.id]=d;});
    var FULL=[0,0,900,672], cur=FULL.slice(), anim=null;
    var card=document.getElementById('mcard'), reset=document.getElementById('mreset');
    function applyZ(vb){
      smap.setAttribute('viewBox',vb.map(function(v){return v.toFixed(2);}).join(' '));
      var z=900/vb[2]; smap.style.setProperty('--z',z); smap.classList.toggle('near',z>1.8);
      var k=Math.pow(z,0.3)/z;
      smap.querySelectorAll('circle[data-r]').forEach(function(c){c.setAttribute('r',(+c.dataset.r*k).toFixed(2));});
      smap.querySelectorAll('text[data-x]').forEach(function(tx){tx.setAttribute('x',(+tx.dataset.x+(+tx.dataset.dx||0)/z).toFixed(2));tx.setAttribute('y',(+tx.dataset.y+(+tx.dataset.dy||0)/z).toFixed(2));});
    }
    function zoomTo(to){
      var from=cur.slice(), t0=performance.now(), Dur=matchMedia('(prefers-reduced-motion: reduce)').matches?0:750;
      cancelAnimationFrame(anim);
      (function step(now){var u=Dur?Math.min(1,(now-t0)/Dur):1; u=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;
        cur=from.map(function(v,i){return v+(to[i]-v)*u;}); applyZ(cur); if(u<1) anim=requestAnimationFrame(step);})(t0);
    }
    function fit(bb){
      var p=40, x0=bb[0]-p, y0=bb[1]-p, w=bb[2]-bb[0]+2*p+60, h=bb[3]-bb[1]+2*p, R=900/672;
      if(w<230){x0-=(230-w)/2;w=230;}
      if(w/h<R){var nw=h*R;x0-=(nw-w)/2;w=nw;}else{var nh=w/R;y0-=(nh-h)/2;h=nh;}
      if(w>=900) return FULL.slice();
      x0=Math.max(0,Math.min(x0,900-w)); y0=Math.max(0,Math.min(y0,672-h));
      return [x0,y0,w,h];
    }
    function fmtT(km){var m=Math.round(km/50*60/15)*15, h=Math.floor(m/60), r=m%60; return h?(h+' h'+(r?' '+(r<10?'0':'')+r:'')):(r+' min');}
    function select(id){
      var d=byId[id];
      smap.querySelectorAll('.rt,.mk').forEach(function(el){el.classList.remove('act');});
      document.querySelectorAll('.dbtn').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.id===id?'true':'false');});
      if(!d){smap.classList.remove('focus');zoomTo(FULL);reset.hidden=true;card.innerHTML=card.dataset.def;return;}
      var r=document.getElementById('rt-'+id), m=smap.querySelector('.mk[data-id="'+id+'"]');
      if(r){r.classList.add('act');r.parentNode.appendChild(r);} if(m) m.classList.add('act');
      smap.classList.add('focus'); reset.hidden=false; zoomTo(fit(d.bb));
      card.innerHTML='<div class="t">'+T.from+' <span>→</span> '+d[L]+'</div><dl><div><dt>'+T.dist+'</dt><dd>'+d.km.toLocaleString(L==='fr'?'fr-FR':'en-GB')+' km</dd></div><div><dt>'+T.time+'</dt><dd>≈ '+fmtT(d.km)+'</dd></div></dl>'+(d.gm?'<div class="gm">'+T.gm+'</div>':'')+'<p>'+T.note+'</p>';
    }
    card.dataset.def=card.innerHTML;
    document.querySelectorAll('.dbtn').forEach(function(b){b.addEventListener('click',function(){select(b.getAttribute('aria-pressed')==='true'?null:b.dataset.id);});});
    smap.querySelectorAll('.mk').forEach(function(m){m.addEventListener('click',function(){var id=m.dataset.id;
      var b=document.querySelector('.dbtn[data-id="'+id+'"]'); if(b&&b.closest('[role=tabpanel]').hidden){document.querySelector('[aria-controls="'+b.closest('[role=tabpanel]').id+'"]').click();}
      select(id);});});
    reset.addEventListener('click',function(){select(null);});
    document.querySelectorAll('.tabs button').forEach(function(t){t.addEventListener('click',function(){
      document.querySelectorAll('.tabs button').forEach(function(x){var on=x===t;x.setAttribute('aria-selected',on?'true':'false');document.getElementById(x.getAttribute('aria-controls')).hidden=!on;});
    });});
    applyZ(cur);
  }

  /* ---------- Formulaire ---------- */
  var f=document.getElementById('devis');
  if(f){
    var DEST='contact@lisgroupindustriel.com';
    f.addEventListener('submit',function(){
      var soc=f.querySelector('[data-soc]').value.trim(), sj=f.querySelector('[name=_subject]');
      if(soc) sj.value=T.subj+soc;
      var btn=f.querySelector('button[type=submit]'); btn.disabled=true; var ok=document.getElementById('ok'); ok.hidden=false; ok.textContent=T.sending;
    });
    var cb=document.getElementById('copyBtn');
    cb.addEventListener('click',function(){
      var el=document.getElementById('mail');
      function sel(){var r=document.createRange();r.selectNodeContents(el);var s=getSelection();s.removeAllRanges();s.addRange(r);}
      try{navigator.clipboard.writeText(el.textContent).then(function(){cb.textContent=T.copied;},sel);}catch(e){sel();}
    });
  }
})();
