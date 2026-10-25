'use strict';
(() => {
 const WEB='https://bibliotecariberadenuble.github.io/ribera-conecta-web/';
 const APK='downloads/Ribera_Conecta_1.1.0.apk';
 const SHARE='https://wa.me/?text='+encodeURIComponent('La Ribera de Ñuble Conecta: revisa las actividades y comunicaciones escolares. Accede o descarga la aplicación Android aquí: '+WEB);
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const option=(value,label)=>`<option value="${esc(value)}">${esc(label)}</option>`;
 let context={},status=null,revision=0;
 const teacher=()=>['admin','jefe','asignatura'].includes(context.user?.role);
 const canManage=()=>teacher()&&status?.can_manage===true&&Number(status.course_id)===Number(context.course);
 const current=(rev,cid,uid)=>revision===rev&&Number(context.course)===cid&&context.user?.id===uid&&canManage();
 const endpoint=(cid,action)=>'/courses/'+cid+'/'+action;
 function draw(){
  const panel=document.getElementById('quickActions');if(!panel)return;
  const selected=context.courses?.find(c=>Number(c.id)===Number(context.course));
  panel.innerHTML=`<section class="card quick-card"><h2>Accesos rápidos</h2>
   <a class="quick-button" href="${new URL(APK,document.baseURI).href}" download="Ribera_Conecta_1.1.0.apk">Instalar en celular</a>
   <p class="quick-help">APK de prueba para Android 6 o superior. Abre el archivo descargado en tu teléfono para instalarlo. En el computador puedes guardar el APK para transferirlo al celular y usar esta web.</p>
   <a class="quick-button outline" href="${SHARE}" target="_blank" rel="noopener noreferrer">Compartir por WhatsApp</a>
   <p class="quick-help">Comparte solo el enlace público. Tú eliges a quién enviarlo.</p>
   <h3>Mi curso</h3><p class="quick-course">${esc(selected?.name||'Sin curso seleccionado')}</p>
   ${teacher()&&selected?`<p id="quickHeadStatus" class="quick-help">${status?status.head?'Profesor jefe: '+esc(status.head.name):'Este curso no tiene profesor jefe designado.':'Revisando la jefatura del curso…'}</p>${status?.can_claim_head?'<button type="button" class="outline" id="quickClaimHead">Seleccionarme como profesor jefe</button>':''}`:''}
   <button type="button" id="quickGuardian" ${canManage()?'':'disabled'}>Agregar apoderados al curso</button>
   <button type="button" id="quickTeacher" class="outline" ${canManage()?'':'disabled'}>Designar profesor de asignatura</button>
   <p class="quick-help">${canManage()?'Estas acciones se guardan en el curso que está seleccionado.':context.user?.role==='utp'?'Tu perfil UTP permite consultar evaluaciones y administrar tus propios avisos.':teacher()?'La gestión se habilita para el profesor jefe del curso y administración.':'Inicia sesión con una cuenta docente autorizada para gestionar tu curso.'}</p>
   ${canManage()?'<button type="button" class="outline" data-open-tab="ingresos">Inscripción automática y retiro de apoderados</button>':''}<div id="quickFormArea" aria-live="polite"></div></section>`;
  panel.querySelector('#quickGuardian').onclick=()=>open('guardian');
  panel.querySelector('#quickTeacher').onclick=()=>open('teacher');
  const claim=panel.querySelector('#quickClaimHead');if(claim)claim.onclick=async()=>{
   const cid=Number(context.course),uid=context.user.id,rev=revision;
   if(!window.confirm('¿Confirmas que serás el profesor jefe de '+selected.name+'?'))return;
   claim.disabled=true;
   try{await context.api(endpoint(cid,'head-teacher'),'POST',{});if(revision===rev&&context.user?.id===uid&&Number(context.course)===cid)await render(context);}
   catch(error){if(revision===rev){panel.querySelector('#quickFormArea').textContent=error.message;claim.disabled=false;}}
  };
 }
 async function render(next={}){
  context=next;status=null;const rev=++revision,cid=Number(context.course),uid=context.user?.id;draw();
  if(!teacher()||!cid||!context.api)return;
  try{const found=await context.api(endpoint(cid,'management'));if(revision===rev&&context.user?.id===uid&&Number(context.course)===cid){status=found;draw();}}
  catch(error){if(revision===rev){const element=document.getElementById('quickHeadStatus');if(element)element.textContent='No se pudieron revisar los permisos: '+error.message;}}
 }
 async function open(kind){
  if(!canManage())return;
  const rev=++revision,cid=Number(context.course),uid=context.user.id,area=document.getElementById('quickFormArea');
  area.innerHTML='<p role="status">Cargando opciones del curso…</p>';
  try{
   const data=await context.api(endpoint(cid,'options'));if(!current(rev,cid,uid))return;
   const people=data.people.filter(u=>u.active&&(kind==='guardian'?['titular','suplente'].includes(u.role):['asignatura','jefe','admin'].includes(u.role)));
   const enrolled=data.students.filter(s=>Number(s.course_id)===cid),courseName=context.courses.find(c=>Number(c.id)===cid)?.name||'';
   const ready=kind==='teacher'||enrolled.length>0;
   area.innerHTML=`<h3>${kind==='guardian'?'Agregar apoderado':'Agregar profesor'} en ${esc(courseName)}</h3>
    ${kind==='guardian'?'<p class="quick-help">Vincula al apoderado con un estudiante de este curso. La misma cuenta sirve para otros hijos.</p>':''}
    ${!ready?'<p>Primero registra un estudiante en este curso.</p>':''}
    ${ready?`<form id="quickAssignmentForm">
     ${kind==='guardian'?`<label for="quickStudent">Estudiante del curso</label><select id="quickStudent" name="student_id" required>${option('','Selecciona un estudiante')+enrolled.map(s=>option(s.id,s.alias)).join('')}</select>`:''}
     <label for="quickMode">Cuenta</label><select id="quickMode" name="mode"><option value="existing" ${!people.length?'disabled':''}>Usar cuenta existente</option><option value="new" ${!people.length?'selected':''}>Crear cuenta nueva</option></select>
     <div id="quickExisting"><label for="quickPerson">${kind==='guardian'?'Apoderado':'Docente'}</label><select id="quickPerson" name="user_id">${option('','Selecciona una cuenta')+people.map(u=>option(u.id,u.name)).join('')}</select></div>
     <div id="quickNew"><label for="quickName">Nombre</label><input id="quickName" name="name" maxlength="100" autocomplete="off"><label for="quickEmail">Correo de la nueva cuenta</label><input id="quickEmail" name="email" type="email" maxlength="180" autocomplete="off"><label for="quickPassword">Clave provisional de al menos 12 caracteres</label><input id="quickPassword" name="password" type="password" minlength="12" maxlength="200" autocomplete="new-password"><p class="quick-help">Entrega la clave de forma privada. La persona puede cambiarla en Mi cuenta.</p></div>
     ${kind==='guardian'?'<label for="quickKind">Responsabilidad</label><select id="quickKind" name="kind"><option value="titular">Titular</option><option value="suplente">Suplente</option></select>':'<label for="quickSubject">Asignatura</label><input id="quickSubject" name="subject" required maxlength="80" placeholder="Ejemplo: Historia">'}
     <button type="submit">${kind==='guardian'?'Guardar apoderado':'Guardar profesor y asignatura'}</button></form>`:''}
    ${kind==='guardian'?'<button type="button" class="outline" id="quickCreateStudent">Registrar estudiante de este curso</button><div id="quickStudentArea"></div>':''}
    <p id="quickResult" role="status"></p>`;
   const createStudent=area.querySelector('#quickCreateStudent');if(createStudent)createStudent.onclick=()=>{
    area.querySelector('#quickStudentArea').innerHTML='<form id="quickStudentForm"><label for="quickStudentAlias">Nombre o identificador del estudiante</label><input id="quickStudentAlias" name="alias" maxlength="100" required><button type="submit">Guardar estudiante en este curso</button><p role="status" id="quickStudentResult"></p></form>';
    const form=area.querySelector('#quickStudentForm');form.onsubmit=async event=>{
     event.preventDefault();if(!current(rev,cid,uid))return;
     const button=form.querySelector('button');button.disabled=true;
     try{await context.api(endpoint(cid,'students'),'POST',{alias:form.elements.alias.value.trim()});if(current(rev,cid,uid))await open(kind);}
     catch(error){if(current(rev,cid,uid)){area.querySelector('#quickStudentResult').textContent=error.message;button.disabled=false;}}
    };
   };
   const form=area.querySelector('#quickAssignmentForm');if(!form)return;
   const mode=()=>{
    const isNew=form.elements.mode.value==='new';
    for(const [selector,active] of [['#quickNew',isNew],['#quickExisting',!isNew]]){
     const section=form.querySelector(selector);section.hidden=!active;section.querySelectorAll('input,select').forEach(input=>{input.disabled=!active;input.required=active});
    }
   };form.elements.mode.onchange=mode;mode();
   form.onsubmit=async event=>{
    event.preventDefault();if(!current(rev,cid,uid))return;
    const values=Object.fromEntries(new FormData(form).entries()),isNew=values.mode==='new',personId=Number(values.user_id),studentId=Number(values.student_id),result=area.querySelector('#quickResult'),button=form.querySelector('[type="submit"]');
    if((!isNew&&!people.some(p=>Number(p.id)===personId))||(kind==='guardian'&&!enrolled.some(s=>Number(s.id)===studentId))){result.textContent='Selecciona una cuenta y un estudiante válidos para el curso.';return;}
    let payload=kind==='guardian'?{student_id:studentId,kind:values.kind}:{subject:String(values.subject||'').trim()};
    if(kind==='teacher'&&!payload.subject){result.textContent='Escribe la asignatura.';return;}
    if(isNew)payload={...payload,person_kind:kind,name:values.name,email:values.email,password:values.password};else payload.user_id=personId;
    button.disabled=true;result.textContent='Guardando…';
    try{await context.api(endpoint(cid,isNew?'people':kind==='guardian'?'guardians':'teachers'),'POST',payload);if(current(rev,cid,uid)){result.textContent=(kind==='guardian'?'Apoderado vinculado':'Profesor asignado')+' correctamente a '+courseName+'.';form.reset();mode();}}
    catch(error){if(current(rev,cid,uid))result.textContent=error.message||'No se pudo guardar.';}
    finally{if(current(rev,cid,uid))button.disabled=false;}
   };
  }catch(error){if(current(rev,cid,uid))area.textContent='No se pudieron cargar las opciones: '+error.message;}
 }
 window.riberaQuickActions={render};render();
})();
