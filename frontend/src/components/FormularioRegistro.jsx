// src/components/FormularioRegistro.jsx
import React, { useState, useEffect } from 'react';
import '../styles/FormularioRegistro.css'; // Asegúrate de tener este archivo CSS

const FormularioRegistro = () => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

    useEffect(() => {
        const target = new Date("2025-08-30T23:59:59"); // Fecha del sorteo
        const timer = setInterval(() => {
            const now = new Date();
            const diff = target - now;
            if (diff <= 0) return clearInterval(timer);
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const mins = Math.floor((diff / (1000 * 60)) % 60);
            const secs = Math.floor((diff / 1000) % 60);
            setTimeLeft({ days, hours, mins, secs });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="registro-form">
            <div className="form-container">
                <h2>Registro de Ticket</h2>
                <form>
                    <input placeholder="DNI o C. de Extranjería" required />
                    <input placeholder="Nombres" required />
                    <input placeholder="Apellidos" required />
                    <input placeholder="Número WhatsApp" required />
                    <select required>
                        <option value="">Selecciona Departamento</option>
                        <option>Lima</option>
                        <option>Cusco</option>
                        <option>Arequipa</option>
                        {/* Agrega más departamentos si deseas */}
                    </select>
                    <label className="checkbox-label">
                        <input type="checkbox" required />
                        Confirmo que soy mayor de edad
                    </label>
                    <input type="file" accept="image/*" required />
                    <button type="submit">Enviar</button>
                </form>

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
