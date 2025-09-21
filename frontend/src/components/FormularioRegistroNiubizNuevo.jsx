import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../apiRoutes.js';

function FormularioRegistroNiubizNuevo() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nombres: '',
        apellidos: '',
        dni: '',
        telefono: '',
        email: '',
        fechaNacimiento: '',
        ciudad: '',
        direccion: '',
        aceptaTerminos: false,
        aceptaPoliticas: false,
        premio: null,
        sorteo: null
    });
    const [errors, setErrors] = useState({});

    // Función para crear formulario HTML que hace POST según documentación Niubiz
    const createNiubizPaymentForm = useCallback((sessionData) => {
        console.log('🎯 Creando formulario POST según documentación Niubiz...');
        console.log('📝 Session data recibida:', sessionData);

        // Remover formularios existentes
        const existingForms = document.querySelectorAll('#niubiz-payment-form');
        existingForms.forEach(form => form.remove());

        // Crear formulario HTML según documentación oficial
        const form = document.createElement('form');
        form.id = 'niubiz-payment-form';
        form.method = 'POST';
        form.action = `${API_BASE_URL}/api/niubiz/payment-response`; // Endpoint donde Niubiz enviará respuesta
        form.style.display = 'none';

        // Campos requeridos según documentación del Botón de Pago App
        const fields = [
            { name: 'data-sessiontoken', value: sessionData.sessionKey },
            { name: 'data-channel', value: 'web' },
            { name: 'data-merchantid', value: sessionData.merchantId },
            { name: 'data-purchasenumber', value: sessionData.purchaseNumber },
            { name: 'data-amount', value: sessionData.amountStr },
            { name: 'data-expirationminutes', value: '15' },
            { name: 'data-timeouturl', value: `${window.location.origin}/pay?status=timeout` },
            { name: 'data-merchantname', value: 'Gameztore Premios' },
            { name: 'data-buttoncolor', value: 'NAVY' },
            { name: 'data-buttonsize', value: 'DEFAULT' },
            { name: 'data-showamount', value: 'TRUE' }
        ];

        fields.forEach(field => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = field.name;
            input.value = field.value;
            form.appendChild(input);
        });

        document.body.appendChild(form);
        console.log('✅ Formulario HTML creado según documentación');
        return form;
    }, []);

    // Función principal de procesamiento de pago según documentación Niubiz
    const procesarPagoNiubiz = useCallback(async () => {
        console.log('🚀 Iniciando flujo de pago según documentación Niubiz...');
        setLoading(true);

        try {
            // Paso 1: Crear sesión de pago
            console.log('📡 Paso 1: Creando sesión de pago...');
            const sessionResponse = await fetch(`${API_BASE_URL}/api/niubiz/session/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: 15.00,
                    currency: 'PEN',
                    customer: {
                        email: formData.email,
                        dni: formData.dni,
                        telefono: formData.telefono,
                        ciudad: formData.ciudad,
                        direccion: formData.direccion
                    }
                })
            });

            if (!sessionResponse.ok) {
                throw new Error(`Error creando sesión: ${sessionResponse.status}`);
            }

            const sessionData = await sessionResponse.json();
            console.log('✅ Sesión creada exitosamente:', sessionData);

            // Paso 2: Guardar datos para recuperar después del pago
            sessionStorage.setItem('formData', JSON.stringify(formData));
            sessionStorage.setItem('paymentSession', JSON.stringify(sessionData));

            // Paso 3: Según documentación - hacer POST al action URL para obtener formulario HTML
            console.log('🎯 Paso 3: Creando formulario POST según documentación...');
            const paymentForm = createNiubizPaymentForm(sessionData);
            
            // Paso 4: Enviar formulario para recibir HTML de pago de Niubiz
            console.log('📤 Paso 4: Enviando formulario para obtener interfaz de pago...');
            paymentForm.submit();

        } catch (error) {
            console.error('❌ Error en procesamiento de pago:', error);
            setErrors({ submit: `Error procesando pago: ${error.message}` });
            setLoading(false);
        }
    }, [formData, createNiubizPaymentForm]);

    // Manejar retorno después del pago
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('status');

        if (status) {
            console.log('🔄 Usuario regresó del pago con status:', status);
            
            // Recuperar datos guardados
            const savedFormData = sessionStorage.getItem('formData');
            const savedSession = sessionStorage.getItem('paymentSession');

            if (savedFormData && savedSession) {
                const formData = JSON.parse(savedFormData);
                const sessionData = JSON.parse(savedSession);

                console.log('📊 Datos recuperados:', { formData, sessionData, status });

                // Limpiar sessionStorage
                sessionStorage.removeItem('formData');
                sessionStorage.removeItem('paymentSession');

                // Redirigir a página de resultados
                navigate('/pay', { 
                    state: { 
                        formData, 
                        sessionData, 
                        status 
                    } 
                });
            } else {
                console.log('⚠️ No se encontraron datos guardados');
                navigate('/pay?status=' + status);
            }
        }
    }, [navigate]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Limpiar error del campo
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.nombres.trim()) newErrors.nombres = 'Nombres son requeridos';
        if (!formData.apellidos.trim()) newErrors.apellidos = 'Apellidos son requeridos';
        if (!formData.dni.trim()) newErrors.dni = 'DNI es requerido';
        else if (!/^\d{8}$/.test(formData.dni)) newErrors.dni = 'DNI debe tener 8 dígitos';
        if (!formData.telefono.trim()) newErrors.telefono = 'Teléfono es requerido';
        if (!formData.email.trim()) newErrors.email = 'Email es requerido';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email inválido';
        if (!formData.fechaNacimiento) newErrors.fechaNacimiento = 'Fecha de nacimiento es requerida';
        if (!formData.ciudad.trim()) newErrors.ciudad = 'Ciudad es requerida';
        if (!formData.direccion.trim()) newErrors.direccion = 'Dirección es requerida';
        if (!formData.aceptaTerminos) newErrors.aceptaTerminos = 'Debe aceptar términos y condiciones';
        if (!formData.aceptaPoliticas) newErrors.aceptaPoliticas = 'Debe aceptar políticas de privacidad';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            console.log('❌ Formulario inválido');
            return;
        }

        console.log('✅ Formulario válido, iniciando flujo Niubiz según documentación...');
        await procesarPagoNiubiz();
    };

    return (
        <div className="formulario-registro-niubiz">
            <h2>Registro para Sorteo - Pago con Niubiz</h2>
            <p>Complete los datos para participar en el sorteo (S/ 15.00)</p>

            {errors.submit && (
                <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
                    {errors.submit}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Nombres:</label>
                    <input
                        type="text"
                        name="nombres"
                        value={formData.nombres}
                        onChange={handleInputChange}
                        required
                    />
                    {errors.nombres && <span className="error">{errors.nombres}</span>}
                </div>

                <div className="form-group">
                    <label>Apellidos:</label>
                    <input
                        type="text"
                        name="apellidos"
                        value={formData.apellidos}
                        onChange={handleInputChange}
                        required
                    />
                    {errors.apellidos && <span className="error">{errors.apellidos}</span>}
                </div>

                <div className="form-group">
                    <label>DNI:</label>
                    <input
                        type="text"
                        name="dni"
                        value={formData.dni}
                        onChange={handleInputChange}
                        maxLength="8"
                        required
                    />
                    {errors.dni && <span className="error">{errors.dni}</span>}
                </div>

                <div className="form-group">
                    <label>Teléfono:</label>
                    <input
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        required
                    />
                    {errors.telefono && <span className="error">{errors.telefono}</span>}
                </div>

                <div className="form-group">
                    <label>Email:</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                    />
                    {errors.email && <span className="error">{errors.email}</span>}
                </div>

                <div className="form-group">
                    <label>Fecha de Nacimiento:</label>
                    <input
                        type="date"
                        name="fechaNacimiento"
                        value={formData.fechaNacimiento}
                        onChange={handleInputChange}
                        required
                    />
                    {errors.fechaNacimiento && <span className="error">{errors.fechaNacimiento}</span>}
                </div>

                <div className="form-group">
                    <label>Ciudad:</label>
                    <input
                        type="text"
                        name="ciudad"
                        value={formData.ciudad}
                        onChange={handleInputChange}
                        required
                    />
                    {errors.ciudad && <span className="error">{errors.ciudad}</span>}
                </div>

                <div className="form-group">
                    <label>Dirección:</label>
                    <input
                        type="text"
                        name="direccion"
                        value={formData.direccion}
                        onChange={handleInputChange}
                        required
                    />
                    {errors.direccion && <span className="error">{errors.direccion}</span>}
                </div>

                <div className="form-group">
                    <label>
                        <input
                            type="checkbox"
                            name="aceptaTerminos"
                            checked={formData.aceptaTerminos}
                            onChange={handleInputChange}
                        />
                        Acepto los términos y condiciones
                    </label>
                    {errors.aceptaTerminos && <span className="error">{errors.aceptaTerminos}</span>}
                </div>

                <div className="form-group">
                    <label>
                        <input
                            type="checkbox"
                            name="aceptaPoliticas"
                            checked={formData.aceptaPoliticas}
                            onChange={handleInputChange}
                        />
                        Acepto las políticas de privacidad
                    </label>
                    {errors.aceptaPoliticas && <span className="error">{errors.aceptaPoliticas}</span>}
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    style={{
                        backgroundColor: loading ? '#ccc' : '#007bff',
                        color: 'white',
                        padding: '12px 24px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        marginTop: '1rem'
                    }}
                >
                    {loading ? 'Procesando pago...' : 'Pagar S/ 15.00 con Niubiz'}
                </button>
            </form>

            <style jsx>{`
                .formulario-registro-niubiz {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 2rem;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }

                .form-group {
                    margin-bottom: 1rem;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: bold;
                }

                .form-group input {
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                }

                .error {
                    color: red;
                    font-size: 12px;
                    display: block;
                    margin-top: 4px;
                }

                .error-message {
                    background: #ffebee;
                    border: 1px solid #f44336;
                    padding: 1rem;
                    border-radius: 4px;
                }
            `}</style>
        </div>
    );
}

export default FormularioRegistroNiubizNuevo;