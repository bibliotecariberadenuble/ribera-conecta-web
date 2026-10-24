// Capacitor registra los plugins nativos en window.Capacitor.Plugins.
// En un navegador común no hay puente nativo y este módulo no hace nada.
(() => {
 let lastToken=null,initialized=false;
 function plugin(){return window.Capacitor?.isNativePlatform?.() ? window.Capacitor?.Plugins?.PushNotifications : null}
 async function unregister(){if(lastToken&&window.riberaApi){await window.riberaApi('/push/native/unregister','POST',{token:lastToken}).catch(()=>{});lastToken=null}}
 window.riberaNativePush={
  async enable(){const p=plugin();if(!p)throw Error('Disponible únicamente en la aplicación Android');
   if(initialized){if(lastToken)await window.riberaApi('/push/native/register','POST',{token:lastToken});return;}
   const cfg=await window.riberaApi('/push/native/config');if(!cfg.enabled)throw Error('El servidor aún no tiene Firebase configurado');
   const status=await p.checkPermissions();const result=status.receive==='granted'?status:await p.requestPermissions();if(result.receive!=='granted')throw Error('Permiso de notificaciones denegado');
   await p.addListener('registration',async t=>{lastToken=t.value;try{await window.riberaApi('/push/native/register','POST',{token:lastToken})}catch(e){console.warn('Registro push nativo fallido:',e.message)}});
   await p.addListener('registrationError',e=>console.warn('Error de registro nativo',e));
   await p.addListener('pushNotificationActionPerformed',()=>{window.location.hash='#avisos'});
   initialized=true;await p.register();
  },unregister
 };
})();
