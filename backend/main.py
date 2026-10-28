from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from models import RagDashboardData, AnaliseDafRequest, AnaliseDafResponse
from services import sanitizar_ibge, consultar_digisus_real
from openai_service import executar_analise_daf_completa, consultar_openai_daf

app = FastAPI(
    title="BI Saúde - RAG & PAS DigiSUS BFF",
    description="BFF que consome dados do DigiSUS e realiza análise de similaridade com o DAF via OpenAI.",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health():
    return {"status": "online", "mode": "digisus-live-with-openai"}

@app.get("/api/rag/{ibge_input}", response_model=RagDashboardData)
async def obter_rag_por_ibge(
    ibge_input: str,
    ano: int = Query(2025, description="Ano do exercício do PAS/RAG")
):
    """
    Recebe um código IBGE (6 ou 7 dígitos numéricos).
    - Se tiver 7 dígitos, elimina o último dígito verificador.
    - Consulta os dados em tempo real no DigiSUS.
    """
    ibge_6, uf = sanitizar_ibge(ibge_input)
    try:
        dados = await consultar_digisus_real(ibge_6=ibge_6, uf=uf, ano=ano)
        return dados
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Não foi possível obter resposta dos servidores do DigiSUS: {str(e)}"
        )

@app.post("/api/rag/{ibge_input}/analise-daf", response_model=AnaliseDafResponse)
async def analisar_daf_por_ibge(
    ibge_input: str,
    ano: int = Query(2025, description="Ano do exercício"),
    req: AnaliseDafRequest = Body(default_factory=AnaliseDafRequest)
):
    """
    Consulta o RAG do município no DigiSUS e aplica a inteligência do OpenAI
    para identificar e categorizar os itens com relacionamento ao DAF (Assistência Farmacêutica).
    Filtra por padrão os achados de relacionamento forte (PROVAVEL e EVIDENTE).
    """
    ibge_6, uf = sanitizar_ibge(ibge_input)
    dados_rag = await consultar_digisus_real(ibge_6=ibge_6, uf=uf, ano=ano)

    resultado = await executar_analise_daf_completa(
        dados_rag=dados_rag,
        apenas_fortes=req.apenas_fortes,
        model=req.model,
        temperature=req.temperature
    )
    return resultado

@app.post("/api/analise-daf/texto-livre")
async def analisar_daf_texto_livre(
    texto: str = Body(..., media_type="text/plain"),
    model: str = Query("gpt-4o-mini"),
    temperature: float = Query(0.1)
):
    """
    Endpoint para analisar qualquer trecho arbitrário de texto ou JSON
    utilizando rigorosamente o prompt de especialista do DAF/SECTICS.
    """
    achados = await consultar_openai_daf(
        texto_rag=texto,
        model=model,
        temperature=temperature
    )
    return {"achados": achados}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
