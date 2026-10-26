// Cached read-only Google Calendar events, scoped to a verified Nottas workspace.
// Cache entries are one calendar and one calendar month, shared by its members.
const MAX_SELECTED=40,MAX_MONTHS=5,CACHE_MS=15*60*1000,MAX_EVENTS_PER_MONTH=3000;
const reply=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, content-type","Access-Control-Allow-Methods":"GET,POST,OPTIONS"}});
function dateValid(date) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(date||"")))return false;
  return !Number.isNaN(Date.parse(date+"T00:00:00Z"))&&new Date(date+"T00:00:00Z").toISOString().slice(0,10)===date;
}
function monthId(date){return date.slice(0,7)}
function nextMonth(month){const d=new Date(month+"-01T00:00:00Z");d.setUTCMonth(d.getUTCMonth()+1);return d.toISOString().slice(0,7)}
function monthWindows(start,end){
  let month=monthId(start),out=[];
  while(month+"-01"<end&&out.length<=MAX_MONTHS){out.push(month);month=nextMonth(month)}
  return out;
}
const trim=(value,max=180)=>String(value||"").slice(0,max);
function eventRecord(item,source) {
  if(!item?.id||item.status==="cancelled"||!item.start||!item.end)return null;
  const allDay=!!item.start.date;
  const start=trim(allDay?item.start.date:item.start.dateTime,40),end=trim(allDay?item.end.date:item.end.dateTime,40);
  if(!start||!end)return null;
  return {id:trim(item.id,500),calendarId:source.calendar_id,calendarName:source.summary,color:source.background_color,
    title:trim(item.summary||"Ocupado",240),location:trim(item.location,240),start,end,allDay};
}
async function fetchMonth(source,month,token){
  const start=new Date(month+"-01T00:00:00Z"),finish=new Date(nextMonth(month)+"-01T00:00:00Z");
  // Expand two days to handle calendar-local dates that cross UTC month boundaries.
  start.setUTCDate(start.getUTCDate()-2);finish.setUTCDate(finish.getUTCDate()+2);
  const base=new URL("https://www.googleapis.com/calendar/v3/calendars/"+encodeURIComponent(source.calendar_id)+"/events");
  base.searchParams.set("singleEvents","true");
  base.searchParams.set("showDeleted","false");
  base.searchParams.set("orderBy","startTime");
  base.searchParams.set("maxResults","1000");
  base.searchParams.set("timeMin",start.toISOString());
  base.searchParams.set("timeMax",finish.toISOString());
  base.searchParams.set("fields","nextPageToken,items(id,status,summary,start,end,location)");
  let page="",count=0,rows=[],remaining=4;
  do{
    const url=new URL(base);
    if(page)url.searchParams.set("pageToken",page);
    const res=await fetch(url.toString(),{headers:{Authorization:"Bearer "+token}});
    if(!res.ok)throw new Error("calendar_events_http_"+res.status);
    const data=await res.json();
    for(const item of (data.items||[])){
      const event=eventRecord(item,source);if(event)rows.push(event);
    }
    count+=(data.items||[]).length;
    page=data.nextPageToken||"";
    if(count>MAX_EVENTS_PER_MONTH&&page)throw new Error("calendar_too_many_events");
  }while(page&&--remaining>0);
  if(page)throw new Error("calendar_too_many_events");
  return rows;
}
export async function getCalendarEvents(workspaceId,url,env,getToken){
  const start=url.searchParams.get("start"),end=url.searchParams.get("end");
  if(!dateValid(start)||!dateValid(end)||start>=end)return reply({error:"valid_calendar_date_range_required"},400);
  const span=(Date.parse(end+"T00:00:00Z")-Date.parse(start+"T00:00:00Z"))/86400000;
  if(span>125)return reply({error:"calendar_range_too_large"},400);
  const months=monthWindows(start,end);
  if(months.length>MAX_MONTHS)return reply({error:"calendar_too_many_months"},400);
  const sources=(await env.DB.prepare(
    "SELECT calendar_id,summary,background_color FROM google_calendar_sources WHERE workspace_id=? AND selected=1 ORDER BY summary LIMIT ?"
  ).bind(workspaceId,MAX_SELECTED+1).all()).results||[];
  if(sources.length>MAX_SELECTED)return reply({error:"calendar_selection_limit_exceeded"},409);
  if(!sources.length)return reply({connected:true,events:[],selectedCount:0,needsSelection:true});
  const force=url.searchParams.get("refresh")==="1";
  const now=Date.now(),jobs=[],all=[],issues=[];
  for(const source of sources)for(const month of months){
    const cached=await env.DB.prepare(
      "SELECT events_json,synced_at FROM google_calendar_event_windows WHERE workspace_id=? AND calendar_id=? AND month=?"
    ).bind(workspaceId,source.calendar_id,month).first();
    if(!force&&cached&&now-Number(cached.synced_at)<CACHE_MS){
      try{all.push(...JSON.parse(cached.events_json));continue}catch(_){}
    }
    jobs.push({source,month,cached});
  }
  if(jobs.length){
    const connection=await env.DB.prepare(
      "SELECT refresh_cipher FROM google_calendar_connections WHERE workspace_id=?"
    ).bind(workspaceId).first();
    if(!connection)return reply({error:"google_not_connected"},409);
    let token;
    try{token=await getToken(connection,env)}
    catch(error){return reply({error:"google_session_refresh_failed",message:"La cuenta Google necesita nueva autorización."},502)}
    for(let i=0;i<jobs.length;i+=5){
      await Promise.all(jobs.slice(i,i+5).map(async({source,month,cached})=>{
        try{
          const records=await fetchMonth(source,month,token);
          await env.DB.prepare(
            "INSERT INTO google_calendar_event_windows(workspace_id,calendar_id,month,events_json,synced_at) VALUES(?,?,?,?,?) "+
            "ON CONFLICT(workspace_id,calendar_id,month) DO UPDATE SET events_json=excluded.events_json,synced_at=excluded.synced_at"
          ).bind(workspaceId,source.calendar_id,month,JSON.stringify(records),Date.now()).run();
          all.push(...records);
        }catch(error){
          issues.push({calendarId:source.calendar_id,name:source.summary,error:String(error?.message||error).slice(0,70)});
          if(cached){try{all.push(...JSON.parse(cached.events_json))}catch(_){}}
        }
      }));
    }
  }
  const dedup=new Map();
  for(const item of all) {
    if(!item?.id||!item?.calendarId)continue;
    dedup.set(item.calendarId+"\u0000"+item.id,item);
  }
  const events=[...dedup.values()].sort((a,b)=>a.start.localeCompare(b.start)||a.calendarName.localeCompare(b.calendarName));
  return reply({connected:true,selectedCount:sources.length,events,partial:issues.length>0,issues,cacheMinutes:15});
}
export function calendarSelectionLimit(){return MAX_SELECTED}
