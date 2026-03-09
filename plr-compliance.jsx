import { useState, useCallback } from "react";

// ─── Machado Meyer Brand Colors ───────────────────────────────────────────────
// Navy: #0A1628  Gold: #B8962E  Light: #F5F2EC  Gray: #6B7280

const MM_LOGO = () => (
  <svg width="220" height="48" viewBox="0 0 220 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="6" height="48" fill="#B8962E"/>
    <rect x="10" width="6" height="48" fill="#B8962E"/>
    <text x="26" y="20" fontFamily="'Georgia', serif" fontSize="15" fontWeight="700" fill="#0A1628" letterSpacing="2">MACHADO MEYER</text>
    <text x="26" y="36" fontFamily="'Georgia', serif" fontSize="9" fill="#B8962E" letterSpacing="3">ADVOGADOS</text>
    <line x1="26" y1="40" x2="220" y2="40" stroke="#B8962E" strokeWidth="0.5"/>
  </svg>
);

const SYSTEM_PROMPT = `Você é um especialista em Direito do Trabalho brasileiro, com foco em Participação nos Lucros e Resultados (PLR). Você atua no escritório Machado Meyer Advogados, área de consultoria trabalhista.

Sua tarefa é analisar acordos coletivos de PLR e verificar a conformidade com a Lei 10.101/2000 e demais normas aplicáveis.

ASPECTOS A ANALISAR (verifique cada um):
1. Vigência e periodicidade (art. 2º, §1º - mínimo semestral)
2. Comissão paritária de negociação (art. 2º, I)
3. Critérios de elegibilidade e regras de proporcionalidade
4. Indicadores e metas mensuráveis (art. 2º, §1º)
5. Periodicidade de pagamento (art. 3º - máx. 2x ao ano, semestral)
6. Prazo entre assinatura e vigência
7. Distinção de natureza salarial (art. 3º, §2º)
8. Depósito e registro sindical
9. Tratamento de empregados afastados/desligados
10. Cláusula de substituição do PLR por remuneração

Para CADA aspecto, responda obrigatoriamente no seguinte formato JSON:

{
  "aspectos": [
    {
      "titulo": "Nome do aspecto",
      "status": "CONFORME" ou "NÃO CONFORME" ou "PARCIALMENTE CONFORME",
      "fundamento": "Dispositivo legal aplicável",
      "analise": "Análise jurídica detalhada em linguagem técnica mas acessível (3-5 frases)"
    }
  ],
  "conclusao": "Conclusão geral do acordo em 3-4 parágrafos, linguagem jurídica mas fluida",
  "recomendacoes": [
    "Recomendação 1 específica e acionável",
    "Recomendação 2",
    "..."
  ],
  "scoreCompliance": número de 0 a 100,
  "classificacao": "ALTO RISCO" ou "RISCO MODERADO" ou "BAIXO RISCO" ou "CONFORME"
}

Responda APENAS com o JSON, sem markdown, sem texto adicional.`;

const statusConfig = {
  "CONFORME": { color: "#166534", bg: "#DCFCE7", border: "#86EFAC", icon: "✓" },
  "NÃO CONFORME": { color: "#991B1B", bg: "#FEE2E2", border: "#FCA5A5", icon: "✗" },
  "PARCIALMENTE CONFORME": { color: "#92400E", bg: "#FEF3C7", border: "#FCD34D", icon: "◐" }
};

const riskConfig = {
  "CONFORME": { color: "#166534", bg: "#DCFCE7" },
  "BAIXO RISCO": { color: "#1E40AF", bg: "#DBEAFE" },
  "RISCO MODERADO": { color: "#92400E", bg: "#FEF3C7" },
  "ALTO RISCO": { color: "#991B1B", bg: "#FEE2E2" }
};

