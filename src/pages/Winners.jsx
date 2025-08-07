import WinnersTable from '../components/WinnersTable'
import '../styles/Ganadores.css'
const data =
{
    "Autos Toyota Yaris": [
        { "nombre": "Luis Ramírez", "modelo": "Yaris 2025", "ticket": "A1234", "departamento": "Lima" },
        { "nombre": "María Pérez", "modelo": "Yaris 2025", "ticket": "A5678", "departamento": "Cusco" },
        { "nombre": "Javier Soto", "modelo": "Yaris 2025", "ticket": "A9101", "departamento": "Arequipa" },
        { "nombre": "Paola Díaz", "modelo": "Yaris 2025", "ticket": "A1123", "departamento": "Tacna" },
        { "nombre": "Roberto Silva", "modelo": "Yaris 2025", "ticket": "A1415", "departamento": "Puno" }
    ],
    "Motos Pulsar N400": [
        { "nombre": "Carlos Gómez", "ticket": "M001", "departamento": "Arequipa" },
        { "nombre": "Ana Torres", "ticket": "M002", "departamento": "Trujillo" },
        { "nombre": "Eduardo Medina", "ticket": "M003", "departamento": "Lambayeque" },
        { "nombre": "Lucía Ríos", "ticket": "M004", "departamento": "Tumbes" },
        { "nombre": "Joel Mena", "ticket": "M005", "departamento": "Ica" },
        { "nombre": "Natalia Ponce", "ticket": "M006", "departamento": "Lima" }
    ],
    "Celulares Galaxy S24": [
        { "nombre": "Jorge Salas", "modelo": "S24 Ultra", "ticket": "C123", "departamento": "Tacna" },
        { "nombre": "Lucía Martínez", "modelo": "S24 Plus", "ticket": "C456", "departamento": "Piura" },
        { "nombre": "Kevin Rojas", "modelo": "S24", "ticket": "C789", "departamento": "Iquitos" },
        { "nombre": "Maribel Suárez", "modelo": "S24 Ultra", "ticket": "C101", "departamento": "Lima" },
        { "nombre": "Ramiro Vargas", "modelo": "S24 Plus", "ticket": "C202", "departamento": "Chiclayo" }
    ],
    "Laptops HP Pavilion": [
        { "nombre": "Roberto Paredes", "modelo": "Pavilion x360", "ticket": "L101", "departamento": "Ica" },
        { "nombre": "Daniela Huamán", "modelo": "Pavilion 15", "ticket": "L102", "departamento": "Loreto" },
        { "nombre": "Jesús Contreras", "modelo": "Pavilion x360", "ticket": "L103", "departamento": "Callao" },
        { "nombre": "Valeria Herrera", "modelo": "Pavilion 15", "ticket": "L104", "departamento": "Ayacucho" },
        { "nombre": "Felipe Vargas", "modelo": "Pavilion 13", "ticket": "L105", "departamento": "Moquegua" }
    ],
    "Vales de Consumo S/500": [
        { "nombre": "Karen López", "ticket": "V001", "departamento": "Puno" },
        { "nombre": "José Díaz", "ticket": "V002", "departamento": "Junín" },
        { "nombre": "Mirtha Ñahui", "ticket": "V003", "departamento": "Huancayo" },
        { "nombre": "Laura Quispe", "ticket": "V004", "departamento": "Ancash" },
        { "nombre": "Mario Gutiérrez", "ticket": "V005", "departamento": "Cajamarca" },
        { "nombre": "Rosa Núñez", "ticket": "V006", "departamento": "Pasco" },
        { "nombre": "Esteban Olivares", "ticket": "V007", "departamento": "Madre de Dios" },
        { "nombre": "Yolanda Campos", "ticket": "V008", "departamento": "Apurímac" },
        { "nombre": "Carmen Aguirre", "ticket": "V009", "departamento": "Ucayali" },
        { "nombre": "Pedro Sánchez", "ticket": "V010", "departamento": "San Martín" }
    ]
}


export default function Ganadores() {
    return (
        <div className="ganadores-page">

            <h1>🎉 GANADORES DEL 31 de JULIO 🎉</h1>
            <WinnersTable data={data} />
        </div>
    )
}