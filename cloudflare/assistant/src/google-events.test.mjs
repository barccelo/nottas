import { test, before } from "node:test";
import assert from "node:assert/strict";
import { getCalendarEvents } from "./google-events.js";

const src={calendar_id:"staff@example.invalid",summary:"Horario",background_color:"#3377aa"};
function fixture({selected=[src],cached=null,now=Date.now()}={}){
  const writes=[],requests=[],sqls=[];
  const env={DB:{prepare(sql){return {bind(...params){return {
    async all(){sqls.push({sql,params});if(sql.includes("FROM google_calendar_sources"))return {results:selected};return {results:[]}},
    async first(){sqls.push({sql,params});if(sql.includes("FROM google_calendar_event_windows"))return cached;
      if(sql.includes("FROM google_calendar_connections"))return {refresh_cipher:"encrypted"};return null},
    async run(){writes.push({sql,params});return {meta:{changes:1}}}
  }}}}}};
  return {env,writes,requests,sqls};
}
function req(start,end,extra=""){return new URL("https://nottas.invalid/v1/workspaces/ws/google/events?start="+start+"&end="+end+extra)}
test("no selected calendars returns a usable empty response without OAuth",async()=>{
  const f=fixture({selected:[]});
  const result=await getCalendarEvents("ws",req("2026-10-01","2026-11-01"),f.env,()=>{throw Error("unexpected refresh")});
  assert.equal(result.status,200);
  assert.equal((await result.json()).needsSelection,true);
  assert.equal(f.writes.length,0);
});
test("invalid, too broad or malformed windows are rejected",async()=>{
  const f=fixture();
  for(const [start,end] of [["2026-02-31","2026-03-01"],["2026-11-01","2026-10-01"],["2026-01-01","2026-06-01"]]){
    const response=await getCalendarEvents("ws",req(start,end),f.env,()=>{throw Error("not called")});
    assert.equal(response.status,400);
  }
});
test("fresh D1 snapshot is reused with no calls to Google OAuth",async()=>{
  const cachedEvents=[{id:"one",calendarId:src.calendar_id,calendarName:src.summary,color:"#3377aa",title:"Reunión",start:"2026-10-22T10:00:00-04:00",end:"2026-10-22T11:00:00-04:00",allDay:false}];
  const f=fixture({cached:{events_json:JSON.stringify(cachedEvents),synced_at:Date.now()}});
  const r=await getCalendarEvents("ws",req("2026-10-01","2026-11-01"),f.env,()=>{throw Error("refresh forbidden")});
  const body=await r.json();assert.equal(r.status,200);assert.equal(body.events.length,1);
  assert.equal(body.events[0].title,"Reunión");assert.equal(f.writes.length,0);
});
test("stale calendar snapshot refreshes Google and saves compact events in D1",async()=>{
  const f=fixture();
  const savedFetch=globalThis.fetch;let googleCalls=0,oauthCalls=0;
  globalThis.fetch=async(url)=>{
    googleCalls++;
    const u=new URL(url);
    assert.equal(u.hostname,"www.googleapis.com");
    assert.equal(u.searchParams.get("singleEvents"),"true");
    assert.equal(u.searchParams.get("showDeleted"),"false");
    assert.ok(u.searchParams.get("timeMin"));
    return new Response(JSON.stringify({items:[
      {id:"google-id",summary:"Junta",status:"confirmed",start:{dateTime:"2026-10-31T09:00:00-04:00"},end:{dateTime:"2026-10-31T10:00:00-04:00"}},
      {id:"cancelled",status:"cancelled",start:{date:"2026-10-30"},end:{date:"2026-10-31"}}
    ]}),{status:200});
  };
  try {
    const r=await getCalendarEvents("ws",req("2026-10-01","2026-11-01"),f.env,async()=>{oauthCalls++;return "mock-token"});
    const data=await r.json();
    assert.equal(r.status,200);
    assert.equal(data.events.length,1);
    assert.equal(data.events[0].title,"Junta");
    assert.equal(data.events[0].calendarName,"Horario");
    assert.equal(googleCalls,1);assert.equal(oauthCalls,1);
    assert.ok(f.writes.some(x=>x.sql.includes("INSERT INTO google_calendar_event_windows")));
  } finally {globalThis.fetch=savedFetch}
});
test("calendar API errors report a partial result, not a false successful sync",async()=>{
  const f=fixture();const old=globalThis.fetch;
  globalThis.fetch=async()=>new Response("not authorized",{status:403});
  try{
    const r=await getCalendarEvents("ws",req("2026-10-01","2026-11-01"),f.env,async()=>"mock");
    const body=await r.json();assert.equal(r.status,200);assert.equal(body.partial,true);assert.equal(body.issues.length,1);
    assert.equal(body.events.length,0);assert.equal(f.writes.length,0);
  }finally{globalThis.fetch=old}
});
test("each calendar and time range is bounded",async()=>{
  const many=Array.from({length:41},(_,i)=>({calendar_id:"cal"+i,summary:"Calendar"+i,background_color:"#000000"}));
  const f=fixture({selected:many});
  const r=await getCalendarEvents("ws",req("2026-10-01","2026-11-01"),f.env,async()=>{throw Error("unreachable")});
  assert.equal(r.status,409);assert.equal((await r.json()).error,"calendar_selection_limit_exceeded");
});
