import { test } from "node:test";
import assert from "node:assert/strict";
import { webcrypto, generateKeyPairSync } from "node:crypto";
import worker from "./index.js";
globalThis.crypto ??= webcrypto;
const {privateKey}=generateKeyPairSync("rsa",{modulusLength:2048});
const creds=JSON.stringify({
 project_id:"mock-project",
 client_email:"service@example.invalid",
 private_key:privateKey.export({type:"pkcs8",format:"pem"}).toString()
});
function fixture({tokenStatus=200,previous=null}={}){
 const writes=[],requests=[];
 const env={FCM_SERVICE_ACCOUNT_JSON:creds,DB:{prepare(sql){
   return {
     async first(){return null;},
     bind(...params){return{
       async first(){
         if(sql.includes("FROM sessions s JOIN users"))return {user_id:"director",device_id:"director-phone",display_name:"Director"};
         if(sql.includes("SELECT fcm_token,user_id FROM devices WHERE id"))return previous;
         return null;
       },
       async all(){
         if(sql.includes("SELECT workspace_id FROM workspace_members"))return {results:[{workspace_id:"office"}]};
         return {results:[]};
       },
       async run(){writes.push({sql,params});return {meta:{changes:1}}}
     }}
   }
 }}};
 const previousFetch=globalThis.fetch;
 globalThis.fetch=async (url,options={})=>{
   requests.push({url:String(url),body:String(options.body||"")});
   if(String(url).includes("oauth2.googleapis.com/token"))
     return new Response(JSON.stringify({access_token:"fake-access",expires_in:3600}),{status:200});
   if(String(url).includes("fcm.googleapis.com")){
     return new Response(JSON.stringify(tokenStatus===404?{error:{details:[{errorCode:"UNREGISTERED"}]}}:{ok:true}),{status:tokenStatus});
   }
   throw new Error("Unexpected fetch "+url);
 };
 const post=new Request("https://example.invalid/v1/devices/push-token",{
   method:"POST",
   headers:{Authorization:"Bearer session","Content-Type":"application/json"},
   body:JSON.stringify({fcmToken:"test-director-fcm",deviceLabel:"Director Android"})
 });
 return {env,post,requests,writes,restore(){globalThis.fetch=previousFetch}};
}
test("registration probes FCM, then makes director available for BOTH directions",async()=>{
 const f=fixture();
 try{
   const response=await worker.fetch(f.post,f.env);
   assert.equal(response.status,200);
   const body=await response.json();
   assert.equal(body.verified,true);
   assert.equal(body.recovered,true);
   assert.ok(f.requests.some(x=>x.url.includes("fcm.googleapis.com")&&
      JSON.parse(x.body).message.data.type==="push_registration_probe"));
   assert.ok(f.requests.some(x=>x.url.includes("fcm.googleapis.com")&&
      JSON.parse(x.body).message.data.type==="sync"));
   assert.ok(f.writes.some(x=>x.sql.includes("INSERT INTO devices")));
 }finally{f.restore()}
});
test("definitively expired Firebase tokens are NEVER accepted as registered",async()=>{
 const f=fixture({tokenStatus:404,previous:{fcm_token:"test-director-fcm",user_id:"director"}});
 try{
   const response=await worker.fetch(f.post,f.env);
   assert.equal(response.status,409);
   assert.equal((await response.json()).error,"firebase_token_expired");
   assert.ok(f.writes.some(x=>x.sql.includes("UPDATE devices SET fcm_token=NULL")));
   assert.equal(f.writes.some(x=>x.sql.includes("INSERT INTO devices")),false);
 }finally{f.restore()}
});
test("FCM server faults do not incorrectly delete locally valid tokens",async()=>{
 const f=fixture({tokenStatus:401,previous:{fcm_token:"test-director-fcm",user_id:"director"}});
 try{
   const response=await worker.fetch(f.post,f.env);
   assert.equal(response.status,503);
   assert.equal((await response.json()).error,"firebase_delivery_unavailable");
   assert.equal(f.writes.some(x=>x.sql.includes("UPDATE devices SET fcm_token=NULL")),false);
 }finally{f.restore()}
});
test("existing verified token does not replay notifications on every foreground event",async()=>{
 const f=fixture({previous:{fcm_token:"test-director-fcm",user_id:"director"}});
 try{
   const response=await worker.fetch(f.post,f.env);
   assert.equal(response.status,200);
   assert.equal((await response.json()).recovered,false);
   assert.equal(f.requests.filter(x=>x.url.includes("fcm.googleapis.com")).length,1);
 }finally{f.restore()}
});
