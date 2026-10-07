/* ============================================================
   HÁBITOTRACKER · app.js (SOLUCIONARIO · modelo de 2 formularios)
   ------------------------------------------------------------
   DOS registros independientes:
     - habitos[]   : los hábitos que creas (Formulario A)
     - registros[] : cada día que apuntas de un hábito (Formulario B)
   La tabla de seguimiento está en una SEGUNDA VENTANA y puede
   cambiar el estado "cumplido" directamente sobre el array.
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
  rellenarSelectHabitos(); // el nuevo hábito debe aparecer en el formulario B
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
   CAMBIAR "cumplido" desde la tabla (criterio e + g)
   La segunda ventana llama a ESTA función del padre con
   window.opener. Así el cambio se guarda en el array real.
   ============================================================ */
function toggleCumplido(idRegistro) {
  const r = registros.find(x => x.id === idRegistro);
  if (r) {
    r.cumplido = !r.cumplido;
    guardarTodo();
    refrescar();
  }
}
function borrarRegistro(idRegistro) {
  registros = registros.filter(r => r.id !== idRegistro);
  guardarTodo();
  refrescar();
}
// Exponemos las funciones para que la ventana hija pueda llamarlas
window.toggleCumplido = toggleCumplido;
window.borrarRegistro = borrarRegistro;
window.getRegistros = () => registros;
window.getNombreHabito = nombreHabito;

/* ============================================================
   SEGUNDA VENTANA · tabla de seguimiento (criterio f + d)
   Se genera entera por código y se refresca sola.
   ============================================================ */
let ventanaTabla = null;

function abrirTabla() {
  if (registros.length === 0) { alert("Aún no hay registros que mostrar."); return; }
  ventanaTabla = window.open("", "tabla", "width=820,height=560");
  pintarTablaEnVentana();
}

function pintarTablaEnVentana() {
  if (!ventanaTabla || ventanaTabla.closed) return;

  let filas = "";
  for (const r of registros) {
    const estado = r.cumplido
      ? '<span style="color:#35d0a5;font-weight:700">✓ Cumplido</span>'
      : '<span style="color:#ff6b6b;font-weight:700">✗ No cumplido</span>';
    filas +=
      '<tr>' +
        '<td>' + nombreHabito(r.habitoId) + '</td>' +
        '<td>' + r.fecha + '</td>' +
        '<td>' + (r.observaciones || "-") + '</td>' +
        '<td>' + estado + '</td>' +
        '<td style="text-align:center">' +
          '<button onclick="window.opener.toggleCumplido(' + r.id + '); window.opener.pintarTablaEnVentana();">Cambiar</button> ' +
          '<button class="del" onclick="window.opener.borrarRegistro(' + r.id + '); window.opener.pintarTablaEnVentana();">X</button>' +
        '</td>' +
      '</tr>';
  }
  const cumplidos = registros.filter(r => r.cumplido).length;
  const fallados = registros.filter(r => !r.cumplido).length;

  const html =
    '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Tabla de seguimiento</title><style>' +
    'body{font-family:system-ui,sans-serif;background:#0f1420;color:#e8ecf4;padding:24px}' +
    'h1{color:#4f8cff}table{width:100%;border-collapse:collapse;margin-top:14px}' +
    'th,td{border:1px solid #263149;padding:9px 11px;text-align:left}th{background:#4f8cff;color:#fff}' +
    'tr:nth-child(even){background:#171e2e}button{background:#4f8cff;color:#fff;border:none;' +
    'padding:5px 10px;border-radius:7px;cursor:pointer;font-weight:600}.del{background:#ff6b6b}' +
    '.resumen{margin-top:14px;color:#93a0b8}</style></head><body>' +
    '<h1>Tabla de seguimiento</h1>' +
    '<p class="resumen">Cumplidos: ' + cumplidos + ' · No cumplidos: ' + fallados +
    ' · Total: ' + registros.length + '</p>' +
    '<table><thead><tr><th>Hábito</th><th>Fecha</th><th>Observaciones</th>' +
    '<th>Estado</th><th>Acciones</th></tr></thead><tbody>' + filas + '</tbody></table>' +
    '<p class="resumen">Pulsa "Cambiar" para marcar cumplido / no cumplido. Se guarda al instante.</p>' +
    '</body></html>';

  ventanaTabla.document.open();
  ventanaTabla.document.write(html);
  ventanaTabla.document.close();
}
window.pintarTablaEnVentana = pintarTablaEnVentana;

/* ---------- Estadísticas en la ventana principal (criterio d) ---------- */
function refrescar() {
  const totalH = habitos.length;
  const cumplidos = registros.filter(r => r.cumplido).length;
  const fallados = registros.filter(r => !r.cumplido).length;
  document.getElementById("statsGlobal").innerHTML =
    '<div class="stat"><b>' + totalH + '</b>hábitos</div>' +
    '<div class="stat"><b>' + cumplidos + '</b>días cumplidos</div>' +
    '<div class="stat"><b>' + fallados + '</b>días fallados</div>';
  // si la tabla está abierta, la actualizamos también
  if (ventanaTabla && !ventanaTabla.closed) pintarTablaEnVentana();
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
  document.getElementById("btnTabla").addEventListener("click", abrirTabla);
  document.getElementById("btnReiniciar").addEventListener("click", function () {
    if (confirm("¿Borrar todos los hábitos y registros?")) {
      borrarCookie("habitos"); borrarCookie("registros"); borrarCookie("usuario");
      habitos = []; registros = [];
      rellenarSelectHabitos(); refrescar();
      if (ventanaTabla && !ventanaTabla.closed) ventanaTabla.close();
      alert("Todo borrado. Recarga la página.");
    }
  });
}
document.addEventListener("DOMContentLoaded", iniciar);
