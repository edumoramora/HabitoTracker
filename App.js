/* ============================================================
   HÁBITOTRACKER · app.js (SOLUCIONARIO · modelo de 2 formularios)
   ------------------------------------------------------------
   DOS registros independientes:
     - habitos[]   : los hábitos que creas (Formulario A)
     - registros[] : cada día que apuntas de un hábito (Formulario B)
   La tabla de seguimiento se muestra en un MODAL: una ventana
   pequeña DENTRO de la misma página, con el fondo oscurecido.
   ============================================================ */

/* ---------- COOKIES CON JSON (criterio g) ---------- */
function guardarCookie(nombre, valor, dias) {
  const seg = dias * 24 * 60 * 60;
  document.cookie = nombre + "=" + encodeURIComponent(JSON.stringify(valor)) + "; max-age=" + seg + "; path=/";
}
function leerCookie(nombre) {
  const t = document.cookie.split("; ").find(c => c.startsWith(nombre + "="));
  if (!t) return null;
  try { return JSON.parse(decodeURIComponent(t.split("=").slice(1).join("="))); }
  catch (e) { return null; }
}
function borrarCookie(nombre) { document.cookie = nombre + "=; max-age=0; path=/"; }

/* ---------- ESTADO: los dos arrays ---------- */
let habitos = [];    // { id, nombre, descripcion, categoria }
let registros = [];  // { id, habitoId, fecha, observaciones, cumplido }

function guardarTodo() {
  guardarCookie("habitos", habitos, 365);
  guardarCookie("registros", registros, 365);
}
function cargarTodo() {
  habitos = leerCookie("habitos") || [];
  registros = leerCookie("registros") || [];
}

/* ============================================================
   FORMULARIO A · crear un hábito (criterio e)
   ============================================================ */
function crearHabito() {
  const nombre = document.getElementById("inNombre").value.trim();
  const desc = document.getElementById("inDesc").value.trim();
  const categoria = document.getElementById("inCategoria").value;
  const aviso = document.getElementById("avisoA");

  if (nombre === "") {
    aviso.textContent = "El hábito necesita un nombre.";
    aviso.className = "aviso";
    return;
  }
  const id = habitos.length ? Math.max(...habitos.map(h => h.id)) + 1 : 1;
  habitos.push({ id: id, nombre: nombre, descripcion: desc, categoria: categoria });

  aviso.textContent = "Hábito creado.";
  aviso.className = "aviso ok";
  document.getElementById("inNombre").value = "";
  document.getElementById("inDesc").value = "";

  guardarTodo();
  rellenarSelectHabitos();
  refrescar();
}

/* ============================================================
   FORMULARIO B · registrar un día de un hábito (criterio e)
   ============================================================ */
function registrarDia() {
  const habitoId = document.getElementById("inHabito").value;
  const fecha = document.getElementById("inFecha").value;
  const obs = document.getElementById("inObs").value.trim();
  const cumplido = document.getElementById("inCumplido").checked;
  const aviso = document.getElementById("avisoB");

  if (habitoId === "") {
    aviso.textContent = "Elige a qué hábito pertenece.";
    aviso.className = "aviso";
    return;
  }
  if (fecha === "") {
    aviso.textContent = "Indica la fecha.";
    aviso.className = "aviso";
    return;
  }

  const id = registros.length ? Math.max(...registros.map(r => r.id)) + 1 : 1;
  registros.push({
    id: id, habitoId: Number(habitoId), fecha: fecha,
    observaciones: obs, cumplido: cumplido
  });

  aviso.textContent = "Registro guardado.";
  aviso.className = "aviso ok";
  document.getElementById("inObs").value = "";
  document.getElementById("inCumplido").checked = false;

  guardarTodo();
  refrescar();
}

/* ---------- Rellenar el desplegable del formulario B (criterio d) ---------- */
function rellenarSelectHabitos() {
  const sel = document.getElementById("inHabito");
  sel.innerHTML = '<option value="">-- Elige un hábito --</option>';
  for (const h of habitos) {
    const op = document.createElement("option");
    op.value = h.id;
    op.textContent = h.nombre + " (" + h.categoria + ")";
    sel.appendChild(op);
  }
}

/* ---------- Buscar el nombre de un hábito por su id ---------- */
function nombreHabito(id) {
  const h = habitos.find(x => x.id === id);
  return h ? h.nombre : "(hábito borrado)";
}

/* ============================================================
   CAMBIAR "cumplido" y BORRAR (criterio e + g)
   Al estar todo en la misma página, se accede al array directo.
   ============================================================ */
function toggleCumplido(idRegistro) {
  const r = registros.find(x => x.id === idRegistro);
  if (r) { r.cumplido = !r.cumplido; guardarTodo(); pintarTabla(); refrescar(); }
}
function borrarRegistro(idRegistro) {
  registros = registros.filter(r => r.id !== idRegistro);
  guardarTodo(); pintarTabla(); refrescar();
}

