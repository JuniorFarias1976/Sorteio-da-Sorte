import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Participant, DrawWinner, BrandConfig, ReportPdfConfig } from '../types';

// Export participants to Excel
export const exportParticipantsToExcel = (participants: Participant[], filename = 'participantes_lacer_omd.xlsx') => {
  const data = participants.map((p, index) => ({
    '#': index + 1,
    'Número do Bilhete': p.ticketNumber,
    'Nome Completo': p.name,
    'E-mail Profissional': p.email,
    'Telefone': p.phone,
    'Clínica / Consultório': p.clinic || '-',
    'Cidade': p.city,
    'Especialidade': p.specialty || '-',
    'Visita Representante Lacer': p.wantsLacerVisit ? 'Sim, solicitou visita' : 'Não',
    'Autorização Comercial / Novidades': p.marketingConsent ? 'Sim, autorizado' : 'Não',
    'Termos & Privacidade': p.termsAccepted ? 'Aceite' : 'Pendente',
    'Status': p.status === 'active' ? 'Ativo' : p.status === 'winner' ? 'Premiado' : 'Banido',
    'Data de Inscrição': new Date(p.createdAt).toLocaleDateString('pt-PT') + ' ' + new Date(p.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  // Set column widths
  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 18 },
    { wch: 28 },
    { wch: 28 },
    { wch: 18 },
    { wch: 28 },
    { wch: 18 },
    { wch: 26 },
    { wch: 24 },
    { wch: 24 },
    { wch: 18 },
    { wch: 12 },
    { wch: 20 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Participantes Lacer');
  XLSX.writeFile(workbook, filename);
};

// Export participants to PDF
export const exportParticipantsToPDF = (participants: Participant[], brand: BrandConfig) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  const now = new Date();

  // Header Banner - Navy Corporate
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 297, 26, 'F');

  // Accent Line
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 25, 297, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(brand.companyName || 'Sorteio Lacer OMD 2026', 14, 16);

  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Relatório Oficial de Participantes & Contactos Profissionais', 283, 16, { align: 'right' });

  // Subheader
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8.5);
  doc.text(
    `Gerado em: ${now.toLocaleDateString('pt-PT')} às ${now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })} | Total de inscritos: ${participants.length}`,
    14,
    33
  );

  const tableData = participants.map((p, index) => [
    index + 1,
    `#${p.ticketNumber}`,
    p.name,
    p.email,
    p.phone,
    p.clinic || '-',
    p.city,
    p.specialty || '-',
    p.wantsLacerVisit ? 'Sim' : 'Não',
    p.marketingConsent ? 'Sim' : 'Não',
    p.termsAccepted !== false ? 'Aceite' : 'Pendente',
  ]);

  autoTable(doc, {
    startY: 37,
    head: [[
      '#',
      'Bilhete',
      'Nome Completo',
      'E-mail Profissional',
      'Telefone',
      'Clínica / Consultório',
      'Cidade',
      'Especialidade',
      'Visita Lacer',
      'Comercial',
      'RGPD / Termos',
    ]],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 18, fontStyle: 'bold', textColor: [16, 185, 129] },
      2: { cellWidth: 38, fontStyle: 'bold' },
      3: { cellWidth: 42 },
      4: { cellWidth: 24 },
      5: { cellWidth: 34 },
      6: { cellWidth: 22 },
      7: { cellWidth: 34 },
      8: { cellWidth: 16, halign: 'center' },
      9: { cellWidth: 16, halign: 'center' },
      10: { cellWidth: 18, halign: 'center' },
    },
    margin: { left: 10, right: 10 },
  });

  doc.save(`participantes_lacer_${now.toISOString().slice(0, 10)}.pdf`);
};

