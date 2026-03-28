Estratégia de Prevenção a Fraudes


Idempotência (Evitar Duplicidade)

Implementação: O serviço de Lançamentos deve exigir um x-idempotency-key (UUID) no cabeçalho de cada requisição.

Ação: Se a mesma chave for enviada em um curto intervalo, o sistema retorna o status da transação anterior em vez de processar um novo débito/crédito.



Padrão Transactional Outbox (Integridade de Dados):

Para evitar que um lançamento seja salvo no banco mas a mensagem se perca (ou vice-versa), garantindo que o saldo consolidado nunca divirja do real.

Técnica: O serviço grava o lançamento e o evento na mesma transação de banco de dados. Um "Relay" lê essa tabela e envia para o Broker (RabbitMQ).

Benefício: Garante consistência eventual de 100%, impedindo "saldos fantasmas".



Detecção de Anomalias (Behavioral Analysis)

Rate Limiting Dinâmico: Se um usuário tentar realizar 50 lançamentos em 1 segundo, o sistema bloqueia temporariamente via Redis (Prevenção contra scripts maliciosos).

Validação de Limite Operacional: Regras de negócio que barram lançamentos acima de um valor "X" sem uma aprovação de segundo nível (Segregação de Funções).



Trilhas de Auditoria (Imutabilidade)

Decisão: Os logs de transações devem ser enviados para um armazenamento imutável (S3 com Object Lock ou Elasticsearch).

O que registrar: user_id, ip_address, timestamp, payload_hash e device_fingerprint.

OBS: Em caso de fraude interna, há um rastro não apagável de quem alterou o fluxo de caixa.

Sensitive Data Encriptação --> em nível de aplicação (Field-level Encryption) Mesmo com acesso ao DB, o atacante não lê valores financeiros crus.

API Security --> OAuth2 + JWT (RS256 - Chaves Assimétricas) Apenas o provedor de identidade assina; os serviços apenas validam a chave pública.

Secrets Management --> HashiCorp Vault ou AWS Secrets Manager