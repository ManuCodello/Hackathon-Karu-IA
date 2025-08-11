// Helpers
const qs = (s, ctx=document) => ctx.querySelector(s);
const qsa = (s, ctx=document) => [...ctx.querySelectorAll(s)];
const toastContainer = () => qs('#toast-container');
function showToast(message, type='info', timeout=2800){
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.setAttribute('role','status');
  el.setAttribute('aria-live','polite');
  el.textContent = message;
  toastContainer()?.appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; el.style.transform='translateY(-6px)'; setTimeout(()=>el.remove(), 200); }, timeout);
}

// Modal de confirmación estilizado
function customConfirm(message){
  return new Promise(resolve => {
    const overlay = qs('#modal-overlay');
    const msg = qs('#modal-message');
    const ok = qs('#modal-ok');
    const cancel = qs('#modal-cancel');
    if(!overlay || !msg || !ok || !cancel){
      // Fallback si no existe el modal
      return resolve(window.confirm(message));
    }

    const onOk = () => { cleanup(); resolve(true); };
    const onCancel = () => { cleanup(); resolve(false); };
    const onKey = (e) => {
      if(e.key === 'Escape'){ e.preventDefault(); onCancel(); }
      if(e.key === 'Enter'){ e.preventDefault(); onOk(); }
    };

    const onOverlayClick = (e) => { if(e.target === overlay){ onCancel(); } };
    const cleanup = () => {
      ok.removeEventListener('click', onOk);
      cancel.removeEventListener('click', onCancel);
      document.removeEventListener('keydown', onKey);
      overlay.removeEventListener('mousedown', onOverlayClick);
      overlay.classList.add('hidden');
    };

    msg.textContent = message;
    overlay.classList.remove('hidden');
    ok.focus();
    ok.addEventListener('click', onOk);
    cancel.addEventListener('click', onCancel);
    document.addEventListener('keydown', onKey);
    overlay.addEventListener('mousedown', onOverlayClick);
  });
}

// Views
function hideAllViews(){ qsa('.vista').forEach(v=>{ v.classList.remove('animate-fadeIn'); v.classList.add('hidden'); }); }
function showView(id){ qs('#vista-menu')?.classList.add('hidden'); qs('#logo-karu')?.classList.add('hidden'); hideAllViews(); const v = qs(`#${id}`); if(v){ v.classList.remove('hidden'); v.classList.add('animate-fadeIn'); window.scrollTo({top:0,behavior:'smooth'});} }
function backHome(){ qs('#vista-menu')?.classList.remove('hidden'); qs('#logo-karu')?.classList.remove('hidden'); hideAllViews(); window.scrollTo({top:0,behavior:'smooth'});} 

// Ingredientes UI
function addIngredienteRow(){
  const cont = qs('#contenedor-ingredientes');
  const row = document.createElement('div');
  row.className = 'bg-white/90 p-4 rounded-lg shadow flex flex-col md:flex-row md:items-end gap-4';
  row.innerHTML = `
    <input type="text" name="ingrediente[]" placeholder="Ingrediente" required class="w-full md:w-1/6 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-lime-500">
    <input type="number" name="cantidad[]" placeholder="Cantidad" min="0" required class="w-full md:w-1/6 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-lime-500">
    <select name="unidad[]" required class="w-full md:w-1/6 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-lime-500">
      <option value="" disabled selected>Medida</option>
      <option value="gr">gr</option><option value="ml">ml</option><option value="kg">kg</option><option value="unidad">unidad</option>
    </select>
    <select name="tipo[]" required class="w-full md:w-1/6 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-lime-500">
      <option value="natural">Natural</option><option value="envasado">Envasado</option>
    </select>
    <select name="guardado[]" required class="w-full md:w-1/6 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-lime-500">
      <option value="" disabled selected>Guardado</option>
      <option value="heladera">Heladera</option><option value="freezer">Freezer</option><option value="ambiente">Ambiente</option>
    </select>
    <input type="date" name="vencimiento[]" disabled class="w-full md:w-1/6 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-lime-500">
    <button type="button" class="text-red-600 hover:font-bold hover:text-red-800 transition btn-eliminar">Eliminar</button>
  `;
  cont.appendChild(row);
  qs('#btn-enviar-ingredientes')?.classList.remove('hidden');
}

function onIngredienteChange(e){
  if(e.target.name === 'tipo[]'){
    const fecha = e.target.parentElement.querySelector('input[type="date"]');
    if(fecha) fecha.disabled = (e.target.value !== 'envasado');
  }
  if(e.target.classList.contains('btn-eliminar')){
    e.target.parentElement.remove();
  }
}

