"use strict";
/* Nottas Web presentation layer only.
 * This file does not intercept POST /v1/sync, FCM or WSS, modify state.items,
 * or install polling. The original client owns session, writes and realtime. */
(function(){
  const $ = id => document.getElementById(id);
  let screen="home", smartFilter="all", settingsPage="appearance";
  let calendarMode="month", cursor=new Date(), calendarSelection=new Date();
  let selectedWorkspace="";
  const taskCardDisclosure=new Map(); // local UI state only; never synchronized or written to D1
  const icon=(name,extra="")=>{
    const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
    svg.setAttribute("class","ns-icon"+(extra?" "+extra:""));
    svg.setAttribute("viewBox","0 0 24 24");
    svg.setAttribute("aria-hidden","true");
    const use=document.createElementNS("http://www.w3.org/2000/svg","use");
    use.setAttribute("href","/assets/nottas-icons.svg#"+name);
    svg.appendChild(use);return svg;
  };
  const elt=(tag,cls,text)=>{
    const el=document.createElement(tag);
    if(cls)el.className=cls;
    if(text!==undefined)el.textContent=String(text);
    return el;
  };
  const today=()=>{const d=new Date();return stamp(d)};
  function stamp(date){return date.getFullYear()+"-"+String(date.getMonth()+1).padStart(2,"0")+"-"+String(date.getDate()).padStart(2,"0")}
  function fromStamp(text){const match=String(text||"").match(/^(\d{4})-(\d{2})-(\d{2})$/);return match?new Date(+match[1],+match[2]-1,+match[3]):null}
  function plusDays(date,n){const r=new Date(date.getFullYear(),date.getMonth(),date.getDate());r.setDate(r.getDate()+n);return r}
  function formatMonth(d){return new Intl.DateTimeFormat("es-ES",{month:"long",year:"numeric"}).format(d).replace(/^\p{L}/u,x=>x.toUpperCase())}
  function formatDay(d){return new Intl.DateTimeFormat("es-ES",{weekday:"long",day:"numeric",month:"long"}).format(d)}
  const living=()=>[...state.items.values()].filter(x=>!x.payload.deletedAt);
  const inWorkspace=()=>living().filter(x=>x.workspaceId===state.workspaceId);
  function taskItems(p){
    const result=[];
    const nodes=Array.isArray(p.items)&&p.items.length?p.items:Array.isArray(p.subtasks)?p.subtasks:[];
    function visit(list,depth=0){
      if(depth>12)return;
      for(const x of list||[]){
        result.push({id:String(x.id||""),label:String(x.text||x.title||""),done:!!(x.done||x.checked),depth});
        if(Array.isArray(x.children))visit(x.children,depth+1);
      }
    }
    visit(nodes);
    return result;
  }
  function noteBlocks(p){
    const check=[],copy=[];
    function visit(list,depth=0){
      if(depth>12)return;
      for(const b of list||[]){
        const label=String(b.html||b.text||"").replace(/<br\s*\/?>/gi,"\n").replace(/<[^>]*>/g,"").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").trim();
        if(b.type==="checklist")check.push({id:String(b.id||""),label,done:!!b.checked});
        else if(label)copy.push(label);
        if(Array.isArray(b.children))visit(b.children,depth+1);
      }
    }
    visit(p.blocks);
    return {check,body:copy.join("\n")};
  }
  const titleOf=x=>getTitle(x);
  function bodyOf(x){
    if(x.entityType==="task")return noteBlocks(x.payload).body||String(x.payload.description||x.payload.body||"");
    const blocks=noteBlocks(x.payload);return blocks.body||String(x.payload.body||"");
  }
  function openHome(view){screen="home";if(view)state.view=view;smartFilter="all";render()}
  function showScreen(name){screen=name;if(name==="home")state.view=state.view||"all";closeMenu();render()}
  function closeMenu(){document.documentElement.classList.remove("sidebar-open")}
  function updateNavigation(){
    document.querySelectorAll("[data-section]").forEach(el=>{
      const selected=el.dataset.section===screen;
      el.setAttribute("aria-pressed",String(selected));
      el.classList.toggle("active",selected);
    });
    document.querySelectorAll(".nav[data-view]").forEach(el=>el.setAttribute("aria-pressed",String(screen==="home"&&state.view===el.dataset.view&&smartFilter==="all")));
  }
  function hideWorkspaceMenu(){
    const menu=$("workspaceMenu"),btn=$("workspaceTrigger");
    if(menu)menu.classList.add("hidden");
    if(btn)btn.setAttribute("aria-expanded","false");
  }
  function renderSpaces(){
    const box=$("spaceLinks");if(!box)return;
    box.replaceChildren();
    for(const ws of state.workspaces){
      const btn=elt("button","space-item"+(ws.id===state.workspaceId?" active":""));
      btn.type="button";btn.setAttribute("aria-pressed",String(ws.id===state.workspaceId));
      const initial=elt("span","space-initial",ws.kind==="personal"?"P":"A");
      const label=elt("span","space-name",ws.kind==="personal"?"Personal":ws.name);
      const role=elt("small","",ws.kind==="personal"?"Privado":ws.role==="owner"?"Jefe":"Asistente");
      btn.append(initial,label,role);
      btn.addEventListener("click",()=>{$("workspace").value=ws.id;$("workspace").dispatchEvent(new Event("change"));showScreen("home")});
      box.append(btn);
    }
    const trigger=$("workspaceTrigger"),menu=$("workspaceMenu");
    if(trigger&&menu){
      trigger.disabled=!state.token||!state.workspaces.length;
      menu.replaceChildren();
      for(const ws of state.workspaces){
        const selected=ws.id===state.workspaceId;
        const choice=elt("button","workspace-choice"+(selected?" active":""));
        choice.type="button";choice.setAttribute("role","menuitemradio");choice.setAttribute("aria-checked",String(selected));
        choice.append(elt("span","space-initial",ws.kind==="personal"?"P":"A"));
        const details=elt("span","workspace-choice-text");
        details.append(elt("strong","",ws.kind==="personal"?"Personal":ws.name));
        details.append(elt("small","",ws.kind==="personal"?"Privado":ws.role==="owner"?"Jefe":"Asistente"));
        choice.append(details);
        if(selected)choice.append(icon("ns-check","tiny"));
        choice.addEventListener("click",()=>{$("workspace").value=ws.id;$("workspace").dispatchEvent(new Event("change"));hideWorkspaceMenu();showScreen("home")});
        menu.append(choice);
      }
    }
    const current=state.workspaces.find(w=>w.id===state.workspaceId);
    if($("workspaceTriggerText"))$("workspaceTriggerText").textContent=current?.kind==="personal"?"Personal":current?.name||"Espacio";
    if(current){
      const head=$("heading");if(head&&screen==="home")head.textContent=current.kind==="personal"?"Personal":current.name;
    }
  }
  function counts(){
    const all=inWorkspace(),tasks=all.filter(x=>x.entityType==="task"),notes=all.filter(x=>x.entityType==="note");
    return {all:all.length,tasks:tasks.length,notes:notes.length,today:tasks.filter(x=>x.payload.dueDate===today()&&!x.payload.done).length,
      pending:tasks.filter(x=>!x.payload.done).length,pinned:tasks.filter(x=>!!x.payload.pinned).length,done:tasks.filter(x=>!!x.payload.done).length,
      fixed:notes.filter(x=>!!x.payload.pinned).length,trash:[...state.items.values()].filter(x=>x.workspaceId===state.workspaceId&&!!x.payload.deletedAt).length};
  }
  function renderCounts(){
    const c=counts();
    for(const [k,n] of Object.entries(c)){
      document.querySelectorAll('[data-count="'+k+'"]').forEach(el=>{el.textContent=n?String(n):""});
    }
    document.querySelectorAll("[data-smart-filter]").forEach(el=>{
      const selected=(el.dataset.smartFilter==="notes-pinned"?state.view==="note"&&smartFilter==="pinned":smartFilter===el.dataset.smartFilter)&&screen==="home";
      el.setAttribute("aria-pressed",String(selected));
      el.classList.toggle("active",selected);
    });
  }
  function filtered(){
    const ws=state.workspaceId;
    const q=$("search").value.toLocaleLowerCase();
    return [...state.items.values()].filter(x=>
      x.workspaceId===ws&&(state.view==="deleted"?!!x.payload.deletedAt:!x.payload.deletedAt)&&
      (state.view==="all"||state.view==="deleted"||x.entityType===state.view))
      .filter(x=>{
        if(smartFilter==="today")return x.entityType==="task"&&!x.payload.done&&x.payload.dueDate===today();
        if(smartFilter==="pending")return x.entityType==="task"&&!x.payload.done;
        if(smartFilter==="pinned")return !!x.payload.pinned;
        if(smartFilter==="done")return x.entityType==="task"&&!!x.payload.done;
        if(smartFilter==="note")return x.entityType==="note";
        return true;
      })
      .filter(x=>(titleOf(x)+" "+bodyOf(x)+" "+taskItems(x.payload).map(y=>y.label).join(" ")).toLocaleLowerCase().includes(q))
      .sort((a,b)=>Number(!!b.payload.pinned)-Number(!!a.payload.pinned)||Number(b.payload.updatedAt||0)-Number(a.payload.updatedAt||0));
  }
  function nodeCompletedToggle(count,ui,lines){
    const section=elt("section","nottas-card-completed");
    const header=elt("button","nottas-card-completed-toggle");header.type="button";
    const arrow=icon("ns-chevron","nottas-completed-chevron");
    header.append(arrow,elt("span","",count===1?"1 elemento marcado":count+" elementos marcados"));
    header.setAttribute("aria-expanded",String(ui.completed));
    const list=elt("div","nottas-card-completed-list subtask-list");
    list.classList.toggle("hidden",!ui.completed);
    for(const row of lines)list.append(row);
    header.addEventListener("click",event=>{
      event.stopPropagation();ui.completed=!ui.completed;
      list.classList.toggle("hidden",!ui.completed);
      header.setAttribute("aria-expanded",String(ui.completed));
    });
    section.append(header,list);return section;
  }
  function itemCard(x){
    const p=x.payload,task=x.entityType==="task",card=elt("article","item-card"+(task&&p.done?" done":""));
    card.setAttribute("role","button");card.tabIndex=0;
    card.setAttribute("aria-label",(task?"Abrir tarea: ":"Abrir nota: ")+titleOf(x));
    const top=elt("div","item-card-top");
    if(task){
      const check=elt("button","quick-check"+(p.done?" checked":""));
      check.type="button";check.title=p.done?"Marcar pendiente":"Marcar completada";
      check.setAttribute("aria-label",check.title);
      if(p.done)check.append(icon("ns-check","tiny"));
      check.addEventListener("click",event=>{
        event.stopPropagation();window.NottasEditor?.toggleTask(x);
      });
      top.append(check);
    }
    const content=elt("div","item-text");
    content.append(elt("strong","",titleOf(x)));
    const desc=bodyOf(x);
    if(desc)content.append(elt("p","",desc.slice(0,1100)));
    top.append(content);card.append(top);
    const items=task?taskItems(p):noteBlocks(p).check;
    if(items.length){
      const cacheKey=x.workspaceId+":"+x.entityType+":"+x.entityId;
      const ui=taskCardDisclosure.get(cacheKey)||{expanded:!task,completed:false};
      taskCardDisclosure.set(cacheKey,ui);
      const container=elt("div",task?"nottas-card-subtasks":"nottas-card-note-checklist");
      const makeRow=row=>{
        const line=elt("div","subtask-preview"+(row.done?" done":""));
        line.style.setProperty("--depth",Math.min(row.depth||0,5)*16+"px");
        const check=elt("button","quick-check"+(row.done?" checked":""));
        check.type="button";check.title=row.done?"Desmarcar elemento":"Marcar elemento";
        check.setAttribute("aria-label",check.title+": "+row.label);
        if(row.done)check.append(icon("ns-check","tiny"));
        if(!row.id)check.disabled=true;
        else check.addEventListener("click",event=>{
          event.stopPropagation();
          if(task)window.NottasEditor?.toggleItem(x,row.id);
          else window.NottasEditor?.toggleNoteCheck(x,row.id);
        });
        const label=elt("button","nottas-subtask-label",row.label||"Elemento");
        label.type="button";label.title="Editar elemento";
        label.addEventListener("click",event=>{
          event.stopPropagation();window.NottasEditor?.openAt(x,task?"subtasks":"title");
        });
        line.append(check,label);
        return line;
      };
      if(task){
        const title=elt("button","nottas-card-subtasks-toggle");
        title.type="button";
        title.append(icon("ns-nav-all"),elt("span","nottas-card-subtasks-title","Subtareas"));
        title.append(elt("small","nottas-card-progress",items.filter(n=>n.done).length+"/"+items.length));
        const arrow=icon("ns-chevron","nottas-subtask-chevron");title.append(arrow);
        const content=elt("div","nottas-card-subtasks-body");
        content.classList.toggle("hidden",!ui.expanded);
        title.setAttribute("aria-expanded",String(ui.expanded));
        title.setAttribute("aria-label",(ui.expanded?"Ocultar":"Mostrar")+" subtareas");
        title.addEventListener("click",event=>{
          event.stopPropagation();ui.expanded=!ui.expanded;
          content.classList.toggle("hidden",!ui.expanded);
          title.setAttribute("aria-expanded",String(ui.expanded));
          title.setAttribute("aria-label",(ui.expanded?"Ocultar":"Mostrar")+" subtareas");
        });
        container.append(title,content);
        const active=items.filter(n=>!n.done),completed=items.filter(n=>n.done);
        const unmarked=elt("div","subtask-list");
        for(const row of active)unmarked.append(makeRow(row));
        content.append(unmarked);
        if(completed.length){
          const complete=nodeCompletedToggle(completed.length,ui,completed.map(makeRow));
          content.append(complete);
        }
      }else{
        const list=elt("div","subtask-list");
        for(const row of items.slice(0,10))list.append(makeRow(row));
        if(items.length>10)list.append(elt("small","section-caption","+"+(items.length-10)+" más"));
        container.append(list);
      }
      container.addEventListener("click",event=>event.stopPropagation());
      card.append(container);
    }
    const meta=elt("div","meta");
    // Metadata actions mirror tapping the corresponding chip in Android.
    function badge(kind,label,field=null){
      const target=elt(field?"button":"span","card-badge"+(field?" card-action":""));
      if(field){target.type="button";target.title="Editar "+label;target.setAttribute("aria-label","Editar "+label)}
      target.append(icon(kind,"tiny"),elt("span","",label));
      if(field)target.addEventListener("click",event=>{
        event.preventDefault();event.stopPropagation();
        if(!window.NottasFloat?.open(x,field,event.currentTarget))window.NottasEditor?.openAt(x,field);
      });
      meta.append(target);
    }
    if(task&&p.dueDate)badge("ns-calendar",window.NottasSchedule?.displayDate(p.dueDate)||p.dueDate,"date");
    if(task&&p.dueTime)badge("ns-clock",p.dueTime,"time");
    if(task&&p.endDate&&p.endDate>p.dueDate)badge("ns-calendar","Hasta "+p.endDate,"endDate");
    if(task&&p.endTime)badge("ns-clock","Fin "+p.endTime,"endTime");
    if(p.category&&p.category!=="inbox"){
      const category=window.NottasCategories?.find(p.category,x.workspaceId);
      if(category){
        const button=elt("button","card-badge card-action category-badge");
        button.type="button";button.title="Cambiar categoría";button.setAttribute("aria-label","Cambiar categoría: "+category.name);
        button.append(window.NottasCategories.label(category));
        button.addEventListener("click",event=>{
          event.preventDefault();event.stopPropagation();
          if(!window.NottasFloat?.open(x,"category",event.currentTarget))window.NottasEditor?.openAt(x,"category");
        });
        meta.append(button);
      }
    }
    if(task&&p.priority==="high")badge("ns-nav-pinned","Prioridad alta","priority");
    if(p.pinned)badge("ns-nav-pinned","Destacada");
    if(items.length)badge("ns-nav-done",items.filter(a=>a.done).length+"/"+items.length);
    if(task&&!p.done&&!p.dueDate)badge("ns-calendar","Sin fecha","date");
    if(task&&p.done)badge("ns-nav-done","Completada");
    if(!task&&!items.length)badge("ns-nav-notes","Nota");
    if(task&&p.recurrence&&p.recurrence!=="none")badge("ns-nav-refresh","Repetición","recurrence");
    if(task&&Array.isArray(p.reminders)&&p.reminders.length)badge("ns-bell",p.reminders.length+" avisos","reminders");
    if(task&&!Array.isArray(p.reminders)&&p.reminder&&p.reminder!=="none")badge("ns-bell","Recordatorio","reminders");
    if(Array.isArray(p.tags)&&p.tags.length)badge("ns-folder",p.tags.map(t=>"#"+t).join(" · ").slice(0,85),"tags");
    const meeting={scheduled:"Agendada",deferred:"Diferida",realized:"Realizada",not_realized:"No realizada",cancelled:"Cancelada"};
    const approval={proposed:"Propuesta",changes_requested:"Cambios solicitados",rejected:"Rechazada",cancelled:"Cancelada"};
    if(task){
      const statusLabel=approval[p.approvalStatus]|| (p.meetingTracked?meeting[p.meetingStatus||"scheduled"]:null);
      const statusKind=approval[p.approvalStatus]?p.approvalStatus:p.meetingStatus||"scheduled";
      if(statusLabel){
        const status=elt("button","item-status status-"+statusKind,statusLabel);
        status.type="button";status.title="Ver estado del evento";status.setAttribute("aria-label","Ver estado: "+statusLabel);
        status.addEventListener("click",event=>{
          event.preventDefault();event.stopPropagation();
          if(!window.NottasFloat?.open(x,"status",event.currentTarget))window.NottasEditor?.openAt(x,"status");
        });
        meta.append(status);
      }
    }
    card.append(meta);
    card.addEventListener("click",()=>openEditor(x));
    card.addEventListener("keydown",ev=>{if((ev.key==="Enter"||ev.key===" ")&&ev.target===card){ev.preventDefault();openEditor(x)}});
    return card;
  }
  function renderHome(){
    const cards=$("cards");if(!cards)return;
    const items=filtered();
    const ws=state.workspaces.find(w=>w.id===state.workspaceId);
    const labels={all:"Inicio",note:"Notas",task:"Tareas",deleted:"Papelera"};
    $("heading").textContent=state.view==="all"?(ws?.kind==="personal"?"Personal":ws?.name||"Nottas"):labels[state.view];
    const toolbar=$("homeToolbar");
    if(toolbar)toolbar.classList.toggle("in-trash",state.view==="deleted");
    cards.replaceChildren();
    items.forEach(x=>cards.append(itemCard(x)));
    const empty=$("empty");
    empty.textContent=items.length?"":state.view==="deleted"?"La papelera está vacía.":"No hay elementos en esta vista.";
    empty.classList.toggle("hidden",!!items.length);
    $("quickFilters").classList.toggle("hidden",state.view==="deleted");
    for(const chip of document.querySelectorAll("[data-quick]")){
      const active=smartFilter===chip.dataset.quick;
      chip.classList.toggle("active",active);chip.setAttribute("aria-pressed",String(active));
    }
    renderCounts();
  }
  function tasksWithDates(){
    return inWorkspace().filter(x=>x.entityType==="task"&&fromStamp(x.payload.dueDate)).sort((a,b)=>String(a.payload.dueDate||"").localeCompare(String(b.payload.dueDate||""))||String(a.payload.dueTime||"").localeCompare(String(b.payload.dueTime||"")));
  }
  function agendaEntries(date,items){
    const list=elt("div","agenda-list");
    if(!items.length)list.append(elt("div","panel-card section-caption","Sin eventos ni tareas con fecha."));
    for(const x of items){
      const day=fromStamp(x.payload.dueDate);if(!day)continue;
      const b=elt("button","agenda-row");b.type="button";
      const dateBadge=elt("div","date-badge",String(day.getDate()));
      dateBadge.append(elt("small","",new Intl.DateTimeFormat("es-ES",{month:"short"}).format(day)));
      const desc=elt("div","agenda-desc");
      desc.append(elt("strong","",titleOf(x)));
      const metadata=(x.payload.dueTime||"Todo el día")+(x.payload.done?" · Completada":"");
      desc.append(elt("small","",metadata));
      b.append(dateBadge,desc);b.addEventListener("click",()=>openEditor(x));
      list.append(b);
    }
    return list;
  }
  function renderCalendar(){
    const content=$("calendarBody");if(!content)return;
    content.replaceChildren();
    const label=$("calendarPeriodLabel");
    $("calendarPrevious").disabled=calendarMode==="agenda";$("calendarNext").disabled=calendarMode==="agenda";
    document.querySelectorAll("[data-calendar-mode]").forEach(b=>b.classList.toggle("active",b.dataset.calendarMode===calendarMode));
    const tasks=tasksWithDates();
    const y=cursor.getFullYear(),m=cursor.getMonth();
    if(calendarMode==="month"){
      label.textContent=formatMonth(cursor);
      const grid=elt("div","calendar-grid");
      ["L","M","M","J","V","S","D"].forEach(day=>grid.append(elt("div","calendar-weekday",day)));
      const start=new Date(y,m,1);start.setDate(start.getDate()-(start.getDay()+6)%7);
      for(let i=0;i<42;i++){
        const d=plusDays(start,i),id=stamp(d),items=tasks.filter(x=>x.payload.dueDate===id);
        const cell=elt("button","calendar-day"+(d.getMonth()!==m?" outside":"")+(id===today()?" today":"")+(id===stamp(calendarSelection)?" selected":"")+(items.length?" has-events":""));
        cell.type="button";cell.setAttribute("aria-label",formatDay(d)+" · "+items.length+" elementos");
        cell.append(elt("span","calendar-number",d.getDate()));
        items.slice(0,2).forEach(x=>cell.append(elt("span","calendar-event-pill",titleOf(x))));
        cell.addEventListener("click",()=>{calendarSelection=d;cursor=new Date(d);renderCalendar()});
        grid.append(cell);
      }
      content.append(grid);
      content.append(elt("div","settings-section-label",formatDay(calendarSelection)));
      content.append(agendaEntries(calendarSelection,tasks.filter(x=>x.payload.dueDate===stamp(calendarSelection))));
    }else{
      let start,end;
      if(calendarMode==="day"){
        label.textContent=formatDay(cursor);start=stamp(cursor);end=start;
      }else if(calendarMode==="week"){
        const startDay=plusDays(cursor,-(cursor.getDay()+6)%7),last=plusDays(startDay,6);
        label.textContent=startDay.getDate()+" "+new Intl.DateTimeFormat("es-ES",{month:"short"}).format(startDay)+" – "+last.getDate()+" "+new Intl.DateTimeFormat("es-ES",{month:"short"}).format(last);
        start=stamp(startDay);end=stamp(last);
      }else{
        label.textContent="Agenda";start="0000-01-01";end="9999-12-31";
      }
      content.append(agendaEntries(cursor,tasks.filter(x=>x.payload.dueDate>=start&&x.payload.dueDate<=end)));
    }
  }
  function renderTeam(){
    const grid=$("teamCards");if(!grid)return;
    grid.replaceChildren();
    for(const ws of state.workspaces){
      const isPersonal=ws.kind==="personal",items=living().filter(x=>x.workspaceId===ws.id);
      const card=elt("div","panel-card team-card");
      const head=elt("div","team-card-head");
      head.append(elt("span","space-initial",isPersonal?"P":"A"));
      const name=elt("div","");name.append(elt("strong","",isPersonal?"Personal":ws.name),elt("div","section-caption",isPersonal?"Privado":ws.role==="owner"?"Jefe":"Asistente"));
      head.append(name);card.append(head);
      const choose=elt("button","secondary","Ver espacio");choose.type="button";
      choose.addEventListener("click",()=>{state.workspaceId=ws.id;$("workspace").value=ws.id;showScreen("home")});
      card.append(choose);
      const stats=elt("div","stats");
      const n1=elt("span","");n1.append(elt("b","",items.filter(x=>x.entityType==="task").length),elt("small","","Tareas"));
      const n2=elt("span","");n2.append(elt("b","",items.filter(x=>x.entityType==="note").length),elt("small","","Notas"));
      stats.append(n1,n2);card.append(stats);grid.append(card);
    }
  }
  function settingsRow(symbol,title,description){
    const row=elt("div","settings-row");
    const glyph=elt("span","setting-glyph");glyph.append(icon(symbol));
    const info=elt("span","setting-main");info.append(elt("strong","",title));
    if(description)info.append(elt("small","",description));
    row.append(glyph,info);return row;
  }
  function settingsGroup(title,rows){
    const fragment=document.createDocumentFragment();
    fragment.append(elt("div","settings-section-label",title));
    const group=elt("div","settings-group");
    rows.forEach(row=>group.append(row));
    fragment.append(group);return fragment;
  }
  function settingsChoice(page){
    settingsPage=page;
    document.querySelectorAll("[data-settings-page]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.settingsPage===page)));
    renderSettings();
  }
  function renderSettings(){
    const body=$("settingsBody");if(!body)return;body.replaceChildren();
    const title={appearance:"Apariencia",alerts:"Notificaciones y recordatorios",team:"Equipo de trabajo",messages:"Mensajes rápidos",backup:"Datos y respaldo",about:"Acerca de Nottas"};
    $("settingsTitle").textContent=title[settingsPage]||"Ajustes";
    if(settingsPage==="appearance"){
      const themeRow=settingsRow("ns-palette","Tema oscuro","Solo en este navegador.");
      const input=elt("input","");input.type="checkbox";input.checked=document.documentElement.dataset.theme==="dark";input.setAttribute("aria-label","Tema oscuro");
      input.onchange=()=>setTheme(input.checked?"dark":"light");
      themeRow.append(input);
      body.append(settingsGroup("Visualización",[themeRow]));
      const colors=settingsRow("ns-info","Estilo Nottas","Usa los colores, geometría e iconos definidos en el Design System 1.3.");
      body.append(settingsGroup("Identidad",[colors]));
    }else if(settingsPage==="alerts"){
      body.append(settingsGroup("Notificaciones y recordatorios",[
        settingsRow("ns-bell","Recordatorios","La programación y los avisos a pantalla completa se gestionan desde Nottas Android."),
        settingsRow("ns-clock","Horario de trabajo","Los horarios y la función de mostrar al desbloquear permanecen en el teléfono.")
      ]));
    }else if(settingsPage==="team"){
      const rows=state.workspaces.map(ws=>settingsRow("ns-users",ws.kind==="personal"?"Personal":ws.name,ws.kind==="personal"?"Espacio privado":ws.role==="owner"?"Rol: Jefe":"Rol: Asistente"));
      body.append(settingsGroup("Espacios conectados",rows));
    }else if(settingsPage==="messages"){
      body.append(settingsGroup("Mensajes rápidos",[
        settingsRow("ns-chat","Respuestas predeterminadas","Se administran desde Nottas Android. Aquí se conservan los espacios compartidos sincronizados.")
      ]));
    }else if(settingsPage==="backup"){
      body.append(settingsGroup("Datos y respaldo",[
        settingsRow("ns-database","Sincronización","Las notas y tareas conectadas se actualizan automáticamente en ambos sentidos."),
        settingsRow("ns-lock","Copia de seguridad","La exportación y restauración completas se realizan desde Nottas Android.")
      ]));
      const sessionRow=settingsRow("ns-lock","Mantener sesión iniciada","Se conserva únicamente en este navegador. Desactívalo en equipos compartidos.");
      const remember=elt("input","");remember.type="checkbox";
      remember.checked=!!window.NottasBrowserSession?.remembered;
      remember.disabled=!state.token;
      remember.setAttribute("aria-label","Mantener sesión iniciada en este navegador");
      remember.addEventListener("change",()=>{
        const saved=window.NottasBrowserSession?.setRemember(remember.checked);
        if(!saved){remember.checked=!remember.checked;alert("No se pudo modificar el almacenamiento de sesión de este navegador.")}
      });
      sessionRow.append(remember);
      body.append(settingsGroup("Sesión web",[sessionRow]));
      const out=elt("button","secondary","Actualizar ahora");
      out.type="button";out.style.marginTop="15px";out.append(icon("ns-nav-refresh","tiny"));
      out.onclick=()=>refresh();body.append(out);
    }else if(settingsPage==="about"){
      const about=elt("div","panel-card settings-about");
      const logo=elt("img","brand-wordmark");logo.src="/assets/nottas_wordmark.svg";logo.alt="Nottas";
      about.append(logo,elt("strong","","Nottas Web"),elt("small","","Design System 1.3"));
      about.append(elt("p","","Notas, tareas y calendario. Identidad visual compartida con Nottas Android y sincronización por eventos."));
      body.append(about);
    }
  }
  function render(){
    const loggedIn=!!state.token;
    document.querySelectorAll("[data-requires-account]").forEach(el=>el.disabled=!loggedIn);
    updateNavigation();renderSpaces();renderCounts();
    const main=$("homeScreen"),calendar=$("calendarScreen"),team=$("teamScreen"),settings=$("settingsScreen");
    main.classList.toggle("hidden",screen!=="home");
    calendar.classList.toggle("hidden",screen!=="calendar");
    team.classList.toggle("hidden",screen!=="team");
    settings.classList.toggle("hidden",screen!=="settings");
    const q=$("searchClear");
    if(q)q.classList.toggle("hidden",!$("search").value);
    if(screen==="home")renderHome();
    if(screen==="calendar")renderCalendar();
    if(screen==="team")renderTeam();
    if(screen==="settings")renderSettings();
  }
  function setTheme(theme){
    document.documentElement.dataset.theme=theme;
    try{localStorage.setItem("nottas_web_theme",theme)}catch{}
  }
  function initTheme(){
    let saved;try{saved=localStorage.getItem("nottas_web_theme")}catch{}
    setTheme(saved==="light"||saved==="dark"?saved:(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"));
  }
  initTheme();
  $("workspaceTrigger").addEventListener("click",()=>{
    const menu=$("workspaceMenu");
    const open=menu.classList.toggle("hidden")===false;
    $("workspaceTrigger").setAttribute("aria-expanded",String(open));
    if(open)menu.querySelector(".workspace-choice.active")?.focus();
  });
  document.addEventListener("click",event=>{if(!$("workspacePicker").contains(event.target))hideWorkspaceMenu()});
  $("workspacePicker").addEventListener("keydown",event=>{
    if(event.key==="Escape"){hideWorkspaceMenu();$("workspaceTrigger").focus()}
  });
  $("sidebarToggle").addEventListener("click",()=>document.documentElement.classList.toggle("sidebar-open"));
  $("sidebarScrim").addEventListener("click",closeMenu);
  document.querySelectorAll("[data-section]").forEach(el=>el.addEventListener("click",()=>el.dataset.section==="home"?openHome("all"):showScreen(el.dataset.section)));
  document.querySelectorAll(".nav[data-view]").forEach(el=>el.addEventListener("click",()=>{smartFilter="all";showScreen("home")}));
  document.querySelectorAll("[data-smart-filter]").forEach(el=>el.addEventListener("click",()=>{
    const value=el.dataset.smartFilter;
    if(value==="notes"||value==="notes-pinned")state.view="note";else state.view="task";
    smartFilter=value==="notes"?"all":value==="notes-pinned"?"pinned":value;
    showScreen("home");
  }));
  document.querySelectorAll("[data-quick]").forEach(el=>el.addEventListener("click",()=>{
    smartFilter=el.dataset.quick;
    if(smartFilter==="today"||smartFilter==="pending"||smartFilter==="done")state.view="task";
    if(smartFilter==="note")state.view="note";
    if(smartFilter==="all")state.view="all";
    showScreen("home");
  }));
  $("searchClear").addEventListener("click",()=>{$("search").value="";$("search").dispatchEvent(new Event("input"));$("search").focus()});
  $("settingsQuick").addEventListener("click",()=>showScreen("settings"));
  $("refreshQuick").addEventListener("click",()=>refresh());
  $("settingsLogout").addEventListener("click",()=>$("logout").click());
  $("newTask").addEventListener("click",()=>{openEditor();$("type").value="task";configureEditor()});
  $("calendarToday").addEventListener("click",()=>{cursor=new Date();calendarSelection=new Date();renderCalendar()});
  $("calendarCreate").addEventListener("click",()=>{
    if(!state.token)return;
    openEditor();$("type").value="task";configureEditor();
    $("editDueDate").value=stamp(calendarSelection);
    $("editDueDate").dispatchEvent(new Event("change",{bubbles:true}));
    $("editEndDate").value="";
    $("title").focus();
  });
  $("calendarPrevious").addEventListener("click",()=>{cursor=calendarMode==="month"?new Date(cursor.getFullYear(),cursor.getMonth()-1,1):plusDays(cursor,calendarMode==="week"?-7:-1);renderCalendar()});
  $("calendarNext").addEventListener("click",()=>{cursor=calendarMode==="month"?new Date(cursor.getFullYear(),cursor.getMonth()+1,1):plusDays(cursor,calendarMode==="week"?7:1);renderCalendar()});
  document.querySelectorAll("[data-calendar-mode]").forEach(b=>b.addEventListener("click",()=>{calendarMode=b.dataset.calendarMode;renderCalendar()}));
  document.querySelectorAll("[data-settings-page]").forEach(b=>b.addEventListener("click",()=>settingsChoice(b.dataset.settingsPage)));
  $("workspace").addEventListener("change",()=>{smartFilter="all";screen="home";render()});
  $("search").addEventListener("input",()=>{if(screen!=="home")showScreen("home");else render()});
  document.addEventListener("keydown",ev=>{
    if(ev.key==="Escape")closeMenu();
    if((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==="k"&&!ev.altKey){ev.preventDefault();$("search").focus();$("search").select()}
  });
  window.NottasWebVisual={render,showScreen};
  render();
})();