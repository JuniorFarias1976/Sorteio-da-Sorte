import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputPath = path.join(rootDir, 'public', 'regulamento.pdf');

export function createRegulationPDF(): Buffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const company = 'Sorteio Oficial Lacer OMD 2026';

  // --- HEADER BANNER: Slate 900 ---
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 32, 'F');

  // Accent Line: Emerald 500
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 31, 210, 1.8, 'F');

  // Header Titles
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('REGULAMENTO OFICIAL DO SORTEIO & POLÍTICA DE PRIVACIDADE', 14, 15);

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${company.toUpperCase()} • LACER FARMACÊUTICA • EDIÇÃO OFICIAL 2026`, 14, 23);

  doc.setTextColor(203, 213, 225);
  doc.setFontSize(7.5);
  doc.text('DOCUMENTO HOMOLOGADO • RGPD UE 2016/679', 196, 23, { align: 'right' });

  let y = 40;

  const addSection = (num: string, title: string, text: string) => {
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`${num}. ${title.toUpperCase()}`, 14, y);
    y += 4.5;

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, 182);
    doc.text(lines, 14, y);
    y += lines.length * 3.7 + 4;
  };

  addSection(
    'Artigo 1.º',
    'Entidade Promotora e Objeto do Sorteio',
    'O presente sorteio institucional é promovido pela Lacer Farmacêutica, com o objetivo de divulgar as suas soluções de saúde oral junto dos profissionais do setor dentário durante o evento oficial OMD 2026, premiando os participantes devidamente inscritos de forma transparente, equitativa e auditável.'
  );

  addSection(
    'Artigo 2.º',
    'Destinatários e Elegibilidade',
    'Podem inscrever-se no sorteio todos os Médicos Dentistas, Médicos Estomatologistas, Higienistas Orais, Assistentes Dentários, Gestores de Clínica e demais profissionais e estudantes credenciados do setor de medicina dentária em exercício em território português.'
  );

  addSection(
    'Artigo 3.º',
    'Mecânica de Participação e Múltiplas Especialidades',
    '1. A inscrição é gratuita e realiza-se exclusivamente através da plataforma digital oficial da Lacer.\n2. Cada participante deverá indicar o seu nome completo, e-mail profissional, telefone, clínica ou consultório, cidade e a(s) sua(s) respetiva(s) especialidade(s) odontológica(s), sendo admitida e incentivada a seleção de mais de uma especialidade/opção.\n3. É gerado um Número da Sorte único (5 dígitos) por participante no momento da submissão. Para garantia de igualdade, cada participante apenas pode inscrever-se uma única vez por endereço de e-mail.'
  );

  addSection(
    'Artigo 4.º',
    'Sorteios, Datas e Transmissão em Direto',
    'Os sorteios serão realizados nos horários e rondas programadas pela organização e transmitidos em direto no ecrã oficial da plataforma. O processo utiliza algoritmo pseudo-aleatório criptográfico seguro (CSPRNG), com emissão automática de código hash de validação imutável para verificação pública e auditoria independente.'
  );

  addSection(
    'Artigo 5.º',
    'Atribuição, Notificação e Reclamação de Prémios',
    '1. Os contemplados serão contactados pela equipa da Lacer através dos dados profissionais indicados na inscrição.\n2. Os prémios (incluindo dispositivos de higiene oral avançada Lacer Hidro e demais distinções do catálogo oficial) não são passíveis de troca, devolução ou conversão em dinheiro.\n3. A reclamação do prémio e apresentação de documento profissional comprobatório deverá ocorrer no prazo de até 30 dias após a homologação da ata oficial do sorteio.'
  );

  addSection(
    'Artigo 6.º',
    'Política de Privacidade e Tratamento de Dados (RGPD)',
    'Em estrito cumprimento do Regulamento Geral sobre a Proteção de Dados (Regulamento UE 2016/679) e da Lei n.º 58/2019:\na) Responsável pelo Tratamento: Lacer Farmacêutica.\nb) Finalidade Principal: Gestão integral da participação no sorteio, apuramento dos números contemplados, entrega de prémios e arquivo de atas de auditoria legal.\nc) Finalidade Facultativa (Consentimento): Mediante autorização expressa no ato de registo, os dados poderão ser utilizados para envio de informação científica sobre produtos Lacer, novidades institucionais e agendamento de visitas de apresentação de produtos por delegados comerciais à clínica indicada.\nd) Direitos do Titular: O participante tem o direito de solicitar a todo o momento o acesso, retificação, limitação ou eliminação dos seus dados pessoais através de contacto com os canais oficiais da Lacer.'
  );

  addSection(
    'Artigo 7.º',
    'Disposições Finais e Aceitação',
    'A submissão do formulário de inscrição implica a aceitação integral, sem reservas ou condições, do presente regulamento oficial. Qualquer situação omissa será resolvida pela comissão organizadora da Lacer segundo critérios de boa-fé e transparência.'
  );

  // Bottom seal & signatures
  const sigY = Math.min(y + 3, 274);
  doc.setDrawColor(203, 213, 225);
  doc.line(14, sigY, 95, sigY);
  doc.line(115, sigY, 196, sigY);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Direção Comercial & Marketing • Lacer Farmacêutica', 54.5, sigY + 4, { align: 'center' });
  doc.text('Comissão Oficial de Auditoria e Sorteios OMD', 155.5, sigY + 4, { align: 'center' });

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}

const buffer = createRegulationPDF();
fs.writeFileSync(outputPath, buffer);
console.log('Successfully written official regulation PDF to:', outputPath, 'Size:', buffer.length);