// Export Winners Audit Report to PDF
export const exportWinnersReportPDF = (
  winners: DrawWinner[],
  brand: BrandConfig,
  config?: ReportPdfConfig
) => {
  const doc = new jsPDF();
  const now = new Date();

  const cfg: ReportPdfConfig = config || {
    title: 'ATA E AUDITORIA OFICIAL DE SORTEIO',
    subtitle: 'RELATÓRIO CONSOLIDADO DE VENCEDORES HOMOLOGADOS',
    protocolPrefix: 'LACER-',
    statementText:
      'Certificamos que o sorteio foi realizado em tempo real utilizando algoritmo pseudo-aleatório criptográfico auditável sem duplicidade ou favorecimento, respeitando integralmente as regras do regulamento oficial da Lacer.',
    organizerSignTitle: 'Assinatura do Responsável Lacer / Direção',
    auditorSignTitle: 'Assinatura da Comissão de Auditoria',
    includeTicket: true,
    includeWinnerName: true,
    includePrize: true,
    includePhone: true,
    includeClinic: true,
    includeSpecialty: true,
    includeDocument: false,
    includeEmail: true,
    includeHash: true,
    includeDate: true,
  };

  // Header Banner - Navy Corporate
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 32, 'F');

  // Accent Line - Emerald Green
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 31, 210, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(brand.companyName || 'Sorteio Lacer OMD 2026', 14, 15);

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(cfg.title || 'ATA E AUDITORIA OFICIAL DE SORTEIO', 14, 25);

  doc.setTextColor(203, 213, 225);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Protocolo: ${cfg.protocolPrefix || 'LACER-'}${now.getTime().toString().slice(-8)}`,
    196,
    15,
    { align: 'right' }
  );
  doc.text(
    `Data: ${now.toLocaleDateString('pt-PT')} ${now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`,
    196,
    25,
    { align: 'right' }
  );

  // Body Information
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`1. ${cfg.subtitle || 'VENCEDORES HOMOLOGADOS'} (${winners.length} REGISTOS)`, 14, 42);

  // Dynamic table headers based on config
  const headers: string[] = ['#'];
  if (cfg.includePrize) headers.push('Prémio');
  if (cfg.includeTicket) headers.push('Bilhete');
  if (cfg.includeWinnerName) headers.push('Vencedor(a)');
  if (cfg.includeClinic) headers.push('Clínica');
  if (cfg.includeSpecialty) headers.push('Especialidade');
  if (cfg.includePhone) headers.push('Telefone');
  if (cfg.includeEmail) headers.push('E-mail');
  if (cfg.includeDocument) headers.push('NIF/Doc');
  if (cfg.includeDate) headers.push('Data/Hora');
  if (cfg.includeHash) headers.push('Hash');

  const tableData = winners.map((w, i) => {
    const row: Array<string | number> = [i + 1];
    if (cfg.includePrize) row.push(w.prizeTitle);
    if (cfg.includeTicket) row.push(`#${w.participantTicket}`);
    if (cfg.includeWinnerName) row.push(w.participantName);
    if (cfg.includeClinic) row.push(w.participantClinic || '-');
    if (cfg.includeSpecialty) row.push(w.participantSpecialty || '-');
    if (cfg.includePhone) row.push(w.participantPhone || '-');
    if (cfg.includeEmail) row.push(w.participantEmail || '-');
    if (cfg.includeDocument) row.push(w.participantDocument || '-');
    if (cfg.includeDate) {
      const dt = new Date(w.wonAt);
      row.push(`${dt.toLocaleDateString('pt-PT')} ${dt.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`);
    }
    if (cfg.includeHash) row.push(w.validationHash.slice(0, 10));
    return row;
  });

  autoTable(doc, {
    startY: 46,
    head: [headers],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42], // Elegant corporate navy instead of orange
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 14;

  // Signatures section
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('2. TERMO DE HOMOLOGAÇÃO E AUDITORIA', 14, finalY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    cfg.statementText ||
      'Certificamos que o sorteio foi realizado em tempo real utilizando algoritmo pseudo-aleatório criptográfico auditável sem duplicidade ou favorecimento, respeitando integralmente as regras do regulamento divulgado aos participantes.',
    14,
    finalY + 5,
    { maxWidth: 182 }
  );

  // Signature lines
  const sigY = finalY + 30;
  doc.setDrawColor(148, 163, 184);
  doc.line(14, sigY, 90, sigY);
  doc.line(120, sigY, 196, sigY);

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(cfg.organizerSignTitle || 'Assinatura do Organizador / Diretor', 52, sigY + 5, { align: 'center' });
  doc.text(cfg.auditorSignTitle || 'Assinatura da Comissão de Auditoria', 158, sigY + 5, { align: 'center' });

  doc.save(`relatorio_vencedores_${now.toISOString().slice(0, 10)}.pdf`);
};