async function submitIngredientes(e){
  e.preventDefault();
  const filas = qsa('#contenedor-ingredientes > div');
  if(!filas.length){ showToast('Agrega al menos un ingrediente','error'); return; }
  const ingredientes = filas.map(f=>({
    ingrediente: f.querySelector('input[name="ingrediente[]"]').value,
    cantidad: parseInt(f.querySelector('input[name="cantidad[]"]').value),
    unidad: f.querySelector('select[name="unidad[]"]').value,
    tipo: f.querySelector('select[name="tipo[]"]').value,
    guardado: f.querySelector('select[name="guardado[]"]').value,
    vencimiento: f.querySelector('input[name="vencimiento[]"]').value || null,
  }));
  try{
    const res = await fetch('/agregar-ingredientes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(ingredientes)});
    if(res.ok){ showToast('Ingredientes agregados','success'); setTimeout(()=>location.reload(), 700); }
    else{ showToast('Error al guardar ingredientes','error'); }
  }catch(err){ console.error(err); showToast('No se pudo conectar con el servidor','error'); }
}

// Recetas
let todasLasRecetas = [];
function renderRecetaDetalle(receta){
  const c = qs('#detalle-receta');
  c.innerHTML = `
  <div class="bg-white/90 p-6 rounded-lg shadow-md">
    <h2 class="text-2xl font-bold mb-2 text-gray-800">${receta.nombre_receta}</h2>
    <p class="text-gray-600 mb-4 italic">${receta.descripcion}</p>
    <div class="text-sm text-gray-500 mb-6">⏱️ Tiempo: <strong>${receta.tiempo}</strong> &nbsp; 🍽️ Porciones: <strong>${receta.porciones}</strong> &nbsp; 🗂️ Categoría: <strong>${receta.categoria}</strong></div>
    <h3 class="font-semibold text-lime-700 mb-2">🥕 Ingredientes:</h3>
    <ul class="list-disc pl-5 mb-4">${receta.ingredientes.split(';').map(ing=>`<li>${ing.trim()}</li>`).join('')}</ul>
    <h3 class="font-semibold text-blue-700 mb-2">📋 Pasos:</h3>
    <ol class="list-decimal pl-5 mb-4">${receta.pasos.split('|').map(p=>`<li>${p.trim()}</li>`).join('')}</ol>
    <h3 class="font-semibold text-purple-700 mb-2">🍎 Información nutricional:</h3>
    <p class="text-gray-700">Calorías: <strong>${receta.calorias}</strong>, Proteína: <strong>${receta.proteina}</strong>, Grasa: <strong>${receta.grasa}</strong>, Carbohidratos: <strong>${receta.carbohidratos}</strong></p>
    <div class="mt-4 text-center">
      <form action="/eliminar-receta/${receta.id}" method="post">
        <button class="text-red-500 hover:text-red-700 text-lg font-semibold transition duration-300" title="Eliminar" aria-label="Eliminar receta">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>Eliminar Receta
        </button>
      </form>
    </div>
  </div>`;
}
function renderRecetasGrid(recetas){
  const grid = qs('#todas-recetas-grid');
  grid.innerHTML = '';
  recetas.forEach(receta=>{
    const card = document.createElement('div');
    card.className = 'bg-white/90 rounded-lg shadow-md p-4 hover:shadow-lg transition cursor-pointer';
    card.innerHTML = `<h3 class="text-lg font-bold text-purple-800 mb-1">${receta.nombre_receta}</h3><p class="text-gray-600 text-sm">${receta.descripcion}</p>`;
    card.addEventListener('click',()=>{ qs('#vista-comidas')?.classList.remove('hidden'); renderRecetaDetalle(receta); });
    grid.appendChild(card);
  });
}
async function cargarRecetas(){
  try{
    const res = await fetch('/todas-las-recetas');
    const data = await res.json();
    todasLasRecetas = data; renderRecetasGrid(data);
    const datalist = qs('#recetas-lista');
    if(datalist){ datalist.innerHTML=''; data.forEach(r=>{ const o = document.createElement('option'); o.value = r.nombre_receta; datalist.appendChild(o); }); }
  }catch(err){ console.error(err); showToast('No se pudieron cargar las recetas','error'); }
}
function buscarRecetaPorNombre(nombre){
  const r = todasLasRecetas.find(x=>x.nombre_receta.toLowerCase() === nombre.toLowerCase());
  if(r){ qs('#vista-comidas')?.classList.remove('hidden'); renderRecetaDetalle(r); }
}

// Generar receta IA
async function solicitarReceta(){
  const loader = qs('#loader');
  const botones = qs('#botones-recetas');
  try{
    loader?.classList.remove('hidden'); botones?.classList.add('hidden');
    const response = await fetch('/generar-receta-inteligente',{method:'POST',headers:{'Content-Type':'application/json'}});
    const data = await response.json();
    loader?.classList.add('hidden'); botones?.classList.remove('hidden');
    if(response.ok){
      const receta = data.receta;
      const resumen = `📋 ${receta.nombre_receta}\n\n📝 ${receta.descripcion}\n⏱️ ${receta.tiempo} | 🍽️ ${receta.porciones}`;
      const guardar = await customConfirm(`¿Querés guardar esta receta?\n\n${resumen}`);
      if(guardar){
        const guardarResponse = await fetch('/guardar-receta',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(receta)});
        const guardarData = await guardarResponse.json();
        if(guardarResponse.ok){ showToast('Receta guardada','success'); setTimeout(()=>location.reload(), 800); }
        else{ showToast(guardarData.error || 'Error al guardar la receta','error'); }
      }else{
        showToast('Receta descartada','info');
      }
    }else{ showToast(data.error || 'Ocurrió un error','error'); }
  }catch(err){ loader?.classList.add('hidden'); botones?.classList.remove('hidden'); console.error(err); showToast('No se pudo conectar con el servidor','error'); }
}

