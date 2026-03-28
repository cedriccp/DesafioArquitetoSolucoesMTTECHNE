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


graph TD
    User((Comerciante))
    System[Sistema de Fluxo de Caixa]
    EmailService[Serviço de Notificação Ext]
    
    User -- "Registra lançamentos e consulta saldos" --> System
    System -- "Envia alertas" --> EmailService


// --------------------------



​Container Diagram 
(L2) --> ​padrão CQRS (Command Query Responsibility Segregation) assíncrono.

graph LR
    User((Comerciante))
    
    subgraph "Cash Flow System"
        Gateway[API Gateway / Auth]
        
        S1[Serviço de Lançamentos\n.NET / Java / Go]
        DB1[(PostgreSQL\nTransacional)]
        
        Broker[Message Broker\nRabbitMQ / Kafka]
        
        S2[Worker de Consolidação\nConsumidor]
        S3[Serviço de Relatórios\nQuery API]
        DB2[(Redis / MongoDB\nRead Model)]
    end

    User -- "HTTPS/JSON" --> Gateway
    Gateway -- "Write" --> S1
    S1 -- "Persiste" --> DB1
    S1 -- "Publica Evento" --> Broker
    Broker -- "Assina" --> S2
    S2 -- "Atualiza Saldo" --> DB2
    Gateway -- "Read" --> S3
    S3 -- "Consulta" --> DB2


// --------------------------


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


sequenceDiagram
    participant U as Comerciante
    participant G as API Gateway (Rate Limit)
    participant IDP as Identity Provider (OIDC)
    participant S as Microserviço
    participant DB as Banco de Dados (AES-256)

    U->>IDP: Autenticar (User/Pass)
    IDP-->>U: JWT Token (Signed)
    U->>G: Request + JWT
    G->>G: Valida Rate Limit & WAF
    G->>S: Encaminha Req (mTLS)
    S->>S: Valida Escopo do Token
    S->>DB: Escrita com Dados Criptografados
    DB-->>S: Sucesso
    S-->>U: 201 Created

// ---------------------------------



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


OBS:
----
Resiliência (Requisito Não Funcional):
 O uso do Message Broker garante que, se o "Serviço de Consolidação" cair, as mensagens de lançamentos ficarão represadas na fila. Assim que o serviço subir, ele processa o gargalo sem perda de dados.


Performance (50 req/s): A leitura do saldo consolidado é feita em um banco de dados de leitura (Read Model), evitando consultas pesadas de SUM() no banco transacional de lançamentos.


Segurança:
Rate Limiting: Previne exaustão de recursos.

Criptografia: Dados sensíveis são protegidos em repouso e em trânsito.

Desacoplamento: O serviço de lançamentos não conhece o de consolidado, reduzindo a superfície de ataque em caso de falha em cascata.
