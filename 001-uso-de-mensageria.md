
​Título: Uso de Mensageria para Desacoplamento de Fluxo de Caixa.

Status: Aceito.

Contexto: O sistema precisa garantir que o registro de vendas (lançamentos) seja resiliente a falhas no sistema de relatórios (consolidado).

Decisão: Implementar padrão Outbox com RabbitMQ.

Consequência: Positiva: Alta disponibilidade do serviço principal.

Negativa: Complexidade adicional de infraestrutura e monitoramento de filas.
