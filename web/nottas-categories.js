"use strict";
/* Category graphics use the exact icon names, emoji and color policy from
 * Nottas Android's categorySymbolHtml() / EVENT_CATEGORY_DEFAULTS. */
(function(){
  const supported=new Set(["council","meeting","one-on-one","interview","inperson","appointment","visit","phone","followup","activity","training"]);
  const colorOf=c=>/^#[0-9a-fA-F]{6}$/.test(c?.color||"")?c.color:"#8e8e93";
  function records(){return [...(state.categories?.values()||[])].map(row=>row.payload).filter(c=>c&&!c.deletedAt&&c.scope!=="system")}
  function find(id,workspaceId=state.workspaceId){
    if(!id||id==="inbox")return {id:"inbox",name:"Sin categoría",color:"#8e8e93",icon:""};
    const rows=records().filter(c=>c.id===id);
    return rows.find(c=>c.workspaceId===workspaceId)||rows.find(c=>!c.workspaceId)||rows[0]||{id,name:"Categoría anterior",color:"#8e8e93",icon:""};
  }
  function choices(workspaceId=state.workspaceId){
    const eligible=records().filter(c=>(!c.workspaceId||c.workspaceId===workspaceId)&&c.id!=="inbox");
    return [{id:"inbox",name:"Sin categoría",color:"#8e8e93",icon:""},...eligible.sort((a,b)=>String(a.name||"").localeCompare(String(b.name||""),"es"))];
  }
  function element(c){
    const color=colorOf(c),wrap=document.createElement("span");
    wrap.className="ns-category-icon";
    wrap.style.setProperty("--category-color",color);
    wrap.setAttribute("aria-hidden","true");
    if(String(c?.emoji||"").trim()){
      wrap.classList.add("is-emoji");wrap.textContent=String(c.emoji).slice(0,16);
    }else if(supported.has(c?.icon)){
      const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
      svg.setAttribute("viewBox","0 0 24 24");svg.setAttribute("class","ns-icon");svg.setAttribute("aria-hidden","true");
      const use=document.createElementNS("http://www.w3.org/2000/svg","use");
      use.setAttribute("href","/assets/nottas-icons.svg#ns-event-"+c.icon);
      svg.append(use);wrap.append(svg);
    }else{
      const dot=document.createElement("span");dot.className="ns-category-dot";wrap.append(dot);
    }
    return wrap;
  }
  function label(c,css=""){
    const span=document.createElement("span");span.className="ns-category-label"+(css?" "+css:"");
    span.append(element(c));
    const text=document.createElement("span");
    text.textContent=String(c?.name||"Categoría");span.append(text);
    return span;
  }
  window.NottasCategories=Object.freeze({find,choices,element,label});
})();