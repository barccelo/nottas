"use strict";
/* Nottas floating controls; scoped to one item. No polling, no extra API.
   Uses existing NottasEditor.quick POST /v1/sync write path and FCM/WSS. */
(function(){
  const $=id=>document.getElementById(id);
  const fields=new Set(["date","endDate","time","endTime","reminders","category","status","priority","recurrence","tags"]);
  let panel=null,context=null,month=null,selectedHour=9,selectedMinute=0;
  function node(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=String(txt);return e}
  function svg(name){const s=document.createElementNS("http://www.w3.org/2000/svg","svg");s.setAttribute("viewBox","0 0 24 24");s.setAttribute("class","ns-icon");s.setAttribute("aria-hidden","true");const u=document.createElementNS("http://www.w3.org/2000/svg","use");u.setAttribute("href","/assets/nottas-icons.svg#"+name);s.append(u);return s}
  function addButton(label,cb,cls=""){const b=node("button",cls,label);b.type="button";b.addEventListener("click",cb);return b}
  function pickItem(item){
    return state.items.get(item.workspaceId+":"+item.entityType+":"+item.entityId)||item;
  }
  function createPanel(){
    if(panel)return panel;
    panel=node("section","nottas-float hidden");
    panel.id="nottasFloat";
    panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","false");panel.setAttribute("aria-label","Editar sin abrir la tarea");
    panel.tabIndex=-1;document.body.append(panel);
    document.addEventListener("pointerdown",e=>{
      if(context&&panel&&!panel.contains(e.target)&&!context.anchor?.contains(e.target))close();
    });
    document.addEventListener("keydown",e=>{
      if(context&&e.key==="Escape"){e.preventDefault();e.stopPropagation();close(true)}
    });
    window.addEventListener("resize",()=>{if(context)position()});
    window.addEventListener("scroll",()=>{if(context)position()},{passive:true,capture:true});
    return panel;
  }
  function close(restore=false){
    if(!context)return;
    const anchor=context.anchor;panel?.classList.add("hidden");context=null;
    if(restore&&anchor?.isConnected)anchor.focus({preventScroll:true});
  }
  function position(){
    if(!context||!panel)return;
    const r=context.anchor?.getBoundingClientRect();
    const w=Math.min(360,window.innerWidth-24);
    panel.style.width=w+"px";
    let left=r?r.left:window.innerWidth/2-w/2;
    left=Math.max(12,Math.min(window.innerWidth-w-12,left));
    const h=panel.offsetHeight;
    let top=r?r.bottom+9:Math.max(12,(window.innerHeight-h)/2);
    if(top+h>window.innerHeight-12&&r&&r.top-h-9>=10)top=r.top-h-9;
    top=Math.min(Math.max(12,top),Math.max(12,window.innerHeight-h-12));
    panel.style.left=left+"px";panel.style.top=top+"px";
  }
  function show(item,field,anchor){
    if(!fields.has(field)||!state.token||state.busy||$("editor")?.open)return false;
    const target=pickItem(item);
    if(!target||target.payload.deletedAt||target.entityType!=="task"&&field!=="category"&&field!=="tags")return false;
    if(context&&context.item.entityId===item.entityId&&context.field===field){close();return true}
    createPanel();
    context={item:target,field,anchor:anchor||document.activeElement};
    panel.classList.remove("hidden");
    render();
    return true;
  }
  function header(title,icon){
    panel.replaceChildren();
    const row=node("div","nottas-float-head");
    const heading=node("div","nottas-float-heading");heading.append(svg(icon),node("strong","",title));row.append(heading);
    const x=addButton("×",()=>close(),"nottas-float-close");x.setAttribute("aria-label","Cerrar panel");row.append(x);
    panel.append(row);
  }
  function content(){const c=node("div","nottas-float-body");panel.append(c);return c}
  function footer(cb,action="Guardar"){
    const bar=node("div","nottas-float-foot");
    bar.append(addButton("Cancelar",()=>close(),"nottas-float-cancel"));
    const save=addButton(action,cb,"nottas-float-save");save.disabled=false;bar.append(save);
    const status=node("p","nottas-float-error");status.setAttribute("role","alert");status.setAttribute("aria-live","polite");
    panel.append(status,bar);
    return save;
  }
  async function submit(mutator){
    if(!context||panel.dataset.saving==="true")return;
    const active=context;
    const button=panel.querySelector(".nottas-float-save");
    panel.dataset.saving="true";if(button){button.disabled=true;button.textContent="Guardando…"}
    try{
      const okay=await window.NottasEditor?.quick(active.item,mutator);
      if(okay)close();
      else if(context===active){panel.querySelector(".nottas-float-error").textContent="No se pudo guardar. Comprueba el estado del elemento."}
    }catch(e){if(context===active)panel.querySelector(".nottas-float-error").textContent=e.message||"Error al guardar";}
    finally{panel.dataset.saving="false";if(context===active&&button){button.disabled=false;button.textContent="Guardar"}}
  }
  const dateISO=(d)=>window.NottasSchedule.isoDate(d);
  const dayOffset=(n)=>dateISO(window.NottasSchedule.addDays(new Date(),n));
  function datePanel(){
    const field=context.field,k=field==="date"?"dueDate":"endDate";
    const p=context.item.payload;
    const value=p[k]||"";
    header(field==="date"?"Fecha de inicio":"Fecha de cierre","ns-calendar");
    const body=content();
    let selected=value||"",focus=value?new Date(+value.slice(0,4),+value.slice(5,7)-1,+value.slice(8,10),12):new Date();
    month=new Date(focus.getFullYear(),focus.getMonth(),1);
    const quick=node("div","nottas-float-chips");
    for(const [label,offset]of [["Hoy",0],["Mañana",1],["Pasado mañana",2]]){
      const b=addButton(label,()=>{selected=dayOffset(offset);month=new Date(+selected.slice(0,4),+selected.slice(5,7)-1,1);draw()});
      b.dataset.date=String(offset);quick.append(b);
    }
    quick.append(addButton("Sin fecha",()=>{selected="";draw()},"nottas-clear-date"));
    body.append(quick);
    const nav=node("div","nottas-calendar-nav");
    const prev=addButton("‹",()=>{month.setMonth(month.getMonth()-1);draw()},"nottas-float-month-nav");
    const label=node("strong");
    const next=addButton("›",()=>{month.setMonth(month.getMonth()+1);draw()},"nottas-float-month-nav");
    prev.setAttribute("aria-label","Mes anterior");next.setAttribute("aria-label","Mes siguiente");
    nav.append(prev,label,next);body.append(nav);
    const grid=node("div","nottas-float-calendar");body.append(grid);
    const hint=node("p","nottas-float-help","Selecciona un día. La fecha se guarda al confirmar.");body.append(hint);
    function draw(){
      label.textContent=month.toLocaleDateString("es",{month:"long",year:"numeric"});
      grid.replaceChildren();
      for(const d of ["L","M","X","J","V","S","D"])grid.append(node("span","nottas-float-weekday",d));
      const first=(new Date(month.getFullYear(),month.getMonth(),1).getDay()+6)%7;
      const start=new Date(month.getFullYear(),month.getMonth(),1-first,12);
      for(let i=0;i<42;i++){
        const day=new Date(start.getFullYear(),start.getMonth(),start.getDate()+i,12),v=dateISO(day);
        const b=addButton(String(day.getDate()),()=>{selected=v;draw()},"nottas-float-day");
        b.setAttribute("aria-label",day.toLocaleDateString("es",{weekday:"long",day:"numeric",month:"long",year:"numeric"}));
        b.classList.toggle("outside",day.getMonth()!==month.getMonth());
        b.classList.toggle("today",v===dayOffset(0));b.classList.toggle("selected",v===selected);
        b.setAttribute("aria-pressed",String(v===selected));grid.append(b);
      }
      for(const b of quick.children)b.classList.toggle("selected",b.dataset.date!==undefined&&selected===dayOffset(+b.dataset.date));
      position();
    }
    footer(()=>submit(payload=>{
      if(k==="endDate"&&selected&&payload.dueDate&&selected<payload.dueDate)throw Error("El cierre no puede ser anterior al inicio.");
      payload[k]=selected;
      if(k==="dueDate"&&!selected){payload.endDate="";payload.dueTime="";payload.endTime="";payload.reminders=[];payload.reminder="none";}
      if(k==="endDate"&&!selected)payload.endTime="";
    }));
    draw();
  }
  function timePanel(){
    const field=context.field,k=field==="time"?"dueTime":"endTime",p=context.item.payload;
    header(field==="time"?"Hora de inicio":"Hora de cierre","ns-clock");
    const body=content();
    const raw=p[k]||p.dueTime||"09:00";
    const hh=Number(raw.slice(0,2)),mm=Number(raw.slice(3,5));
    selectedHour=Number.isInteger(hh)&&hh>=0&&hh<24?hh:9;
    selectedMinute=Number.isInteger(mm)&&mm>=0&&mm<60?mm:0;
    const wrap=node("div","nottas-time-wheels");
    const hour=wheel("Hora",24,()=>selectedHour,x=>{selectedHour=x;update()});
    const colon=node("strong","nottas-time-colon",":");
    const min=wheel("Minutos",60,()=>selectedMinute,x=>{selectedMinute=x;update()});
    wrap.append(hour,colon,min);
    body.append(wrap);
    const preview=node("div","nottas-time-preview");body.append(preview);
    const suggestions=node("div","nottas-float-chips");
    for(const value of ["09:00","12:00","15:00","18:00"]){
      suggestions.append(addButton(value,()=>{selectedHour=+value.slice(0,2);selectedMinute=+value.slice(3,5);update(true)}));
    }
    body.append(suggestions);
    const bar=footer(()=>submit(payload=>{
      const time=String(selectedHour).padStart(2,"0")+":"+String(selectedMinute).padStart(2,"0");
      if(k==="dueTime"&&!payload.dueDate)payload.dueDate=dayOffset(0);
      if(k==="endTime"&&!payload.dueDate)payload.dueDate=dayOffset(0);
      if(k==="endTime"&&!payload.dueTime)throw Error("Selecciona antes la hora de inicio.");
      if(k==="endTime"&&(!payload.endDate||payload.endDate===payload.dueDate)&&time<=payload.dueTime)throw Error("La hora de cierre debe ser posterior al inicio.");
      payload[k]=time;
    }));
    bar.before(addButton("Quitar hora",()=>submit(payload=>{payload[k]="";if(k==="dueTime")payload.endTime=""}),"nottas-float-remove"));
    function update(scroll=false){
      preview.textContent=String(selectedHour).padStart(2,"0")+":"+String(selectedMinute).padStart(2,"0");
      for(const [w,v]of [[hour,selectedHour],[min,selectedMinute]]){
        for(const b of w.querySelectorAll(".nottas-time-item"))b.classList.toggle("selected",+b.dataset.value===v);
        if(scroll){
          const target=w.querySelector('.nottas-time-item[data-value="'+v+'"]');
          target?.scrollIntoView({block:"center",behavior:"instant"});
        }
      }
    }
    update(true);position();
  }
  function wheel(label,length,current,select){
    const holder=node("div","nottas-time-wheel");holder.setAttribute("role","group");holder.setAttribute("aria-label",label);
    holder.append(node("small","nottas-time-wheel-label",label));
    const scroll=node("div","nottas-time-scroll");
    scroll.setAttribute("role","listbox");scroll.setAttribute("aria-label",label);
    for(let n=0;n<length;n++){
      const b=addButton(String(n).padStart(2,"0"),()=>select(n),"nottas-time-item");
      b.dataset.value=String(n);b.setAttribute("role","option");
      b.setAttribute("aria-selected",String(n===current()));
      scroll.append(b);
    }
    let raf=0;
    scroll.addEventListener("scroll",()=>{
      if(raf)cancelAnimationFrame(raf);
      raf=requestAnimationFrame(()=>{
        raf=0;
        const elements=Array.from(scroll.children),center=scroll.scrollTop+scroll.clientHeight/2;
        const closest=elements.reduce((best,n)=>Math.abs(n.offsetTop+n.offsetHeight/2-center)<Math.abs(best.offsetTop+best.offsetHeight/2-center)?n:best,elements[0]);
        if(closest)select(+closest.dataset.value);
      });
    },{passive:true});
    holder.append(scroll);return holder;
  }
  function remindersPanel(){
    header("Recordatorios","ns-bell");const body=content();
    const p=context.item.payload,existing=Array.isArray(p.reminders)?p.reminders.filter(Number.isInteger):[];
    const old=existing.length?existing:p.reminder&&p.reminder!=="none"?[({"at":0,"5m":5,"10m":10,"15m":15,"30m":30,"1h":60,"1d":1440}[p.reminder]??0)]:[];
    const selected=new Set(old);
    const presets=[[0,"A la hora"],[1,"1 min antes"],[5,"5 min antes"],[10,"10 min antes"],[15,"15 min antes"],[30,"30 min antes"],[60,"1 hora antes"],[1440,"1 día antes"]];
    const list=node("div","nottas-float-reminders");
    function choice(n,title){
      const b=addButton("",()=>{selected.has(n)?selected.delete(n):selected.add(n);draw()},"nottas-reminder-choice");
      b.dataset.minutes=String(n);b.append(node("span","nottas-reminder-circle"),node("span","",title));
      list.append(b);
    }
    presets.forEach(([n,name])=>choice(n,name));
    for(const n of old.filter(n=>!presets.some(([v])=>v===n)))choice(n,n+" min antes");
    function draw(){
      for(const b of list.children){const checked=selected.has(+b.dataset.minutes);b.classList.toggle("selected",checked);b.setAttribute("aria-pressed",String(checked))}
    }
    draw();body.append(list);
    const custom=node("div","nottas-reminder-custom");
    const field=node("input");field.type="number";field.min=1;field.max=525600;field.placeholder="Minutos antes";field.setAttribute("aria-label","Nuevo recordatorio en minutos");
    const add=addButton("+ Añadir",()=>{const n=+field.value;if(!Number.isInteger(n)||n<1||n>525600)return;selected.add(n);if(![...list.children].some(b=>+b.dataset.minutes===n))choice(n,n+" min antes");field.value="";draw();position()},"nottas-float-secondary");
    custom.append(field,add);body.append(custom);
    body.append(node("p","nottas-float-help","Los avisos llegarán al teléfono según sus permisos de notificación."));
    const bar=footer(()=>submit(payload=>{
      payload.reminders=[...selected].sort((a,b)=>a-b).slice(0,12);
      payload.reminder=payload.reminders.length?payload.reminders[0]===0?"at":({5:"5m",10:"10m",15:"15m",30:"30m",60:"1h",1440:"1d"}[payload.reminders[0]]||"at"):"none";
      if(payload.reminders.length&&!payload.dueDate)payload.dueDate=dayOffset(0);
    }));
    bar.before(addButton("Quitar todo",()=>{selected.clear();draw()},"nottas-float-remove"));
  }
  function choicePanel(){
    const field=context.field,p=context.item.payload;
    const title={category:"Categoría",priority:"Prioridad",status:"Estado",recurrence:"Repetir"}[field];
    header(title,field==="category"?"ns-folder":field==="priority"?"ns-nav-pinned":field==="status"?"ns-calendar":"ns-nav-refresh");
    const body=content();
    const options=field==="category"?window.NottasCategories.choices(context.item.workspaceId):
      field==="priority"?[{id:"normal",name:"Normal"},{id:"high",name:"Alta"},{id:"low",name:"Baja"}]:
      field==="recurrence"?[{id:"none",name:"No repetir"},{id:"daily",name:"Cada día"},{id:"weekdays",name:"Lunes a viernes"},{id:"weekly",name:"Cada semana"},{id:"monthly",name:"Cada mes"}]:
      [{id:"scheduled",name:"Agendada"},{id:"deferred",name:"Diferida"},{id:"realized",name:"Realizada"},{id:"not_realized",name:"No realizada"},{id:"cancelled",name:"Cancelada"}];
    const prop=field==="status"?"meetingStatus":field;
    let selected=p[prop]|| (field==="category"?"inbox":field==="priority"?"normal":field==="recurrence"?"none":"scheduled");
    const choices=node("div","nottas-float-options");
    for(const c of options){
      const b=addButton("",()=>{selected=c.id;update()},"nottas-float-option");
      b.dataset.value=c.id;
      if(field==="category")b.append(window.NottasCategories.label(c));
      else b.append(node("span","",c.name));
      b.append(svg("ns-check"));choices.append(b);
    }
    function update(){for(const b of choices.children){const active=b.dataset.value===selected;b.classList.toggle("selected",active);b.setAttribute("aria-pressed",String(active))}}
    update();body.append(choices);
    footer(()=>submit(payload=>{
      if(field==="status"&&selected==="deferred"&&!payload.dueDate)throw Error("Para diferir, indica primero una fecha.");
      payload[prop]=selected;
    }));
    position();
  }
  function tagsPanel(){
    header("Etiquetas","ns-folder");const body=content();const t=node("input","nottas-float-tags");
    t.type="text";t.maxLength=240;t.placeholder="trabajo, urgente";t.value=(context.item.payload.tags||[]).join(", ");
    body.append(t,node("p","nottas-float-help","Separa las etiquetas con comas."));
    footer(()=>submit(payload=>{
      payload.tags=[...new Set(t.value.split(",").map(x=>x.trim().replace(/^#+/,"").toLowerCase().slice(0,30)).filter(Boolean))].slice(0,12);
    }));
    position();t.focus();
  }
  function render(){
    if(!context)return;
    const f=context.field;
    if(f==="date"||f==="endDate")datePanel();
    else if(f==="time"||f==="endTime")timePanel();
    else if(f==="reminders")remindersPanel();
    else if(f==="tags")tagsPanel();
    else choicePanel();
    position();
  }
  window.NottasFloat=Object.freeze({open:show,close});
})();