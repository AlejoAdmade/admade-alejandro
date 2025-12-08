(() => {

    const App = (() => {

        const html = {
            form: document.getElementById("studentForm"),
            limpiar: document.getElementById("limpiar"),
            borrarTodo: document.getElementById("borrarTodo"),
            tablaBody: document.getElementById("tablaEstudiantes").querySelector("tbody"),
            countLabel: document.getElementById("count"),

            nombre: document.getElementById("nombre"),
            apellido: document.getElementById("apellido"),
            email: document.getElementById("email"),
            edad: document.getElementById("edad"),
            carrera: document.getElementById("carrera")
        };

        let estudiantes = [];

        const templates = {
            emptyRow: () => `
                <tr>
                    <td colspan="7" class="empty">No hay resultados.</td>
                </tr>
            `,
            row: (est, index) => `
                <tr data-index="${index}">
                    <td>${index + 1}</td>
                    <td>${est.nombre}</td>
                    <td>${est.apellido}</td>
                    <td>${est.email}</td>
                    <td>${est.edad}</td>
                    <td>${est.carrera}</td>
                    <td><button class="delete">Eliminar</button></td>
                </tr>
            `
        };

        const utils = {
            validarFormulario() {
                const nombre = html.nombre.value.trim();
                const apellido = html.apellido.value.trim();
                const email = html.email.value.trim();
                const edad = parseInt(html.edad.value.trim());
                const carrera = html.carrera.value;

                if (!nombre || !apellido || !email || !edad || !carrera) {
                    alert("Todos los campos son obligatorios.");
                    return false;
                }
                if (!/\S+@\S+\.\S+/.test(email)) {
                    alert("Por favor ingresa un correo válido.");
                    return false;
                }
                if (edad < 18 || edad > 100) {
                    alert("La edad debe estar entre 18 y 100 años.");
                    return false;
                }

                return { nombre, apellido, email, edad, carrera };
            },

            actualizarContador() {
                const n = estudiantes.length;
                html.countLabel.textContent = n === 1 ? "1 estudiante" : `${n} estudiantes`;
            },

            adjuntarEventosEliminar() {
                const botones = html.tablaBody.querySelectorAll(".delete");
                botones.forEach(btn =>
                    btn.addEventListener("click", handlers.onDeleteStudent)
                );
            }
        };

        const handlers = {
            onSubmit(e) {
                e.preventDefault();
                const data = utils.validarFormulario();
                if (!data) return;

                estudiantes.push(data);
                render.table();
                html.form.reset();
            },

            onClearForm() {
                if (confirm("¿Deseas limpiar el formulario?")) {
                    html.form.reset();
                }
            },

            onDeleteAll() {
                if (estudiantes.length === 0) return;
                if (confirm("¿Deseas eliminar todos los estudiantes?")) {
                    estudiantes = [];
                    render.table();
                }
            },

            onDeleteStudent(e) {
                const fila = e.target.closest("tr");
                const index = parseInt(fila.dataset.index);

                if (confirm("¿Deseas eliminar este estudiante?")) {
                    estudiantes.splice(index, 1);
                    render.table();
                }
            }
        };

        const render = {
            table() {
                html.tablaBody.innerHTML = "";

                if (estudiantes.length === 0) {
                    html.tablaBody.innerHTML = templates.emptyRow();
                    utils.actualizarContador();
                    return;
                }

                estudiantes.forEach((est, index) => {
                    html.tablaBody.innerHTML += templates.row(est, index);
                });

                utils.adjuntarEventosEliminar();
                utils.actualizarContador();
            }
        };

        return {
            init() {
                html.form.addEventListener("submit", handlers.onSubmit);
                html.limpiar.addEventListener("click", handlers.onClearForm);
                html.borrarTodo.addEventListener("click", handlers.onDeleteAll);
                render.table();
            }
        };

    })();

    App.init();

})();
