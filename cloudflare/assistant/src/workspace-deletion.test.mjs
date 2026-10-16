import { test } from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import worker from "./index.js";

globalThis.crypto ??= webcrypto;

function mock({ kind="assistant", owner="boss", role="owner" } = {}) {
  const statements=[];
  const DB={
    prepare(sql){
      return {bind(...args){
        return {
          async first(){
            if(sql.includes("FROM sessions s JOIN users"))return {user_id:"boss",device_id:"boss-device",display_name:"Jefe"};
            if(sql.includes("SELECT id,name,kind,owner_user_id FROM workspaces"))return {id:"testspace",name:"Asistente",kind,owner_user_id:owner};
            if(sql.includes("SELECT role,status FROM workspace_members"))return role?{role,status:"active"}:null;
            if(sql.includes("SELECT COUNT(*) AS n"))return {n:sql.includes("google_calendar_connections")?1:3};
            return null;
          },
          async all(){return {results:[]}},
          async run(){statements.push({sql,args});return {meta:{changes:1}}}
        };
      }};
    }
  };
  return {env:{DB},statements, workspaceDeletes(){return statements.filter(x=>x.sql.startsWith("DELETE FROM workspaces"))}};
}
function endpoint(method,body,path="/v1/workspaces/testspace"){
  return new Request("https://example.invalid"+path,{
    method,headers:{Authorization:"Bearer mocked-session", "Content-Type":"application/json"},
    body:body===undefined?undefined:JSON.stringify(body)
  });
}
const correct = {workspaceId:"testspace",workspaceName:"Asistente",confirmation:"ELIMINAR",backupAcknowledged:true};

test("workspace deletion preview is scoped to selected owner workspace",async()=>{
  const m=mock();
  const r=await worker.fetch(endpoint("GET",undefined,"/v1/workspaces/testspace/deletion-preview"),m.env);
  assert.equal(r.status,200);
  const body=await r.json();
  assert.equal(body.workspaceId,"testspace");
  assert.equal(body.googleConnected,true);
  assert.equal(body.contentCount,3);
  assert.equal(m.workspaceDeletes().length,0);
});
test("deleting a personal workspace is forbidden",async()=>{
  const m=mock({kind:"personal"});
  const r=await worker.fetch(endpoint("DELETE",correct),m.env);
  assert.equal(r.status,403);
  assert.equal((await r.json()).error,"personal_workspace_protected");
  assert.equal(m.workspaceDeletes().length,0);
});
test("assistant or non-owner cannot delete",async()=>{
  for(const opts of [{role:"assistant"},{owner:"another-user"},{role:null}]){
    const m=mock(opts);
    const r=await worker.fetch(endpoint("DELETE",correct),m.env);
    assert.equal(r.status,403);
    assert.equal((await r.json()).error,"owner_required");
    assert.equal(m.workspaceDeletes().length,0);
  }
});
test("deletion refuses mismatched name, ID or backup acknowledgement",async()=>{
  for(const bad of [
    {...correct,workspaceName:"Oficina"},
    {...correct,workspaceId:"different"},
    {...correct,confirmation:"eliminar"},
    {...correct,backupAcknowledged:false},
    {...correct,backupAcknowledged:null}
  ]){
    const m=mock();
    const r=await worker.fetch(endpoint("DELETE",bad),m.env);
    assert.equal(r.status,400);
    assert.equal((await r.json()).error,"workspace_deletion_confirmation_required");
    assert.equal(m.workspaceDeletes().length,0);
  }
});
test("a verified owner can delete exactly one requested assistant workspace",async()=>{
  const m=mock();
  const r=await worker.fetch(endpoint("DELETE",correct),m.env);
  assert.equal(r.status,200);
  assert.deepEqual(await r.json(),{ok:true,deletedWorkspaceId:"testspace"});
  assert.equal(m.workspaceDeletes().length,1);
  assert.match(m.workspaceDeletes()[0].sql,/^DELETE FROM workspaces WHERE id=\?/);
  assert.deepEqual(m.workspaceDeletes()[0].args,["testspace","boss"]);
});