export default function PLRAnalyzer() {
  const [file, setFile] = useState(null);
  const [memorandos, setMemorandos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragMemo, setDragMemo] = useState(false);
  const [step, setStep] = useState("upload"); // upload | analyzing | result

  const readFileAsBase64 = (f) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(f);
  });

  const readFileAsText = (f) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsText(f);
  });

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const handleMemoDrop = useCallback((e) => {
    e.preventDefault();
    setDragMemo(false);
    const files = Array.from(e.dataTransfer.files);
    setMemorandos(prev => [...prev, ...files]);
  }, []);

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setStep("analyzing");
    setError(null);

    try {
      const isPDF = file.type === "application/pdf";
      let userContent = [];

      // Main document
      if (isPDF) {
        const b64 = await readFileAsBase64(file);
        userContent.push({
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: b64 }
        });
      } else {
        const text = await readFileAsText(file);
        userContent.push({ type: "text", text: `ACORDO COLETIVO DE PLR:\n\n${text}` });
      }

      // Memorandos como contexto adicional
      let memoContext = "";
      if (memorandos.length > 0) {
        for (const m of memorandos) {
          try {
            const txt = await readFileAsText(m);
            memoContext += `\n\n--- MEMORANDO: ${m.name} ---\n${txt}`;
          } catch {}
        }
        if (memoContext) {
          userContent.push({
            type: "text",
            text: `MEMORANDOS DO ESCRITÓRIO PARA REFERÊNCIA (padrão de análise e linguagem):\n${memoContext}`
          });
        }
      }

      userContent.push({
        type: "text",
        text: "Analise o acordo coletivo de PLR acima e retorne o JSON conforme instruído."
      });

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userContent }]
        })
      });

      const data = await response.json();
      const rawText = data.content.map(i => i.text || "").join("");
      const clean = rawText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
      setStep("result");
    } catch (err) {
      setError("Erro ao processar o documento. Verifique o arquivo e tente novamente.");
      setStep("upload");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setMemorandos([]);
    setResult(null);
    setError(null);
    setStep("upload");
  };

  const conformeCount = result?.aspectos?.filter(a => a.status === "CONFORME").length || 0;
  const naoConformeCount = result?.aspectos?.filter(a => a.status === "NÃO CONFORME").length || 0;
  const parcialCount = result?.aspectos?.filter(a => a.status === "PARCIALMENTE CONFORME").length || 0;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F5F2EC",
      fontFamily: "'Georgia', serif",
    }}>
      {/* Header */}
      <header style={{
        background: "#0A1628",
        borderBottom: "3px solid #B8962E",
        padding: "20px 48px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <MM_LOGO />
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#B8962E", fontSize: "11px", letterSpacing: "3px", marginBottom: "2px" }}>ÁREA TRABALHISTA</div>
          <div style={{ color: "#fff", fontSize: "13px", letterSpacing: "1px" }}>Analisador de Compliance PLR</div>
        </div>
      </header>

      {/* Hero */}
      {step === "upload" && (
        <div style={{ background: "#0A1628", padding: "60px 48px 80px", position: "relative", overflow: "hidden" }}>
          {/* Decorative lines */}
          <div style={{ position: "absolute", top: 0, right: "10%", width: "1px", height: "100%", background: "rgba(184,150,46,0.15)" }}/>
          <div style={{ position: "absolute", top: 0, right: "25%", width: "1px", height: "100%", background: "rgba(184,150,46,0.08)" }}/>
          <div style={{ maxWidth: "800px" }}>
            <div style={{ color: "#B8962E", fontSize: "11px", letterSpacing: "4px", marginBottom: "16px" }}>
              INTELIGÊNCIA ARTIFICIAL · CONSULTORIA TRABALHISTA
            </div>
            <h1 style={{ color: "#F5F2EC", fontSize: "38px", fontWeight: "400", lineHeight: 1.2, margin: "0 0 16px" }}>
              Análise de Compliance<br/>
              <span style={{ color: "#B8962E" }}>Acordos Coletivos de PLR</span>
            </h1>
            <p style={{ color: "rgba(245,242,236,0.65)", fontSize: "16px", lineHeight: 1.7, maxWidth: "560px", margin: 0 }}>
              Envie o acordo coletivo e nossa IA verifica a conformidade com a Lei 10.101/2000, 
              gerando um relatório jurídico completo em segundos.
            </p>
          </div>
        </div>
      )}

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: step === "result" ? "40px 24px" : "-40px 24px 60px" }}>

        {/* Upload Section */}
        {step === "upload" && (
          <div style={{ marginTop: "-40px" }}>
            {/* Main upload */}
            <div style={{
              background: "#fff",
              borderRadius: "4px",
              boxShadow: "0 4px 24px rgba(10,22,40,0.12)",
              padding: "40px",
              marginBottom: "24px",
              border: "1px solid #E8E2D9"
            }}>
              <h2 style={{ color: "#0A1628", fontSize: "16px", fontWeight: "700", margin: "0 0 8px", letterSpacing: "1px" }}>
                ACORDO COLETIVO DE PLR
              </h2>
              <p style={{ color: "#6B7280", fontSize: "13px", margin: "0 0 24px" }}>
                Aceita arquivos PDF ou DOCX do acordo a ser analisado
              </p>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => document.getElementById("file-input").click()}
                style={{
                  border: `2px dashed ${dragOver ? "#B8962E" : file ? "#166534" : "#D1C9BB"}`,
                  borderRadius: "4px",
                  padding: "48px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: dragOver ? "rgba(184,150,46,0.04)" : file ? "rgba(22,101,52,0.03)" : "#FAFAF8",
                  transition: "all 0.2s",
                }}>
                <input id="file-input" type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: "none" }}
                  onChange={(e) => setFile(e.target.files[0])} />
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>
                  {file ? "📄" : "⬆"}
                </div>
                {file ? (
                  <>
                    <div style={{ color: "#166534", fontWeight: "700", fontSize: "15px" }}>{file.name}</div>
                    <div style={{ color: "#6B7280", fontSize: "12px", marginTop: "4px" }}>
                      {(file.size / 1024).toFixed(1)} KB · Clique para substituir
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ color: "#0A1628", fontWeight: "600", fontSize: "15px" }}>
                      Arraste o arquivo ou clique para selecionar
                    </div>
                    <div style={{ color: "#9CA3AF", fontSize: "12px", marginTop: "6px" }}>PDF, DOCX, TXT</div>
                  </>
                )}
              </div>
            </div>

            {/* Memorandos upload */}
            <div style={{
              background: "#fff",
              borderRadius: "4px",
              border: "1px solid #E8E2D9",
              padding: "32px 40px",
              marginBottom: "32px",
            }}>
              <h2 style={{ color: "#0A1628", fontSize: "16px", fontWeight: "700", margin: "0 0 6px", letterSpacing: "1px" }}>
                MEMORANDOS DE REFERÊNCIA <span style={{ color: "#9CA3AF", fontSize: "12px", fontWeight: "400" }}>(opcional)</span>
              </h2>
              <p style={{ color: "#6B7280", fontSize: "13px", margin: "0 0 20px", lineHeight: 1.6 }}>
                Alimente a IA com memorandos do escritório para calibrar o padrão de análise e linguagem jurídica
              </p>
              <div
                onDrop={handleMemoDrop}
                onDragOver={(e) => { e.preventDefault(); setDragMemo(true); }}
                onDragLeave={() => setDragMemo(false)}
                onClick={() => document.getElementById("memo-input").click()}
                style={{
                  border: `2px dashed ${dragMemo ? "#B8962E" : "#E8E2D9"}`,
                  borderRadius: "4px",
                  padding: "28px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: dragMemo ? "rgba(184,150,46,0.04)" : "#FAFAF8",
                  transition: "all 0.2s",
                }}>
                <input id="memo-input" type="file" multiple accept=".pdf,.doc,.docx,.txt" style={{ display: "none" }}
                  onChange={(e) => setMemorandos(prev => [...prev, ...Array.from(e.target.files)])} />
                <div style={{ color: "#6B7280", fontSize: "13px" }}>
                  📎 Arraste múltiplos arquivos ou clique aqui
                </div>
              </div>
              {memorandos.length > 0 && (
                <div style={{ marginTop: "16px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {memorandos.map((m, i) => (
                    <span key={i} style={{
                      background: "#F5F2EC", border: "1px solid #D1C9BB",
                      borderRadius: "20px", padding: "4px 12px",
                      fontSize: "12px", color: "#0A1628",
                      display: "flex", alignItems: "center", gap: "6px"
                    }}>
                      {m.name}
                      <button onClick={(e) => { e.stopPropagation(); setMemorandos(prev => prev.filter((_, j) => j !== i)); }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: "14px", padding: 0, lineHeight: 1 }}>
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: "4px", padding: "16px 20px", marginBottom: "24px", color: "#991B1B", fontSize: "14px" }}>
                ⚠ {error}
              </div>
            )}

            <button
              onClick={analyze}
              disabled={!file || loading}
              style={{
                width: "100%",
                padding: "18px",
                background: file ? "#0A1628" : "#D1C9BB",
                color: file ? "#F5F2EC" : "#9CA3AF",
                border: "none",
                borderRadius: "4px",
                fontSize: "14px",
                fontFamily: "'Georgia', serif",
                letterSpacing: "3px",
                cursor: file ? "pointer" : "not-allowed",
                transition: "all 0.2s",
              }}>
              {loading ? "ANALISANDO..." : "INICIAR ANÁLISE DE COMPLIANCE →"}
            </button>
          </div>
        )}

        {/* Loading */}
        {step === "analyzing" && (
          <div style={{ textAlign: "center", padding: "100px 40px" }}>
            <div style={{ marginBottom: "32px" }}>
              <div style={{
                width: "64px", height: "64px", border: "3px solid #E8E2D9",
                borderTopColor: "#B8962E", borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto"
              }}/>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <h3 style={{ color: "#0A1628", fontSize: "20px", fontWeight: "400", margin: "0 0 12px" }}>
              Analisando o acordo...
            </h3>
            <p style={{ color: "#6B7280", fontSize: "14px", lineHeight: 1.7 }}>
              A IA está verificando cada cláusula em face da Lei 10.101/2000.<br/>
              Isso pode levar alguns instantes.
            </p>
          </div>
        )}

        {/* Result */}
        {step === "result" && result && (
          <div>
            {/* Report Header */}
            <div style={{
              background: "#0A1628",
              borderRadius: "4px",
              padding: "48px",
              marginBottom: "32px",
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: "200px", height: "100%", background: "rgba(184,150,46,0.06)" }}/>
              <div style={{ position: "absolute", top: "20px", right: "48px" }}>
                <MM_LOGO />
              </div>
              <div style={{ color: "#B8962E", fontSize: "10px", letterSpacing: "4px", marginBottom: "12px" }}>
                RELATÓRIO DE ANÁLISE JURÍDICA
              </div>
              <h1 style={{ color: "#F5F2EC", fontSize: "32px", fontWeight: "400", margin: "0 0 8px" }}>
                Compliance Legal
              </h1>
              <h2 style={{ color: "#B8962E", fontSize: "18px", fontWeight: "400", margin: "0 0 32px" }}>
                Acordo Coletivo de PLR · Lei 10.101/2000
              </h2>

              {/* Score + Risk */}
              <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: "#B8962E", fontSize: "48px", fontWeight: "700", lineHeight: 1 }}>
                    {result.scoreCompliance}
                  </div>
                  <div style={{ color: "rgba(245,242,236,0.6)", fontSize: "11px", letterSpacing: "2px" }}>
                    SCORE
                  </div>
                </div>
                <div style={{ width: "1px", height: "60px", background: "rgba(184,150,46,0.3)" }}/>
                <div>
                  <span style={{
                    ...riskConfig[result.classificacao],
                    padding: "6px 16px", borderRadius: "2px",
                    fontSize: "12px", letterSpacing: "2px", fontWeight: "700"
                  }}>
                    {result.classificacao}
                  </span>
                  <div style={{ color: "rgba(245,242,236,0.5)", fontSize: "11px", marginTop: "8px" }}>
                    {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                  </div>
                </div>
                <div style={{ marginLeft: "auto", display: "flex", gap: "20px", textAlign: "center" }}>
                  {[
                    { n: conformeCount, label: "Conformes", color: "#86EFAC" },
                    { n: parcialCount, label: "Parciais", color: "#FCD34D" },
                    { n: naoConformeCount, label: "Não conformes", color: "#FCA5A5" },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ color: item.color, fontSize: "28px", fontWeight: "700" }}>{item.n}</div>
                      <div style={{ color: "rgba(245,242,236,0.5)", fontSize: "10px", letterSpacing: "1px" }}>{item.label.toUpperCase()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Aspectos */}
            <div style={{ marginBottom: "32px" }}>
              <h3 style={{ color: "#0A1628", fontSize: "13px", letterSpacing: "3px", margin: "0 0 20px", borderBottom: "2px solid #B8962E", paddingBottom: "8px" }}>
                I. ANÁLISE POR ASPECTOS
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {result.aspectos?.map((aspecto, i) => {
                  const cfg = statusConfig[aspecto.status] || statusConfig["PARCIALMENTE CONFORME"];
                  return (
                    <div key={i} style={{
                      background: "#fff",
                      borderRadius: "4px",
                      border: "1px solid #E8E2D9",
                      borderLeft: `4px solid ${cfg.border}`,
                      padding: "24px 28px",
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                        <div>
                          <div style={{ color: "#0A1628", fontWeight: "700", fontSize: "15px", marginBottom: "4px" }}>
                            {aspecto.titulo}
                          </div>
                          {aspecto.fundamento && (
                            <div style={{ color: "#9CA3AF", fontSize: "11px", letterSpacing: "1px" }}>
                              {aspecto.fundamento}
                            </div>
                          )}
                        </div>
                        <span style={{
                          background: cfg.bg, color: cfg.color,
                          padding: "4px 14px", borderRadius: "2px",
                          fontSize: "11px", letterSpacing: "1px", fontWeight: "700",
                          whiteSpace: "nowrap", marginLeft: "16px"
                        }}>
                          {cfg.icon} {aspecto.status}
                        </span>
                      </div>
                      <p style={{ color: "#4B5563", fontSize: "14px", lineHeight: 1.75, margin: 0 }}>
                        {aspecto.analise}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Conclusão */}
            <div style={{
              background: "#fff",
              borderRadius: "4px",
              border: "1px solid #E8E2D9",
              padding: "36px 40px",
              marginBottom: "24px",
            }}>
              <h3 style={{ color: "#0A1628", fontSize: "13px", letterSpacing: "3px", margin: "0 0 20px", borderBottom: "2px solid #B8962E", paddingBottom: "8px" }}>
                II. CONCLUSÃO GERAL
              </h3>
              <div style={{ color: "#374151", fontSize: "15px", lineHeight: 1.85 }}>
                {result.conclusao?.split("\n").filter(Boolean).map((p, i) => (
                  <p key={i} style={{ margin: "0 0 16px" }}>{p}</p>
                ))}
              </div>
            </div>

            {/* Recomendações */}
            <div style={{
              background: "#0A1628",
              borderRadius: "4px",
              padding: "36px 40px",
              marginBottom: "40px",
            }}>
              <h3 style={{ color: "#B8962E", fontSize: "13px", letterSpacing: "3px", margin: "0 0 24px", borderBottom: "1px solid rgba(184,150,46,0.3)", paddingBottom: "8px" }}>
                III. RECOMENDAÇÕES
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {result.recomendacoes?.map((rec, i) => (
                  <div key={i} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                    <div style={{
                      minWidth: "28px", height: "28px",
                      background: "#B8962E", borderRadius: "2px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#0A1628", fontSize: "12px", fontWeight: "700"
                    }}>
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <p style={{ color: "#F5F2EC", fontSize: "14px", lineHeight: 1.7, margin: 0 }}>{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer do relatório */}
            <div style={{
              borderTop: "1px solid #D1C9BB",
              paddingTop: "24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "40px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "3px", height: "36px", background: "#B8962E" }}/>
                <div>
                  <div style={{ color: "#0A1628", fontSize: "12px", fontWeight: "700", letterSpacing: "1px" }}>MACHADO MEYER ADVOGADOS</div>
                  <div style={{ color: "#9CA3AF", fontSize: "11px" }}>Área Trabalhista · Consultoria</div>
                </div>
              </div>
              <div style={{ color: "#9CA3AF", fontSize: "11px", textAlign: "right" }}>
                Documento gerado por IA · Uso interno<br/>
                Sujeito à revisão do advogado responsável
              </div>
            </div>

            {/* Nova análise */}
            <button onClick={reset} style={{
              width: "100%",
              padding: "14px",
              background: "transparent",
              color: "#0A1628",
              border: "2px solid #0A1628",
              borderRadius: "4px",
              fontSize: "13px",
              fontFamily: "'Georgia', serif",
              letterSpacing: "2px",
              cursor: "pointer",
            }}>
              ← NOVA ANÁLISE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
