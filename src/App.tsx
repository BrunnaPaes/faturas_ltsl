// Estrutura inicial do app com login simples e painel de faturas filtradas

"use client";

import { useState } from "react";
import faturas from "./faturas_ltsl_filtradas.json"; // simulando import de dados do CSV convertido

export default function AppFaturasLTSL() {
  const [usuario, setUsuario] = useState("");
  const [logado, setLogado] = useState(false);

  const handleLogin = () => {
    if (!usuario) return alert("Informe seu nome");
    setLogado(true);
  };

  const faturasFiltradas = usuario.toUpperCase() === "VIVIAN MAGALHAES"
    ? faturas
    : faturas.filter(f => f.Vendedor.toUpperCase() === usuario.toUpperCase());

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      {!logado ? (
        <div style={{ maxWidth: 400, margin: "100px auto", textAlign: "center" }}>
          <h2>Login LTSL</h2>
          <input
            placeholder="Digite seu nome"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            style={{ width: "100%", padding: 10, fontSize: 16 }}
          />
          <button onClick={handleLogin} style={{ marginTop: 12, padding: 10, width: "100%", background: "#0070f3", color: "#fff", border: "none", borderRadius: 4 }}>
            Entrar
          </button>
        </div>
      ) : (
        <div>
          <h2>Faturas - {usuario}</h2>
          {faturasFiltradas.length === 0 ? (
            <p>Nenhuma fatura encontrada.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr>
                  <th style={th}>Cliente</th>
                  <th style={th}>CNPJ</th>
                  <th style={th}>Fatura</th>
                  <th style={th}>Vencimento</th>
                  <th style={th}>Valor</th>
                  <th style={th}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {faturasFiltradas.map((f, i) => (
                  <tr key={i}>
                    <td style={td}>{f.Cliente}</td>
                    <td style={td}>{f.CNPJ}</td>
                    <td style={td}>{f.Fatura}</td>
                    <td style={td}>{new Date(f.Vencimento).toLocaleDateString("pt-BR")}</td>
                    <td style={td}>R$ {parseFloat(f.Saldo).toFixed(2)}</td>
                    <td style={td}>
                      <button style={{ padding: "4px 8px", background: "#25D366", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>
                        Calcular
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

const th = { border: "1px solid #ccc", padding: 8, background: "#f0f0f0" };
const td = { border: "1px solid #ccc", padding: 8 };

// OBS: O próximo passo é conectar o botão "Calcular" ao formulário de cálculo + mensagem
