import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useRef } from "react";
import esLocale from "@fullcalendar/core/locales/es";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [eventos, setEventos] = useState([]);
  const [evento, setEvento] = useState("");
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");  
  const [mostrarModal, setMostrarModal] = useState(false);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const calendarRef = useRef(null);
  const [tituloFecha, setTituloFecha] = useState("");

  const [recursos, setRecursos] = useState([]);
  const [aula, setAula] = useState("");
  const [equipo, setEquipo] = useState("");
  const [personal, setPersonal] = useState("");
  const [modalidad, setModalidad] = useState("");

  //FILTROS
  const [filtrosActivos, setFiltrosActivos] = useState({
    sustentacion: true,
    reunion: true,
    evento: true,
    webinar: true,
    curso: true,
    otro: true,
  });

  // COLORES Y TITULOS PARA LEGENDA
  const tiposReserva = [
  { key: "sustentacion", label: "Sustentación", color: "#e53935" },
  { key: "reunion", label: "Reuniones", color: "#8e24aa" },
  { key: "evento", label: "Eventos", color: "#43a047" },
  { key: "webinar", label: "Webinar", color: "#fdd835" },
  { key: "curso", label: "Curso", color: "#0e8df5" },
  { key: "otro", label: "Otro", color: "#ff9800" },
  ];

  // 🔥 👉 AQUÍ
  const hoy = new Date();
  const [tipo, setTipo] = useState("");
  const [detalles, setDetalles] = useState("");
  const dia = hoy.getDate();

  const dias = [
    "DOMINGO",
    "LUNES",
    "MARTES",
    "MIÉRCOLES",
    "JUEVES",
    "VIERNES",
    "SÁBADO",
  ];

  const irAnterior = () => {
    const calendarApi = calendarRef.current.getApi();
    calendarApi.prev();
    setTituloFecha(calendarApi.view.title);
  };

  const irSiguiente = () => {
    const calendarApi = calendarRef.current.getApi();
    calendarApi.next();
    setTituloFecha(calendarApi.view.title);
  };

  const toggleFiltro = (key) => {
    setFiltrosActivos((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  
    const nombreDia = dias[hoy.getDay()];

    const formatearEventos = (data) => {
      return data.map((reserva) => {
        const tipo = (reserva.tipo || "").toLowerCase();

        let color = "#1976d2";

        if (tipo.includes("sustent")) color = "#e53935";
        else if (tipo.includes("reunion")) color = "#8e24aa";
        else if (tipo.includes("evento")) color = "#43a047";
        else if (tipo.includes("webinar")) color = "#fdd835";
        else if (tipo.includes("curso")) color = "#0e8df5";
        else if (tipo.includes("otro")) color = "#ff9800";

        return {
          title: reserva.evento,
          start: reserva.inicio,
          end: reserva.fin,
          backgroundColor: color,
          borderColor: color,
          extendedProps: {
            tipo: reserva.tipo,
            detalles: reserva.detalles,

            // 🔥 AGREGA ESTO
            aula: reserva.aula,
            equipo: reserva.equipo,
            personal: reserva.personal,
            modalidad: reserva.modalidad,
          },
        };
      });
    };


  useEffect(() => {

    const cargarEventos = () => {
      fetch("/reservas")
        .then((res) => res.json())
        .then((data) => {setEventos(formatearEventos(data));})
        .catch((err) => console.error(err));
    };

    const cargarRecursos = () => {
      fetch("/recursos")
        .then((res) => res.json())
        .then((data) => {
          //console.log("RECURSOS:", data);
          setRecursos(data);
        })
        .catch((err) => console.error(err));
    };

    // 🔥 carga inicial
    cargarEventos();
    cargarRecursos();

    // 🔥 refresco automático cada 5 segundos
    const interval = setInterval(() => {
      cargarEventos();
    }, 5000);

    // 🔥 limpieza
    return () => clearInterval(interval);

  }, []);

  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      setTituloFecha(calendarApi.view.title);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("/reservas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        aula_id: aula,
        equipo_id: equipo,
        personal_id: personal,
        modalidad_id: modalidad,
        inicio,
        fin,
        tipo,
        evento,
        detalles,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      toast.success("Reserva creada");

      // 🔥 REFETCH (CORRECTO)
      fetch("/reservas")
        .then((res) => res.json())
        .then((data) => {
          setEventos(formatearEventos(data)); // 👈 aquí también
        });

      // limpiar formulario
      setEvento("");
      setInicio("");
      setFin("");
      setTipo("");
      setDetalles("");
      setMostrarModal(false);
    } else {
      toast.error(data.error || "Error al crear reserva");
    }
  };

  const eventosFiltrados = eventos.filter((ev) => {
    const tipo = (ev.extendedProps?.tipo || "").toLowerCase();

    if (tipo.includes("sustent")) return filtrosActivos.sustentacion;
    if (tipo.includes("reunion")) return filtrosActivos.reunion;
    if (tipo.includes("evento")) return filtrosActivos.evento;
    if (tipo.includes("webinar")) return filtrosActivos.webinar;
    if (tipo.includes("curso")) return filtrosActivos.curso;
    if (tipo.includes("otro")) return filtrosActivos.otro;

    return true;
  });

  return (
    <div className="app-container">

      {/* SIDEBAR */}
      <div className="sidebar">
        <h1 className="dia-numero">{dia}</h1>
        <h2 className="dia-texto">{nombreDia}</h2>
      </div>

      {/* CONTENIDO */}
      <div className="main">

        {/* HEADER (luego lo mejoramos) */}
        <div className="header">

          {/* IZQUIERDA */}
          <div className="header-left">
            <h2>Calendario de Eventos</h2>
          </div>

          {/* DERECHA */}
          <div className="header-right">

            <button onClick={irAnterior} className="nav-btn">
              ◀
            </button>

            <span className="mes-texto">{tituloFecha}</span>

            <button onClick={irSiguiente} className="nav-btn">
              ▶
            </button>

          </div>

        </div>

        {/* CALENDARIO */}
        <div className="calendar-container">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={eventosFiltrados}
            height="100%"
            expandRows={true}
            eventDisplay="block" 
            ref={calendarRef}
            headerToolbar={false}
            locale={esLocale}
            displayEventTime={false} 
            eventClick={(info) => {
              setEventoSeleccionado(info.event);
            }}
          />
        </div>
        {mostrarModal && (
          <div className="modal-overlay" onClick={() => setMostrarModal(false)}> 
            
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              
              <h2>Agendar Reserva</h2>

              <form onSubmit={handleSubmit}>

                <input
                  type="text"
                  placeholder="Asunto"
                  value={evento}
                  onChange={(e) => setEvento(e.target.value)}
                />

                <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  <option value="">Tipo</option>
                  <option value="sustentacion">Sustentación</option>
                  <option value="reunion">Reunión interna</option>
                  <option value="evento">Evento</option>
                  <option value="webinar">Webinar</option>
                  <option value="curso">Curso</option>
                  <option value="otro">Otro</option>
                </select>

                <input
                  type="datetime-local"
                  value={inicio}
                  onChange={(e) => setInicio(e.target.value)}
                />

                <input
                  type="datetime-local"
                  value={fin}
                  onChange={(e) => setFin(e.target.value)}
                />

                <div>
                  <label>Aula</label>
                  <select value={aula} onChange={(e) => setAula(e.target.value)}>
                    <option value="">Seleccionar aula</option>
                    {recursos
                      .filter((r) => r.tipo === "aula")
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nombre}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label>Equipo</label>
                  <select value={equipo} onChange={(e) => setEquipo(e.target.value)}>
                    <option value="">Seleccionar equipo</option>
                    {recursos
                      .filter((r) => r.tipo === "equipo")
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nombre}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label>Encargado</label>
                  <select value={personal} onChange={(e) => setPersonal(e.target.value)}>
                    <option value="">Seleccionar personal</option>
                    {recursos
                      .filter((r) => r.tipo === "personal")
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nombre}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label>Modalidad</label>
                  <select value={modalidad} onChange={(e) => setModalidad(e.target.value)}>
                    <option value="">Seleccionar modalidad</option>
                    {recursos
                      .filter((r) => r.tipo === "modalidad")
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nombre}
                        </option>
                      ))}
                  </select>
                </div>

                <textarea
                  placeholder="Detalles"
                  value={detalles}
                  onChange={(e) => setDetalles(e.target.value)}
                />

                <div className="modal-buttons">
                  <button type="submit">Guardar</button>
                  <button type="button" onClick={() => setMostrarModal(false)}>
                    Cancelar
                  </button>
                </div>

              </form>

            </div>

          </div>
        )}

        {eventoSeleccionado && (
          <div
            className="modal-overlay"
            onClick={() => setEventoSeleccionado(null)}
          >       
            <div className="modal-detalle" onClick={(e) => e.stopPropagation()}>

              {/* HEADER VISUAL */}
              <div className="detalle-header">
                <h1>{eventoSeleccionado.title}</h1>
              </div>

              {/* BODY */}
              <div className="detalle-body">

                {/* TIPO */}
                <div className="detalle-tags">
                  <span className={`badge ${eventoSeleccionado.extendedProps.tipo}`}>
                    {eventoSeleccionado.extendedProps.tipo || "Sin tipo"}
                  </span>
                </div>

                {/* TITULO REPETIDO (como ESPOL) */}
                <h3 className="detalle-subtitulo">
                  {eventoSeleccionado.title}
                </h3>

                {/* 🔥 NUEVO BLOQUE */}
                <p className="detalle-info">
                  <strong>Aula:</strong>{" "}
                  {eventoSeleccionado.extendedProps.aula || "No definida"}
                </p>

                <p className="detalle-info">
                  <strong>Equipo:</strong>{" "}
                  {eventoSeleccionado.extendedProps.equipo || "No requerido"}
                </p>

                <p className="detalle-info">
                  <strong>Encargado:</strong>{" "}
                  {eventoSeleccionado.extendedProps.personal || "No requerido"}
                </p>

                <p className="detalle-info">
                  <strong>Modalidad:</strong>{" "}
                  {eventoSeleccionado.extendedProps.modalidad || "No requerido"}
                </p>

                {/* DESCRIPCIÓN */}
                <p className="detalle-texto">
                  {eventoSeleccionado.extendedProps.detalles || "Sin detalles"}
                </p>

                {/* FOOTER */}
                <div className="detalle-footer">
                  <span className="detalle-fecha">
                    📅 {new Date(eventoSeleccionado.start).toLocaleDateString()}
                  </span>

                  <span className="detalle-hora">
                    🕒 {new Date(eventoSeleccionado.start).toLocaleTimeString()}
                  </span>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* BOTÓN FAB */}
        <button 
          className="fab"
          onClick={() => setMostrarModal(true)}
        >
          +
        </button>
        <div className="leyenda">
          {tiposReserva.map((tipo) => (
            <div 
              key={tipo.key} 
               className={`leyenda-item ${filtrosActivos[tipo.key] ? "activo" : "inactivo"}`}
               onClick={() => toggleFiltro(tipo.key)}               
            >
              <span
                className="leyenda-color"
                style={{ backgroundColor: tipo.color }}
              ></span>
              <span className="leyenda-texto">{tipo.label}</span>
            </div>
          ))}
        </div>

      </div>
      <ToastContainer />
    </div>
  );
}

export default App;