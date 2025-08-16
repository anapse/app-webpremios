// /src/pages/LibroReclamaciones.jsx
import React, { useState } from "react";
import "../styles/main.css";
import "../styles/libro-reclamaciones.css";
import usePost from "../hooks/usePost";
import apiRoutes from "../apiRoutes";

const INIT = {
  tipo_documento: "DNI",
  numero_documento: "",
  tipo_comprobante: "Boleta",
  numero_comprobante: "",
  email: "",
  celular: "",
  operador: "",
  producto_servicio: "",
  motivo_reclamo: "",
  ignorado_solicitud: false,
  ofrecio_fecha_hora: false,
};

export default function LibroReclamaciones() {
  const [form, setForm] = useState(INIT);
  const { data, loading, error, post } = usePost(apiRoutes.libroReclamaciones);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((s) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
  };

  const validate = () => {
    if (!form.numero_documento) return "Documento obligatorio";
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) return "Email inválido";
    if (!form.celular) return "Celular obligatorio";
    if (!form.producto_servicio) return "Producto/Servicio obligatorio";
    if (!form.motivo_reclamo || form.motivo_reclamo.trim().length < 10)
      return "Motivo mínimo 10 caracteres";
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) return alert(v);
    try { await post(form); } catch {}
  };

  const reset = () => setForm(INIT);

  return (
    <div className="container">
      <header className="header">
        <h1 className="logo">Game Ztore</h1>
        <p className="tagline">Libro de Reclamaciones</p>
      </header>

      <main className="main">
        <section className="lr-container">
        <section className="lr-card lr-legal">
  <p>
    La formulación del reclamo no impide acudir a otras vías de solución de controversias
    ni es requisito previo para interponer una denuncia ante el INDECOPI.
  </p>
  <p>
    GamezTorePremios  deberá dar respuesta al reclamo o queja en un plazo 
    no mayor a <b>quince (15) días hábiles</b>, el cual es improrrogable sin previo acuerdo 
    con el cliente.
  </p>
  <p>
    El reclamo será declarado improcedente en las siguientes circunstancias:
  </p>
  <ul>
    <li>No se logra contactar al cliente tras un máximo de 3 intentos.</li>
    <li>El cliente utiliza insultos o menosprecios hacia nuestros colaboradores.</li>
    <li>El reclamo carece de fundamento.</li>
    <li>El cliente se niega a proporcionar información adicional necesaria.</li>
    <li>Reclamos repetidos sobre la misma cuestión sin nueva información.</li>
    <li>Se determina que el reclamo se basa en un malentendido ya aclarado.</li>
    <li>No hay respuesta del cliente a la resolución propuesta en un plazo razonable.</li>
    <li>Reclamo anónimo que no se puede verificar.</li>
    <li>El reclamo está relacionado con políticas previamente comunicadas y aceptadas.</li>
    <li>Se detecta intención maliciosa o de generar conflicto.</li>
  </ul>
</section>


          <form className="lr-card lr-form" onSubmit={onSubmit}>
            <h2 className="lr-title">Datos del consumidor</h2>

            <div className="lr-grid-2">
              <label>
                Tipo de documento
                <select name="tipo_documento" value={form.tipo_documento} onChange={onChange}>
                  <option value="DNI">DNI</option>
                  <option value="CE">Carné de Extranjería</option>
                  <option value="Pasaporte">Pasaporte</option>
                </select>
              </label>

              <label>
                Número de documento
                <input
                  name="numero_documento"
                  value={form.numero_documento}
                  onChange={onChange}
                  maxLength={15}
                />
              </label>

              <label>
                Tipo de comprobante
                <select name="tipo_comprobante" value={form.tipo_comprobante} onChange={onChange}>
                  <option>Boleta</option>
                  <option>Factura</option>
                  <option>Ticket</option>
                  <option value="">(No aplica)</option>
                </select>
              </label>

              <label>
                Número de comprobante
                <input
                  name="numero_comprobante"
                  value={form.numero_comprobante}
                  onChange={onChange}
                  maxLength={20}
                />
              </label>

              <label>
                E-mail
                <input type="email" name="email" value={form.email} onChange={onChange} />
              </label>

              <label>
                Celular
                <input name="celular" value={form.celular} onChange={onChange} maxLength={20} />
              </label>

              <label>
                Operador
                <input name="operador" value={form.operador} onChange={onChange} />
              </label>

              <label className="lr-col-span-2">
                Producto o servicio contratado
                <input
                  name="producto_servicio"
                  value={form.producto_servicio}
                  onChange={onChange}
                />
              </label>

              <label className="lr-col-span-2">
                Motivo o reclamo (describa el motivo y lo que solicita)
                <textarea
                  name="motivo_reclamo"
                  value={form.motivo_reclamo}
                  onChange={onChange}
                  rows={5}
                />
              </label>

              <label className="lr-check">
                <input
                  type="checkbox"
                  name="ignorado_solicitud"
                  checked={form.ignorado_solicitud}
                  onChange={onChange}
                />
                ¿Nuestro equipo ignoró su solicitud?
              </label>

              <label className="lr-check">
                <input
                  type="checkbox"
                  name="ofrecio_fecha_hora"
                  checked={form.ofrecio_fecha_hora}
                  onChange={onChange}
                />
                ¿Se ofreció fecha y hora de atención?
              </label>
            </div>

            {error && <div className="lr-alert error">Error: {error}</div>}
            {data?.codigo_reclamo && (
              <div className="lr-alert success">
                ¡Reclamo registrado! Código: <b>{data.codigo_reclamo}</b>
              </div>
            )}

            <div className="lr-actions">
              <button type="button" className="lr-btn secondary" onClick={reset} disabled={loading}>
                Borrar formulario
              </button>
              <button type="submit" className="lr-btn primary" disabled={loading}>
                {loading ? "Enviando..." : "Enviar reclamo"}
              </button>
            </div>

            <p className="lr-footnote">⚠ No envíe contraseñas en este formulario.</p>
          </form>
        </section>
      </main>
    </div>
  );
}
