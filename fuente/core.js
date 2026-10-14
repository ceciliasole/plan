const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const KEY='impactese:'+TOOL.id;let st,mem=null;
const IMP=window.IMP||null;let saveT,saving=false;
function load(){if(IMP)return IMP.state;try{const v=localStorage.getItem(KEY);if(v)return JSON.parse(v)}catch(e){}return mem}
function setSaveState(t,bad){const e=$('#savestate');if(e){e.textContent=t;e.classList.toggle('bad',!!bad)}}
async function flush(){if(!IMP)return;saving=true;setSaveState('Guardando…');
  try{const r=await fetch('/api/tools/'+TOOL.id,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({state:st}),keepalive:true});
    if(r.status===401){setSaveState('Tu sesión venció. Volvé a ingresar para guardar.',1);return}
    if(!r.ok)throw 0;setSaveState('Guardado')}catch(e){setSaveState('No se pudo guardar. Reintentando…',1);saveT=setTimeout(flush,4000)}finally{saving=false}}
function persist(){mem=st;if(IMP){clearTimeout(saveT);setSaveState('Sin guardar…');saveT=setTimeout(flush,700);return}try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}}
addEventListener('beforeunload',e=>{if(IMP&&(saveT||saving)){clearTimeout(saveT);flush()}});
const getp=p=>p.split('.').reduce((o,k)=>o?.[k],st);
function setp(p,v){const k=p.split('.');let o=st;for(const x of k.slice(0,-1))o=o[x];o[k[k.length-1]]=v}
const val=p=>esc(getp(p));
const inp=(p,o={})=>`<input data-b="${p}" type="${o.t||'text'}" value="${val(p)}" ${o.ph?`placeholder="${esc(o.ph)}"`:''} ${o.min!=null?`min="${o.min}"`:''} ${o.max!=null?`max="${o.max}"`:''} ${o.step?`step="${o.step}"`:''} ${o.a||''}>`;
const area=(p,ph='',rows=3)=>`<textarea data-b="${p}" rows="${rows}" placeholder="${esc(ph)}">${val(p)}</textarea>`;
const sel=(p,opts,o={})=>`<select data-b="${p}" ${o.redraw?'data-redraw':''}>${opts.map(x=>{const [v,l]=Array.isArray(x)?x:[x,x];return `<option value="${esc(v)}" ${String(getp(p))===String(v)?'selected':''}>${esc(l)}</option>`}).join('')}</select>`;
const rng=(p,min,max,step=1)=>`<input data-b="${p}" type="range" min="${min}" max="${max}" step="${step}" value="${val(p)}">`;
const fld=(l,h)=>`<label class="f">${l}${h}</label>`;
const fmt=n=>isFinite(n)?Math.round(n).toLocaleString('es-AR'):'—';
const pct=n=>isFinite(n)?Math.round(n*100)+'%':'—';
function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2200)}
const RO=!!(window.IMP&&window.IMP.readonly);
// Ejemplos: las filas y valores que vienen de fábrica se ven en cursiva hasta que la persona escribe en ellos.
// Mientras sigan así no cuentan para el plan estratégico (ver 12-plan.js).
const isO=o=>o&&typeof o==='object';
function markEx(o){if(Array.isArray(o))o.forEach(x=>{if(isO(x)&&!Array.isArray(x))x._ej=true;markEx(x)});else if(isO(o))for(const k in o)markEx(o[k])}
function hasEx(o){return Array.isArray(o)?o.some(x=>(isO(x)&&x._ej)||hasEx(x)):isO(o)?Object.values(o).some(hasEx):false}
function initEx(){markEx(st);st._exf=Object.keys(st).filter(k=>k!=='ejemplo'&&k[0]!=='_'&&(typeof st[k]==='number'||(typeof st[k]==='string'&&st[k])));st._exf0=st._exf.length;st._hasEx=hasEx(st)||st._exf.length>0}
function exAt(p){let o=st;for(const x of p.split('.')){if(!isO(o))break;if(o._ej)return true;o=o[x]}return(isO(o)&&o._ej)||(st._exf||[]).includes(p)}
function clearEx(p){let o=st;for(const x of p.split('.')){if(!isO(o))break;if(o._ej)delete o._ej;o=o[x]}if(isO(o)&&o._ej)delete o._ej;if(st._exf){const i=st._exf.indexOf(p);if(i>=0)st._exf.splice(i,1)}}
function markDom(){document.querySelectorAll('#app [data-b]').forEach(e=>e.classList.toggle('ej',!!exAt(e.dataset.b)))}
document.addEventListener('focusin',e=>{const el=e.target;if(el.classList&&el.classList.contains('ej')&&el.select&&!['range','checkbox','date'].includes(el.type))try{el.select()}catch(_){}});
function lock(){if(RO)document.querySelectorAll('#root input,#root select,#root textarea,#root button').forEach(e=>e.disabled=true)}
function draw(){
  if('ejemplo' in st)st.ejemplo=hasEx(st)||!!(st._exf&&st._exf.length);
  const a=document.activeElement,fb=a&&a.dataset&&a.dataset.b,ss=a&&a.selectionStart;
  $('#app').innerHTML=TOOL.view();
  if(TOOL.out)$('#out').innerHTML=TOOL.out();
  if(fb){const e=$(`[data-b="${fb}"]`);if(e){e.focus();try{e.setSelectionRange(ss,ss)}catch(_){}}}
  lock();markDom();
}
function upd(){if(TOOL.out&&$('#out'))$('#out').innerHTML=TOOL.out()}
document.addEventListener('input',e=>{const el=e.target,p=el.dataset.b;if(!p||RO)return;
  let v=el.type==='checkbox'?el.checked:(el.type==='number'||el.type==='range')?(el.value===''?'':Number(el.value)):el.value;
  setp(p,v);clearEx(p);persist();if(el.type==='range'){const o=el.closest('label')?.querySelector('[data-v]');if(o)o.textContent=v}if(el.hasAttribute('data-redraw'))draw();else{upd();markDom()}});
