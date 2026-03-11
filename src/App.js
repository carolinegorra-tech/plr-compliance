import { useState, useCallback } from "react";
import * as mammoth from "mammoth";

// ─── Machado Meyer Brand Colors ───────────────────────────────────────────────
const MM_LOGO = ({ height = 100 }) => (
  <img src={process.env.PUBLIC_URL + "/mm-logo.png"} alt="Machado Meyer Advogados" style={{ height, objectFit: "contain" }} />
);

// ─── System Prompt ────────────────────────────────────────────────────────────
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
- Tema de Repercussão Geral 1046 do STF — ARE 1121633

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
   - Consideram-se previamente estabelecidas as regras fixadas em instrumento assinado: (i) anteriormente ao pagamento da antecipação; (ii) com antecedência de no mínimo 90 dias da data do pagamento da parcela única ou final
   - Inobservância da periodicidade invalida APENAS os pagamentos em desacordo (não o plano todo)
   - Comissão paritária deve dar ciência ao sindicato por escrito; sindicato tem 10 dias corridos para indicar representante

ITENS A ANALISAR:

ITENS OBJETIVOS (binários — ou cumpre 100 ou score 0, e se 0 o score final vai a 0):

a) NEGOCIAÇÃO COM SINDICATO OU COMISSÃO PARITÁRIA
   - Verificar se foi celebrado via acordo/convenção coletiva OU comissão paritária com sindicato
   - SCORE: 100 se cumpriu, 0 se não (score final = 0)

b) PERIODICIDADE DE PAGAMENTO
   - Máximo 2 pagamentos/ano, intervalo mínimo 3 meses
   - SCORE: 100 se cumpriu, 0 se não (score final = 0)

c) ABRANGÊNCIA TERRITORIAL
   - Acordo via sindicato: válido apenas na base territorial do sindicato signatário
   - Refs: CSRF Ac. 9202-005.979; CARF 9202-011.451
   - SCORE: 100 se cumpriu, 0 se não (score final = 0)

d) EMPREGADOS ABRANGIDOS
   - PLR deve abranger totalidade dos empregados
   - Ref: CSRF (22/01/2020)
   - SCORE: 100 se cumpriu, 0 se não (score final = 0)

e) VIGÊNCIA E PRAZOS
   - Máximo 2 anos, coerência vigência/apuração
   - SCORE: 100 se cumpriu, 0 se não (score final = 0)

f) EMPREGADOS DISPENSADOS OU AFASTADOS (APENAS TRABALHISTA — não tem viés previdenciário)
   - Súmula 451 TST; Art. 611-A CLT + Tema 1046 STF
   - Refs: TRT-9 0001207-78.2022.5.09.0069; TRT-12 0001123-60.2023.5.12.0004
   - SCORE: 100 se cumpriu, 0 se não (score final = 0)
   - ESTE ITEM DEVE SER O ÚLTIMO NA LISTA

ITENS COM NUANCE (score variável):

g) DATA DE ASSINATURA
   - CARF exige celebração ANTES do período de apuração; judicial + Lei 14.020/2020: 90 dias antes do pagamento
   - Refs: CARF Ac. 2201-011.889; TRF-3 Ap 0004491-73.2014.4.03.6100
   - SCORE: 90 se nos primeiros 25% do período; 75 se nos primeiros 50%; 65 se nos primeiros 75%; 50 se nos últimos 25%

h) METAS CLARAS E OBJETIVAS
   - Refs: CARF Ac. 2402-05.508; CARF Ac. 2401-004.365
   - SCORE: 0 a 100 baseado na sua análise aprofundada. Justifique.

i) PAGAMENTO A DIRETORES ESTATUTÁRIOS
   - Refs: CSRF Ac. 9202-004.347; CSRF Ac. 9202-004.305
   - SCORE: Se inclui diretores sem vínculo = -10 no score de nuance. Se não inclui (correto) = 0.

CÁLCULO DO SCORE:
1. Se QUALQUER item objetivo = 0 → score final trabalhista E tributário = 0
2. Se todos objetivos = 100 → score de nuance = média(Data de Assinatura + Metas) ± Diretores
3. Score final = score de nuance

ESCALA DE RISCO:
- REMOTO — risco muito baixo
- POSSÍVEL com viés REMOTO — risco teórico
- POSSÍVEL — risco moderado
- POSSÍVEL com viés PROVÁVEL — risco significativo
- PROVÁVEL — risco elevado

