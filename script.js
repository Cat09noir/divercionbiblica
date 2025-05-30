let nombreJugador = "";
let puntaje = 0;
let puntajeMaximo = localStorage.getItem("puntajeMaximo") || 0;
let preguntas = [];
let indiceActual = 0;
let temporizador;
let tiempo = 15;

document.addEventListener("DOMContentLoaded", () => {
  const usuarioGuardado = localStorage.getItem("correoUsuario");
  if (usuarioGuardado) {
    nombreJugador = usuarioGuardado;
    mostrarPantallaBienvenida();
  } else {
    mostrarPantalla("pantallaLogin");
  }
});

function iniciarSesion() {
  const input = document.getElementById("correo");
  const correo = input.value.trim();

  if (!correo || !correo.includes("@") || !correo.includes(".")) {
    alert("Ingresa un correo válido.");
    return;
  }

  nombreJugador = correo;
  localStorage.setItem("correoUsuario", correo);
  mostrarPantallaBienvenida();
}

function cerrarSesion() {
  localStorage.removeItem("correoUsuario");
  nombreJugador = "";
  mostrarPantalla("pantallaLogin");
}

// Función para mostrar pantalla de bienvenida
function mostrarPantallaBienvenida() {
  document.getElementById("usuarioBienvenida").innerText = `👤 ${nombreJugador}`;
  document.getElementById("saludoUsuario").innerText = `¡Bienvenido, ${nombreJugador}!`;
  mostrarPantalla("pantallaBienvenida");
}

// Oculta todas las pantallas y muestra solo una
function mostrarPantalla(idMostrar) {
  const pantallas = document.querySelectorAll(".pantalla");
  pantallas.forEach(p => p.classList.remove("activa"));

  const activa = document.getElementById(idMostrar);
  if (activa) activa.classList.add("activa");
}


const barraProgreso = document.getElementById("barraTiempoProgreso");
const sonidoCorrecto = new Audio("assets/sonido_correcto.mp3");
const sonidoIncorrecto = new Audio("assets/sonido_incorrecto.mp3");

function iniciarJuego() {
    const inputNombre = document.getElementById("nombreJugador");
    if (!inputNombre.value.trim()) {
        alert("Por favor, ingresa tu nombre.");
        return;
    }

    nombreJugador = inputNombre.value.trim();
    cambiarPantalla("pantallaInicio", "pantallaBienvenida");
    document.getElementById("saludoUsuario").innerText = `¡Bienvenido, ${nombreJugador}!`;
}

function comenzarJuego() {
    fetch("preguntas_1000.json")
        .then(res => res.json())
        .then(data => {
            const preguntasArray = Array.isArray(data) ? data : data.preguntas;
            if (!Array.isArray(preguntasArray)) {
                throw new Error("La estructura del JSON es incorrecta.");
            }
            preguntas = preguntasArray.sort(() => Math.random() - 0.5).slice(0, 10);
            indiceActual = 0;
            puntaje = 0;
            mostrarPregunta();
        })
        .catch(error => {
            console.error("Error al cargar preguntas:", error);
            alert("Hubo un problema al cargar las preguntas.");
        });
}

function mostrarPregunta() {
    clearInterval(temporizador);
    tiempo = 15;

    const preguntaActual = preguntas[indiceActual];
    document.getElementById("pregunta").innerText = preguntaActual.pregunta;

    const opcionesDiv = document.getElementById("opciones");
    opcionesDiv.innerHTML = "";

    preguntaActual.opciones.forEach((opcion, index) => {
        const boton = document.createElement("button");
        boton.innerText = opcion;
        boton.classList.add("btn-opcion");
        boton.onclick = () => verificarRespuesta(index);
        opcionesDiv.appendChild(boton);
    });

    document.getElementById("resultado").innerText = "";
    document.getElementById("puntaje").innerText = `Puntaje: ${puntaje}`;
    document.getElementById("btnSiguiente").style.display = "none";

    barraProgreso.style.width = "100%";
    temporizador = setInterval(() => {
        tiempo--;
        barraProgreso.style.width = `${(tiempo / 15) * 100}%`;
        if (tiempo <= 0) {
            clearInterval(temporizador);
            verificarRespuesta(-1);
        }
    }, 1000);
}

function verificarRespuesta(indiceSeleccionado) {
    clearInterval(temporizador);
    const correcta = preguntas[indiceActual].correcta;
    const resultado = document.getElementById("resultado");

    if (indiceSeleccionado === correcta) {
        resultado.innerText = "✅ ¡Correcto!";
        resultado.className = "correcto fade-in";
        sonidoCorrecto.play();
        puntaje += 10;
    } else if (indiceSeleccionado === -1) {
        resultado.innerText = `⏰ Tiempo agotado. La respuesta era: ${preguntas[indiceActual].opciones[correcta]}`;
        resultado.className = "incorrecto fade-in";
        sonidoIncorrecto.play();
    } else {
        resultado.innerText = `❌ Incorrecto. La respuesta era: ${preguntas[indiceActual].opciones[correcta]}`;
        resultado.className = "incorrecto fade-in";
        sonidoIncorrecto.play();
    }

    document.getElementById("puntaje").innerText = `Puntaje: ${puntaje}`;
    document.getElementById("btnSiguiente").style.display = "inline-block";

    Array.from(document.getElementById("opciones").children).forEach(btn => btn.disabled = true);
}

