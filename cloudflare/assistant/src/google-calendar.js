// Google Calendar OAuth bootstrap. All credentials and refresh tokens stay server-side.
const REDIRECT = "https://nottas-assistant-api.losrobles.workers.dev/v1/google/oauth/callback";
const ACCOUNT_EMAIL = "calendario@losroblesenlinea.com.ve";
const SCOPES = "https://www.googleapis.com/auth/calendar.calendarlist.readonly https://www.googleapis.com/auth/calendar.events.readonly";
const encoder = new TextEncoder();
function send(data, status=200) {
  return new Response(JSON.stringify(data), {status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, content-type","Access-Control-Allow-Methods":"GET,POST,OPTIONS"}});
}
function html(message, success=false) {
  const title=success?"Cuenta conectada":"No se pudo conectar";
  const safe=String(message).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  return new Response(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Nottas · Calendar</title><style>body{font:16px -apple-system,BlinkMacSystemFont,Arial,sans-serif;background:#f5f5f7;color:#1d1d1f;min-height:90vh;display:grid;place-items:center;margin:0;padding:24px}main{max-width:420px;background:white;padding:28px;border-radius:20px}h1{font-size:23px}p{line-height:1.5}</style></head><body><main><h1>${title}</h1><p>${safe}</p><p>Regresa a Nottas.</p></main></body></html>`,{status:success?200:400,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store","Referrer-Policy":"no-referrer","Content-Security-Policy":"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"}});
}
function random(){const bytes=crypto.getRandomValues(new Uint8Array(32));return btoa(String.fromCharCode(...bytes)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}
async function digest(input){return new Uint8Array(await crypto.subtle.digest("SHA-256",encoder.encode(input)))}
function b64url(bytes){return btoa(String.fromCharCode(...bytes)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}
async function cipherKey(env){if(!env.GOOGLE_CALENDAR_CLIENT_SECRET)throw new Error("OAuth secret no configurado");return crypto.subtle.importKey("raw",await digest("nottas:google-calendar-token:v1:"+env.GOOGLE_CALENDAR_CLIENT_SECRET),{name:"AES-GCM"},false,["encrypt","decrypt"])}
async function seal(token,env){const iv=crypto.getRandomValues(new Uint8Array(12));const key=await cipherKey(env);const encrypted=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},key,encoder.encode(token)));return b64url(iv)+"."+b64url(encrypted)}
function unb64(value){const input=value.replace(/-/g,"+").replace(/_/g,"/");const raw=atob(input+"=".repeat((4-input.length%4)%4));return Uint8Array.from(raw,c=>c.charCodeAt(0))}
async function unseal(value,env){const parts=String(value).split(".");if(parts.length!==2)throw new Error("encrypted_token_invalid");const key=await cipherKey(env);const raw=await crypto.subtle.decrypt({name:"AES-GCM",iv:unb64(parts[0])},key,unb64(parts[1]));return new TextDecoder().decode(raw)}
async function owner(workspaceId,auth,env){const x=await env.DB.prepare("SELECT role FROM workspace_members WHERE workspace_id=? AND user_id=? AND status='active'").bind(workspaceId,auth.userId).first();return x?.role==="owner"}
async function member(workspaceId,auth,env){const x=await env.DB.prepare("SELECT 1 AS yes FROM workspace_members WHERE workspace_id=? AND user_id=? AND status='active'").bind(workspaceId,auth.userId).first();return !!x}
function googleConfigured(env){return !!(env.GOOGLE_CALENDAR_CLIENT_ID&&env.GOOGLE_CALENDAR_CLIENT_SECRET)}
async function apiJson(url,token){const response=await fetch(url,{headers:{Authorization:"Bearer "+token}});if(!response.ok)throw new Error("calendar_http_"+response.status);return response.json()}
async function calendarList(token){let page="",data=[];do{const url=new URL("https://www.googleapis.com/calendar/v3/users/me/calendarList");url.searchParams.set("maxResults","250");if(page)url.searchParams.set("pageToken",page);const body=await apiJson(url.toString(),token);data.push(...(body.items||[]));page=body.nextPageToken||"";if(data.length>1500)throw new Error("calendar_list_too_large")}while(page);return data}
async function replaceCalendarList(workspaceId,entries,env){
  for(const item of entries){
    if(!item.id)continue;
    await env.DB.prepare("INSERT INTO google_calendar_sources(workspace_id,calendar_id,summary,background_color,access_role,selected,updated_at) VALUES(?,?,?,?,?,0,?) ON CONFLICT(workspace_id,calendar_id) DO UPDATE SET summary=excluded.summary,background_color=excluded.background_color,access_role=excluded.access_role,updated_at=excluded.updated_at").bind(workspaceId,String(item.id),String(item.summary||item.id).slice(0,250),String(item.backgroundColor||"#4f90e8").slice(0,20),String(item.accessRole||"reader").slice(0,30),Date.now()).run();
  }
}
async function accessToken(connection,env){
  const refresh=await unseal(connection.refresh_cipher,env);
  const response=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:env.GOOGLE_CALENDAR_CLIENT_ID,client_secret:env.GOOGLE_CALENDAR_CLIENT_SECRET,refresh_token:refresh,grant_type:"refresh_token"})});
  if(!response.ok)throw new Error("google_refresh_failed_"+response.status);
  const body=await response.json();
  if(!body.access_token)throw new Error("google_refresh_no_access_token");
  return body.access_token;
}
export async function callback(request,env){
  const url=new URL(request.url),state=url.searchParams.get("state")||"",code=url.searchParams.get("code")||"";
  if(url.searchParams.has("error"))return html("La autorización de Google se canceló.");
  if(!state||!code||state.length>250)return html("Respuesta OAuth incompleta.");
  const hash=b64url(await digest(state));
  const row=await env.DB.prepare("SELECT workspace_id,user_id,code_verifier,expires_at FROM google_calendar_oauth_states WHERE state_hash=?").bind(hash).first();
  if(!row||row.expires_at<Date.now())return html("La autorización expiró o ya se utilizó. Vuelve a iniciar desde Nottas.");
  const consumed=await env.DB.prepare("DELETE FROM google_calendar_oauth_states WHERE state_hash=?").bind(hash).run();
  if(consumed.meta?.changes!==1)return html("La autorización ya se utilizó.");
  try {
    const response=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams({code,client_id:env.GOOGLE_CALENDAR_CLIENT_ID,client_secret:env.GOOGLE_CALENDAR_CLIENT_SECRET,redirect_uri:REDIRECT,code_verifier:row.code_verifier,grant_type:"authorization_code"})});
    if(!response.ok)throw new Error("google_exchange_"+response.status);
    const tokens=await response.json();
    if(!tokens.refresh_token||!tokens.access_token)throw new Error("google_refresh_missing");
    const list=await calendarList(tokens.access_token);
    const primary=list.find(x=>x.primary);
    if(!primary||String(primary.id).toLowerCase()!==ACCOUNT_EMAIL)throw new Error("google_account_mismatch");
    const cipher=await seal(tokens.refresh_token,env);
    await env.DB.prepare("INSERT INTO google_calendar_connections(workspace_id,account_email,refresh_cipher,connected_by,connected_at) VALUES(?,?,?,?,?) ON CONFLICT(workspace_id) DO UPDATE SET account_email=excluded.account_email,refresh_cipher=excluded.refresh_cipher,connected_by=excluded.connected_by,connected_at=excluded.connected_at").bind(row.workspace_id,ACCOUNT_EMAIL,cipher,row.user_id,Date.now()).run();
    await replaceCalendarList(row.workspace_id,list,env);
    return html("Se autorizó "+ACCOUNT_EMAIL+" y se encontraron "+list.length+" calendarios. Puedes volver a Nottas.",true);
  } catch(err) {
    console.error("Google OAuth callback",String(err?.message||err));return html("No se completó la autorización. Comprueba que seleccionaste la cuenta laboral correcta y vuelve a intentarlo.");
  }
}
export async function routes(request,url,auth,env){
  const path=url.pathname;
  const match=path.match(/^\/v1\/workspaces\/([^/]+)\/google(?:\/(connect|calendars|discover))?$/);
  if(!match)return null;
  const workspaceId=decodeURIComponent(match[1]),action=match[2]||"";
  if(!await member(workspaceId,auth,env))return send({error:"workspace_forbidden"},403);
  if(action==="connect"&&request.method==="POST"){
    if(!await owner(workspaceId,auth,env))return send({error:"owner_required"},403);
    if(!googleConfigured(env))return send({error:"google_credentials_missing"},503);
    const state=random(),verifier=random(),challenge=b64url(await digest(verifier));
    await env.DB.prepare("INSERT INTO google_calendar_oauth_states(state_hash,workspace_id,user_id,code_verifier,expires_at) VALUES(?,?,?,?,?)").bind(b64url(await digest(state)),workspaceId,auth.userId,verifier,Date.now()+10*60000).run();
    const target=new URL("https://accounts.google.com/o/oauth2/v2/auth");
    for(const [k,v] of Object.entries({client_id:env.GOOGLE_CALENDAR_CLIENT_ID,redirect_uri:REDIRECT,response_type:"code",scope:SCOPES,state,access_type:"offline",prompt:"select_account consent",login_hint:ACCOUNT_EMAIL,code_challenge:challenge,code_challenge_method:"S256"}))target.searchParams.set(k,v);
    return send({authorizationUrl:target.toString(),expiresInSeconds:600});
  }
  if(!action&&request.method==="GET"){
    const c=await env.DB.prepare("SELECT account_email,connected_at FROM google_calendar_connections WHERE workspace_id=?").bind(workspaceId).first();
    return send({connected:!!c,accountEmail:c?.account_email||null,connectedAt:c?.connected_at||null});
  }
  if(action==="calendars"&&request.method==="GET"){
    const connection=await env.DB.prepare("SELECT account_email,connected_at FROM google_calendar_connections WHERE workspace_id=?").bind(workspaceId).first();
    if(!connection)return send({connected:false,calendars:[]});
    const list=await env.DB.prepare("SELECT calendar_id,summary,background_color,access_role,selected,updated_at FROM google_calendar_sources WHERE workspace_id=? ORDER BY summary").bind(workspaceId).all();
    return send({connected:true,accountEmail:connection.account_email,calendars:(list.results||[]).map(x=>({id:x.calendar_id,name:x.summary,color:x.background_color,accessRole:x.access_role,selected:!!x.selected,lastDiscoveredAt:x.updated_at}))});
  }
  if(action==="discover"&&request.method==="POST"){
    if(!await owner(workspaceId,auth,env))return send({error:"owner_required"},403);
    const connection=await env.DB.prepare("SELECT refresh_cipher FROM google_calendar_connections WHERE workspace_id=?").bind(workspaceId).first();
    if(!connection)return send({error:"google_not_connected"},409);
    try{const token=await accessToken(connection,env),list=await calendarList(token);await replaceCalendarList(workspaceId,list,env);return send({ok:true,calendarCount:list.length})}
    catch(error){console.error("Google Calendar discover",String(error?.message||error));return send({error:"calendar_discovery_failed"},502)}
  }
  return send({error:"not_found"},404);
}
