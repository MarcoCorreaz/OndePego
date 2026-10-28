import fs from 'node:fs';
import path from 'node:path';
import { listPendingAuditEstablishments } from '../src/lib/coordsAudit';
import { EstabelecimentosFile } from '../src/types/schema';

function main(): void {
  const filePath = path.resolve(process.cwd(), 'data/estabelecimentos.json');
  if (!fs.existsSync(filePath)) {
    console.error(`Arquivo não encontrado: ${filePath}`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as unknown;
  const estabelecimentos = EstabelecimentosFile.parse(raw);
  const pending = listPendingAuditEstablishments(estabelecimentos);

  console.log('=== Auditoria Humana de Coordenadas (data/estabelecimentos.json) ===');
  console.log(`Total de estabelecimentos no arquivo : ${estabelecimentos.length}`);
  console.log(`Pendentes de auditoria ou localização: ${pending.length}`);

  if (pending.length === 0) {
    console.log('Todos os estabelecimentos possuem coordenadas válidas e auditadas manualmente.');
    return;
  }

  console.log('');
  for (const item of pending) {
    const coordStatus = item.hasValidCoords
      ? 'Coordenada aproximada (auditado_manualmente=false)'
      : 'SEM LOCALIZAÇÃO VÁLIDA (sem_localizacao / placeholder)';
    console.log(`- [${item.tipo}] id="${item.id}" | ${item.nome_fantasia}`);
    console.log(`  Endereço: ${item.endereco_completo} (${item.bairro})`);
    console.log(`  Status  : ${coordStatus}`);
    console.log(`  Verificar: ${item.googleMapsUrl}`);
  }
}

main();