function siguientePregunta() {
    indiceActual++;
    if (indiceActual < preguntas.length) {
        mostrarPregunta();
    } else {
        mostrarPantallaFinal();
    }
}

function mostrarPantallaFinal() {
    document.getElementById("pantallaJuego").classList.remove("activa");
    document.getElementById("pantallaFinal").classList.add("activa");

    if (puntaje > puntajeMaximo) {
        puntajeMaximo = puntaje;
        localStorage.setItem("puntajeMaximo", puntajeMaximo);
    }

    document.getElementById("puntajeMaximo").innerText = `🏆 Puntaje más alto: ${puntajeMaximo}`;
    document.getElementById("resumenFinal").innerText = `${nombreJugador}, tu puntaje final fue: ${puntaje}`;

    let listaPuntajes = JSON.parse(localStorage.getItem("puntajesUsuarios")) || [];
    listaPuntajes.push({ nombre: nombreJugador, puntaje: puntaje });
    localStorage.setItem("puntajesUsuarios", JSON.stringify(listaPuntajes));

    mostrarEstrellas(puntaje);
    mostrarRanking();
}

function mostrarRanking() {
    const contenedorRanking = document.getElementById("rankingJugadores");
    contenedorRanking.innerHTML = "<h3>🏅 Ranking de jugadores:</h3>";

    let lista = JSON.parse(localStorage.getItem("puntajesUsuarios")) || [];
    lista.sort((a, b) => b.puntaje - a.puntaje);

    let listaHTML = "<ol>";
    lista.forEach(j => {
        listaHTML += `<li>${j.nombre} - ${j.puntaje} puntos</li>`;
    });
    listaHTML += "</ol>";

    contenedorRanking.innerHTML += listaHTML;
}

function cambiarPantalla(idAnterior, idNueva) {
    document.getElementById(idAnterior).classList.remove("activa");
    document.getElementById(idNueva).classList.add("activa");
}

function reiniciarJuego() {
    location.reload();
}

function mostrarEstrellas(puntaje) {
    const estrellasDiv = document.getElementById("estrellasFinales");
    estrellasDiv.innerHTML = "";
    const estrellas = Math.floor(puntaje / 30);
    for (let i = 0; i < estrellas; i++) {
        const estrella = document.createElement("span");
        estrella.innerText = "⭐";
        estrellasDiv.appendChild(estrella);
    }
}
const seriesBiblicas = {
  moises: {
    titulo: "📜 Moisés y los Diez Mandamientos",
    descripcion: "La vida de Moisés y la liberación del pueblo de Israel.",
    archivo: "moises.mp4"
  },
  josue: {
    titulo: "⚔️ Josué",
    descripcion: "La conquista de la Tierra Prometida bajo el liderazgo de Josué.",
    archivo: "josue.mp4"
  },
  reyes: {
    titulo: "👑 Reyes",
    descripcion: "La historia de los reyes de Israel y Judá.",
    archivo: "reyes.mp4"
  },
  genesis: {
    titulo: "🌍 Génesis",
    descripcion: "El principio de la creación y los patriarcas de la fe.",
    archivo: "genesis.mp4"
  }
  // Puedes agregar más aquí
};
function mostrarSeccion(id) {
  const pantallas = document.querySelectorAll(".pantalla");
  pantallas.forEach(p => p.classList.remove("activa"));

  const seccion = document.getElementById(id);
  if (seccion) seccion.classList.add("activa");
}
// Función para cambiar el video desde GitHub
function cambiarSerie(nombreArchivo) {
  const video = document.getElementById("videoBiblico");
  if (!video) return;

  const ruta = `https://cat09noir.github.io/juegosbiblicos/${nombreArchivo}`;
  video.src = ruta;
  video.load();
  video.play();
}
function cambiarSerieDesdeSelect() {
  const seleccion = document.getElementById("selectorSeries").value;
  const video = document.getElementById("videoBiblico");
  const titulo = document.getElementById("tituloSerie");
  const descripcion = document.getElementById("descripcionSerie");

  const datos = seriesBiblicas[seleccion];
  if (!datos) return;

  const url = `https://TU_USUARIO.github.io/TU_REPOSITORIO/series/${datos.archivo}`;
  video.src = url;
  video.load();
  video.play();

  titulo.textContent = datos.titulo;
  descripcion.textContent = datos.descripcion;
}