/* ============================================================
   MODAL · abrir/cerrar la ventana pequeña (criterio f)
   No es otra ventana del navegador: es una capa de esta misma
   página que mostramos u ocultamos quitando/poniendo una clase.
   ============================================================ */
function abrirModal() {
  pintarTabla();                                     // generamos la tabla
  document.getElementById("modal").classList.remove("oculto"); // la mostramos
}
function cerrarModal() {
  document.getElementById("modal").classList.add("oculto");
}

/* ---------- Pintar la tabla dentro del modal (criterio d) ---------- */
function pintarTabla() {
  const cuerpo = document.getElementById("cuerpoTabla");
  cuerpo.innerHTML = "";

  if (registros.length === 0) {
    cuerpo.innerHTML = '<tr><td colspan="5" class="muted">Aún no hay registros.</td></tr>';
    document.getElementById("modalResumen").textContent = "";
    return;
  }

  for (const r of registros) {
    const estado = r.cumplido
      ? '<span class="estado-ok">✓ Cumplido</span>'
      : '<span class="estado-no">✗ No cumplido</span>';
    const fila = document.createElement("tr");
    fila.innerHTML =
      "<td>" + nombreHabito(r.habitoId) + "</td>" +
      "<td>" + r.fecha + "</td>" +
      "<td>" + (r.observaciones || "-") + "</td>" +
      "<td>" + estado + "</td>" +
      '<td><button type="button" class="btn-mini" data-toggle="' + r.id + '">Cambiar</button> ' +
      '<button type="button" class="btn-mini del" data-del="' + r.id + '">✕</button></td>';
    cuerpo.appendChild(fila);
  }

  // conectar los botones de cada fila
  cuerpo.querySelectorAll("[data-toggle]").forEach(b =>
    b.addEventListener("click", () => toggleCumplido(Number(b.dataset.toggle))));
  cuerpo.querySelectorAll("[data-del]").forEach(b =>
    b.addEventListener("click", () => borrarRegistro(Number(b.dataset.del))));

  const cumplidos = registros.filter(r => r.cumplido).length;
  const fallados = registros.filter(r => !r.cumplido).length;
  document.getElementById("modalResumen").textContent =
    "Cumplidos: " + cumplidos + " · No cumplidos: " + fallados + " · Total: " + registros.length;
}

/* ---------- Estadísticas en la página principal (criterio d) ---------- */
function refrescar() {
  const totalH = habitos.length;
  const cumplidos = registros.filter(r => r.cumplido).length;
  const fallados = registros.filter(r => !r.cumplido).length;
  document.getElementById("statsGlobal").innerHTML =
    '<div class="stat"><b>' + totalH + '</b>hábitos</div>' +
    '<div class="stat"><b>' + cumplidos + '</b>días cumplidos</div>' +
    '<div class="stat"><b>' + fallados + '</b>días fallados</div>';
}

/* ---------- ARRANQUE (criterio h) ---------- */
function iniciar() {
  console.log("HábitoTracker iniciado.");

  let usuario = leerCookie("usuario");
  if (!usuario) {
    usuario = prompt("¿Cómo te llamas?") || "invitado";
    guardarCookie("usuario", usuario, 365);
  }
  document.getElementById("saludo").textContent =
    "Hola, " + usuario + " · " + new Date().toLocaleDateString("es-ES");

  cargarTodo();
  rellenarSelectHabitos();
  refrescar();

  document.getElementById("btnCrear").addEventListener("click", crearHabito);
  document.getElementById("btnRegistrar").addEventListener("click", registrarDia);

  // Menú: "Ver seguimiento" abre el modal
  document.getElementById("navTabla").addEventListener("click", function (e) {
    e.preventDefault();
    abrirModal();
  });
  document.getElementById("navInicio").addEventListener("click", function (e) {
    e.preventDefault();
    cerrarModal();
  });

  // Cerrar el modal con la X o pulsando fuera de la ventanita
  document.getElementById("btnCerrarModal").addEventListener("click", cerrarModal);
  document.getElementById("modal").addEventListener("click", function (e) {
    if (e.target === this) cerrarModal(); // clic en el fondo oscuro
  });

  document.getElementById("btnReiniciar").addEventListener("click", function () {
    if (confirm("¿Borrar todos los hábitos y registros?")) {
      borrarCookie("habitos"); borrarCookie("registros"); borrarCookie("usuario");
      habitos = []; registros = [];
      rellenarSelectHabitos(); refrescar(); cerrarModal();
      alert("Todo borrado. Recarga la página.");
    }
  });
}
document.addEventListener("DOMContentLoaded", iniciar);