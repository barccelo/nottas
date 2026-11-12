"use strict";
/* Nottas Web structured editor. Android model is authoritative:
   task.items (tree), task.blocks, note.blocks, meetingStatus and reminders.
   Writes use the existing POST /v1/sync and its FCM/WSS notification path. */
(function(){
  const $=id=>document.getElementById(id);
  let draft=null,richFocus=null,reminderChanged=false;
  const allowedTypes=new Set(["paragraph","heading","subheading","quote","bullet","number","checklist"]);
  const icon=(name)=>{
    const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
    svg.setAttribute("class","ns-icon tiny");svg.setAttribute("viewBox","0 0 24 24");svg.setAttribute("aria-hidden","true");
    const use=document.createElementNS("http://www.w3.org/2000/svg","use");
    use.setAttribute("href","/assets/nottas-icons.svg#"+name);svg.append(use);return svg;
  };
  function el(tag,cls,text){
    const n=document.createElement(tag);if(cls)n.className=cls;
    if(text!==undefined)n.textContent=String(text);return n;
  }
  const clone=x=>JSON.parse(JSON.stringify(x));
  const escape=x=>String(x||"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  function safeHtml(html){
    const template=document.createElement("template");
    template.innerHTML=String(html||"");
    const safe=new Set(["B","STRONG","I","EM","U","S","STRIKE","BR"]);
    function convert(parent){
      let out="";
      for(const node of parent.childNodes){
        if(node.nodeType===3){out+=escape(node.nodeValue);continue}
        if(node.nodeType!==1)continue;
        if(["SCRIPT","STYLE","IFRAME","SVG","MATH","OBJECT"].includes(node.tagName))continue;
        if(node.tagName==="BR"){out+="<br>";continue}
        const inner=convert(node);
        if(safe.has(node.tagName)){const tag={"STRONG":"b","EM":"i","STRIKE":"s"}[node.tagName]||node.tagName.toLowerCase();out+="<"+tag+">"+inner+"</"+tag+">"}
        else out+=inner+ (["DIV","P","LI"].includes(node.tagName)?"<br>":"");
      }
      return out;
    }
    return convert(template.content).replace(/(<br>){3,}/g,"<br><br>");
  }
  function plain(html){const area=document.createElement("div");area.innerHTML=safeHtml(html);area.querySelectorAll("br").forEach(br=>br.replaceWith("\n"));return area.textContent||""}
  function normalizedBlock(raw){return {...raw,id:raw.id||crypto.randomUUID(),type:allowedTypes.has(raw.type)?raw.type:"paragraph",html:String(raw.html??escape(raw.text||"")),checked:!!raw.checked,children:(raw.children||[]).map(normalizedBlock)}}
  function sourceBlocks(p){
    if(Array.isArray(p.blocks)&&p.blocks.length)return clone(p.blocks).map(normalizedBlock);
    const body=String(p.body||"");
    return body.trim()?[{id:crypto.randomUUID(),type:"paragraph",html:escape(body).replace(/\n/g,"<br>"),checked:false,children:[]}]:[];
  }
  function blocksText(nodes){
    const result=[];
    for(const x of nodes||[]){const text=plain(x.html).trim();if(text)result.push(text);
      if(x.children?.length)result.push(blocksText(x.children));
    }
    return result.filter(Boolean).join("\n");
  }
  function sourceItems(p){const nodes=Array.isArray(p.items)&&p.items.length?p.items:(Array.isArray(p.subtasks)?p.subtasks:[]);return clone(nodes).map(node=>normItem(node))}
  function normItem(n){return {id:n.id||crypto.randomUUID(),text:String(n.text||""),html:String(n.html||escape(n.text||"")),done:!!n.done,children:Array.isArray(n.children)?n.children.map(normItem):[]}}
  function progress(nodes){let total=0,done=0;function walk(items){for(const n of items){total++;if(n.done)done++;walk(n.children||[])}}walk(nodes);return {total,done}}
  function setAll(n,done){n.done=done;(n.children||[]).forEach(x=>setAll(x,done))}
  function syncParents(nodes){(nodes||[]).forEach(n=>{syncParents(n.children);if(n.children?.length)n.done=n.children.every(x=>x.done)})}
  function locate(nodes,id){for(const node of nodes){if(node.id===id)return node;const inside=locate(node.children||[],id);if(inside)return inside}return null}
  function removeFrom(nodes,id){const at=nodes.findIndex(x=>x.id===id);if(at>=0){nodes.splice(at,1);return true}return nodes.some(n=>removeFrom(n.children||[],id))}
  function moveIn(nodes,id,dir){const pos=nodes.findIndex(n=>n.id===id);if(pos>=0){const target=pos+dir;if(target<0||target>=nodes.length)return;[nodes[pos],nodes[target]]=[nodes[target],nodes[pos]];return}for(const n of nodes)moveIn(n.children||[],id,dir)}
  function rowsForBlocks(container,blocks,depth=0,disabled=false){
    if(depth>12)return;
    let ordinal=0;
    for(const block of blocks){
      ordinal=block.type==="number"?ordinal+1:0;
      const row=el("div","editor-block-row type-"+block.type);
      row.style.setProperty("--indent",(Math.min(4,depth)*18)+"px");
      if(block.type==="checklist"){
        const check=el("input","editor-circle-check");
        check.type="checkbox";check.checked=!!block.checked;check.disabled=disabled;
        check.setAttribute("aria-label","Marcar elemento");
        check.onchange=()=>{block.checked=check.checked;row.classList.toggle("is-checked",block.checked)};
        row.append(check);row.classList.toggle("is-checked",!!block.checked);
      }
      const editor=el("div","editor-rich-input");editor.contentEditable=disabled?"false":"true";
      editor.setAttribute("role","textbox");editor.setAttribute("aria-label",block.type==="checklist"?"Elemento de lista":block.type==="paragraph"?"Texto":"Bloque "+block.type);
      editor.setAttribute("data-placeholder","Escribe aquí…");
      editor.innerHTML=safeHtml(block.html);
      editor.dataset.blockId=block.id;
      if(block.type==="number")editor.dataset.number=ordinal+".";
      editor.addEventListener("focus",()=>{richFocus=editor});
      editor.addEventListener("input",()=>{block.html=safeHtml(editor.innerHTML)});
      editor.addEventListener("paste",event=>{
        event.preventDefault();
        document.execCommand("insertText",false,event.clipboardData?.getData("text/plain")||"");
      });
      row.append(editor);
      const actions=el("div","editor-row-tools");
      const kind=el("select","editor-block-type");kind.title="Tipo de bloque";kind.setAttribute("aria-label","Tipo de bloque");
      [["paragraph","Texto"],["heading","Título"],["subheading","Subtítulo"],["checklist","Casilla"],["bullet","Viñeta"],["number","Número"],["quote","Cita"]].forEach(([val,name])=>{const opt=el("option","",name);opt.value=val;kind.append(opt)});
      kind.value=block.type;kind.disabled=disabled;
      kind.addEventListener("change",()=>{block.type=kind.value;if(block.type!=="checklist")block.checked=false;drawBlocks()});
      actions.append(kind);
      const del=el("button","editor-delete-mini");del.type="button";del.textContent="×";del.title="Eliminar bloque";del.setAttribute("aria-label","Eliminar bloque");del.disabled=disabled;
      del.onclick=()=>{if(removeFrom(draft.blocks,block.id))drawBlocks()};
      actions.append(del);row.append(actions);container.append(row);
      if(block.children?.length)rowsForBlocks(container,block.children,depth+1,disabled);
    }
  }
  function drawBlocks(){
    const holder=$("editBlocks");holder.replaceChildren();
    if(!draft)return;
    rowsForBlocks(holder,draft.blocks,0,!!draft.original?.payload.deletedAt);
    if(!draft.blocks.length)holder.append(el("div","editor-blank","Añade texto, viñetas o casillas para empezar."));
  }
  function drawSubtasks(){
    const holder=$("editSubtasks");holder.replaceChildren();if(!draft)return;
    const disabled=!!draft.original?.payload.deletedAt;
    function paint(nodes,depth=0){
      if(depth>12)return;
      for(const node of nodes){
        const row=el("div","editor-item-row"+(node.done?" is-checked":""));
        row.style.setProperty("--indent",(Math.min(6,depth)*17)+"px");
        const check=el("input","editor-circle-check");
        check.type="checkbox";check.checked=node.done;check.disabled=disabled;
        check.setAttribute("aria-label","Marcar subtarea "+node.text);
        check.onchange=()=>{setAll(node,check.checked);syncParents(draft.items);drawSubtasks()};
        row.append(check);
        const input=el("input","editor-subtask-input");
        input.type="text";input.value=node.text;input.placeholder="Subtarea";
        input.maxLength=500;input.disabled=disabled;
        input.addEventListener("input",()=>{node.text=input.value;node.html=escape(input.value);row.classList.toggle("is-empty",!node.text.trim())});
        row.append(input);
        function small(name,iconName,callback){
          const b=el("button","editor-item-action");b.type="button";b.title=name;b.setAttribute("aria-label",name);b.disabled=disabled;
          b.append(icon(iconName));b.onclick=callback;return b;
        }
        row.append(small("Añadir subtarea hija","ns-plus",()=>{node.children.push({id:crypto.randomUUID(),text:"",html:"",done:false,children:[]});drawSubtasks()}));
        row.append(small("Subir","ns-back",()=>{moveIn(draft.items,node.id,-1);drawSubtasks()}));
        row.append(small("Bajar","ns-chevron",()=>{moveIn(draft.items,node.id,1);drawSubtasks()}));
        row.append(small("Eliminar","ns-trash",()=>{removeFrom(draft.items,node.id);syncParents(draft.items);drawSubtasks()}));
        holder.append(row);
        paint(node.children||[],depth+1);
      }
    }
    paint(draft.items);
    const p=progress(draft.items);
    $("editSubtaskCount").textContent=p.total?p.done+"/"+p.total:"";
  }
  function syncPin(){const b=$("editPinnedBtn");b.setAttribute("aria-pressed",String(draft?.pinned));b.title=draft?.pinned?"Quitar destacado":"Destacar";b.disabled=!!draft?.original?.payload.deletedAt}
  function renderApproval(){
    const ws=state.workspaces.find(x=>x.id===state.workspaceId);
    const shared=ws?.kind==="assistant"&&draft?.type==="task";
    $("editMeetingBox").classList.toggle("hidden",!shared);
    if(!shared)return;
    const status=draft.original?.payload.approvalStatus|| (ws?.role==="assistant"?"proposed":"confirmed");
    const labels={proposed:"Propuesta",scheduled:"Agendada",confirmed:"Confirmada",rejected:"Rechazada",changes_requested:"Solicitar cambios",cancelled:"Cancelada"};
    const holder=$("editApprovalStatus");holder.replaceChildren();
    holder.append(el("span","editor-approval-label","Aprobación: "+(labels[status]||status)));
    const editable=ws.role==="owner"&&["proposed","changes_requested"].includes(status)&&!draft.original?.payload.deletedAt;
    if(editable){const btn=el("button","editor-add-action","Agendar propuesta");
      btn.type="button";btn.onclick=()=>{draft.approvalStatus="scheduled";holder.replaceChildren(el("span","editor-approval-label","Aprobación: Agendada"))};holder.append(btn)}
  }
  function configure(){
    if(!draft)return;
    const type=$("type").value;
    if(type!==draft.type){
      draft.type=type;
      draft.blocks=[];draft.items=[];draft.pinned=false;
    }
    $("taskFields").classList.toggle("hidden",type!=="task");
    $("subtaskSection").classList.toggle("hidden",type!=="task");
    $("bodyRow").classList.remove("hidden");
    $("editorBlocksLabel").textContent=type==="task"?"Notas / descripción":"Contenido";
    $("editHeading").textContent=(draft.original?"Editar ":"Nueva ")+(type==="task"?"tarea":"nota");
    $("doneRow").classList.toggle("hidden",type!=="task");
    $("editInfo").textContent=draft.original?.payload.deletedAt?"Este elemento está en la papelera y no se puede editar.":"";
    const disabled=!!draft.original?.payload.deletedAt;
    $("title").disabled=disabled;$("title").required=type==="task";$("save").disabled=disabled;
    ["addParagraphBtn","addChecklistBtn","addBulletBtn","addSubtaskBtn"].forEach(id=>$(id).disabled=disabled);
    drawBlocks();drawSubtasks();syncPin();renderApproval();
  }
  function hideCategoryMenu(){
    $("editCategoryMenu").classList.add("hidden");
    $("editCategoryTrigger").setAttribute("aria-expanded","false");
  }
  function fillCategories(workspaceId,selected){
    const select=$("editCategory"),menu=$("editCategoryMenu");
    select.replaceChildren();menu.replaceChildren();
    const cats=window.NottasCategories;
    const list=cats.choices(workspaceId);
    if(selected&&!list.some(c=>c.id===selected))list.push(cats.find(selected,workspaceId));
    for(const c of list){
      const opt=el("option","",c.name);opt.value=c.id;select.append(opt);
      const choice=el("button","editor-category-choice");
      choice.type="button";choice.setAttribute("role","option");choice.dataset.categoryId=c.id;
      choice.append(cats.label(c));
      choice.addEventListener("click",()=>{
        select.value=c.id;
        select.dispatchEvent(new Event("change",{bubbles:true}));
        hideCategoryMenu();
        $("editCategoryTrigger").focus();
      });
      menu.append(choice);
    }
    select.value=selected||"inbox";
    if(!select.value)select.value="inbox";
    renderCategoryValue();
  }
  function renderCategoryValue(){
    const cats=window.NottasCategories,select=$("editCategory");
    const selected=cats.find(select.value,draft?.original?.workspaceId||state.workspaceId);
    $("editCategoryPreview").replaceChildren(cats.label(selected));
    const menu=$("editCategoryMenu");
    for(const btn of menu.children){
      const active=btn.dataset.categoryId===select.value;
      btn.classList.toggle("selected",active);btn.setAttribute("aria-selected",String(active));
    }
  }
  function open(item=null){
    if(!state.token||state.busy)return;
    hideCategoryMenu();
    state.current=item;
    const type=item?.entityType||"note",p=item?.payload||{};
    draft={original:item,type,blocks:sourceBlocks(p),items:type==="task"?sourceItems(p):[],pinned:!!p.pinned,approvalStatus:null};
    $("type").value=type;$("type").disabled=!!item;
    $("title").value=type==="task"?String(p.text||""):String(p.title||"");
    fillCategories(item?.workspaceId||state.workspaceId,p.category);
    $("editTags").value=(Array.isArray(p.tags)?p.tags:[]).join(", ");
    const ws=state.workspaces.find(w=>w.id===(item?.workspaceId||state.workspaceId));
    $("editorWorkspaceLabel").textContent=ws?.kind==="personal"?"Personal":ws?.name||"Oficina";
    $("done").checked=!!p.done;
    $("editDueDate").value=String(p.dueDate||"");
    $("editEndDate").value=String(p.endDate||"");
    $("editDueTime").value=String(p.dueTime||"");
    $("editEndTime").value=String(p.endTime||"");
    $("editRecurrence").value=["none","daily","weekdays","weekly","monthly"].includes(p.recurrence)?p.recurrence:"none";
    $("editPriority").value=["low","normal","high"].includes(p.priority)?p.priority:"normal";
    $("editLocation").value=String(p.locationText||"");
    $("editMeetingStatus").value=["scheduled","deferred","realized","not_realized","cancelled"].includes(p.meetingStatus)?p.meetingStatus:"scheduled";
    $("editMeetingNote").value=String(p.meetingNote||"");
    const offsets=Array.isArray(p.reminders)?p.reminders.map(Number):(!item?[0,10]:({"at":0,"5m":5,"10m":10,"15m":15,"30m":30,"1h":60,"1d":1440}[p.reminder]!==undefined?[{"at":0,"5m":5,"10m":10,"15m":15,"30m":30,"1h":60,"1d":1440}[p.reminder]]:[]));
    draft.reminders=offsets.filter(n=>Number.isInteger(n)&&n>=0&&n<=525600);
    reminderChanged=false;
    const presets=[0,5,10,60,1440];
    document.querySelectorAll("#editorReminders input").forEach(c=>{c.checked=draft.reminders.includes(Number(c.value))});
    const additional=draft.reminders.filter(n=>!presets.includes(n));
    draft.initialExtraReminder=additional[0];
    $("editExtraReminder").value=additional[0]??"";
    $("editExtraReminder").title=additional.length>1?"Los demás recordatorios personalizados se conservarán.":"";
    updateReminderSummary();
    updateDateShortcuts();
    $("quickScheduleHint").classList.add("hidden");
    $("editError").textContent="";
    configure();
    $("editor").showModal();
    if(!item)updateQuickScheduleHint();
  }
  function updateQuickScheduleHint(){
    const box=$("quickScheduleHint");
    if(!draft||draft.type!=="task"||draft.original){box.classList.add("hidden");return}
    const candidate=window.NottasSchedule?.parse($("title").value);
    draft.quickSchedule=candidate?.found?candidate:null;
    box.classList.toggle("hidden",!draft.quickSchedule);
    if(!draft.quickSchedule)return;
    const date=window.NottasSchedule.displayDate(draft.quickSchedule.date);
    const time=draft.quickSchedule.time;
    $("quickScheduleText").textContent="Detectado: "+(date||"")+(time?" · "+time:"")+".";
    $("quickScheduleApply").textContent="Usar "+date+(time?" · "+time:"");
  }
  function applyQuickSchedule(){
    const suggestion=draft?.quickSchedule;
    if(!suggestion?.found)return;
    if(suggestion.date)$("editDueDate").value=suggestion.date;
    if(suggestion.time)$("editDueTime").value=suggestion.time;
    if(suggestion.clean&&suggestion.clean!==$("title").value.trim())$("title").value=suggestion.clean;
    $("quickScheduleHint").classList.add("hidden");
    draft.quickSchedule=null;
    updateDateShortcuts();
    updateReminderSummary();
    $("editDueDate").dispatchEvent(new Event("change",{bubbles:true}));
    $("title").focus();
  }
  function updateDateShortcuts(){
    if(!draft)return;
    const sch=window.NottasSchedule;
    if(!sch)return;
    const today=sch.isoDate(new Date()),tomorrow=sch.isoDate(sch.addDays(new Date(),1));
    const after=sch.isoDate(sch.addDays(new Date(),2)),value=$("editDueDate").value;
    for(const b of document.querySelectorAll("[data-date-shortcut]")){
      const chosen=b.dataset.dateShortcut;
      const active=chosen==="today"?value===today:chosen==="tomorrow"?value===tomorrow:chosen==="aftertomorrow"?value===after:!value;
      b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active));
    }
    for(const b of document.querySelectorAll("[data-time-shortcut]")){
      const selected=b.dataset.timeShortcut;
      const active=selected==="clear"?!$("editDueTime").value:$("editDueTime").value===selected;
      b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active));
    }
  }
  function updateReminderSummary(){
    if(!draft)return;
    const selected=[...document.querySelectorAll("#editorReminders input:checked")].map(x=>Number(x.value));
    const custom=+$("editExtraReminder").value;
    if($("editExtraReminder").value!==""&&Number.isInteger(custom)&&custom>0)selected.push(custom);
    // Show retained custom alerts not exposed by the single custom input.
    const presets=[0,5,10,60,1440];
    const extras=(draft.reminders||[]).filter(n=>!presets.includes(n)&&n!==draft.initialExtraReminder);
    const count=new Set([...selected,...extras]).size;
    $("editReminderSummary").textContent=count?count+(count===1?" aviso":" avisos"):"Sin recordatorios";
  }
  function openAt(item,target=""){
    if(!item||!state.token)return;
    open(item);
    if(!$("editor").open)return;
    const map={date:"editDueDate",endDate:"editEndDate",time:"editDueTime",endTime:"editEndTime",
      reminders:"editorReminders",category:"editCategoryTrigger",status:"editMeetingStatus",priority:"editPriority",recurrence:"editRecurrence",tags:"editTags"};
    const field=$(map[target]||"title");
    field?.scrollIntoView({block:"center",behavior:"instant"});
    field?.focus({preventScroll:true});
    if(["date","endDate","time","endTime"].includes(target)){
      try{field.showPicker?.()}catch{} // Browsers without showPicker use the native focusable input.
    }else if(target==="category"){
      $("editCategoryMenu").classList.remove("hidden");$("editCategoryTrigger").setAttribute("aria-expanded","true");
    }
  }
  function collectReminders(){
    const old=Array.isArray(draft.reminders)?draft.reminders:[];
    if(!reminderChanged)return old;
    const presets=[0,5,10,60,1440];
    const selected=[...document.querySelectorAll("#editorReminders input:checked")].map(x=>Number(x.value));
    const custom=+$("editExtraReminder").value;
    if($("editExtraReminder").value!==""){
      if(!Number.isInteger(custom)||custom<1||custom>525600)throw Error("El recordatorio adicional debe ser un número de minutos válido.");
      selected.push(custom);
    }
    return [...new Set([...old.filter(n=>!presets.includes(n)&&n!==draft.initialExtraReminder),...selected])].sort((a,b)=>a-b).slice(0,12);
  }
  function validateSchedule(){
    const date=$("editDueDate").value,endDate=$("editEndDate").value;
    const start=$("editDueTime").value,end=$("editEndTime").value;
    if((start||end||endDate)&&!date)throw Error("Selecciona primero la fecha de inicio.");
    if(endDate&&endDate<date)throw Error("La fecha final no puede ser anterior al inicio.");
    if(end&&!start)throw Error("Indica la hora de inicio antes de la de cierre.");
    if(end&&start&&(!endDate||endDate===date)&&end<=start)throw Error("La hora de cierre debe ser posterior a la de inicio.");
    if($("editMeetingStatus").value==="deferred"&&!date)throw Error("Selecciona una nueva fecha antes de diferir.");
  }
  async function save(ev){
    ev.preventDefault();
    if(!draft||state.busy||!state.token)return;
    try{
      if(draft.type==="task"&&!$("title").value.trim())throw Error("Escribe un título para la tarea.");
      if(draft.type==="task")validateSchedule();
      const original=draft.original,ts=Date.now();
      const id=original?.entityId||crypto.randomUUID();
      const payload=original?clone(original.payload):{id,workspaceId:state.workspaceId,createdAt:ts,rev:1};
      const finalBlocks=draft.blocks.map(normalizedBlock).filter(b=>plain(b.html).trim()||b.children.length);
      payload.pinned=draft.pinned;
      payload.category=$("editCategory").value||"inbox";
      payload.tags=[...new Set($("editTags").value.split(",").map(t=>t.trim().replace(/^#+/,"").toLowerCase().slice(0,30)).filter(Boolean))].slice(0,12);
      payload.blocks=finalBlocks;
      payload.body=blocksText(finalBlocks);
      if(draft.type==="note"){
        payload.title=$("title").value.trim();
        if(!original||payload.title!==original.payload.title)payload.titleHtml=escape(payload.title);
        // Keep the category and tags selected in the web editor.
      }else{
        payload.text=$("title").value.trim();
        if(!original||payload.text!==original.payload.text)payload.textHtml=escape(payload.text);
        payload.done=$("done").checked;
        const filterItems=nodes=>nodes.map(n=>({...n,children:filterItems(n.children||[])})).filter(n=>n.text.trim()||n.children.length);
        const items=filterItems(clone(draft.items));
        syncParents(items);
        payload.items=items;
        payload.subtasks=items.filter(n=>n.text.trim()).map(n=>({id:n.id,text:n.text,done:n.done}));
        payload.dueDate=$("editDueDate").value;
        payload.endDate=$("editEndDate").value;
        payload.dueTime=$("editDueTime").value;
        payload.endTime=$("editEndTime").value;
        payload.recurrence=$("editRecurrence").value;
        payload.priority=$("editPriority").value;
        payload.locationText=$("editLocation").value.trim().slice(0,200);
        payload.reminders=collectReminders();
        payload.reminder=payload.reminders.length===0?"none":payload.reminders[0]===0?"at":({5:"5m",10:"10m",15:"15m",30:"30m",60:"1h",1440:"1d"}[payload.reminders[0]]||"at");
        if(!original){
          payload.meetingTracked=state.workspaces.find(w=>w.id===state.workspaceId)?.kind==="assistant";
          payload.meetingStatus="scheduled";
          payload.approvalStatus=state.workspaces.find(w=>w.id===state.workspaceId)?.role==="assistant"?"proposed":"confirmed";
          payload.requiresApproval=payload.approvalStatus==="proposed";
          payload.meetingHistory=[];
        }
        const shared=state.workspaces.find(w=>w.id===(original?.workspaceId||state.workspaceId))?.kind==="assistant";
        if(shared){
          payload.meetingTracked=true;
          payload.meetingStatus=$("editMeetingStatus").value;
          payload.meetingNote=$("editMeetingNote").value.slice(0,500);
          if(draft.approvalStatus){
            payload.approvalStatus=draft.approvalStatus;payload.requiresApproval=false;
          }
        }
        if(payload.dueDate&&payload.endDate&&payload.endDate<=payload.dueDate)payload.endDate="";
        if(!payload.dueDate){payload.endDate="";payload.dueTime="";payload.endTime="";payload.reminders=[];payload.reminder="none"}
      }
      payload.updatedAt=ts;
      const workspaceId=original?.workspaceId||state.workspaceId;
      await push({workspaceId,entityType:draft.type,entityId:id,payload,rev:Number(payload.rev||1)+(original?1:0),updatedAt:ts});
    }catch(error){$("editError").textContent=error.message}
  }
  async function quick(item,mutator){
    if(!state.token||state.busy||$("editor").open)return false;
    const key=item.workspaceId+":"+item.entityType+":"+item.entityId;
    const existing=state.items.get(key);
    if(!existing||existing.payload.deletedAt)return false;
    const previous=clone(existing.payload),payload=clone(previous),ts=Date.now();
    try{mutator(payload)}catch(error){alert(error.message);return false}
    if(JSON.stringify(previous)===JSON.stringify(payload))return false;
    payload.updatedAt=ts;
    // Optimistic feedback: the check must visibly respond to a real click.
    // The authoritative returned payload from D1 is applied on acceptance.
    state.busy=true;
    state.items.set(key,{...existing,payload});
    render();setStatus("Guardando cambio…");
    let accepted=false;
    try{
      const res=await request("/v1/sync","POST",{changes:[{
        workspaceId:item.workspaceId,entityType:item.entityType,entityId:item.entityId,
        payload,rev:Number(previous.rev||1)+1,updatedAt:ts
      }]});
      if(res.conflicts?.length)throw Error("Este elemento se modificó en otro dispositivo.");
      const saved=(res.accepted||[]).find(c=>c.workspaceId===item.workspaceId&&c.entityType===item.entityType&&c.entityId===item.entityId);
      if(!saved)throw Error("El servidor no aceptó la modificación.");
      accepted=true;
      state.items.set(key,{...existing,payload:saved.payload||payload});
      render();setStatus("Guardado");
    }catch(error){
      // Revert on any server failure. Never leave a false completed check.
      state.items.set(key,{...existing,payload:previous});
      render();
      setStatus("Error al guardar");
      alert("No se pudo aplicar el cambio: "+error.message);
    }finally{
      state.busy=false;
      await refresh(true); // FCM/WSS already handle the other device; no polling.
    }
    return accepted;
  }
  function toggleTask(id){return quick(id,p=>{p.done=!p.done;if(p.meetingTracked&&["scheduled","realized"].includes(p.meetingStatus))p.meetingStatus=p.done?"realized":"scheduled"})}
  function toggleItem(item,nodeId){return quick(item,p=>{
    const root=sourceItems(p),node=locate(root,nodeId);if(!node)return;
    setAll(node,!node.done);syncParents(root);
    p.items=root;p.subtasks=root.filter(n=>n.text.trim()).map(n=>({id:n.id,text:n.text,done:n.done}));
  })}
  function toggleNoteCheck(item,blockId){return quick(item,p=>{
    const blocks=sourceBlocks(p),n=locate(blocks,blockId);if(!n||n.type!=="checklist")return;
    n.checked=!n.checked;p.blocks=blocks;p.body=blocksText(blocks);
  })}
  $("editCategoryTrigger").addEventListener("click",()=>{
    const menu=$("editCategoryMenu");
    const open=menu.classList.toggle("hidden")===false;
    $("editCategoryTrigger").setAttribute("aria-expanded",String(open));
    if(open)menu.querySelector(".editor-category-choice.selected")?.focus();
  });
  $("editCategory").addEventListener("change",renderCategoryValue);
  document.addEventListener("click",event=>{
    if(!event.target.closest(".editor-category-control"))hideCategoryMenu();
  });
  $("editCategoryTrigger").addEventListener("keydown",event=>{
    if(event.key==="Escape"){hideCategoryMenu();event.preventDefault()}
  });
  $("quickScheduleApply").addEventListener("click",applyQuickSchedule);
  $("quickScheduleDismiss").addEventListener("click",()=>{
    $("quickScheduleHint").classList.add("hidden");draft.quickSchedule=null;
  });
  $("title").addEventListener("input",()=>{
    if(draft?.type==="task"&&!draft.original)updateQuickScheduleHint();
  });
  const schedule=window.NottasSchedule;
  document.querySelectorAll("[data-date-shortcut]").forEach(btn=>btn.addEventListener("click",()=>{
    if(!draft||draft.original?.payload.deletedAt)return;
    const choice=btn.dataset.dateShortcut;
    const value=choice==="today"?schedule.isoDate(new Date()):
      choice==="tomorrow"?schedule.isoDate(schedule.addDays(new Date(),1)):
      choice==="aftertomorrow"?schedule.isoDate(schedule.addDays(new Date(),2)):"";
    $("editDueDate").value=value;
    if(!value){$("editEndDate").value="";$("editDueTime").value="";$("editEndTime").value=""}
    $("editDueDate").dispatchEvent(new Event("change",{bubbles:true}));
  }));
  document.querySelectorAll("[data-time-shortcut]").forEach(btn=>btn.addEventListener("click",()=>{
    if(!draft||draft.original?.payload.deletedAt)return;
    const value=btn.dataset.timeShortcut==="clear"?"":btn.dataset.timeShortcut;
    $("editDueTime").value=value;
    if(value&&!$("editDueDate").value)$("editDueDate").value=schedule.isoDate(new Date());
    if(!value)$("editEndTime").value="";
    $("editDueTime").dispatchEvent(new Event("change",{bubbles:true}));
  }));
  for(const id of ["editDueDate","editEndDate","editDueTime","editEndTime"]){
    $(id).addEventListener("change",()=>{
      if(id==="editDueDate"&&!$("editDueDate").value){
        $("editEndDate").value="";$("editDueTime").value="";$("editEndTime").value="";
      }
      if(id==="editDueTime"&&$("editDueTime").value&&!$("editDueDate").value){
        $("editDueDate").value=schedule.isoDate(new Date());
      }
      updateDateShortcuts();
    });
  }
  document.querySelectorAll("[data-pick]").forEach(btn=>btn.addEventListener("click",()=>{
    const target=$(btn.dataset.pick);
    if(!target||target.disabled)return;
    target.focus();
    try{target.showPicker?.()}catch{}
  }));
  const reminderInputs=[...document.querySelectorAll("#editorReminders input")];
  reminderInputs.forEach(c=>c.addEventListener("change",()=>{
    reminderChanged=true;
    if(c.checked&&!$("editDueDate").value)$("editDueDate").value=schedule.isoDate(new Date());
    updateReminderSummary();updateDateShortcuts();
  }));
  $("editExtraReminder").addEventListener("input",()=>{
    reminderChanged=true;
    if($("editExtraReminder").value&&!$("editDueDate").value)$("editDueDate").value=schedule.isoDate(new Date());
    updateReminderSummary();updateDateShortcuts();
  });
  $("editClearReminders").addEventListener("click",()=>{
    if(!draft)return;
    reminderChanged=true;draft.reminders=[];draft.initialExtraReminder=undefined;
    reminderInputs.forEach(c=>{c.checked=false});
    $("editExtraReminder").value="";
    updateReminderSummary();
  });
  $("editPinnedBtn").addEventListener("click",()=>{if(!draft)return;draft.pinned=!draft.pinned;syncPin()});
  document.querySelectorAll("#editor [data-format]").forEach(button=>{
    button.addEventListener("mousedown",e=>e.preventDefault());
    button.addEventListener("click",()=>{
      if(!draft||draft.original?.payload.deletedAt||!richFocus)return;
      richFocus.focus();
      document.execCommand(button.dataset.format,false,null);
      const node=locate(draft.blocks,richFocus.dataset.blockId);
      if(node)node.html=safeHtml(richFocus.innerHTML);
    });
  });
  $("editCloseBtn").addEventListener("click",()=>$("editor").close());
  $("addSubtaskBtn").addEventListener("click",()=>{if(!draft)return;draft.items.push({id:crypto.randomUUID(),text:"",html:"",done:false,children:[]});drawSubtasks()});
  [["addParagraphBtn","paragraph"],["addChecklistBtn","checklist"],["addBulletBtn","bullet"]].forEach(([id,type])=>{
    $(id).addEventListener("click",()=>{if(!draft)return;draft.blocks.push({id:crypto.randomUUID(),type,html:"",checked:false,children:[]});drawBlocks()});
  });

  // Editing toolbar uses the native browser selection; the saved HTML is
  // strictly sanitized and no remote code or attributes are inserted.
  window.NottasEditor={open,openAt,configure,save,quick,toggleTask,toggleItem,toggleNoteCheck,sourceItems,sourceBlocks,plain,progress};
})();