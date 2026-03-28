# DesafioArquitetoSolucoesMTTECHNE
Controle de fluxo de caixa com relatorio de saldo diário 


1. Mapeamento de Domínios e Capacidades
​Para atender ao requisito de que o serviço de lançamentos não pare se o consolidado falhar, utilizarei uma Arquitetura Baseada em Eventos (EDA).
​Domínio de Lançamentos (Core): Responsável pelo CRUD de débitos e créditos. É o sistema de escrita (Transactional).
​Domínio de Consolidação (Reporting): Responsável por agregar os dados e fornecer o saldo diário. É o sistema de leitura (Read Model).



​2. Arquitetura Proposta 
(C4 Model - Nível 1 e 2)

​Context Diagram 
(L1) --> ​O Comerciante interage com o Sistema de Fluxo de Caixa para registrar movimentações e consultar saldos. O sistema é isolado e resiliente.

​Container Diagram 
(L2) --> ​Aqui aplicarei o padrão CQRS (Command Query Responsibility Segregation) assíncrono.

​API de Lançamentos: 
Recebe débitos/créditos, 
salva no PostgreSQL e publica um evento LancamentoCriado em um tópico do RabbitMQ/Kafka.

​Worker de Consolidação: Consome os eventos e atualiza uma tabela de saldo consolidado em um banco otimizado para leitura (ou uma tabela específica).

​API de Relatórios: Consulta o saldo consolidado sem onerar o banco de lançamentos.



​3. Segurança (Obrigatório)
​Minha proposta foca em Defense in Depth:
​Autenticação/Autorização: 
Uso de OAuth2/OpenID Connect com JWT. 
O serviço de lançamentos exige o scope cashflow.write, o de relatórios cashflow.read.

​Proteção de API: Implementação de Rate Limiting (exemplo: 100 req/s por IP) no API Gateway (Kong ou AWS WAF) para evitar DoS.

​Segurança de Dados:
​At Rest: Criptografia de disco (AES-256).
​In Transit: TLS 1.2+ em todas as comunicações.

​Comunicação entre Serviços: mTLS ou validação de JWT interno via Service Mesh (Istio) ou validação simples de API Key rotativa em Secrets Manager.



​4. Registro de Decisões Arquiteturais
(ADR Exemplo)
​ADR 001: Comunicação Assíncrona via Mensageria
​Contexto: O serviço de consolidado não pode afetar a disponibilidade do lançamento.
​Decisão: Utilizar um Message Broker para desacoplar os serviços.
​Trade-off: Introduz latência eventual (Consistência Eventual). 
O saldo pode demorar alguns milissegundos para atualizar, mas o sistema de vendas nunca para.
​Alternativa Descartada: Chamada HTTP síncrona (geraria acoplamento temporal e falha em cascata).



​5. Requisitos Não Funcionais e Operação:

​Escalabilidade e Resiliência:
​Picos de 50 req/s: O uso de mensageria atua como um buffer. 
Se o serviço de consolidado ficar lento, as mensagens ficam na fila e são processadas conforme a capacidade, garantindo 0% de perda (superando os 5% permitidos).

​Observabilidade: Implementar OpenTelemetry para rastreamento distribuído (Tracing), permitindo ver o caminho de um lançamento desde a API até a consolidação.

​Estratégia de Deploy:
​Blue/Green Deployment para evitar downtime.
​Health Checks (/health/live e /health/ready) configurados no Kubernetes para autorreparação.
