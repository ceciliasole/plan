const TOOL={id:'identidad',mes:5,title:'Identidad y posicionamiento',
lead:'Reuní lo que ya tenés: propósito, misión, visión o manifiesto. No hace falta tener todo. Con al menos una de estas piezas armás el enunciado de posicionamiento, que es la frase que guía lo que decís y lo que decidís.',
how:['<b>1.</b> Cargá lo que ya existe','<b>2.</b> Armá tu enunciado','<b>3.</b> Pasalo por las pruebas'],
P:[['proposito','Propósito','Para qué existimos, más allá de lo que hacemos.','Si mañana desapareciéramos, ¿qué dejaría de pasar en el mundo?'],
['mision','Misión','Qué hacemos, para quién y cómo.','Completá: Trabajamos con ___ para lograr ___ a través de ___.'],
['vision','Visión','Qué cambio queremos ver.','¿Cómo es el lugar donde trabajamos dentro de diez años si nos va bien?'],
['manifiesto','Manifiesto','Lo que creemos, dicho en voz alta y con tono propio.','Empezá cada línea con “Creemos que…” o “No vamos a…”. Cinco líneas alcanzan.']],
init:()=>({proposito:'',mision:'',vision:'',manifiesto:'',ep:{org:'',publico:'',alt:'',cat:'',dif:'',prueba:'',comp:'',igual:''}}),
n(){return this.P.filter(p=>st[p[0]].trim()).length},
view(){return `<div class="card"><div class="hd"><h2>Lo que ya tenés</h2><p class="sub">Si algo no existe, dejalo vacío. No hace falta redactar una misión nueva. Alcanza con una pieza para seguir.</p></div><div class="grid2">${this.P.map(p=>`<div>${fld(p[1]+'<span style="text-transform:none;font-family:var(--f-b);letter-spacing:0;font-size:13px">'+p[2]+'</span>',area(p[0],p[3],4))}</div>`).join('')}</div></div>
<div class="card"><div class="hd"><h2>Enunciado de posicionamiento</h2><p class="sub">Una decisión por casillero. Para [público], [organización] es [categoría] que [resultado diferencial], porque [razón para creer].</p></div>
<div class="grid2">${fld('Nuestro nombre',inp('ep.org',{ph:'Organización o programa'}))}${fld('Un solo público',inp('ep.publico',{ph:'Para quién existimos primero'}))}${fld('Categoría con peso propio',inp('ep.cat',{ph:'Qué tipo de organización somos'}))}${fld('Alternativa real del público',inp('ep.alt',{ph:'Qué hace hoy si no nos elige'}))}</div>
<div class="grid2" style="margin-top:12px">${fld('Resultado diferencial',area('ep.dif','Qué obtiene el público, no qué hacemos nosotros',3))}${fld('Razón para creer',area('ep.prueba','Dato, trayectoria o método que lo respalda',3))}</div></div><div id="out"></div>`},
frase(){const e=st.ep,v=(x,d)=>x.trim()||d;return `Para ${v(e.publico,'[público]')}, ${v(e.org,'[organización]')} es ${v(e.cat,'[categoría]')} que ${v(e.dif,'[resultado diferencial]')}, porque ${v(e.prueba,'[razón para creer]')}.`},
out(){const e=st.ep,t=[];const all=(e.publico+' '+e.dif+' '+e.cat).toLowerCase();
const vac=['innovador','líder','integral','excelencia','referente','calidad','comprometid'].filter(w=>all.includes(w));
const act=/\b(brinda|ofrece|realiza|capacita|desarrolla|ejecuta)\b/i.test(e.dif);
t.push([this.n()>0,'Tenés al menos una pieza de identidad cargada']);
t.push([!!e.alt.trim(),'Nombraste la alternativa real (puede ser “hacerlo internamente” o “no hacer nada”)']);
t.push([e.publico.trim()&&!/( y |,| e )/.test(e.publico),'El público es uno solo (sin “y” ni comas)']);
t.push([e.dif.trim()&&!act,'Describe un resultado, no una actividad']);
t.push([e.dif.trim()&&vac.length===0,vac.length?'Hay palabras vacías: '+vac.join(', ')+'. Reemplazalas por un hecho':'No usa palabras vacías']);
t.push([e.igual==='no','Prueba del cambio de nombre superada (abajo)']);
return `<div class="card"><div class="hd"><h2>Tu enunciado hoy</h2></div><p style="font:600 18px/1.4 var(--f-d);max-width:60ch;margin:0 0 14px">${esc(this.frase())}</p>
<div class="grid2">${fld('Un competidor real, con nombre',inp('ep.comp',{ph:'Ej: otra organización de tu categoría'}))}<label class="f">Si ponés ese nombre en lugar del tuyo, ¿la frase le queda igual?<select data-b="ep.igual" data-redraw><option value="">Elegí</option><option value="si" ${e.igual==='si'?'selected':''}>Sí, le queda igual</option><option value="no" ${e.igual==='no'?'selected':''}>No, es nuestra</option></select></label></div>
${e.igual==='si'?'<div class="note">Todavía no hay posicionamiento. Probá con otro resultado diferencial o con otra categoría.</div>':''}
<div style="margin-top:12px">${t.map(x=>`<p class="row" style="margin:4px 0"><span class="chip ${x[0]?'good':'warn'}">${x[0]?'ok':'revisar'}</span> ${x[1]}</p>`).join('')}</div></div>`},
summary(){return 'IDENTIDAD Y POSICIONAMIENTO\n'+this.P.map(p=>`\n${p[1].toUpperCase()}\n${st[p[0]]||'(no tenemos)'}`).join('\n')+'\n\nENUNCIADO DE POSICIONAMIENTO\n'+this.frase()+'\nAlternativa real: '+(st.ep.alt||'—')+'\nCompetidor probado: '+(st.ep.comp||'—')+' ('+(st.ep.igual||'sin probar')+')'}};
