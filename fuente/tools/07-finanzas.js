const TOOL={id:'finanzas',mes:7,title:'Salud financiera',
lead:'Cargá de dónde viene la plata y a dónde va. Te devolvemos cinco indicadores con semáforo: cuántos meses aguantás, cuánto depende de una sola fuente, cuánto está asegurado, cuánto es restringido y cuánto cuesta la estructura.',
how:['<b>1.</b> Cargá ingresos del año','<b>2.</b> Cargá gastos y reservas','<b>3.</b> Mirá el semáforo'],
T:['Individuos','Fundaciones','Empresas','Estado','Venta de servicios','Otros'],
blank:{ing:{n:'',t:0,m:0,seg:false,res:false}},
init:()=>({ing:[{n:'Fondo de una fundación (ficticio)',t:1,m:6000000,seg:true,res:true},{n:'Socios mensuales (ficticio)',t:0,m:2500000,seg:false,res:false},{n:'Servicio de capacitación (ficticio)',t:4,m:1500000,seg:false,res:false}],gProg:7000000,gEstr:2500000,reserva:1800000,ejemplo:true}),
M(){const tot=st.ing.reduce((a,i)=>a+(+i.m||0),0),g=(+st.gProg||0)+(+st.gEstr||0),mx=Math.max(0,...st.ing.map(i=>+i.m||0));
const seg=st.ing.filter(i=>i.seg).reduce((a,i)=>a+(+i.m||0),0),res=st.ing.filter(i=>i.res).reduce((a,i)=>a+(+i.m||0),0);
return {tot,g,res_:tot-g,meses:g?(+st.reserva||0)/(g/12):NaN,conc:tot?mx/tot:NaN,seg:tot?seg/tot:NaN,rest:tot?res/tot:NaN,estr:g?(+st.gEstr||0)/g:NaN}},
view(){return `<div class="card"><div class="hd"><h2>Ingresos del año</h2>${st.ejemplo?'<span class="sample">Cifras ficticias: reemplazalas</span>':''}</div>
${st.ing.map((it,k)=>`<div class="item"><div class="row"><div style="flex:1 1 200px">${inp('ing.'+k+'.n',{ph:'Fuente'})}</div><div style="flex:0 1 150px">${sel('ing.'+k+'.t',this.T.map((t,i)=>[i,t]))}</div><div style="flex:0 1 150px">${inp('ing.'+k+'.m',{t:'number',min:0,ph:'Monto anual'})}</div><button class="x" data-a="del" data-p="ing" data-i="${k}" aria-label="Quitar">✕</button></div>
<div class="row"><label class="row"><input type="checkbox" data-b="ing.${k}.seg" ${it.seg?'checked':''}> Ya está asegurado (convenio o pago confirmado)</label><label class="row"><input type="checkbox" data-b="ing.${k}.res" ${it.res?'checked':''}> Solo se puede usar para un fin específico</label></div></div>`).join('')}
<button class="g" data-a="add" data-p="ing" style="margin-top:8px">+ Agregar fuente</button></div>
<div class="card"><div class="hd"><h2>Gastos y reservas</h2></div><div class="grid3">${fld('Gastos de programas, anual',inp('gProg',{t:'number',min:0}))}${fld('Gastos de estructura, anual',inp('gEstr',{t:'number',min:0,ph:'Administración, alquiler, contabilidad'}))}${fld('Reserva libre hoy',inp('reserva',{t:'number',min:0,ph:'Dinero disponible sin restricción'}))}</div></div><div id="out"></div>`},
sem(v,r,a,inv){const ok=inv?(v<=r):(v>=r),mid=inv?(v<=a):(v>=a);return !isFinite(v)?['','sin datos']:ok?['good','verde']:mid?['warn','amarillo']:['bad','rojo']},
rows(){const m=this.M();return [
['Meses de reserva',isFinite(m.meses)?m.meses.toFixed(1)+' meses':'—',this.sem(m.meses,3,1.5),'Cuánto aguantás sin ingresos nuevos. Referencia orientativa: 3 meses o más.'],
['Dependencia de la mayor fuente',pct(m.conc),this.sem(m.conc,.3,.5,1),'Referencia orientativa: menos de 30%. Más de 50% es fragilidad.'],
['Ingresos asegurados',pct(m.seg),this.sem(m.seg,.7,.4),'Qué parte del año ya está confirmada.'],
['Ingresos restringidos',pct(m.rest),this.sem(m.rest,.5,.75,1),'Si casi todo es restringido, no podés pagar estructura ni reaccionar.'],
['Peso de la estructura',pct(m.estr),this.sem(m.estr,.2,.3,1),'Gastos de estructura sobre el gasto total. Depende del tamaño de la organización.']]},
out(){const m=this.M();return `<div class="card"><div class="hd"><h2>Tu semáforo</h2><p class="sub">Los umbrales son reglas prácticas, no normas. Ajustalos con tu contador o con nosotras.</p></div>
<div class="row" style="gap:20px;margin-bottom:10px"><span>Ingresos <b class="num">$${fmt(m.tot)}</b></span><span>Gastos <b class="num">$${fmt(m.g)}</b></span><span>Resultado <b class="num" style="color:${m.res_<0?'var(--bad)':'var(--good)'}">$${fmt(m.res_)}</b></span></div>
<table>${this.rows().map(r=>`<tr><td><b>${r[0]}</b><br><span class="sub">${r[3]}</span></td><td class="num">${r[1]}</td><td><span class="chip ${r[2][0]}">${r[2][1]}</span></td></tr>`).join('')}</table>
${m.res_<0?'<div class="note">Gastás más de lo que ingresa. Con tu reserva actual esto dura '+(m.res_<0&&st.reserva?Math.max(0,st.reserva/(-m.res_/12)).toFixed(1):'0')+' meses.</div>':''}</div>`},
summary(){const m=this.M();return `SALUD FINANCIERA\nIngresos $${fmt(m.tot)} | Gastos $${fmt(m.g)} | Resultado $${fmt(m.res_)}\n`+this.rows().map(r=>`- ${r[0]}: ${r[1]} (${r[2][1]})`).join('\n')}};
