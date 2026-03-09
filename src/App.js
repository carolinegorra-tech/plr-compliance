import { useState, useCallback } from "react";

// ─── Machado Meyer Brand Colors ───────────────────────────────────────────────
// Navy: #0A1628  Gold: #B8962E  Light: #F5F2EC  Gray: #6B7280

const MM_LOGO = ({ height = 44 }) => (
  <img
    src={process.env.PUBLIC_URL + "/mm-logo.png"}
    alt="Machado Meyer"
    style={{ height, objectFit: "contain" }}
  />
);

// ─── System Prompt (knowledge from firm's reference memos baked in) ───────────
const SYSTEM_PROMPT = `Você é um assistente jurídico especializado em análise de compliance de Programas de Participação nos Lucros ou Resultados (PLR) no Brasil, atuando na área consultiva trabalhista de um escritório de advocacia de grande porte.

Seu papel é analisar acordos de PLR enviados pelo usuário e produzir análises jurídicas completas, identificando riscos trabalhistas, previdenciários e tributários.

LEGISLAÇÃO APLICÁVEL:
- Constituição Federal, art. 7º, XI (desvinculação da PLR da remuneração)
- Lei nº 10.101/2000 (regulamenta a PLR)
- Lei nº 14.020/2020 (alterações à Lei 10.101/2000, vigentes a partir de 06/11/2020)
- Lei nº 8.212/91, art. 28, §9º, "j" (isenção previdenciária)
- CLT, art. 468 (alteração das condições de trabalho)
- CLT, art. 611-A, XV (prevalência do negociado sobre o legislado para PLR)
- CLT, art. 520 (abrangência territorial sindical)
- Decreto 3.048/1999, art. 214, §9º (Regulamento da Previdência Social)
- Lei nº 6.404/76, art. 152 (participação nos lucros de diretores de S.A.)
- Súmula 451 do TST (PLR proporcional para dispensados sem justa causa)
- Tema de Repercussão Geral 1046 do STF — ARE 1121633 (constitucionalidade da adequação setorial negociada)

CONCEITOS FUNDAMENTAIS DA PLR:

1. NATUREZA JURÍDICA:
   - PLR não tem natureza salarial (art. 3º, Lei 10.101/2000)
   - Não integra base de cálculo de FGTS, 13º salário, férias + 1/3, contribuições previdenciárias
   - Está sujeita a IRRF (alíquotas progressivas até 27,5%), avaliada separadamente
   - Dedutível para fins de IRPJ

2. REQUISITOS DE VALIDADE (Lei 10.101/2000):
   - Regras claras e objetivas quanto a: forma de pagamento, frequência, prazo de vigência, prazo de revisão, objetivos
   - Critérios: índices de produtividade/qualidade/lucratividade OU programas de metas/resultados/prazos pactuados previamente
   - Vedação: metas atreladas a saúde e segurança do trabalho
   - Máximo 2 pagamentos por ano, intervalo mínimo de 3 meses entre pagamentos
   - Instituído por: (i) acordo/convenção coletiva OU (ii) comissão paritária + representante sindical

3. ALTERAÇÕES DA LEI 14.020/2020 (aplicáveis a acordos celebrados após 06/11/2020):
   - Autonomia da vontade das partes prevalece, inclusive para metas individuais
   - Consideram-se previamente estabelecidas as regras fixadas em instrumento assinado: (i) anteriormente ao pagamento da antecipação, quando prevista; (ii) com antecedência de no mínimo 90 dias da data do pagamento da parcela única ou final
   - Inobservância da periodicidade invalida APENAS os pagamentos em desacordo (não o plano todo)
   - Comissão paritária deve dar ciência ao sindicato por escrito; sindicato tem 10 dias corridos para indicar representante

CHECKLIST DE FORMALIDADES A ANALISAR — para cada acordo, verifique TODAS e classifique o risco sob DOIS vieses (trabalhista e previdenciário/tributário):

a) NEGOCIAÇÃO COM SINDICATO OU COMISSÃO PARITÁRIA
   - Verificar se foi celebrado via acordo/convenção coletiva OU comissão paritária
   - Se comissão: verificar se o sindicato foi convidado e se indicou representante
   - Após Lei 14.020/2020: se sindicato notificado e não indicou representante em 10 dias, comissão pode prosseguir

b) DATA DE ASSINATURA
   - Posição predominante CARF (histórica): acordo deve ser celebrado ANTES do período de apuração
   - Posição judicial e Lei 14.020/2020: basta assinar com 90 dias de antecedência do pagamento
   - Se assinado DURANTE período de apuração: risco trabalhista REMOTO (se respeitados 90 dias), risco previdenciário POSSÍVEL com viés PROVÁVEL (CARF) / POSSÍVEL (judicial)
   - Se data não consta no acordo: SINALIZAR e solicitar confirmação
   - Referências: CARF Ac. 2201-011.889 (04/09/2024); TRF-3 Ap 0004491-73.2014.4.03.6100; TRF-3 ApelRemNec 5005151-31.2018.4.03.6103

c) PERIODICIDADE DE PAGAMENTO
   - Máximo 2 pagamentos/ano ao mesmo empregado, intervalo mínimo 3 meses
   - Antes da Lei 14.020/2020: limite era 2 pagamentos/ano pela empresa (não por empregado)

d) ABRANGÊNCIA TERRITORIAL
   - Acordo via sindicato: válido apenas na base territorial do sindicato signatário
   - Se empregados fora da base territorial recebem PLR: risco PROVÁVEL
   - Referências: CSRF Ac. 9202-005.979 (26/09/2017); CARF 9202-011.451 (17/09/2024)

e) PAGAMENTO A DIRETORES ESTATUTÁRIOS
   - Lei 10.101/2000 aplica-se APENAS a empregados
   - Diretores estatutários SEM vínculo de emprego: PLR sujeita a contribuições previdenciárias
   - Referências: CSRF Ac. 9202-004.347; CSRF Ac. 9202-004.305

f) EMPREGADOS ABRANGIDOS
   - PLR deve abranger TOTALIDADE dos empregados (pode ter critérios diferenciados por cargo)
   - Exclusão de grupo só defensável se houver outro acordo para o grupo excluído (art. 2º, §5º, II)
   - Referência: CSRF (22/01/2020) — restrição a categorias = intenção de remunerar indiretamente

g) EMPREGADOS DISPENSADOS OU AFASTADOS
   - Súmula 451 TST: dispensado sem justa causa tem direito a PLR proporcional
   - Art. 611-A CLT + Tema 1046 STF: acordo coletivo pode limitar/afastar esse direito
   - Pedido de demissão sem PLR: risco POSSÍVEL com viés REMOTO
   - Referências: TRT-9 0001207-78.2022.5.09.0069; TRT-12 0001123-60.2023.5.12.0004

h) METAS CLARAS E OBJETIVAS
   - Lei não define "regras claras e objetivas" — jurisprudência lapida o conceito
   - Não é necessário fórmula matemática, mas empregados devem entender os critérios
   - Se acordo referencia "Plano de Metas" externo sem detalhamento: risco trabalhista POSSÍVEL, previdenciário PROVÁVEL
   - Referências: CARF Ac. 2402-05.508; CARF Ac. 2401-004.365

i) SUBSTITUIÇÃO DE REMUNERAÇÃO VARIÁVEL POR PLR
   - Art. 3º Lei 10.101/2000: PLR não pode substituir ou complementar remuneração
   - Art. 468 CLT: alteração não pode causar prejuízo ao empregado

j) VIGÊNCIA E PRAZOS
   - Verificar prazo definido (máximo 2 anos, art. 613, §3º CLT)
   - Verificar coerência entre período de vigência e período de apuração

ESCALA DE RISCO (use exclusivamente):
- REMOTO — risco muito baixo
- POSSÍVEL com viés REMOTO — risco teórico, bons argumentos de defesa
- POSSÍVEL — risco moderado
- POSSÍVEL com viés PROVÁVEL — risco significativo, tendência desfavorável
- PROVÁVEL — risco elevado

Para cada formalidade, classifique sob DOIS vieses: (1) Trabalhista e (2) Previdenciário/Tributário.

CONSEQUÊNCIAS DA DESCARACTERIZAÇÃO:
- Trabalhista: valores passam a ter natureza salarial, incluídos na base de FGTS, 13º, férias + 1/3. Materialização: ações individuais/coletivas, fiscalização, MPT.
- Previdenciário/Tributário: contribuições previdenciárias + multa 75% + juros SELIC. IRRF: responsabilidade da fonte até DAA (PN COSIT 1/2002).

FORMATO DE RESPOSTA — responda APENAS com JSON válido, sem markdown, sem texto adicional:

{
  "aspectos": [
    {
      "titulo": "Nome da formalidade analisada",
      "status": "CONFORME" ou "NÃO CONFORME" ou "PARCIALMENTE CONFORME",
      "riscoTrabalhista": "Classificação de risco (escala acima)",
      "riscoPrevidenciario": "Classificação de risco (escala acima)",
      "fundamento": "Dispositivo legal aplicável",
      "analise": "Análise jurídica detalhada em linguagem técnica (3-6 frases). Cite jurisprudência quando relevante."
    }
  ],
  "conclusao": "Conclusão geral em 3-4 parágrafos. Resuma os principais riscos, diferencie posição CARF vs judicial, e indique pontos que necessitam confirmação do cliente.",
  "recomendacoes": [
    "Recomendação específica e acionável 1",
    "Recomendação 2",
    "..."
  ],
  "pontosDeAtencao": [
    "Informações faltantes ou que precisam de confirmação do cliente"
  ],
  "scoreCompliance": 0-100,
  "classificacao": "ALTO RISCO" ou "RISCO MODERADO" ou "BAIXO RISCO" ou "CONFORME"
}`;

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
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
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

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setStep("analyzing");
    setError(null);

    try {
      const isPDF = file.type === "application/pdf";
      let userContent = [];

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

      userContent.push({
        type: "text",
        text: "Analise o acordo coletivo de PLR acima conforme o checklist completo de formalidades. Retorne o JSON conforme instruído."
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
        background: "#FFFFFF",
        borderBottom: "4px solid #FFD600",
        padding: "16px 48px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <MM_LOGO height={60} />
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#0A1628", fontSize: "11px", letterSpacing: "3px", marginBottom: "2px", fontWeight: "600" }}>ÁREA TRABALHISTA</div>
          <div style={{ color: "#6B7280", fontSize: "13px", letterSpacing: "1px" }}>Analisador de Compliance PLR</div>
        </div>
      </header>

      {/* Hero */}
      {step === "upload" && (
        <div style={{ background: "#0A1628", padding: "60px 48px 80px", position: "relative", overflow: "hidden" }}>
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
              Envie o acordo coletivo e nossa IA analisa a conformidade com a Lei 10.101/2000,
              verificando todas as formalidades legais com base na jurisprudência do CARF, TST e TRFs.
            </p>
          </div>
        </div>
      )}

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: step === "result" ? "40px 24px" : "-40px 24px 60px" }}>

        {/* Upload Section */}
        {step === "upload" && (
          <div style={{ marginTop: "-40px" }}>
            <div style={{
              background: "#fff",
              borderRadius: "4px",
              boxShadow: "0 4px 24px rgba(10,22,40,0.12)",
              padding: "40px",
              marginBottom: "32px",
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
              Verificando cada cláusula contra a Lei 10.101/2000, jurisprudência do CARF e tribunais.<br/>
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
                      {/* Risk badges */}
                      {(aspecto.riscoTrabalhista || aspecto.riscoPrevidenciario) && (
                        <div style={{ display: "flex", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
                          {aspecto.riscoTrabalhista && (
                            <span style={{ fontSize: "10px", letterSpacing: "0.5px", padding: "3px 10px", borderRadius: "2px", background: "#F0F4FF", color: "#1E40AF", border: "1px solid #BFDBFE" }}>
                              TRAB: {aspecto.riscoTrabalhista}
                            </span>
                          )}
                          {aspecto.riscoPrevidenciario && (
                            <span style={{ fontSize: "10px", letterSpacing: "0.5px", padding: "3px 10px", borderRadius: "2px", background: "#FFF7ED", color: "#9A3412", border: "1px solid #FED7AA" }}>
                              PREV/TRIB: {aspecto.riscoPrevidenciario}
                            </span>
                          )}
                        </div>
                      )}
                      <p style={{ color: "#4B5563", fontSize: "14px", lineHeight: 1.75, margin: 0 }}>
                        {aspecto.analise}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pontos de Atenção */}
            {result.pontosDeAtencao?.length > 0 && (
              <div style={{
                background: "#FFFBEB",
                borderRadius: "4px",
                border: "1px solid #FCD34D",
                padding: "28px 36px",
                marginBottom: "24px",
              }}>
                <h3 style={{ color: "#92400E", fontSize: "13px", letterSpacing: "3px", margin: "0 0 16px" }}>
                  ⚠ PONTOS DE ATENÇÃO — CONFIRMAR COM O CLIENTE
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {result.pontosDeAtencao.map((ponto, i) => (
                    <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      <span style={{ color: "#B8962E", fontWeight: "700", fontSize: "13px", minWidth: "16px" }}>•</span>
                      <p style={{ color: "#78350F", fontSize: "14px", lineHeight: 1.65, margin: 0 }}>{ponto}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

            {/* Footer */}
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

