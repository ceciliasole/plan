const TOOL={id:'presupuesto',mes:11,title:'Presupuesto anual',
lead:'Poné números a tu plan. Cargá ingresos y gastos con el mes en que empiezan y terminan. Mirá mes a mes si la caja llega o si hay un bache que tenés que cubrir.',
how:['<b>1.</b> Indicá tu saldo inicial','<b>2.</b> Cargá ingresos y gastos','<b>3.</b> Buscá los meses en rojo'],
M:['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
blank:{r:{n:'',tp:'gasto',m:0,ini:1,fin:12,seg:true,kr:''}},
init:()=>({saldo:1800000,r:[{n:'Fondo de una fundación (ficticio)',tp:'ingreso',m:6000000,ini:1,fin:12,seg:true,kr:''},{n:'Socios mensuales (ficticio)',tp:'ingreso',m:2400000,ini:1,fin:12,seg:false,kr:'Socios mensuales activos'},{n:'Equipo de programas (ficticio)',tp:'gasto',m:6600000,ini:1,fin:12,seg:true,kr:''},{n:'Campaña de socios (ficticio)',tp:'gasto',m:900000,ini:1,fin:6,seg:true,kr:'Socios mensuales activos'}],ejemplo:true}),
mes(sol){const a=Array(12).fill(0);st.r.forEach(r=>{if(sol&&!r.seg&&r.tp==='ingreso')return;const n=Math.max(1,r.fin-r.ini+1);for(let i=+r.ini;i<=+r.fin;i++)a[i-1]+=(r.tp==='ingreso'?1:-1)*(+r.m||0)/n});return a},
view(){return `<div class="card"><div class="hd"><h2>Ingresos y gastos</h2>${st.ejemplo?'<span class="sample">Cifras ficticias</span>':''}</div>${fld('Saldo inicial disponible',inp('saldo',{t:'number',min:0}))}
${st.r.map((r,k)=>`<div class="item"><div class="row"><div style="flex:1 1 200px">${inp('r.'+k+'.n',{ph:'Concepto'})}</div><div style="flex:0 1 110px">${sel('r.'+k+'.tp',['ingreso','gasto'])}</div><div style="flex:0 1 140px">${inp('r.'+k+'.m',{t:'number',min:0,ph:'Total anual'})}</div><button class="x" data-a="del" data-p="r" data-i="${k}" aria-label="Quitar">✕</button></div>
<div class="row"><div style="flex:0 1 120px">${sel('r.'+k+'.ini',this.M.map((m,i)=>[i+1,'Desde '+m]))}</div><div style="flex:0 1 120px">${sel('r.'+k+'.fin',this.M.map((m,i)=>[i+1,'Hasta '+m]))}</div>${r.tp==='ingreso'?`<label class="row"><input type="checkbox" data-b="r.${k}.seg" ${r.seg?'checked':''}> Asegurado</label>`:''}<div style="flex:1 1 180px">${inp('r.'+k+'.kr',{ph:'Resultado clave que financia (opcional)'})}</div></div></div>`).join('')}
<button class="g" data-a="add" data-p="r" style="margin-top:8px">+ Agregar línea</button></div><div id="out"></div>`},
out(){const f=this.mes(false),s=this.mes(true);let a=+st.saldo||0,b=a;const A=[],B=[];f.forEach((v,i)=>{a+=v;A.push(a);b+=s[i];B.push(b)});
const neg=B.map((v,i)=>v<0?this.M[i]:null).filter(Boolean);const tot=f.reduce((x,y)=>x+y,0);
return `<div class="card"><div class="hd"><h2>Caja mes a mes</h2></div>${neg.length?`<div class="note">Si solo contás ingresos asegurados, la caja queda negativa en: ${neg.join(', ')}. Ahí necesitás conseguir fondos, bajar gasto o mover fechas.</div>`:'<div class="note" style="border-color:var(--good);background:var(--good-soft)">Con solo ingresos asegurados la caja no baja de cero.</div>'}
<div class="scroll"><table style="min-width:720px"><tr><th></th>${this.M.map(m=>`<th>${m}</th>`).join('')}</tr>
<tr><td>Flujo del mes</td>${f.map(v=>`<td class="num">${fmt(v/1000)}k</td>`).join('')}</tr>
<tr><td>Caja total</td>${A.map(v=>`<td class="num" style="color:${v<0?'var(--bad)':'inherit'}">${fmt(v/1000)}k</td>`).join('')}</tr>
<tr><td>Caja solo asegurado</td>${B.map(v=>`<td class="num"><span class="chip ${v<0?'bad':'good'}">${fmt(v/1000)}k</span></td>`).join('')}</tr></table></div>
<p class="sub">Resultado anual: <b class="num">$${fmt(tot)}</b>. Cifras en miles.</p></div>`},
summary(){const f=this.mes(false);return `PRESUPUESTO ANUAL\nSaldo inicial $${fmt(st.saldo)}\n`+st.r.filter(r=>r.n.trim()).map(r=>`- ${r.tp}: ${r.n} $${fmt(r.m)} (meses ${r.ini}-${r.fin})${r.tp==='ingreso'?(r.seg?' asegurado':' a conseguir'):''}${r.kr?' → '+r.kr:''}`).join('\n')+`\nResultado anual $${fmt(f.reduce((x,y)=>x+y,0))}`}};
