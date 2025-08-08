import BotonRegistro from "../components/BotonRegistro"
import "../styles/main.css"

export default function Home() {
    return (
        <div className="container">
            <header className="header">
                <h1 className="logo">Game Ztore</h1>
                <p className="tagline">Participa y gana premios cada mes</p>
            </header>

            <main className="main">
                <h2 className="title">🎁 Sorteo activo: 31 de Agosto</h2>
                <p className="price">Compra tu ticket por solo <strong>S/ 40</strong></p>

                <BotonRegistro />

                <div className="cards">
                    <div className="card">
                        <h3>🚗 Auto 0KM</h3>
                        <p>Participa por un auto completamente nuevo</p>
                    </div>
                    <div className="card">
                        <h3>📱 iPhone 15 Pro</h3>
                        <p>También sorteamos tecnología de última generación</p>
                    </div>
                    <div className="card">
                        <h3>💸 S/ 10,000</h3>
                        <p>Y premios en efectivo para 10 ganadores más</p>
                    </div>
                </div>
            </main>

            <footer className="footer">
                &copy; 2025 Game Ztore. Todos los derechos reservados.
            </footer>
        </div>
    )
}