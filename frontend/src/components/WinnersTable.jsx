import '../styles/winnersTable.css'
import React from 'react';

const WinnersTable = ({ data }) => {
    return (
        <div className="winners-page">
            <div className="winners-wrapper">
                {Object.entries(data).map(([tipoPremio, ganadores], index) => (
                    <div key={index}>
                        <h2 className="table-title">🎉 {tipoPremio}</h2>
                        <table className="styled-table">
                            <thead>
                                <tr>
                                    <th>Nro</th>
                                    {Object.keys(ganadores[0] || {}).map((key, i) => (
                                        <th key={i}>{key.charAt(0).toUpperCase() + key.slice(1)}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {ganadores.map((g, i) => (
                                    <tr key={i}>
                                        <td>{i + 1}</td>
                                        {Object.values(g).map((val, j) => (
                                            <td key={j}>{val}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WinnersTable;