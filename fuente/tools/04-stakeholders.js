const TOOL={id:'stakeholders',mes:4,title:'Mapa de stakeholders',
lead:'Listá las personas y organizaciones que pueden ayudarte o frenarte. Ubicalas por poder e interés. El mapa te dice a quién dedicarle tiempo este año.',
how:['<b>1.</b> Agregá actores','<b>2.</b> Puntuá poder e interés de 1 a 5','<b>3.</b> Escribí el próximo paso'],
G:['Destinatarios','Financiadores','Aliados y redes','Estado','Equipo y gobierno interno','Medios y opinión pública'],
A:['A favor','Neutral','En contra','No sé'],
blank:{items:{n:'',g:0,p:3,i:3,a:'Neutral',s:''}},
init:()=>({items:[{n:'Fundación financiadora principal',g:1,p:5,i:4,a:'A favor',s:'Reunión de devolución en marzo'},{n:'Secretaría municipal de desarrollo social',g:3,p:4,i:2,a:'Neutral',s:'Pedir una reunión técnica'},{n:'Red de organizaciones del barrio',g:2,p:2,i:5,a:'A favor',s:'Proponer un evento conjunto'},{n:'Medio local',g:5,p:3,i:1,a:'Neutral',s:''}],ejemplo:true}),
est(i){const hp=i.p>=4,hi=i.i>=4;return hp&&hi?['Actuar ya','bad']:hp?['Mantener informado','warn']:hi?['Delegar la relación','blue']:['Monitorear','']},
view(){return `<div class="card"><div class="hd"><h2>Actores</h2>${st.ejemplo?'<span class="sample">Ejemplos ficticios</span>':''}</div>
${st.items.map((it,k)=>`<div class="item"><div class="row"><div style="flex:1 1 220px">${inp('items.'+k+'.n',{ph:'Nombre'})}</div><div style="flex:0 1 190px">${sel('items.'+k+'.g',this.G.map((g,i)=>[i,g]))}</div><div style="flex:0 1 110px">${sel('items.'+k+'.a',this.A)}</div><button class="x" data-a="del" data-p="items" data-i="${k}" aria-label="Quitar">✕</button></div>
<div class="grid3">${fld('Poder: <b data-v>'+it.p+'</b>',rng('items.'+k+'.p',1,5))}${fld('Interés: <b data-v>'+it.i+'</b>',rng('items.'+k+'.i',1,5))}${fld('Próximo paso',inp('items.'+k+'.s',{ph:'Qué hacemos con este actor'}))}</div></div>`).join('')}
<button class="g" data-a="add" data-p="items" style="margin-top:8px">+ Agregar actor</button></div><div id="out"></div>`},
out(){const W=520,H=380,P=40;const px=v=>P+(v-0.5)/5*(W-P*2),py=v=>H-P-(v-0.5)/5*(H-P*2);
const dots=st.items.filter(i=>i.n.trim()).map((i,k)=>{const c={'A favor':'var(--good)','Neutral':'var(--muted)','En contra':'var(--bad)','No sé':'var(--line)'}[i.a];const jx=(k%3-1)*6,jy=((k*7)%3-1)*6;return `<circle cx="${px(i.i)+jx}" cy="${py(i.p)+jy}" r="7" fill="${c}"/><text x="${px(i.i)+jx+10}" y="${py(i.p)+jy+4}" font-size="11">${esc(i.n.slice(0,22))}</text>`}).join('');
const lst=st.items.filter(i=>i.n.trim()).map(i=>[i,this.est(i)]).sort((a,b)=>(b[0].p+b[0].i)-(a[0].p+a[0].i));
return `<div class="card"><div class="hd"><h2>Tu mapa</h2><p class="sub">Color del punto: actitud. Verde a favor, rojo en contra, gris neutral.</p></div><div class="scroll"><svg viewBox="0 0 ${W} ${H}" style="width:100%;min-width:420px" role="img" aria-label="Mapa de poder e interés">
<rect x="${P}" y="${P-10}" width="${(W-P*2)/2}" height="${(H-P*2)/2+10}" fill="var(--blue-soft)"/><rect x="${W/2}" y="${P-10}" width="${(W-P*2)/2}" height="${(H-P*2)/2+10}" fill="var(--red-soft)"/>
<rect x="${P}" y="${H/2}" width="${(W-P*2)/2}" height="${(H-P*2)/2}" fill="none" stroke="var(--line)"/><rect x="${W/2}" y="${H/2}" width="${(W-P*2)/2}" height="${(H-P*2)/2}" fill="none" stroke="var(--line)"/>
<text x="${P+6}" y="${P+6}" font-size="11" fill="var(--muted)">Mantener informado</text><text x="${W-P-6}" y="${P+6}" font-size="11" text-anchor="end">Actuar ya</text><text x="${P+6}" y="${H-P-6}" font-size="11">Monitorear</text><text x="${W-P-6}" y="${H-P-6}" font-size="11" text-anchor="end">Delegar la relación</text>
<text x="${W/2}" y="${H-10}" font-size="11" text-anchor="middle">Interés →</text><text x="12" y="${H/2}" font-size="11" transform="rotate(-90 12 ${H/2})" text-anchor="middle">Poder →</text>${dots}</svg></div>
<div class="scroll"><table style="margin-top:12px"><tr><th>Actor</th><th>Grupo</th><th>Qué hacer</th><th>Próximo paso</th></tr>${lst.map(([i,e])=>`<tr><td>${esc(i.n)}</td><td>${this.G[i.g]}</td><td><span class="chip ${e[1]}">${e[0]}</span></td><td>${esc(i.s)||'<span class="sub">falta definir</span>'}</td></tr>`).join('')}</table></div>
${lst.filter(([i,e])=>e[0]==='Actuar ya'&&!i.s.trim()).length?'<div class="note">Hay actores de alto poder e interés sin próximo paso. Son los primeros que deberías resolver.</div>':''}</div>`},
summary(){return 'MAPA DE STAKEHOLDERS\n'+st.items.filter(i=>i.n.trim()).map(i=>`- ${i.n} (${this.G[i.g]}, ${i.a}) poder ${i.p}/interés ${i.i} → ${this.est(i)[0]}${i.s?': '+i.s:''}`).join('\n')}};
