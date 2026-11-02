import { test } from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import worker from "./index.js";
globalThis.crypto ??= webcrypto;

function fixture() {
  const seen=[];
  const now=Date.now();
  const deletedAt=now-90000;
  const existing={id:"deleted-task",workspaceId:"office",text:"Tarea eliminada",rev:8,updatedAt:now-30000,deletedAt};
  const current={id:"stale-task",workspaceId:"office",text:"Versión antigua",rev:12,updatedAt:now-10000};
  const db={
    prepare(sql){
      return {bind(...args){
        return {
          async first(){
            if(sql.includes("FROM sessions s JOIN users"))return {user_id:"director",device_id:"phone",display_name:"Director"};
            if(sql.includes("MAX(seq)"))return {seq:8};
            if(sql.includes("SELECT payload_json,rev,updated_at,deleted_at FROM items"))return {payload_json:JSON.stringify(current),rev:12,updated_at:now-10000,deleted_at:null};
            if(sql.includes("RETURNING seq"))return {seq:9};
            if(sql.includes("SELECT kind,owner_user_id FROM workspaces"))return {kind:"assistant",owner_user_id:"director"};
            return null;
          },
          async all(){
            if(sql.includes("SELECT workspace_id FROM workspace_members"))return {results:[{workspace_id:"office"}]};
            if(sql.includes("SELECT workspace_id,role FROM workspace_members"))return {results:[{workspace_id:"office",role:"owner"}]};
            if(sql.includes("FROM items WHERE workspace_id=?"))return {results:[
              {id:"active-task",workspace_id:"office",entity_type:"task",payload_json:JSON.stringify({id:"active-task",text:"Activa",deletedAt:null}),updated_at:now,updated_by:"director",deleted_at:null},
              {id:existing.id,workspace_id:"office",entity_type:"task",payload_json:JSON.stringify(existing),updated_at:existing.updatedAt,updated_by:"assistant",deleted_at:deletedAt}
            ]};
            if(sql.includes("FROM workspace_members m JOIN workspaces w"))return {results:[{id:"office",name:"Oficina",kind:"assistant",owner_user_id:"director",role:"owner",status:"active",updated_at:now}]};
            if(sql.includes("SELECT user_id FROM workspace_members"))return {results:[]};
            return {results:[]};
          },
          async run(){seen.push({sql,args});return {meta:{changes:1}}}
        };
      }};
    }
  };
  return {db,seen,deletedAt,now};
}
function request(path,method="GET",body=undefined){
  return new Request("https://example.invalid"+path,{
    method,headers:{"Authorization":"Bearer test-session","Content-Type":"application/json"},
    ...(body?{body:JSON.stringify(body)}:{})
  });
}
test("complete synchronization includes deleted tasks and does not resurrect them",async()=>{
  const f=fixture();
  const response=await worker.fetch(request("/v1/sync?since=8&full=1"),{DB:f.db});
  assert.equal(response.status,200);
  const data=await response.json();
  assert.equal(data.full,true);
  assert.equal(data.changes.length,2);
  const deleted=data.changes.find(x=>x.entityId==="deleted-task");
  assert.equal(deleted.op,"delete");
  assert.equal(deleted.payload.deletedAt,f.deletedAt);
});
test("an explicit deletion is accepted even against a newer stored revision",async()=>{
  const f=fixture(),deleted=f.now-20000;
  const body={changes:[{workspaceId:"office",entityType:"task",entityId:"stale-task",
    payload:{id:"stale-task",text:"Versión antigua",updatedAt:f.now-30000,rev:2,deletedAt:deleted},
    rev:2,updatedAt:f.now-30000,deletedAt:deleted}]};
  const response=await worker.fetch(request("/v1/sync","POST",body),{DB:f.db});
  assert.equal(response.status,200);
  const data=await response.json();
  assert.equal(data.accepted.length,1);
  assert.equal(data.conflicts.length,0);
  assert.equal(data.accepted[0].payload.deletedAt,deleted);
  assert.ok(f.seen.some(x=>x.sql.includes("ON CONFLICT(workspace_id,entity_type,id)")));
});
