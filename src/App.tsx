import React, { useEffect, useState } from "react";

// Função para converter o JSON do Google Sheets em array de objetos
function parseGoogleSheetJSON(data) {
  const json = JSON.parse(data.substring(47).replace(/;$/, "")); // remove o prefixo e sufixo
  const cols = json.table.cols.map(col => col.label || "");
  const rows = json.table.rows
    .filter(row => row.c && row.c.length)
    .map(row =>
      Object.fromEntries(
        row.c.map((cell, i) => [cols[i], cell ? (cell.f ?? cell.v ?? "") : ""])
      )
    );
  // Remove linhas que são cabeçalho ou resumo (tipo "CONTROLE DE COBRANÇA")
  return rows.filter(obj =>
    obj["CLIENTE"] && obj["FATURA"] && obj["SALDO"] !== ""
  );
}

export default function App() {
  const [faturas, setFaturas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  // Filtros
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroVendedor, setFiltroVendedor] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroDominio, setFiltroDominio] = useState("");

  useEffect(() => {
    setCarregando(true);
    fetch(
      "https://docs.google.com/spreadsheets/d/1-Td1UT7x9aKyCf_PHr9WZ7D3ZJNFxpMZ/gviz/tq?tqx=out:json&sheet=Cobrança"
    )
      .then(res => res.text())
      .then(raw => {
        setFaturas(parseGoogleSheetJSON(raw));
        setCarregando(false);
      })
      .catch(e => {
        setErro("Erro ao carregar dados da planilha.");
        setCarregando(false);
      });
  }, []);

  // Gera as opções de filtro a partir dos dados reais
  const vendedores = [...new Set(faturas.map(f => f["VENDEDOR"]).filter(Boolean))];
  const dominios = [...new Set(faturas.map(f => f["DOM"]).filter(Boolean))];
  const statusList = [...new Set(faturas.map(f => f["LIQUIDADA/ATRASADA"]).filter(Boolean))];

  // Filtro aplicado
  const faturasFiltradas = faturas.filter(f =>
    (filtroCliente === "" || (f["CLIENTE"] && f["CLIENTE"].toLowerCase().includes(filtroCliente.toLowerCase()))) &&
    (filtroVendedor === "" || f["VENDEDOR"] === filtroVendedor) &&
    (filtroDominio === "" || f["DOM"] === filtroDominio) &&
    (filtroStatus === "" || f["LIQUIDADA/ATRASADA"] === filtroStatus)
  );

  // Gráficos/resumo
  const atrasadas = faturasFiltradas.filter(f => String(f["LIQUIDADA/ATRASADA"]).toUpperCase().includes("ATRASADA"));
  const topAtrasadas = atrasadas
    .sort((a, b) => (Number(String(b["SALDO"]).replace(".", "").replace(",", ".") || 0) - Number(String(a["SALDO"]).replace(".", "").replace(",", ".") || 0)))
    .slice(0, 5);

  const totalAtrasado = atrasadas.reduce(
    (acc, f) => acc + (Number(String(f["SALDO"]).replace(".", "").replace(",", ".") || 0)), 0
  );
  const totalAVencer = faturasFiltradas
    .filter(f => String(f["LIQUIDADA/ATRASADA"]).toUpperCase().includes("A VENCER"))
    .reduce((acc, f) => acc + (Number(String(f["SALDO"]).replace(".", "").replace(",", ".") || 0)), 0);

  return (
    <div style={{ background: "#f9f9fb", minHeight: "100vh", fontFamily: "sans-serif", padding: 0 }}>
      {/* LOGO */}
      <div style={{ textAlign: "center", marginTop: 24 }}>
        <img
          src="https://i.imgur.com/sgO3fqf.png"
          alt="LTSL Express"
          style={{ width: 180, margin: "0 auto", display: "block" }}
        />
      </div>
      <div style={{ maxWidth: 1200, margin: "32px auto 0 auto" }}>
        <h2>
          Faturas - <span style={{ color: "#111", fontWeight: 700 }}>LTSL</span>
        </h2>
        {/* Gráficos/Resumo */}
        <div style={{ display: "flex", gap: 28, marginBottom: 20 }}>
          {/* Top 5 faturas atrasadas */}
          <div style={{ flex: 1, background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 8px #eee" }}>
            <b>Top 5 Faturas Atrasadas</b>
            <ul style={{ margin: 12 }}>
              {topAtrasadas.length === 0 ? (
                <li>Nenhuma fatura atrasada</li>
              ) : (
                topAtrasadas.map((f, i) => (
                  <li key={i}>
                    <b>{f["CLIENTE"]}</b> — {f["FATURA"]} — R${" "}
                    {Number(String(f["SALDO"]).replace(".", "").replace(",", ".") || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </li>
                ))
              )}
            </ul>
          </div>
          {/* Resumo total */}
          <div style={{ flex: 1, background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 8px #eee" }}>
            <b>Resumo Total</b>
            <div style={{ marginTop: 24, fontSize: 17 }}>
              <span style={{ color: "#d00", fontWeight: 700 }}>
                Atrasado: R$ {totalAtrasado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
              <span style={{ color: "#666", fontWeight: 300 }}> | </span>
              <span style={{ color: "#0066ee", fontWeight: 700 }}>
                A Vencer: R$ {totalAVencer.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
        {/* Filtros */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <input
            placeholder="Filtrar Cliente"
            value={filtroCliente}
            onChange={e => setFiltroCliente(e.target.value)}
            style={{ padding: 7, borderRadius: 5, border: "1px solid #ccc", flex: 2 }}
          />
          <select value={filtroVendedor} onChange={e => setFiltroVendedor(e.target.value)} style={{ flex: 1, padding: 7, borderRadius: 5, border: "1px solid #ccc" }}>
            <option value="">Todos Vendedores</option>
            {vendedores.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{ flex: 1, padding: 7, borderRadius: 5, border: "1px solid #ccc" }}>
            <option value="">Todos Status</option>
            {statusList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filtroDominio} onChange={e => setFiltroDominio(e.target.value)} style={{ flex: 1, padding: 7, borderRadius: 5, border: "1px solid #ccc" }}>
            <option value="">Todos Domínios</option>
            {dominios.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        {/* Tabela */}
        <div style={{
          background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px #eee",
          overflowX: "auto", padding: 8, marginBottom: 40
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
            <thead>
              <tr style={{ background: "#f4f4f4", fontWeight: 700 }}>
                <th>Cliente</th>
                <th>CNPJ</th>
                <th>Fatura</th>
                <th>Vencimento</th>
                <th>Valor</th>
                <th>Dias Atraso</th>
                <th>Status</th>
                <th>Vendedor</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {faturasFiltradas.map((f, i) => (
                <tr key={i}>
                  <td>{f["CLIENTE"]}</td>
                  <td>{f["CNPJ/CPF"]}</td>
                  <td>{f["FATURA"]}</td>
                  <td>{f["VENCIMEN"]}</td>
                  <td>R$ {Number(String(f["SALDO"]).replace(".", "").replace(",", ".") || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  <td>{f["DIAS ATRASO"]}</td>
                  <td>{f["LIQUIDADA/ATRASADA"]}</td>
                  <td>{f["VENDEDOR"]}</td>
                  <td>
                    <button style={{ background: "#1a73e8", color: "#fff", border: 0, borderRadius: 5, padding: "3px 13px", cursor: "pointer" }}>
                      Calcular
                    </button>
                  </td>
                </tr>
              ))}
              {faturasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", color: "#888", padding: 32 }}>
                    Nenhum registro encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {carregando && <div>Carregando dados...</div>}
        {erro && <div style={{ color: "#c00" }}>{erro}</div>}
      </div>
    </div>
  );
}
