import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Participant, DrawWinner, BrandConfig, ReportPdfConfig } from '../types';

// Export participants to Excel
export const exportParticipantsToExcel = (participants: Participant[], filename = 'participantes_sorteio.xlsx') => {
  const data = participants.map((p, index) => ({
    '#': index + 1,
    'Número do Bilhete': p.ticketNumber,
    'Nome Completo': p.name,
    'E-mail': p.email,
    'Telefone / WhatsApp': p.phone,
    'CPF / Documento': p.document,
    'Cidade / Estado': p.city,
    'Status': p.status === 'active' ? 'Ativo' : p.status === 'winner' ? 'Premiado' : 'Banido',
    'Motivo de Banimento': p.banReason || '-',
    'Data de Inscrição': new Date(p.createdAt).toLocaleDateString('pt-BR') + ' ' + new Date(p.createdAt).toLocaleTimeString('pt-BR'),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  // Set column widths
  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 18 },
    { wch: 28 },
    { wch: 28 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 12 },
    { wch: 25 },
    { wch: 20 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Participantes');
  XLSX.writeFile(workbook, filename);
};

// Export participants to PDF
export const exportParticipantsToPDF = (participants: Participant[], brand: BrandConfig) => {
  const doc = new jsPDF({ orientation: 'landscape' });

  // Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(245, 158, 11); // amber-500
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(brand.companyName || 'SorteioLive Pro', 14, 15);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Relatório Oficial de Participantes Cadastrados', 150, 15, { align: 'right' });

  // Subheader
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  const now = new Date();
  doc.text(`Gerado em: ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')} | Total de registros: ${participants.length}`, 14, 32);

  const tableData = participants.map((p, index) => [
    index + 1,
    p.ticketNumber,
    p.name,
    p.document,
    p.phone,
    p.email,
    p.city,
    p.status === 'active' ? 'Ativo' : p.status === 'winner' ? 'Premiado' : 'Banido',
  ]);

  autoTable(doc, {
    startY: 36,
    head: [['#', 'Bilhete', 'Nome', 'CPF/Doc', 'Telefone', 'E-mail', 'Cidade', 'Status']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 26, fontStyle: 'bold', textColor: [217, 119, 6] },
      2: { cellWidth: 50 },
      3: { cellWidth: 32 },
      4: { cellWidth: 32 },
      5: { cellWidth: 55 },
      6: { cellWidth: 35 },
      7: { cellWidth: 22 },
    },
    margin: { left: 14, right: 14 },
  });

  doc.save(`participantes_${now.toISOString().slice(0, 10)}.pdf`);
};

// Export Winners Audit Report to PDF
export const exportWinnersReportPDF = (
  winners: DrawWinner[],
  brand: BrandConfig,
  config?: ReportPdfConfig
) => {
  const doc = new jsPDF();
  const now = new Date();

  const cfg = config || {
    title: 'ATA E AUDITORIA OFICIAL DE SORTEIO',
    subtitle: 'RELATÓRIO CONSOLIDADO DE VENCEDORES HOMOLOGADOS',
    protocolPrefix: 'SRT-',
    statementText:
      'Certificamos que o sorteio foi realizado em tempo real utilizando algoritmo pseudo-aleatório criptográfico auditável sem duplicidade ou favorecimento, respeitando integralmente as regras do regulamento divulgado aos participantes.',
    organizerSignTitle: 'Assinatura do Organizador / Diretor',
    auditorSignTitle: 'Assinatura da Comissão de Auditoria',
    includeTicket: true,
    includeWinnerName: true,
    includePrize: true,
    includePhone: true,
    includeDocument: true,
    includeEmail: true,
    includeHash: true,
    includeDate: true,
  };

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(245, 158, 11);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(brand.companyName || 'SorteioLive Pro', 14, 16);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(cfg.title || 'ATA E AUDITORIA OFICIAL DE SORTEIO', 14, 25);

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Protocolo: ${cfg.protocolPrefix || 'SRT-'}${now.getTime().toString().slice(-8)}`,
    196,
    16,
    { align: 'right' }
  );
  doc.text(
    `Data: ${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}`,
    196,
    25,
    { align: 'right' }
  );

  // Body Information
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`1. ${cfg.subtitle || 'VENCEDORES HOMOLOGADOS'} (${winners.length} REGISTROS)`, 14, 42);

  // Dynamic table headers based on config
  const headers: string[] = ['#'];
  if (cfg.includePrize) headers.push('Prêmio Sorteado');
  if (cfg.includeTicket) headers.push('Bilhete');
  if (cfg.includeWinnerName) headers.push('Vencedor(a)');
  if (cfg.includeDocument) headers.push('CPF/Doc');
  if (cfg.includePhone) headers.push('Telefone');
  if (cfg.includeEmail) headers.push('E-mail');
  if (cfg.includeDate) headers.push('Data/Hora');
  if (cfg.includeHash) headers.push('Hash Auditoria');

  const tableData = winners.map((w, i) => {
    const row: Array<string | number> = [i + 1];
    if (cfg.includePrize) row.push(w.prizeTitle);
    if (cfg.includeTicket) row.push(w.participantTicket);
    if (cfg.includeWinnerName) row.push(w.participantName);
    if (cfg.includeDocument) row.push(w.participantDocument || '-');
    if (cfg.includePhone) row.push(w.participantPhone || '-');
    if (cfg.includeEmail) row.push(w.participantEmail || '-');
    if (cfg.includeDate) {
      const dt = new Date(w.wonAt);
      row.push(`${dt.toLocaleDateString('pt-BR')} ${dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
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
      fillColor: [217, 119, 6],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 3,
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

  // Border ornament
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(3);
  doc.rect(10, 10, 277, 190);

  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.8);
  doc.rect(14, 14, 269, 182);

  // Header
  doc.setTextColor(217, 119, 6);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text((brand.companyName || 'SorteioLive Pro').toUpperCase(), 148, 32, { align: 'center' });

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICADO DE PREMIAÇÃO', 148, 48, { align: 'center' });

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('COMPROVANTE OFICIAL DE CONTEMPLAÇÃO EM SORTEIO', 148, 56, { align: 'center' });

  // Recipient text
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.text('Certificamos para os devidos fins de direito que o(a) participante', 148, 76, { align: 'center' });

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(217, 119, 6);
  doc.text(winner.participantName.toUpperCase(), 148, 92, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Inscrito sob o documento CPF/ID: ${winner.participantDocument || 'Verificado'} e Bilhete da Sorte:`, 148, 102, { align: 'center' });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`BILHETE PREMIADO: ${winner.participantTicket}`, 148, 114, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text('Foi legitimamente contemplado(a) com a seguinte premiação:', 148, 126, { align: 'center' });

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(`★ ${winner.prizeTitle} ★`, 148, 138, { align: 'center' });

  // Footer & security
  const wonDate = new Date(winner.wonAt);
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`Sorteio realizado em ${wonDate.toLocaleDateString('pt-BR')} às ${wonDate.toLocaleTimeString('pt-BR')}`, 148, 150, { align: 'center' });
  doc.text(`Código de Validação Digital: ${winner.validationHash}`, 148, 156, { align: 'center' });

  // Signatures
  doc.setDrawColor(148, 163, 184);
  doc.line(40, 180, 110, 180);
  doc.line(186, 180, 256, 180);

  doc.setFontSize(8);
  doc.text('Assinatura do Organizador Responsável', 75, 185, { align: 'center' });
  doc.text('Assinatura do Ganhador Contemplado', 221, 185, { align: 'center' });

  doc.save(`certificado_${winner.participantTicket}_${winner.participantName.replace(/\s+/g, '_')}.pdf`);
};
