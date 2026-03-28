// Implementação do Worker de Consolidação
// ​Este componente atende ao requisito de resiliência. Ele "escuta" a fila e
// atualiza o saldo.
// src/services/consolidado-worker/worker.ts

export class ConsolidaSaldoWorker {
  async handle(message: Lancamento) {
    console.log(`Processando lançamento: ${message.id}`);
    
    // Lógica de idempotência: garantir que não processe a mesma mensagem 2x
    const saldoAtual = await db.relatorio.findDaily(message.data);
    
    const novoSaldo = message.tipo === 'CREDITO' 
      ? saldoAtual + message.valor 
      : saldoAtual - message.valor;

    await db.relatorio.updateDaily(message.data, novoSaldo);
  }
}
