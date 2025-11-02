const form = document.getElementById("studentForm");
const limpiarBtn = document.getElementById("limpiar");
const borrarTodoBtn = document.getElementById("borrarTodo");
const tabla = document.getElementById("tablaEstudiantes").querySelector("tbody");
const countLabel = document.getElementById("count");

let estudiantes = [];

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const apellido = document.getElementById("apellido").value.trim();
  const email = document.getElementById("email").value.trim();
  const edad = parseInt(document.getElementById("edad").value.trim());
  const carrera = document.getElementById("carrera").value;

  if (!nombre || !apellido || !email || !edad || !carrera) {
    alert("Todos los campos son obligatorios.");
    return;
  }
  if (!/\S+@\S+\.\S+/.test(email)) {
    alert("Por favor ingresa un correo válido.");
    return;
  }
  if (edad < 18 || edad > 100) {
    alert("La edad debe estar entre 18 y 100 años.");
    return;
  }

  const estudiante = { nombre, apellido, email, edad, carrera };
  estudiantes.push(estudiante);
  actualizarTabla();
  form.reset();
});

limpiarBtn.addEventListener("click", () => {
  if (confirm("¿Deseas limpiar el formulario?")){
    form.reset()};
});

borrarTodoBtn.addEventListener("click", () => {
  if (estudiantes.length === 0) return;
  if (confirm("¿Deseas eliminar todos los estudiantes?")) {
    estudiantes = [];
    actualizarTabla();
  }
});

function eliminarEstudiante(index) {
  if (confirm("¿Deseas eliminar este estudiante?")){
  estudiantes.splice(index, 1);
  actualizarTabla()};
}

function actualizarTabla() {
  tabla.innerHTML = "";

  if (estudiantes.length === 0) {
    tabla.innerHTML = `<tr><td colspan="7" class="empty">No hay resultados.</td></tr>`;
    countLabel.textContent = "0 estudiantes";
    return;
  }

  estudiantes.forEach((e, i) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${i + 1}</td>
      <td>${e.nombre}</td>
      <td>${e.apellido}</td>
      <td>${e.email}</td>
      <td>${e.edad}</td>
      <td>${e.carrera}</td>
      <td><button class="delete" onclick="eliminarEstudiante(${i})">Eliminar</button></td>
    `;
    tabla.appendChild(fila);
  });

  countLabel.textContent = estudiantes.length === 1 
    ? "1 estudiante" 
    : `${estudiantes.length} estudiantes`;
}