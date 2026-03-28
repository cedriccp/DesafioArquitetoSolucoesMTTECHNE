// src/services/lancamento-service/domain/entity.ts
// Serviço de Lançamento (Trecho Principal)
// ​Este serviço valida o lançamento e publica no Broker.

export interface Lancamento {
  id: string;
  valor: number;
  tipo: 'DEBITO' | 'CREDITO';
  data: Date;
}

