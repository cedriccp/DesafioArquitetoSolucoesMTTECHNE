// src/services/lancamento-service/use-case/create-lancamento.ts
export class CreateLancamento {
  constructor(
    private repository: ILancamentoRepository,
    private queue: IMessageBroker
  ) {}

  async execute(data: Lancamento) {
    // 1. Persistência local (ACID)
    await this.repository.save(data);

    // 2. Notificação Assíncrona (Event Driven)
    // Se o worker de consolidado estiver fora, a mensagem fica na fila.
    await this.queue.publish('lancamento.criado', data);
    
    return { success: true };
  }
}
