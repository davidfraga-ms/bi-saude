from typing import Dict, Any

MOCK_DATABASE: Dict[str, Dict[str, Any]] = {
    "cabo-de-santo-agostinho": {
        "municipio_ibge": "260290",
        "municipio_nome": "Cabo de Santo Agostinho",
        "uf": "PE",
        "ano_exercicio": 2025,
        "diretrizes": [
            {
                "id": "dir-1",
                "codigo": "DIR-01",
                "nome": "Fortalecimento da Atenção Primária à Saúde (APS)",
                "descricao": "Ampliação da cobertura vacinal e expansão da estratégia de saúde da família na zona urbana e rural.",
                "objetivos": [
                    {
                        "id": "obj-1-1",
                        "descricao": "Elevar a cobertura populacional estimada pelas equipes de Saúde da Família para 90%.",
                        "metas": [
                            {
                                "id": "meta-1-1-1",
                                "descricao": "Alcançar 95% de cobertura vacinal em crianças menores de 1 ano (Poliomielite e Pentavalente).",
                                "vl_projetado": 95.0,
                                "vl_alcancado": 92.4,
                                "percentual_alcance": 97.26,
                                "vl_financeiro_aplicado": 1450000.00,
                                "status": "atingida",
                                "acoes": [
                                    {"id": "ac-1", "descricao": "Campanha municipal de multivacinação nas escolas", "vl_orcamento": 250000.0, "status": "concluida"},
                                    {"id": "ac-2", "descricao": "Aquisição de câmaras refrigeradas para salas de vacina", "vl_orcamento": 600000.0, "status": "concluida"},
                                    {"id": "ac-3", "descricao": "Busca ativa de faltosos por Agentes Comunitários de Saúde (ACS)", "vl_orcamento": 600000.0, "status": "em_execucao"}
                                ]
                            },
                            {
                                "id": "meta-1-1-2",
                                "descricao": "Realizar no mínimo 7 consultas pré-natal em 80% das gestantes cadastradas.",
                                "vl_projetado": 80.0,
                                "vl_alcancado": 65.0,
                                "percentual_alcance": 81.25,
                                "vl_financeiro_aplicado": 820000.00,
                                "status": "parcial",
                                "acoes": [
                                    {"id": "ac-4", "descricao": "Oficinas de capacitação para enfermeiros em pré-natal de baixo risco", "vl_orcamento": 120000.0, "status": "concluida"},
                                    {"id": "ac-5", "descricao": "Entrega de kits maternidade e transporte para exames ultrassonográficos", "vl_orcamento": 700000.0, "status": "em_execucao"}
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                "id": "dir-2",
                "codigo": "DIR-02",
                "nome": "Vigilância em Saúde e Controle de Endemias",
                "descricao": "Redução dos índices de infestação por arboviroses e controle epidemiológico de ISTs.",
                "objetivos": [
                    {
                        "id": "obj-2-1",
                        "descricao": "Controlar o índice de infestação predial (LIRAa) para patamares inferiores a 1%.",
                        "metas": [
                            {
                                "id": "meta-2-1-1",
                                "descricao": "Manter o IIP (Índice de Infestação Predial) abaixo de 1.0% durante todo o exercício.",
                                "vl_projetado": 1.0,
                                "vl_alcancado": 1.8,
                                "percentual_alcance": 55.5,
                                "vl_financeiro_aplicado": 530000.00,
                                "status": "nao_atingida",
                                "acoes": [
                                    {"id": "ac-6", "descricao": "Mutirões comunitários de limpeza e bota-fora de focos de dengue", "vl_orcamento": 230000.0, "status": "em_execucao"},
                                    {"id": "ac-7", "descricao": "Aplicação espacial de inseticida UBV (fumacê) em áreas de risco", "vl_orcamento": 300000.0, "status": "em_execucao"}
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                "id": "dir-3",
                "codigo": "DIR-03",
                "nome": "Média e Alta Complexidade e Urgência/Emergência",
                "descricao": "Otimização da regulação de leitos e redução do tempo de espera em consultas especializadas.",
                "objetivos": [
                    {
                        "id": "obj-3-1",
                        "descricao": "Integrar 100% dos serviços ambulatoriais especializados ao sistema informatizado de regulação.",
                        "metas": [
                            {
                                "id": "meta-3-1-1",
                                "descricao": "Implantar prontuário eletrônico unificado em 100% dos centros de especialidades e UPAs.",
                                "vl_projetado": 100.0,
                                "vl_alcancado": 100.0,
                                "percentual_alcance": 100.0,
                                "vl_financeiro_aplicado": 2100000.00,
                                "status": "atingida",
                                "acoes": [
                                    {"id": "ac-8", "descricao": "Infraestrutura de fibra óptica e equipamentos de TI para as UPAs", "vl_orcamento": 1300000.0, "status": "concluida"},
                                    {"id": "ac-9", "descricao": "Licenciamento e implantação do sistema e-SUS Especializado", "vl_orcamento": 800000.0, "status": "concluida"}
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },
    "sao-paulo": {
        "municipio_ibge": "355030",
        "municipio_nome": "São Paulo",
        "uf": "SP",
        "ano_exercicio": 2025,
        "diretrizes": [
            {
                "id": "dir-sp-1",
                "codigo": "DIR-01",
                "nome": "Atenção Primária e Saúde Digital",
                "descricao": "Modernização digital, telemedicina e redução de filas de especialidades na rede municipal.",
                "objetivos": [
                    {
                        "id": "obj-sp-1",
                        "descricao": "Ampliar o atendimento por teleconsulta para 500 mil consultas anuais.",
                        "metas": [
                            {
                                "id": "meta-sp-1-1",
                                "descricao": "Realizar 500.000 consultas remotas integradas à rede de UBS.",
                                "vl_projetado": 500000.0,
                                "vl_alcancado": 485000.0,
                                "percentual_alcance": 97.0,
                                "vl_financeiro_aplicado": 15800000.00,
                                "status": "atingida",
                                "acoes": [
                                    {"id": "ac-sp-1", "descricao": "Contratação de plataforma cloud e prontuário digital interoperável", "vl_orcamento": 9800000.0, "status": "concluida"},
                                    {"id": "ac-sp-2", "descricao": "Credenciamento de médicos especialistas para telessaúde", "vl_orcamento": 6000000.0, "status": "concluida"}
                                ]
                            },
                            {
                                "id": "meta-sp-1-2",
                                "descricao": "Redução do tempo médio de espera para ecocardiograma para menos de 30 dias.",
                                "vl_projetado": 30.0,
                                "vl_alcancado": 42.0,
                                "percentual_alcance": 71.4,
                                "vl_financeiro_aplicado": 8200000.00,
                                "status": "parcial",
                                "acoes": [
                                    {"id": "ac-sp-3", "descricao": "Corujão da Saúde em hospitais conveniados parceiros", "vl_orcamento": 8200000.0, "status": "em_execucao"}
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                "id": "dir-sp-2",
                "codigo": "DIR-02",
                "nome": "Rede de Urgência e Saúde Mental (RAPS)",
                "descricao": "Acolhimento humanizado em CAPS III e ampliação de leitos de retaguarda psiquiátrica.",
                "objetivos": [
                    {
                        "id": "obj-sp-2",
                        "descricao": "Expandir o número de CAPS III 24h na periferia da capital.",
                        "metas": [
                            {
                                "id": "meta-sp-2-1",
                                "descricao": "Inauguração e operação de 8 novos CAPS III.",
                                "vl_projetado": 8.0,
                                "vl_alcancado": 3.0,
                                "percentual_alcance": 37.5,
                                "vl_financeiro_aplicado": 4500000.00,
                                "status": "nao_atingida",
                                "acoes": [
                                    {"id": "ac-sp-4", "descricao": "Reforma e adequação de imóveis na zona leste e sul", "vl_orcamento": 2500000.0, "status": "em_execucao"},
                                    {"id": "ac-sp-5", "descricao": "Concurso público e formação multidisciplinar em saúde mental", "vl_orcamento": 2000000.0, "status": "planejada"}
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    }
}
