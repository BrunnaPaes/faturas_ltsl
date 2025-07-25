return (
  <div style={{ padding: 24, fontFamily: "sans-serif", background: "#f9f9fb", minHeight: "100vh" }}>
    <img src="/logo.png" alt="Logo LTSL" style={{ width: 180, marginBottom: 24, display: "block", marginLeft: "auto", marginRight: "auto" }} />
    
    {!logado ? (
      <div style={{ maxWidth: 400, margin: "100px auto", textAlign: "center", background: "#fff", padding: 24, borderRadius: 10, boxShadow: "0 2px 8px #0001" }}>
        <h2>Login LTSL</h2>
        <input
          placeholder="Digite seu nome"
          value={usuario}
          onChange={e => setUsuario(e.target.value)}
          style={{ width: "100%", padding: 10, fontSize: 16, marginBottom: 14 }}
        />
        <button onClick={handleLogin} style={{ width: "100%", padding: 12, background: "#0070f3", color: "#fff", border: "none", borderRadius: 6, fontWeight: "bold", fontSize: 16 }}>
          Entrar
        </button>
      </div>
    ) : (
      <div>
        <button onClick={() => setLogado(false)} style={{ marginBottom: 20, padding: 8, background: "#eee", border: "none", borderRadius: 4, cursor: "pointer" }}>← Voltar</button>
        <h2 style={{ marginBottom: 0 }}>Faturas - {usuario.toUpperCase()}</h2>

        {/* Gráficos */}
        <div style={{ display: 'flex', gap: 24, margin: "30px 0 16px" }}>
          <div style={{ flex: 1, background: "#fff", borderRadius: 8, padding: 16, boxShadow: "0 2px 8px #0001" }}>
            <h4 style={{ marginBottom: 8 }}>Top 5 Faturas Atrasadas</h4>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={topAtrasadas}>
                <XAxis dataKey="name" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="valor" fill="#d42b1a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex: 1, background: "#fff", borderRadius: 8, padding: 16, boxShadow: "0 2px 8px #0001" }}>
            <h4 style={{ marginBottom: 8 }}>Resumo Total</h4>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={[
                { tipo: "Atrasado", valor: totalAtrasado },
                { tipo: "A Vencer", valor: totalAVencer }
              ]}>
                <XAxis dataKey="tipo" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="valor" fill="#0070f3" />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ textAlign: "center", marginTop: 8 }}>
              <span style={{ color: "#d42b1a" }}>Atrasado: {totalAtrasado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span> &nbsp;|&nbsp;
              <span style={{ color: "#0070f3" }}>A Vencer: {totalAVencer.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
            </div>
          </div>
        </div>

        {/* Filtro de clientes */}
        <div style={{ marginBottom: 18 }}>
          <input
            type="text"
            placeholder="Filtrar por cliente..."
            value={filtroCliente}
            onChange={e => setFiltroCliente(e.target.value)}
            style={{ width: 300, padding: 8, fontSize: 15, borderRadius: 4, border: "1px solid #ccc" }}
          />
        </div>

        {/* Tabela de faturas */}
        <div style={{ overflowX: "auto", marginBottom: 24 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px #0001" }}>
            <thead>
              <tr>
                <th style={th}>Cliente</th>
                <th style={th}>CNPJ</th>
                <th style={th}>Fatura</th>
                <th style={th}>Vencimento</th>
                <th style={th}>Valor</th>
                <th style={th}>Dias Atraso</th>
                <th style={th}>Status</th>
                <th style={th}>Vendedor</th>
                <th style={th}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {faturasExibidas.map((f, i) => (
                <tr key={i} style={{ background: calcularStatus(f.Vencimento) === "ATRASADA" ? "#ffeaea" : "#eaffea" }}>
                  <td style={td}>{f.Cliente}</td>
                  <td style={td}>{f.CNPJ}</td>
                  <td style={td}>{f.Fatura}</td>
                  <td style={td}>{new Date(f.Vencimento).toLocaleDateString("pt-BR")}</td>
                  <td style={td}>R$ {parseFloat(f.Saldo.replace(",", "."))?.toFixed(2)}</td>
                  <td style={td}>{calcularDiasAtraso(f.Vencimento)}</td>
                  <td style={td}>{calcularStatus(f.Vencimento)}</td>
                  <td style={td}>{f.Vendedor}</td>
                  <td style={td}>
                    <button
                      style={{ padding: "4px 10px", background: "#0070f3", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
                      onClick={() => {
                        setFaturaSelecionada(f);
                        setMensagem("");
                        setPagamento("");
                        setProtestado("nao");
                        setDominio(f.Dominio || "SBA");
                        setNumeroWhatsApp("");
                      }}
                    >Calcular</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detalhe/calculadora da fatura */}
        {faturaSelecionada && (
          <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px #0001", padding: 18, marginBottom: 30 }}>
            <h3>Fatura: {faturaSelecionada.Fatura}</h3>
            <p>Cliente: {faturaSelecionada.Cliente}</p>
            <p>Valor original: R$ {parseFloat(faturaSelecionada.Saldo.replace(",", "."))?.toFixed(2)}</p>
            <p>Vencimento: {new Date(faturaSelecionada.Vencimento).toLocaleDateString("pt-BR")}</p>
            <label>Data de Pagamento:</label>
            <input type="date" value={pagamento} onChange={e => setPagamento(e.target.value)} style={inputStyle} />

            <label>Protestado?</label>
            <select value={protestado} onChange={e => setProtestado(e.target.value)} style={inputStyle}>
              <option value="nao">Não</option>
              <option value="sim">Sim</option>
            </select>

            <label>Domínio:</label>
            <select value={dominio} onChange={e => setDominio(e.target.value)} style={inputStyle}>
              <option value="SBA">SBA</option>
              <option value="SLU">SLU</option>
            </select>

            <button onClick={calcularValorAtualizado} style={botao}>Gerar Mensagem</button>

            {mensagem && (
              <>
                <label style={{ marginTop: 16 }}>Número WhatsApp (com DDD):</label>
                <input
                  value={numeroWhatsApp}
                  onChange={e => setNumeroWhatsApp(e.target.value)}
                  placeholder="Ex: 41999998888"
                  style={inputStyle}
                />
                <textarea readOnly value={mensagem} style={{ ...inputStyle, height: 160 }} />
                <button onClick={enviarWhatsApp} style={{ ...botao, backgroundColor: "#25D366", marginTop: 4 }}>Enviar via WhatsApp</button>
              </>
            )}
          </div>
        )}
      </div>
    )}
  </div>
);

// estilos auxiliares
const inputStyle = {
  width: "100%",
  padding: 8,
  margin: "8px 0",
  border: "1px solid #ccc",
  borderRadius: 4,
  fontSize: 14,
};
const botao = {
  width: "100%",
  padding: 10,
  backgroundColor: "#0070f3",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  fontWeight: "bold",
  marginTop: 10,
};
const th = { border: "1px solid #ccc", padding: 8, background: "#f0f0f0" };
const td = { border: "1px solid #ccc", padding: 8 };
