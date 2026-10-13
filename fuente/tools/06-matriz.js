const TOOL={id:'matriz',mes:6,title:'Matriz de posicionamiento',
lead:'Elegí dos ejes que de verdad separan a quienes compiten por lo mismo que vos. Ubicate junto a tus alternativas. La matriz muestra dónde hay espacio y quién está más cerca.',
how:['<b>1.</b> Definí los dos ejes','<b>2.</b> Sumá alternativas reales','<b>3.</b> Ubicalos y leé el resultado'],
blank:{items:{n:'',x:0,y:0}},
init:()=>({prod:'',xl:'Servicio estándar',xr:'Servicio a medida',yb:'Alcance local',yt:'Alcance nacional',items:[{n:'Nosotros',x:1.5,y:-2,nos:true},{n:'Organización A (ficticia)',x:-2.5,y:3},{n:'Organización B (ficticia)',x:2,y:2.5},{n:'Hacerlo internamente',x:-1,y:-3.5}],ejemplo:true}),
view(){return `<div class="card"><div class="hd"><h2>Ejes</h2><p class="sub">Una matriz por producto o servicio: todos los puntos tienen que resolver el mismo problema para el mismo público. Los ejes son la decisión estratégica.</p></div>
${fld('Producto o servicio que analizás',inp('prod',{ph:'Ej: capacitación en recaudación para fundaciones chicas'}))}
<div class="grid2" style="margin-top:12px">${fld('Eje horizontal, izquierda',inp('xl'))}${fld('Eje horizontal, derecha',inp('xr'))}${fld('Eje vertical, abajo',inp('yb'))}${fld('Eje vertical, arriba',inp('yt'))}</div></div>
<div class="card"><div class="hd"><h2>Quiénes están en el mapa</h2>${st.ejemplo?'<span class="sample">Ejemplos ficticios</span>':''}</div>
${st.items.map((it,k)=>`<div class="item"><div class="row"><div style="flex:1 1 220px">${inp('items.'+k+'.n',{ph:'Nombre'})}</div>${it.nos?'<span class="chip blue">nosotros</span>':`<button class="x" data-a="del" data-p="items" data-i="${k}" aria-label="Quitar">✕</button>`}</div>
<div class="grid2">${fld('Horizontal: <b data-v>'+it.x+'</b>',rng('items.'+k+'.x',-5,5,.5))}${fld('Vertical: <b data-v>'+it.y+'</b>',rng('items.'+k+'.y',-5,5,.5))}</div></div>`).join('')}
<button class="g" data-a="add" data-p="items" style="margin-top:8px">+ Agregar alternativa</button></div><div id="out"></div>`},
quad(i){return (i.x>=0?1:0)+(i.y>=0?2:0)},
out(){const W=520,H=420,P=34,sx=v=>W/2+v/5*(W/2-P),sy=v=>H/2-v/5*(H/2-P);
const nos=st.items.find(i=>i.nos),rest=st.items.filter(i=>!i.nos&&i.n.trim());
const names=['abajo-izquierda','abajo-derecha','arriba-izquierda','arriba-derecha'];const lab=[st.yb+' / '+st.xl,st.yb+' / '+st.xr,st.yt+' / '+st.xl,st.yt+' / '+st.xr];
const cnt=[0,0,0,0];rest.forEach(i=>cnt[this.quad(i)]++);const empty=cnt.map((c,k)=>c===0&&k!==this.quad(nos)?k:-1).filter(k=>k>=0);
let near=null,d=1e9;if(nos)rest.forEach(i=>{const dd=Math.hypot(i.x-nos.x,i.y-nos.y);if(dd<d){d=dd;near=i}});
const dots=st.items.filter(i=>i.n.trim()).map(i=>`<circle cx="${sx(i.x)}" cy="${sy(i.y)}" r="${i.nos?9:6}" fill="${i.nos?'var(--red)':'var(--blue)'}" fill-opacity="${i.nos?1:.7}"/><text x="${sx(i.x)+11}" y="${sy(i.y)+4}" font-size="11" ${i.nos?'font-weight="700"':''}>${esc(i.n.slice(0,24))}</text>`).join('');
return `<div class="card"><div class="hd"><h2>Tu matriz</h2></div><div class="scroll"><svg viewBox="0 0 ${W} ${H}" style="width:100%;min-width:420px" role="img" aria-label="Matriz de posicionamiento">
<rect x="${P}" y="${P}" width="${W-P*2}" height="${H-P*2}" fill="var(--surface)" stroke="var(--line)"/><line x1="${W/2}" y1="${P}" x2="${W/2}" y2="${H-P}" stroke="var(--line)"/><line x1="${P}" y1="${H/2}" x2="${W-P}" y2="${H/2}" stroke="var(--line)"/>
<text x="${P}" y="${H/2-5}" font-size="10" fill="var(--muted)">← ${esc(st.xl)}</text><text x="${W-P}" y="${H/2-5}" font-size="10" text-anchor="end">${esc(st.xr)} →</text><text x="${W/2+5}" y="${H-P-5}" font-size="10">↓ ${esc(st.yb)}</text><text x="${W/2+5}" y="${P+12}" font-size="10">↑ ${esc(st.yt)}</text>${dots}</svg></div>
<div style="margin-top:10px">${nos&&near?`<p>Tu alternativa más cercana es <b>${esc(near.n)}</b>. Si el público las ve parecidas, la frase de posicionamiento tiene que explicar por qué elegirte a vos.</p>`:''}
${nos?`<p>En tu cuadrante hay ${cnt[this.quad(nos)]} alternativa(s).</p>`:''}
${empty.length?`<p>Cuadrantes sin nadie: ${empty.map(k=>esc(lab[k])).join('; ')}. Un espacio vacío puede ser una oportunidad o una zona sin demanda. Verificalo con tu público antes de apostar.</p>`:'<p>No hay cuadrantes vacíos con estos puntos.</p>'}</div></div>`},
summary(){const nos=st.items.find(i=>i.nos);return 'MATRIZ DE POSICIONAMIENTO\nProducto: '+(st.prod||'—')+`\nEjes: ${st.xl} ↔ ${st.xr}; ${st.yb} ↔ ${st.yt}\n`+st.items.filter(i=>i.n.trim()).map(i=>`- ${i.n}: (${i.x}, ${i.y})`).join('\n')}};
