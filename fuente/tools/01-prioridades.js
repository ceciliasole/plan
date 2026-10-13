const TOOL={id:'prioridades',mes:1,title:'Matriz de prioridades',
lead:'Volcá todo lo que hoy compite por tu tiempo y tu plata. Marcá qué es urgente y qué es importante. La matriz te dice qué hacer ya, qué planificar, qué delegar y qué dejar ir.',
how:['<b>1.</b> Cargá entre 10 y 25 cosas','<b>2.</b> Marcá urgente e importante','<b>3.</b> Mirá el tablero y decidí'],
blank:{items:{t:'',u:false,i:false,who:''}},
init:()=>({items:[
{t:'Renovar convenio con el municipio',u:true,i:true,who:'Dirección'},
{t:'Responder consultas de redes todos los días',u:true,i:false,who:''},
{t:'Armar plan de comunicación anual',u:false,i:true,who:''},
{t:'Reunión semanal con todo el equipo',u:false,i:false,who:''}],ejemplo:true}),
q(it){return it.u&&it.i?0:!it.u&&it.i?1:it.u&&!it.i?2:3},
Q:[['Hacer ahora','Urgente e importante','q-red'],['Planificar','Importante, no urgente','q-blue'],['Delegar','Urgente, no importante','q-warn'],['Dejar ir','Ni urgente ni importante','']],
view(){return `<div class="card"><div class="hd"><h2>Tus cosas pendientes</h2>${st.ejemplo?'<span class="sample">Ejemplos ficticios: reemplazalos por los tuyos</span>':''}</div>
${st.items.map((it,k)=>`<div class="item"><div class="row"><div style="flex:1 1 220px">${inp('items.'+k+'.t',{ph:'Qué es'})}</div><div style="flex:0 1 160px">${inp('items.'+k+'.who',{ph:'Quién'})}</div>
<label class="row"><input type="checkbox" data-b="items.${k}.u" ${it.u?'checked':''}> Urgente</label><label class="row"><input type="checkbox" data-b="items.${k}.i" ${it.i?'checked':''}> Importante</label>
<button class="x" data-a="del" data-p="items" data-i="${k}" aria-label="Quitar">✕</button></div></div>`).join('')}
<button class="g" data-a="add" data-p="items" style="margin-top:8px">+ Agregar</button></div><div id="out"></div>`},
out(){const g=[[],[],[],[]];st.items.filter(i=>i.t.trim()).forEach(i=>g[this.q(i)].push(i));
const warn=g[0].length>5?`<div class="note">Tenés ${g[0].length} cosas en “Hacer ahora”. Si todo es urgente, nada lo es. Revisá cuáles son urgentes por una fecha real y cuáles por costumbre.</div>`:'';
const w=g[1].length<g[0].length?`<div class="note">Hay más cosas urgentes que planificadas. Eso suele indicar que la organización apaga incendios y no avanza en lo estratégico.</div>`:'';
return `<div class="card"><div class="hd"><h2>Tu tablero</h2></div>${warn}${w}<div class="quads">${this.Q.map((q,k)=>`<div class="quad ${q[2]}"><h3>${q[0]}<span class="chip">${g[k].length}</span></h3><p class="sub">${q[1]}</p><ul>${g[k].map(i=>`<li>${esc(i.t)}${i.who?` <span class="sub">· ${esc(i.who)}</span>`:''}</li>`).join('')}</ul></div>`).join('')}</div></div>`},
summary(){const g=[[],[],[],[]];st.items.filter(i=>i.t.trim()).forEach(i=>g[this.q(i)].push(i));return 'MATRIZ DE PRIORIDADES\n'+this.Q.map((q,k)=>`\n${q[0].toUpperCase()} (${q[1]})\n`+(g[k].map(i=>'- '+i.t+(i.who?' ['+i.who+']':'')).join('\n')||'- (vacío)')).join('\n')}};
