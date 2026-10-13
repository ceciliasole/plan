const TOOL={id:'bcg',mes:2,title:'Cartera BCG',
lead:'Poné todos tus programas, proyectos o líneas de trabajo en una misma mesa. Respondé cinco preguntas por cada uno. La matriz los ubica y marca con lápiz rojo la decisión que te toca: invertir, sostener, cosechar o cerrar.',
how:['<b>1.</b> Listá tus programas','<b>2.</b> Respondé sí o no','<b>3.</b> Anotá tu decisión'],
blank:{items:{n:'',nuevo:false,cubre:false,demanda:false,visible:false,mision:false,dec:''}},
Qs:[['nuevo','Es nuevo o está en piloto'],['cubre','Genera recursos que cubren su costo'],['demanda','La demanda o el interés crece'],['visible','Nos reconocen por este trabajo'],['mision','Es central a nuestra misión']],
init:()=>({items:[
{n:'Programa de formación',nuevo:false,cubre:true,demanda:true,visible:true,mision:true,dec:''},
{n:'Línea de investigación',nuevo:false,cubre:false,demanda:false,visible:true,mision:true,dec:''},
{n:'Piloto digital',nuevo:true,cubre:false,demanda:true,visible:false,mision:false,dec:''}],ejemplo:true}),
cls(i){if(i.nuevo)return 'Interrogante';if(i.cubre&&i.demanda)return 'Estrella';if(i.cubre)return 'Vaca';if(i.demanda)return 'Interrogante';return 'Perro'},
meta:{Estrella:['Invertir para sostener el liderazgo','q-good'],Vaca:['Cosechar: financia al resto','q-blue'],Interrogante:['Decidir: apostar o parar','q-warn'],Perro:['Revisar: cerrar o sostener a propósito','q-red']},
view(){return `<div class="card"><div class="hd"><h2>Tus programas</h2>${st.ejemplo?'<span class="sample">Ejemplos ficticios: reemplazalos por los tuyos</span>':''}</div>
${st.items.map((it,k)=>`<div class="item"><div class="row">${'<div style="flex:1 1 240px">'+inp('items.'+k+'.n',{ph:'Nombre del programa'})+'</div>'}<span class="chip ${this.cls(it)==='Perro'?'bad':'blue'}">${this.cls(it)}</span><button class="x" data-a="del" data-p="items" data-i="${k}" aria-label="Quitar">✕</button></div>
<div class="row">${this.Qs.map(q=>`<label class="row"><input type="checkbox" data-b="items.${k}.${q[0]}" ${it[q[0]]?'checked':''} data-redraw> ${q[1]}</label>`).join('')}</div>
<div class="row"><div style="flex:1 1 260px">${inp('items.'+k+'.dec',{ph:'Tu decisión con lápiz rojo (ej: sumar un financiador, cerrar en junio)'})}</div></div></div>`).join('')}
<button class="g" data-a="add" data-p="items" style="margin-top:8px">+ Agregar</button></div><div id="out"></div>`},
out(){const g={Estrella:[],Vaca:[],Interrogante:[],Perro:[]};st.items.filter(i=>i.n.trim()).forEach(i=>g[this.cls(i)].push(i));
const flag=g.Perro.filter(i=>i.mision).length;
return `<div class="card"><div class="hd"><h2>Tu cartera</h2></div><div class="quads">${[['Interrogante','Poca plata, demanda en alza'],['Estrella','Cubre su costo y crece'],['Perro','No cubre su costo y no crece'],['Vaca','Cubre su costo, demanda estable']].map(([c,s])=>`<div class="quad ${this.meta[c][1]}"><h3>${c}<span class="chip">${g[c].length}</span></h3><p class="sub">${s}. ${this.meta[c][0]}.</p><ul>${g[c].map(i=>`<li>${esc(i.n)}${i.dec?`<br><span style="color:var(--red);font-weight:600">✎ ${esc(i.dec)}</span>`:''}</li>`).join('')}</ul></div>`).join('')}</div>
${flag?`<div class="note">${flag} programa(s) en “Perro” son centrales a la misión. Si los sostenés, que sea una decisión explícita con financiamiento propio, no por inercia.</div>`:''}
${g.Estrella.length+g.Vaca.length===0&&st.items.length?'<div class="note">Ningún programa cubre su costo. Eso es un riesgo de continuidad. Es el tema para la Salud financiera (paso 7).</div>':''}</div>`},
summary(){return 'CARTERA BCG\n'+st.items.filter(i=>i.n.trim()).map(i=>`- ${i.n}: ${this.cls(i)} → ${i.dec||'sin decisión'}`).join('\n')}};