document.addEventListener('change',e=>{const el=e.target;if(el.hasAttribute&&el.hasAttribute('data-redraw')&&el.tagName==='SELECT'){draw()}});
document.addEventListener('click',async e=>{const el=e.target.closest('[data-a]');if(!el||RO)return;const a=el.dataset.a,p=el.dataset.p,i=el.dataset.i;
  if(a==='add'){getp(p).push(JSON.parse(JSON.stringify(TOOL.blank[p])));persist();draw()}
  else if(a==='del'){getp(p).splice(+i,1);persist();draw()}
  else if(a==='copy'){const t=TOOL.summary();try{await navigator.clipboard.writeText(t);toast('Resumen copiado')}catch(_){const b=$('#cpbox');b.hidden=false;b.querySelector('textarea').value=t;b.querySelector('textarea').select()}}
  else if(a==='save'){try{const d=await claude.use('downloads');if(!d)throw 0;await d.save({filename:'plan-'+TOOL.id+'.txt',data:TOOL.summary()})}catch(_){const b=$('#cpbox');b.hidden=false;b.querySelector('textarea').value=TOOL.summary()}}
  else if(a==='reset'){if(!el.classList.contains('arm')){el.classList.add('arm');el.textContent='Confirmar: borrar todo';setTimeout(()=>{el.classList.remove('arm');el.textContent='Empezar de cero'},4000)}else{st=TOOL.init();persist();draw()}}
  else if(TOOL.act&&TOOL.act[a]){TOOL.act[a](p,i,el);persist();draw()}});
function shell(){
  const idx=(window.INDEX_URL||'');
  const brand=IMP&&IMP.org?`<span class="brand">${IMP.org.logo?`<img src="${esc(IMP.org.logo)}" alt="" class="logo">`:''}${esc(IMP.org.name)}</span>`:'';
  const pay=RO?(IMP.pay.url?`<a href="${esc(IMP.pay.url)}">activá tu inscripción</a>`:`escribinos a <a href="mailto:${esc(IMP.pay.contact)}">${esc(IMP.pay.contact)}</a> para activar tu inscripción`):'';
  const banner=RO?`<div class="note" role="status"><b>Vista previa.</b> Estos son datos de ejemplo y no se puede editar ni guardar. Para completar esta herramienta, ${pay}.</div>`:'';
  const note=RO?'Vista previa, sin guardado.':IMP?`<span id="savestate" role="status">Guardado</span> <label class="donechk"><input type="checkbox" id="donechk" ${IMP.done?'checked':''}> Lo di por terminado</label>`:'Tu trabajo se guarda en este navegador. Nadie más lo ve. Si querés comentarlo con nosotras, copiá el resumen y pegalo en un mail.';
  $('#root').innerHTML=`<div class="wrap"><div class="top"><span>${brand||''}Paso ${TOOL.mes} de 12</span>${idx?`<a href="${idx}">Ver los 12 pasos</a>`:''}</div>
  ${banner}<h1>${TOOL.title}</h1><p class="lead">${TOOL.lead}</p><div class="how">${TOOL.how.map(h=>`<span>${h}</span>`).join('')}</div>
  <div id="app"></div>
  <div class="foot"><button class="p" data-a="copy">Copiar resumen</button><button data-a="save">Descargar</button><button data-a="reset">Empezar de cero</button><p class="sub">${note}</p></div>
  <div id="cpbox" hidden class="card"><p class="sub">Seleccioná todo y copiá el texto:</p><textarea class="cp" readonly></textarea></div></div>`;
}
document.addEventListener('change',e=>{if(e.target.id==='donechk')fetch('/api/tools/'+TOOL.id+'/done',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({done:e.target.checked})})});
const loaded=load();st=loaded||TOOL.init();if(!loaded)initEx();if(TOOL.mig)TOOL.mig();shell();draw();