EXCEÇÃO: "Empregados Dispensados ou Afastados" é APENAS trabalhista (riscoPrevidenciario = null).

NÃO ANALISAR "Substituição de Remuneração Variável por PLR" — este item foi removido.

FORMATO DE RESPOSTA — APENAS JSON válido, sem markdown:

{
  "aspectos": [
    {
      "titulo": "Nome",
      "tipo": "objetivo" ou "nuance",
      "status": "CONFORME" ou "NÃO CONFORME" ou "PARCIALMENTE CONFORME",
      "scoreItem": 0-100,
      "riscoTrabalhista": "risco" ou null,
      "riscoPrevidenciario": "risco" ou null,
      "fundamento": "base legal",
      "analiseTrabalhista": "análise trab (2-4 frases)",
      "analisePrevidenciario": "análise prev (2-4 frases)" ou null,
      "apenasTrabalista": true/false
    }
  ],
  "conclusaoTrabalhista": "2-3 parágrafos",
  "conclusaoPrevidenciario": "2-3 parágrafos",
  "recomendacoes": ["rec1", "rec2"],
  "pontosDeAtencao": ["ponto1", "ponto2"],
  "scoreTrabalhista": 0-100,
  "scorePrevidenciario": 0-100,
  "scoreNuance": 0-100,
  "classificacaoTrabalhista": "ALTO RISCO"/"RISCO MODERADO"/"BAIXO RISCO"/"CONFORME",
  "classificacaoPrevidenciario": "ALTO RISCO"/"RISCO MODERADO"/"BAIXO RISCO"/"CONFORME"
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

const riskBadgeColor = (risk) => {
  if (!risk) return null;
  const r = risk.toUpperCase();
  if (r.includes("PROVÁVEL")) return { bg: "#FEE2E2", color: "#991B1B", border: "#FCA5A5" };
  if (r.includes("POSSÍVEL")) return { bg: "#FEF3C7", color: "#92400E", border: "#FCD34D" };
  return { bg: "#DCFCE7", color: "#166534", border: "#86EFAC" };
};

export default function PLRAnalyzer() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [step, setStep] = useState("upload");

  const readFileAsBase64 = (f) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.onerror = rej; r.readAsDataURL(f); });
  const readFileAsText = (f) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsText(f); });
  const readDocxAsText = (f) => new Promise((res, rej) => { const r = new FileReader(); r.onload = async () => { try { const result = await mammoth.extractRawText({ arrayBuffer: r.result }); res(result.value); } catch (e) { rej(e); } }; r.onerror = rej; r.readAsArrayBuffer(f); });

  const readFileContent = async (f) => {
    const name = f.name.toLowerCase();
    if (name.endsWith(".docx") || name.endsWith(".doc")) return await readDocxAsText(f);
    if (f.type === "application/pdf") { const b64 = await readFileAsBase64(f); return { isPDF: true, b64 }; }
    return await readFileAsText(f);
  };

  const handleDrop = useCallback((e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); }, []);

  const analyze = async () => {
    if (!file) return;
    setLoading(true); setStep("analyzing"); setError(null);
    try {
      let userContent = [];
      const content = await readFileContent(file);
      if (content && content.isPDF) {
        userContent.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: content.b64 } });
      } else {
        const text = typeof content === "string" ? content : "";
        const t = text.substring(0, 400000);
        userContent.push({ type: "text", text: `ACORDO COLETIVO DE PLR:\n\n${t}${text.length > 400000 ? "\n\n[... TRUNCADO ...]" : ""}` });
      }
      userContent.push({ type: "text", text: "Analise o acordo coletivo de PLR acima conforme o checklist. Retorne o JSON conforme instruído." });

      const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error("API key não configurada.");

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 4000, temperature: 0, system: SYSTEM_PROMPT, messages: [{ role: "user", content: userContent }] })
      });
      if (!response.ok) { const e = await response.json().catch(() => ({})); throw new Error(e.error?.message || `Erro: ${response.status}`); }

      const data = await response.json();
      const raw = data.content.map(i => i.text || "").join("");
      setResult(JSON.parse(raw.replace(/```json|```/g, "").trim()));
      setStep("result");
    } catch (err) { setError(err.message || "Erro desconhecido."); setStep("upload"); }
    finally { setLoading(false); }
  };

  const reset = () => { setFile(null); setResult(null); setError(null); setStep("upload"); };

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const groupAspects = (a) => {
    if (!a) return { conforme: [], parcial: [], naoConforme: [], dispensados: [] };
    const disp = a.filter(x => x.apenasTrabalista || x.titulo?.toLowerCase().includes("dispensad"));
    const rest = a.filter(x => !disp.includes(x));
    return { conforme: rest.filter(x => x.status === "CONFORME"), parcial: rest.filter(x => x.status === "PARCIALMENTE CONFORME"), naoConforme: rest.filter(x => x.status === "NÃO CONFORME"), dispensados: disp };
  };

  const RiskBox = ({ label, risk }) => {
    if (!risk) return null;
    const c = riskBadgeColor(risk);
    return (
      <div style={{ minWidth: "140px", padding: "10px 14px", borderRadius: "4px", border: `1px solid ${c.border}`, background: c.bg, textAlign: "center" }}>
        <div style={{ fontSize: "9px", letterSpacing: "1px", color: "#6B7280", marginBottom: "4px", fontWeight: "600" }}>{label}</div>
        <div style={{ fontSize: "12px", fontWeight: "700", color: c.color }}>{risk}</div>
      </div>
    );
  };

  const AspectCard = ({ aspecto: a }) => {
    const cfg = statusConfig[a.status] || statusConfig["PARCIALMENTE CONFORME"];
    return (
      <div style={{ background: "#fff", borderRadius: "4px", border: "1px solid #E8E2D9", borderLeft: `4px solid ${cfg.border}`, padding: "24px 28px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "16px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
              <div style={{ color: "#0A1628", fontWeight: "700", fontSize: "15px" }}>{a.titulo}</div>
              <span style={{ background: cfg.bg, color: cfg.color, padding: "3px 12px", borderRadius: "2px", fontSize: "10px", letterSpacing: "1px", fontWeight: "700", whiteSpace: "nowrap" }}>{cfg.icon} {a.status}</span>
            </div>
            {a.fundamento && <div style={{ color: "#9CA3AF", fontSize: "11px" }}>{a.fundamento}</div>}
            {a.scoreItem !== undefined && <div style={{ color: "#B8962E", fontSize: "11px", fontWeight: "700", marginTop: "4px" }}>Score: {a.scoreItem}/100</div>}
          </div>
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <RiskBox label="TRABALHISTA" risk={a.riscoTrabalhista} />
            {!a.apenasTrabalista && a.riscoPrevidenciario && <RiskBox label="TRIBUTÁRIO / PREVIDENCIÁRIO" risk={a.riscoPrevidenciario} />}
          </div>
        </div>
        {a.analiseTrabalhista && (
          <div style={{ marginBottom: a.analisePrevidenciario ? "12px" : 0 }}>
            {a.analisePrevidenciario && <div style={{ fontSize: "10px", letterSpacing: "1px", color: "#1E40AF", fontWeight: "700", marginBottom: "4px" }}>ANÁLISE TRABALHISTA</div>}
            <p style={{ color: "#4B5563", fontSize: "14px", lineHeight: 1.75, margin: 0 }}>{a.analiseTrabalhista}</p>
          </div>
        )}
        {a.analisePrevidenciario && !a.apenasTrabalista && (
          <div>
            <div style={{ fontSize: "10px", letterSpacing: "1px", color: "#9A3412", fontWeight: "700", marginBottom: "4px" }}>ANÁLISE TRIBUTÁRIA / PREVIDENCIÁRIA</div>
            <p style={{ color: "#4B5563", fontSize: "14px", lineHeight: 1.75, margin: 0 }}>{a.analisePrevidenciario}</p>
          </div>
        )}
      </div>
    );
  };

  const Section = ({ title, items, color }) => {
    if (!items?.length) return null;
    return (
      <div style={{ marginBottom: "24px" }}>
        <h4 style={{ color: "#0A1628", fontSize: "12px", letterSpacing: "2px", margin: "0 0 12px", paddingBottom: "6px", borderBottom: `2px solid ${color}`, fontWeight: "700" }}>{title}</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>{items.map((a, i) => <AspectCard key={i} aspecto={a} />)}</div>
      </div>
    );
  };

  const ScoreBlock = ({ label, score, classificacao }) => {
    const c = riskConfig[classificacao] || riskConfig["RISCO MODERADO"];
    return (
      <div style={{ textAlign: "center", flex: 1 }}>
        <div style={{ color: "rgba(245,242,236,0.5)", fontSize: "9px", letterSpacing: "2px", marginBottom: "6px" }}>{label}</div>
        <div style={{ color: "#B8962E", fontSize: "44px", fontWeight: "700", lineHeight: 1 }}>{score}</div>
        <span style={{ ...c, display: "inline-block", marginTop: "8px", padding: "4px 14px", borderRadius: "2px", fontSize: "10px", letterSpacing: "1.5px", fontWeight: "700" }}>{classificacao}</span>
      </div>
    );
  };

  const g = result ? groupAspects(result.aspectos) : null;

  return (
    <div style={{ minHeight: "100vh", background: "#F5F2EC", fontFamily: "'Georgia', serif" }}>
      <header style={{ background: "#FFD600", borderBottom: "4px solid #FFD600", padding: "16px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <MM_LOGO height={100} />
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#0A1628", fontSize: "11px", letterSpacing: "3px", marginBottom: "2px", fontWeight: "600" }}>ÁREA TRABALHISTA</div>
          <div style={{ color: "#0A1628", fontSize: "13px", letterSpacing: "1px" }}>Analisador de Compliance PLR</div>
        </div>
      </header>

      {step === "upload" && (
        <div style={{ background: "#0A1628", padding: "60px 48px 80px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, right: "10%", width: "1px", height: "100%", background: "rgba(184,150,46,0.15)" }}/>
          <div style={{ position: "absolute", top: 0, right: "25%", width: "1px", height: "100%", background: "rgba(184,150,46,0.08)" }}/>
          <div style={{ maxWidth: "800px" }}>
            <div style={{ color: "#B8962E", fontSize: "11px", letterSpacing: "4px", marginBottom: "16px" }}>INTELIGÊNCIA ARTIFICIAL · CONSULTORIA TRABALHISTA</div>
            <h1 style={{ color: "#F5F2EC", fontSize: "38px", fontWeight: "400", lineHeight: 1.2, margin: "0 0 16px" }}>Análise de Compliance<br/><span style={{ color: "#B8962E" }}>Acordos Coletivos de PLR</span></h1>
            <p style={{ color: "rgba(245,242,236,0.65)", fontSize: "16px", lineHeight: 1.7, maxWidth: "560px", margin: 0 }}>Envie o acordo coletivo e nossa IA analisa a conformidade com a Lei 10.101/2000, verificando todas as formalidades legais com base na jurisprudência do CARF, TST e TRFs.</p>
          </div>
        </div>
      )}

      <div style={{ maxWidth: "920px", margin: "0 auto", padding: step === "result" ? "40px 24px" : "40px 24px 60px" }}>
        {step === "upload" && (
          <div>
            <div style={{ background: "#fff", borderRadius: "4px", boxShadow: "0 4px 24px rgba(10,22,40,0.12)", padding: "40px", marginBottom: "32px", border: "1px solid #E8E2D9" }}>
              <h2 style={{ color: "#0A1628", fontSize: "16px", fontWeight: "700", margin: "0 0 8px", letterSpacing: "1px" }}>ACORDO COLETIVO DE PLR</h2>
              <p style={{ color: "#6B7280", fontSize: "13px", margin: "0 0 24px" }}>Aceita arquivos PDF ou DOCX do acordo a ser analisado</p>
              <div onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onClick={() => document.getElementById("fi").click()}
                style={{ border: `2px dashed ${dragOver ? "#B8962E" : file ? "#166534" : "#D1C9BB"}`, borderRadius: "4px", padding: "48px", textAlign: "center", cursor: "pointer", background: dragOver ? "rgba(184,150,46,0.04)" : file ? "rgba(22,101,52,0.03)" : "#FAFAF8", transition: "all 0.2s" }}>
                <input id="fi" type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: "none" }} onChange={(e) => setFile(e.target.files[0])} />
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>{file ? "📄" : "⬆"}</div>
                {file ? (<><div style={{ color: "#166534", fontWeight: "700", fontSize: "15px" }}>{file.name}</div><div style={{ color: "#6B7280", fontSize: "12px", marginTop: "4px" }}>{(file.size / 1024).toFixed(1)} KB</div></>) : (<><div style={{ color: "#0A1628", fontWeight: "600", fontSize: "15px" }}>Arraste o arquivo ou clique para selecionar</div><div style={{ color: "#9CA3AF", fontSize: "12px", marginTop: "6px" }}>PDF, DOCX, TXT</div></>)}
              </div>
            </div>
            {error && <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: "4px", padding: "16px 20px", marginBottom: "24px", color: "#991B1B", fontSize: "14px" }}>⚠ {error}</div>}
            <button onClick={analyze} disabled={!file || loading} style={{ width: "100%", padding: "18px", background: file ? "#0A1628" : "#D1C9BB", color: file ? "#F5F2EC" : "#9CA3AF", border: "none", borderRadius: "4px", fontSize: "14px", fontFamily: "'Georgia', serif", letterSpacing: "3px", cursor: file ? "pointer" : "not-allowed" }}>
              {loading ? "ANALISANDO..." : "INICIAR ANÁLISE DE COMPLIANCE"}
            </button>
          </div>
        )}

        {step === "analyzing" && (
          <div style={{ textAlign: "center", padding: "100px 40px" }}>
            <div style={{ width: "64px", height: "64px", border: "3px solid #E8E2D9", borderTopColor: "#B8962E", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 32px" }}/>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}} @media print{header,button,.no-print{display:none!important}body{background:white!important}}`}</style>
            <h3 style={{ color: "#0A1628", fontSize: "20px", fontWeight: "400", margin: "0 0 12px" }}>Analisando o acordo...</h3>
            <p style={{ color: "#6B7280", fontSize: "14px", lineHeight: 1.7 }}>Verificando cada cláusula contra a Lei 10.101/2000, jurisprudência do CARF e tribunais.</p>
          </div>
        )}

        {step === "result" && result && (
          <div>
            {/* Header */}
            <div style={{ background: "#0A1628", borderRadius: "4px", padding: "48px", marginBottom: "32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
                <div>
                  <div style={{ color: "#B8962E", fontSize: "10px", letterSpacing: "4px", marginBottom: "12px" }}>RELATÓRIO DE ANÁLISE JURÍDICA</div>
                  <h1 style={{ color: "#F5F2EC", fontSize: "32px", fontWeight: "400", margin: "0 0 8px" }}>Compliance Legal</h1>
                  <h2 style={{ color: "#B8962E", fontSize: "18px", fontWeight: "400", margin: 0 }}>Acordo Coletivo de PLR · Lei 10.101/2000</h2>
                  <div style={{ color: "rgba(245,242,236,0.4)", fontSize: "11px", marginTop: "8px" }}>{new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</div>
                </div>
                <MM_LOGO height={70} />
              </div>
              <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
                <ScoreBlock label="SCORE TRABALHISTA" score={result.scoreTrabalhista} classificacao={result.classificacaoTrabalhista} />
                <div style={{ width: "1px", height: "80px", background: "rgba(184,150,46,0.3)" }}/>
                <ScoreBlock label="SCORE TRIBUTÁRIO / PREV." score={result.scorePrevidenciario} classificacao={result.classificacaoPrevidenciario} />
                {result.scoreNuance !== undefined && (<>
                  <div style={{ width: "1px", height: "80px", background: "rgba(184,150,46,0.3)" }}/>
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <div style={{ color: "rgba(245,242,236,0.5)", fontSize: "9px", letterSpacing: "2px", marginBottom: "6px" }}>SCORE DE NUANCE</div>
                    <div style={{ color: "#F5F2EC", fontSize: "32px", fontWeight: "700", lineHeight: 1 }}>{result.scoreNuance}</div>
                    <div style={{ color: "rgba(245,242,236,0.35)", fontSize: "9px", marginTop: "6px" }}>Média: Data + Metas ± Diretores</div>
                  </div>
                </>)}
              </div>
            </div>

            {/* I. Aspectos */}
            <div style={{ marginBottom: "32px" }}>
              <h3 style={{ color: "#0A1628", fontSize: "13px", letterSpacing: "3px", margin: "0 0 20px", borderBottom: "2px solid #B8962E", paddingBottom: "8px" }}>I. ANÁLISE POR ASPECTOS</h3>
              <Section title="CONFORME" items={g.conforme} color="#86EFAC" />
              <Section title="PARCIALMENTE CONFORME" items={g.parcial} color="#FCD34D" />
              <Section title="NÃO CONFORME" items={g.naoConforme} color="#FCA5A5" />
              {g.dispensados?.length > 0 && <Section title="EMPREGADOS DISPENSADOS OU AFASTADOS (APENAS TRABALHISTA)" items={g.dispensados} color="#93C5FD" />}
            </div>

            {/* II. Conclusão */}
            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ color: "#0A1628", fontSize: "13px", letterSpacing: "3px", margin: "0 0 20px", borderBottom: "2px solid #B8962E", paddingBottom: "8px" }}>II. CONCLUSÃO</h3>
              <div style={{ background: "#fff", borderRadius: "4px", border: "1px solid #E8E2D9", borderLeft: "4px solid #3B82F6", padding: "28px 36px", marginBottom: "16px" }}>
                <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#1E40AF", fontWeight: "700", marginBottom: "12px" }}>CONCLUSÃO — ÁREA TRABALHISTA</div>
                <div style={{ color: "#374151", fontSize: "15px", lineHeight: 1.85 }}>{(result.conclusaoTrabalhista || "").split("\n").filter(Boolean).map((p, i) => <p key={i} style={{ margin: "0 0 12px" }}>{p}</p>)}</div>
              </div>
              <div style={{ background: "#fff", borderRadius: "4px", border: "1px solid #E8E2D9", borderLeft: "4px solid #F97316", padding: "28px 36px" }}>
                <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#9A3412", fontWeight: "700", marginBottom: "12px" }}>CONCLUSÃO — ÁREA TRIBUTÁRIA / PREVIDENCIÁRIA</div>
                <div style={{ color: "#374151", fontSize: "15px", lineHeight: 1.85 }}>{(result.conclusaoPrevidenciario || "").split("\n").filter(Boolean).map((p, i) => <p key={i} style={{ margin: "0 0 12px" }}>{p}</p>)}</div>
              </div>
            </div>

            {/* III. Recomendações */}
            <div style={{ background: "#0A1628", borderRadius: "4px", padding: "36px 40px", marginBottom: "24px" }}>
              <h3 style={{ color: "#B8962E", fontSize: "13px", letterSpacing: "3px", margin: "0 0 24px", borderBottom: "1px solid rgba(184,150,46,0.3)", paddingBottom: "8px" }}>III. RECOMENDAÇÕES</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {result.recomendacoes?.map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                    <div style={{ minWidth: "28px", height: "28px", background: "#B8962E", borderRadius: "2px", display: "flex", alignItems: "center", justifyContent: "center", color: "#0A1628", fontSize: "12px", fontWeight: "700" }}>{String(i + 1).padStart(2, "0")}</div>
                    <p style={{ color: "#F5F2EC", fontSize: "14px", lineHeight: 1.7, margin: 0 }}>{r}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* IV. Pontos de Atenção */}
            {result.pontosDeAtencao?.length > 0 && (
              <div style={{ background: "#FFFBEB", borderRadius: "4px", border: "1px solid #FCD34D", padding: "28px 36px", marginBottom: "24px" }}>
                <h3 style={{ color: "#92400E", fontSize: "13px", letterSpacing: "3px", margin: "0 0 16px" }}>IV. PONTOS DE ATENÇÃO — CONFIRMAR COM O CLIENTE</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {result.pontosDeAtencao.map((p, i) => (
                    <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      <span style={{ color: "#B8962E", fontWeight: "700", fontSize: "13px", minWidth: "16px" }}>•</span>
                      <p style={{ color: "#78350F", fontSize: "14px", lineHeight: 1.65, margin: 0 }}>{p}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{ borderTop: "1px solid #D1C9BB", paddingTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "3px", height: "36px", background: "#B8962E" }}/>
                <div>
                  <div style={{ color: "#0A1628", fontSize: "12px", fontWeight: "700", letterSpacing: "1px" }}>MACHADO MEYER ADVOGADOS</div>
                  <div style={{ color: "#9CA3AF", fontSize: "11px" }}>Área Trabalhista · Consultoria</div>
                </div>
              </div>
              <div style={{ color: "#9CA3AF", fontSize: "11px", textAlign: "right" }}>Documento gerado por IA · Uso interno<br/>Sujeito à revisão do advogado responsável</div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => window.print()} style={{ flex: 1, padding: "14px", background: "#B8962E", color: "#fff", border: "none", borderRadius: "4px", fontSize: "13px", fontFamily: "'Georgia', serif", letterSpacing: "2px", cursor: "pointer" }}>EXPORTAR PDF</button>
              <button onClick={reset} style={{ flex: 1, padding: "14px", background: "transparent", color: "#0A1628", border: "2px solid #0A1628", borderRadius: "4px", fontSize: "13px", fontFamily: "'Georgia', serif", letterSpacing: "2px", cursor: "pointer" }}>NOVA ANÁLISE</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

