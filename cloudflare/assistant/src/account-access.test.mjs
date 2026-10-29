import { test } from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import worker from "./index.js";

globalThis.crypto ??= webcrypto;

async function digest(value) {
  const raw = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(raw)].map(v => v.toString(16).padStart(2,"0")).join("");
}

function fixture() {
  const rows=new Map(), actions=[];
  const env={
    DB:{
      prepare(sql){
        return {
          bind(...args){
            return {
              async first(){
                if(sql.includes("FROM sessions s JOIN users")){
                  const s=rows.get(args[0]);
                  return s && !["nottas-link","nottas-recovery"].includes(s.device_id)
                    ?{user_id:s.user_id,device_id:s.device_id,display_name:"Director"}:null;
                }
                if(sql.startsWith("DELETE FROM sessions WHERE token_hash")){
                  const row=rows.get(args[0]);
                  if(!row || !(row.device_id==="nottas-recovery" ||
                    (row.device_id==="nottas-link" && row.created_at>args[1])))return null;
                  rows.delete(args[0]);return {user_id:row.user_id,device_id:row.device_id};
                }
                if(sql.startsWith("SELECT id,display_name FROM users"))return {id:"boss",display_name:"Director"};
                if(sql.includes("SELECT role,status FROM workspace_members")){
                  if(args[1]==="boss")return {role:"owner",status:"active"};
                  if(args[1]==="staff")return {role:"assistant",status:"active"};
                  return null;
                }
                if(sql.includes("SELECT id,kind,name,owner_user_id FROM workspaces"))return {
                  id:"office",kind:"assistant",name:"Oficina",owner_user_id:"boss"
                };
                return null;
              },
              async all(){
                if(sql.includes("FROM workspace_members m JOIN workspaces w"))return {results:[
                  {id:"personal",name:"Personal",kind:"personal",owner_user_id:"boss",invite_code:null,updated_at:1,role:"owner",status:"active"},
                  {id:"office",name:"Oficina",kind:"assistant",owner_user_id:"boss",invite_code:"ABCD1234",updated_at:1,role:"owner",status:"active"}
                ]};
                return {results:[]};
              },
              async run(){
                actions.push({sql,args});
                if(sql.startsWith("INSERT INTO sessions")){
                  rows.set(args[0],{user_id:args[1],device_id:args[2],created_at:args[3]});
                }
                if(sql.startsWith("DELETE FROM sessions WHERE user_id")){
                  for(const [key,v] of rows)if(v.user_id===args[0]&&v.device_id===(sql.includes("'nottas-recovery'")?"nottas-recovery":"nottas-link"))rows.delete(key);
                }
                return {meta:{changes:1}};
              }
            };
          }
        };
      },
      async batch(statements){return Promise.all(statements.map(s=>s.run()))}
    }
  };
  return {env,rows,actions};
}
function request(path,body,token){
  return new Request("https://example.invalid"+path,{
    method:"POST",
    headers:{"Content-Type":"application/json",...(token?{Authorization:"Bearer "+token}:{})},
    body:JSON.stringify(body)
  });
}
test("account key is random and never usable as an API bearer session",async()=>{
  const m=fixture();
  const owner="owner-existing-session";
  m.rows.set(await digest(owner),{user_id:"boss",device_id:"android-owner",created_at:Date.now()});
  const issue=await worker.fetch(request("/v1/auth/issue-key",{kind:"link"},owner),m.env);
  assert.equal(issue.status,200);
  const {key,expiresAt}=await issue.json();
  assert.match(key,/^[A-Za-z0-9_-]{43}$/);
  assert.ok(expiresAt>Date.now());
  const unauthorized=await worker.fetch(request("/v1/auth/issue-key",{kind:"link"},key),m.env);
  assert.equal(unauthorized.status,401);
  const redeem=await worker.fetch(request("/v1/auth/redeem",{key,deviceId:"android-new",deviceLabel:"Android"}),m.env);
  assert.equal(redeem.status,200);
  const signedIn=await redeem.json();
  assert.equal(signedIn.user.id,"boss");
  assert.equal(signedIn.workspaces.find(w=>w.id==="office").role,"owner");
  assert.ok(signedIn.sessionToken);
  const reused=await worker.fetch(request("/v1/auth/redeem",{key,deviceId:"android-third"}),m.env);
  assert.equal(reused.status,403);
});

test("recovery credential is one-use, can restore without another device, and is not a bearer token",async()=>{
  const m=fixture();
  const owner="session";
  m.rows.set(await digest(owner),{user_id:"boss",device_id:"android-owner",created_at:Date.now()});
  const res=await worker.fetch(request("/v1/auth/issue-key",{kind:"recovery"},owner),m.env);
  assert.equal(res.status,200);
  const {key}=await res.json();
  const invalid=await worker.fetch(request("/v1/auth/issue-key",{kind:"link"},key),m.env);
  assert.equal(invalid.status,401);
  const ok=await worker.fetch(request("/v1/auth/redeem",{key,deviceId:"android-new"}),m.env);
  assert.equal(ok.status,200);
  const again=await worker.fetch(request("/v1/auth/redeem",{key,deviceId:"android-new2"}),m.env);
  assert.equal(again.status,403);
});

test("ordinary invitation cannot grant director role; explicit owner confirmation is required",async()=>{
  const m=fixture();
  const owner="session";
  m.rows.set(await digest(owner),{user_id:"boss",device_id:"android-owner",created_at:Date.now()});
  const noOwner=await worker.fetch(request("/v1/workspaces/office/assign-director",{toUserId:"staff"}),m.env);
  assert.equal(noOwner.status,401);
  const unknown=await worker.fetch(request("/v1/workspaces/office/assign-director",{toUserId:"unknown"},owner),m.env);
  assert.equal(unknown.status,400);
  const confirm=await worker.fetch(request("/v1/workspaces/office/assign-director",{toUserId:"staff"},owner),m.env);
  assert.equal(confirm.status,200);
  assert.equal((await confirm.json()).directorUserId,"staff");
  assert.equal(m.actions.filter(x=>x.sql.startsWith("UPDATE workspace_members SET role")).length,2);
  assert.ok(m.actions.some(x=>x.sql.includes("UPDATE workspaces SET owner_user_id")));
});
