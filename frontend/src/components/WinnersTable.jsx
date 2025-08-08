import '../styles/winnersTable.css'
import React from 'react';
const WinnersTable = ({ data }) => {
    return (
        <div className="winners-page">
            <div className="winners-wrapper">
                {Object.entries(data).map(([tipoPremio, ganadores], index) => {
                    if (!ganadores.length) return null;

                    // Filtra las llaves que tengan al menos un valor no nulo/undefined/vacío
                    const columnasVisibles = Object.keys(ganadores[0]).filter(key =>
                        ganadores.some(g => g[key] !== null && g[key] !== undefined && g[key] !== '')
                    );

                    return (
                        <div key={index}>
                            <h2 className="table-title">🎉 {tipoPremio}</h2>
                            <table className="styled-table">
                                <thead>
                                    <tr>
                                        <th>Nro</th>
                                        {columnasVisibles.map((key, i) => (
                                            <th key={i}>{key.charAt(0).toUpperCase() + key.slice(1)}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {ganadores.map((g, i) => (
                                        <tr key={i}>
                                            <td>{i + 1}</td>
                                            {columnasVisibles.map((key, j) => (
                                                <td key={j}>{g[key]}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
export default WinnersTable;