import React, { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import '../styles/FormularioRegistro.css';
import useFetch from '../hooks/useFetch';
import apiRoutes from '../apiRoutes';
import departamentosPeru from '../data/departamentos';

const FormularioRegistro = () => {
  const { data, loading, error } = useFetch(apiRoutes.proximoSorteo);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  const [formData, setFormData] = useState({
    dni: '',
    nombres: '',
    apellidos: '',
    telefono: '',
    departamento: '',
    mayorEdad: false
  });

  const [ticketCode, setTicketCode] = useState(null); // ← NUEVO

  useEffect(() => {
    if (!data || !data.sorteo_date) return;
    const target = new Date(data.sorteo_date);
    const timer = setInterval(() => {
      const now = new Date();
      const diff = target - now;
      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);
      setTimeLeft({ days, hours, mins, secs });
    }, 1000);
    return () => clearInterval(timer);
  }, [data]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.culqi.com/js/v4';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.mayorEdad) {
      alert('Debes confirmar que eres mayor de edad.');
      return;
    }
    if (!window.Culqi) {
      alert('Culqi no está cargado.');
      return;
    }

    window.Culqi.publicKey = import.meta.env.VITE_CULQI_PUBLIC_KEY; // Cambiar
    window.Culqi.settings({
      title: 'Game Ztore',
      currency: 'PEN',
      amount: data?.ticket_price * 100 || 1000,
      description: 'Compra de ticket',
      payment_methods: {
        yape: true
      }
    });
    window.Culqi.open();
  };

  useEffect(() => {
    window.culqi = async () => {
      if (window.Culqi.token) {
        const token_yape = window.Culqi.token.id;

        try {
          const res = await fetch('/api/tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...formData,
              token_yape,
              id_transaccion: token_yape,
              estado_pago: 'pagado'
            })
          });

          const result = await res.json();
          if (res.ok) {
            setTicketCode(result.codigo_ticket);
          } else {
            alert(`Error al registrar: ${result.error}`);
          }
        } catch (err) {
          console.error(err);
          alert('Error al conectar con el servidor');
        }
      } else {
        alert('Error con el pago');
      }
    };
  }, [formData]);

  const descargarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('🎫 Ticket Game Ztore', 20, 30);
    doc.setFontSize(12);
    doc.text(`Nombre: ${formData.nombres} ${formData.apellidos}`, 20, 45);
    doc.text(`DNI: ${formData.dni}`, 20, 55);
    doc.text(`Teléfono: ${formData.telefono}`, 20, 65);
    doc.text(`Departamento: ${formData.departamento}`, 20, 75);
    doc.text(`Código de Ticket: ${ticketCode}`, 20, 85);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 95);
    doc.save(`${ticketCode}.pdf`);
  };

  return (
    <section className="registro-form">
      <div className="form-container">
        <h2>Registro de Ticket</h2>

        {ticketCode ? (
          <div className="resultado-ticket">
            <p>🎉 ¡Gracias por tu compra!</p>
            <p>Tu número de ticket es:</p>
            <h3>{ticketCode}</h3>
            <button onClick={descargarPDF}>Descargar ticket en PDF</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input name="dni" placeholder="DNI o C. de Extranjería" value={formData.dni} onChange={handleInputChange} required />
            <input name="nombres" placeholder="Nombres" value={formData.nombres} onChange={handleInputChange} required />
            <input name="apellidos" placeholder="Apellidos" value={formData.apellidos} onChange={handleInputChange} required />
            <input name="telefono" placeholder="Número WhatsApp" value={formData.telefono} onChange={handleInputChange} required />
            <select name="departamento" value={formData.departamento} onChange={handleInputChange} required>
              <option value="">Selecciona Departamento</option>
              {departamentosPeru.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            <label className="checkbox-label">
              <input type="checkbox" name="mayorEdad" checked={formData.mayorEdad} onChange={handleInputChange} />
              Confirmo que soy mayor de edad
            </label>

            <button type="submit" className="btn-yape">Pagar con Yape</button>
          </form>
        )}

        <div className="contador">
          {[
            { key: 'days', label: 'Días' },
            { key: 'hours', label: 'Horas' },
            { key: 'mins', label: 'Minutos' },
            { key: 'secs', label: 'Segundos' },
          ].map(({ key, label }) => (
            <div key={key} className="unidad">
              <div className="numero">{String(timeLeft[key]).padStart(2, '0')}</div>
              <div className="texto">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FormularioRegistro;