// Bindings
document.addEventListener('DOMContentLoaded',()=>{
  // Nav
  qs('#btn-inicio')?.addEventListener('click', e=>{ e.preventDefault(); backHome(); });
  qs('#nav-ingredientes')?.addEventListener('click',()=>showView('vista-ingredientes'));
  qs('#nav-recetas')?.addEventListener('click',()=>showView('vista-recetas'));
  qs('#nav-comidas')?.addEventListener('click',()=>showView('vista-comidas'));
  qs('#btn-open-ingredientes')?.addEventListener('click',()=>showView('vista-ingredientes'));
  qs('#btn-open-recetas')?.addEventListener('click',()=>showView('vista-recetas'));
  qs('#btn-open-comidas')?.addEventListener('click',()=>showView('vista-comidas'));

  // Ingredientes
  qs('#btn-agregar-ingrediente')?.addEventListener('click', addIngredienteRow);
  qs('#contenedor-ingredientes')?.addEventListener('click', (e)=>{ if(e.target.classList.contains('btn-eliminar')) e.target.parentElement.remove(); });
  qs('#contenedor-ingredientes')?.addEventListener('change', onIngredienteChange);
  qs('#ingredientes-form')?.addEventListener('submit', submitIngredientes);
  qs('#btn-ver-ingredientes')?.addEventListener('click', ()=> qs('#lista-ingredientes')?.classList.toggle('hidden'));

  // Recetas
  qs('#btn-mostrar-formulario')?.addEventListener('click', ()=>{
    const sec = qs('#vista-formulario_receta'); const visible = sec?.style.display === 'block' || !sec?.classList.contains('hidden') && sec?.style.display !== 'none';
    if(sec){ sec.classList.toggle('hidden'); }
    const btn = qs('#btn-mostrar-formulario'); if(btn) btn.textContent = (sec && sec.classList.contains('hidden')) ? 'Agregar nueva receta' : 'Ocultar formulario';
  });
  qs('#form-nueva-receta')?.addEventListener('submit', async (e)=>{
    e.preventDefault(); const f = e.target;
    const datos = { nombre_receta:f.nombre_receta.value, descripcion:f.descripcion.value, ingredientes:f.ingredientes.value, pasos:f.pasos.value, tiempo:f.tiempo.value, categoria:f.categoria.value, dieta:f.dieta.value, porciones:parseInt(f.porciones.value), calorias:parseInt(f.calorias.value), proteina:f.proteina.value, grasa:f.grasa.value, carbohidratos:f.carbohidratos.value };
    try{ const res = await fetch('/crear-receta',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(datos)}); if(res.ok){ showToast('Receta creada','success'); setTimeout(()=>location.reload(), 700);} else { showToast('Error al crear receta','error'); } }catch(err){ console.error(err); showToast('No se pudo conectar con el servidor','error'); }
  });
  qs('#buscador-recetas')?.addEventListener('change', (e)=>buscarRecetaPorNombre(e.target.value));
  qs('#buscador-recetas')?.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); buscarRecetaPorNombre(e.target.value); }});
  qs('#btn-buscar-receta')?.addEventListener('click', ()=>buscarRecetaPorNombre(qs('#buscador-recetas').value));
  qs('#btn-solicitar-receta')?.addEventListener('click', solicitarReceta);

  cargarRecetas();
});