// Export Individual Award Certificate to PDF
export const exportCertificatePDF = (winner: DrawWinner, brand: BrandConfig) => {
  const doc = new jsPDF({ orientation: 'landscape' });

  // Border ornament - Emerald Green & Slate Corporate (replaces old orange)
  doc.setDrawColor(16, 185, 129); // emerald-500
  doc.setLineWidth(3);
  doc.rect(10, 10, 277, 190);

  doc.setDrawColor(15, 23, 42); // slate-900
  doc.setLineWidth(0.8);
  doc.rect(14, 14, 269, 182);

  // Top Accent Bar
  doc.setFillColor(15, 23, 42);
  doc.rect(14, 14, 269, 12, 'F');
  doc.setFillColor(16, 185, 129);
  doc.rect(14, 25, 269, 1.5, 'F');

  // Header inside top bar
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text((brand.companyName || 'Sorteio Oficial Lacer OMD 2026').toUpperCase(), 148, 22, { align: 'center' });

  // Certificate Title
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICADO OFICIAL DE HOMOLOGAÇÃO', 148, 48, { align: 'center' });

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'normal');
  doc.text('COMPROVATIVO DE CONTEMPLAÇÃO E AUDITORIA EM TEMPO REAL', 148, 56, { align: 'center' });

  // Recipient text
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(11);
  doc.text('Certificamos para os devidos efeitos que o(a) participante profissional', 148, 74, { align: 'center' });

  // Winner Name
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(winner.participantName.toUpperCase(), 148, 88, { align: 'center' });

  // Clinic & Specialty details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const clinicText = winner.participantClinic ? `Clínica: ${winner.participantClinic}` : '';
  const specText = winner.participantSpecialty ? `Especialidade: ${winner.participantSpecialty}` : '';
  const details = [clinicText, specText].filter(Boolean).join('  |  ');
  if (details) {
    doc.text(details, 148, 97, { align: 'center' });
  }

  // Winning ticket badge
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(`BILHETE PREMIADO: #${winner.participantTicket}`, 148, 110, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('Foi legitimamente contemplado(a) no sorteio oficial com a seguinte atribuição:', 148, 122, { align: 'center' });

  // Prize Title
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`★ ${winner.prizeTitle} ★`, 148, 134, { align: 'center' });

  // Footer & security
  const wonDate = new Date(winner.wonAt);
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Sorteio realizado em ${wonDate.toLocaleDateString('pt-PT')} às ${wonDate.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })} (Horário de Portugal Continental)`,
    148,
    148,
    { align: 'center' }
  );
  doc.text(`Código Criptográfico de Auditoria: ${winner.validationHash}`, 148, 155, { align: 'center' });

  // Signatures
  doc.setDrawColor(148, 163, 184);
  doc.line(40, 178, 110, 178);
  doc.line(186, 178, 256, 178);

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Assinatura do Responsável Lacer / Direção', 75, 183, { align: 'center' });
  doc.text('Assinatura da Comissão de Auditoria', 221, 183, { align: 'center' });

  doc.save(`certificado_${winner.participantTicket}_${winner.participantName.replace(/\s+/g, '_')}.pdf`);
};

// Generate Official Raffle Regulation & Privacy Policy (RGPD) jsPDF document
export const generateRegulationPDFDoc = (brand: BrandConfig): jsPDF => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const company = brand.companyName || 'Sorteio Lacer OMD 2026';

  // --- HEADER BANNER: Slate 900 ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 32, 'F');

  // Accent Line: Emerald Green
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 31, 210, 1.8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('REGULAMENTO OFICIAL DO SORTEIO & POLÍTICA DE PRIVACIDADE', 14, 15);

  doc.setTextColor(148, 163, 184); // slate-400
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
    '1. A inscrição é gratuita e realiza-se exclusivamente através da plataforma digital oficial da Lacer.\n2. Cada participante deverá indicar o seu nome completo, e-mail profissional, telefone, clínica ou consultório, cidade e a(s) sua(s) respetiva(s) especialidade(s) odontológica(s), sendo admitida e incentivada a seleção de mais de uma opção/especialidade.\n3. É gerado um Número da Sorte único (5 dígitos) por participante no momento da submissão. Para garantia de igualdade, cada participante apenas pode inscrever-se uma única vez por endereço de e-mail.'
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

  // Bottom seal & signature
  const sigY = Math.min(y + 3, 274);
  doc.setDrawColor(203, 213, 225);
  doc.line(14, sigY, 95, sigY);
  doc.line(115, sigY, 196, sigY);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Direção Comercial & Marketing • Lacer Farmacêutica', 54.5, sigY + 4, { align: 'center' });
  doc.text('Comissão Oficial de Auditoria e Sorteios OMD', 155.5, sigY + 4, { align: 'center' });

  return doc;
};

// Export Official Raffle Regulation & Privacy Policy (RGPD) to PDF
export const exportRegulationPDF = (brand: BrandConfig) => {
  const doc = generateRegulationPDFDoc(brand);
  doc.save('Regulamento_Oficial_Sorteio_Lacer_OMD_2026.pdf');
};

// Get Regulation PDF Blob URL for in-app viewing or target="_blank"
export const getRegulationPDFBlobUrl = (brand: BrandConfig): string => {
  const doc = generateRegulationPDFDoc(brand);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
};

