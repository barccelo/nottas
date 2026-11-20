/* Nottas local-first in-app updater. Checks latest GitHub Release once at launch,
   only downloads on a tap and never changes the sync or app data model. */
(() => {
  'use strict';
  const bridge=window.NottasNative;
  if(!bridge || typeof bridge.appVersion!=='function' ||
     typeof bridge.downloadUpdate!=='function')return;
  const API='https://api.github.com/repos/barccelo/nottas/releases/latest';
  const PREFIX='https://github.com/barccelo/nottas/releases/download/';
  const $=id=>document.getElementById(id);
  let lastAsset=null,checking=false,pollTimer=null;
  const compare=(a,b)=>{
    const parse=s=>/^v?(\d+)\.(\d+)\.(\d+)$/.exec(String(s||''))?.slice(1).map(Number);
    const x=parse(a),y=parse(b);if(!x||!y)return 0;
    for(let i=0;i<3;i++)if(x[i]!==y[i])return x[i]>y[i]?1:-1;
    return 0;
  };
  const verifiedAsset=release=>{
    const tag=String(release?.tag_name||'');
    if(!/^v\d+\.\d+\.\d+$/.test(tag)||release.draft||release.prerelease)return null;
    const filename='Nottas-'+tag+'.apk';
    const url=PREFIX+tag+'/'+filename;
    if(!Array.isArray(release.assets)||!release.assets.some(a=>
      a.name===filename&&a.state==='uploaded'&&a.browser_download_url===url))return null;
    return {tag,url};
  };
  function clearPoll(){if(pollTimer){clearTimeout(pollTimer);pollTimer=null}}
  function dismiss(){clearPoll();$('nottasUpdateNotice')?.remove()}
  function notice(title,description){
    dismiss();
    const root=document.createElement('section');root.id='nottasUpdateNotice';
    root.className='nottas-update-notice';root.setAttribute('role','status');
    const head=document.createElement('div');head.className='nottas-update-head';
    const h=document.createElement('strong');h.textContent=title;
    const close=document.createElement('button');close.type='button';close.textContent='×';
    close.className='nottas-update-close';close.setAttribute('aria-label','Cerrar');
    close.addEventListener('click',dismiss);head.append(h,close);
    const p=document.createElement('p');p.textContent=description;
    const actions=document.createElement('div');actions.className='nottas-update-actions';
    root.append(head,p,actions);document.body.append(root);
    return {root,p,actions};
  }
  function action(box,label,callback,primary=false){
    const b=document.createElement('button');b.type='button';b.textContent=label;
    if(primary)b.className='primary';
    b.addEventListener('click',callback);box.append(b);return b;
  }
  function offer(asset){
    const ui=notice('Actualización de Nottas '+asset.tag,
      'Hay una versión nueva. Puedes descargarla ahora e instalarla cuando quieras.');
    action(ui.actions,'Más tarde',dismiss);
    const download=action(ui.actions,'Descargar actualización',()=>{
      try{
        if(!bridge.downloadUpdate(asset.url,asset.tag))throw Error('download failed');
        download.disabled=true;download.textContent='Descargando…';
        ui.p.textContent='Android está descargando la APK firmada. Tu información permanece en Nottas.';
        watch(ui,asset,download);
      }catch(_){download.disabled=false;ui.p.textContent='No se pudo iniciar la descarga. Revisa tu conexión.'}
    },true);
    try{
      if(bridge.getDownloadedUpdateVersion()===asset.tag){
        const status=Number(bridge.getUpdateDownloadStatus());
        if(status===8)showInstall(ui,download);
        else if(status===1||status===2||status===4){
          download.disabled=true;download.textContent='Descargando…';watch(ui,asset,download);
        }
      }
    }catch(_){}
  }
  function showInstall(ui,button){
    clearPoll();button.disabled=true;button.textContent='Descargado';
    ui.p.textContent='La APK está lista. Android solicitará tu confirmación antes de instalarla.';
    if(ui.actions.querySelector('.install'))return;
    const install=action(ui.actions,'Instalar',()=>{
      try{
        bridge.installDownloadedUpdate();
        ui.p.textContent='Confirma la instalación en Android. Si solicita permiso para instalar desde Nottas, concédelo y vuelve a tocar Instalar.';
      }catch(_){ui.p.textContent='No se pudo abrir el instalador de Android.'}
    },true);
    install.classList.add('install');
  }
  function watch(ui,asset,button){
    clearPoll();
    const tick=()=>{
      if(!ui.root.isConnected)return;
      let status=0;
      try{status=Number(bridge.getUpdateDownloadStatus())}catch(_){}
      if(status===8){showInstall(ui,button);return}
      if(status===16||status===0){
        button.disabled=false;button.textContent='Reintentar descarga';
        ui.p.textContent='La descarga no terminó. Comprueba tu conexión e inténtalo de nuevo.';
        return;
      }
      pollTimer=setTimeout(tick,1500); // Only while an actual download is active.
    };
    pollTimer=setTimeout(tick,900);
  }
  async function check(manual=false){
    if(checking)return;
    checking=true;
    const ctl=new AbortController(),timeout=setTimeout(()=>ctl.abort(),9000);
    const settings=$('nottasCheckUpdatesBtn');
    if(settings){settings.disabled=true;settings.querySelector('small').textContent='Comprobando…'}
    try{
      const response=await fetch(API,{cache:'no-store',
        headers:{Accept:'application/vnd.github+json'},signal:ctl.signal});
      if(!response.ok)throw Error('github release lookup failed');
      const asset=verifiedAsset(await response.json());
      if(!asset)throw Error('no trusted release asset');
      lastAsset=asset;
      const newer=compare(asset.tag,bridge.appVersion())>0;
      if(settings)settings.querySelector('small').textContent=newer?'Versión '+asset.tag+' disponible':'Tienes la versión más reciente';
      if(newer)offer(asset);
      else if(manual){const ui=notice('Nottas está actualizado',
        'No hay una versión más reciente disponible en GitHub Releases.');
        action(ui.actions,'Cerrar',dismiss,true);}
    }catch(_){
      if(settings)settings.querySelector('small').textContent='No se pudo comprobar la actualización';
      if(manual){const ui=notice('Sin conexión con GitHub',
        'Nottas sigue funcionando. Puedes volver a comprobar las actualizaciones cuando tengas internet.');
        action(ui.actions,'Cerrar',dismiss,true);}
    }finally{
      clearTimeout(timeout);checking=false;if(settings)settings.disabled=false;
    }
  }
  $('nottasCheckUpdatesBtn')?.addEventListener('click',()=>check(true));
  check(false); // One check when opening; never a background version poll.
})();
