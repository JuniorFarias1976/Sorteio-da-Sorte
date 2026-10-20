import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Participant, DrawWinner, BrandConfig, ReportPdfConfig } from '../types';

// Convert hex color to RGB tuple for jsPDF
export const hexToRgb = (hex?: string): [number, number, number] => {
  if (!hex) return [227, 6, 19]; // Default Lacer Red #E30613
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length !== 6) return [227, 6, 19];
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return [r, g, b];
};

// Convert SVG / Image URL to raster PNG data URL for jsPDF embedding
export const getLogoImageForPdf = async (logoUrl?: string): Promise<string | null> => {
  if (!logoUrl) return null;
  if (logoUrl.startsWith('data:image/png;base64,') || logoUrl.startsWith('data:image/jpeg;base64,') || logoUrl.startsWith('data:image/jpg;base64,')) {
    return logoUrl;
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const scale = 2;
          canvas.width = (img.naturalWidth || 160) * scale;
          canvas.height = (img.naturalHeight || 80) * scale;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/png'));
            return;
          }
        } catch {
          // fallback
        }
        resolve(null);
      };
      img.onerror = () => resolve(null);
      img.src = logoUrl;
    } catch {
      resolve(null);
    }
  });
};

// Draw crisp vector logo badge in jsPDF as guaranteed fallback
export const drawFallbackLogo = (
  doc: jsPDF,
  brand: BrandConfig,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  const primary = hexToRgb(brand.primaryColor || '#E30613');
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, width, height, 2, 2, 'F');
  doc.setDrawColor(primary[0], primary[1], primary[2]);
  doc.setLineWidth(0.8);
  doc.ellipse(x + width / 2, y + height / 2, width * 0.42, height * 0.35, 'S');
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.setFontSize(height * 0.5);
  doc.setFont('helvetica', 'bold');
  doc.text('lacer', x + width / 2, y + height / 2 + (height * 0.16), { align: 'center' });
};

// Render Logo in PDF (Raster PNG image or vector badge)
export const renderLogoInDoc = (
  doc: jsPDF,
  brand: BrandConfig,
  logoImgData: string | null,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  if (logoImgData) {
    try {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x - 0.8, y - 0.8, width + 1.6, height + 1.6, 2, 2, 'F');
      doc.addImage(logoImgData, 'PNG', x, y, width, height);
      return;
    } catch {
      // fallback
    }
  }
  drawFallbackLogo(doc, brand, x, y, width, height);
};

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

// Export participants to PDF (Themed with Active App Colors & Company Logo)
export const exportParticipantsToPDF = async (participants: Participant[], brand: BrandConfig) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  const now = new Date();
  const primary = hexToRgb(brand.primaryColor || '#E30613');
  const secondary = hexToRgb(brand.secondaryColor || '#B91C1C');

  // Convert company logo
  const logoData = await getLogoImageForPdf(brand.logoUrl || '/favicon.svg');

  // Header Banner - Active App Primary Color (#E30613 Lacer Red)
  doc.setFillColor(primary[0], primary[1], primary[2]);
  doc.rect(0, 0, 297, 28, 'F');

  // Accent Line - Active App Secondary Color
  doc.setFillColor(secondary[0], secondary[1], secondary[2]);
  doc.rect(0, 27, 297, 1.8, 'F');

  // Render Company Logo on top left
  renderLogoInDoc(doc, brand, logoData, 12, 4, 30, 19);

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(brand.companyName || 'Sorteio Lacer OMD 2026', 48, 14);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Relatório Oficial de Participantes & Contactos Profissionais', 48, 22);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.text(`Total de inscritos: ${participants.length}`, 283, 14, { align: 'right' });
  doc.text(
    `Gerado em: ${now.toLocaleDateString('pt-PT')} às ${now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`,
    283,
    22,
    { align: 'right' }
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
    startY: 34,
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
      fillColor: primary, // Active App Color
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
      1: { cellWidth: 18, fontStyle: 'bold', textColor: primary },
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

// Export Winners Audit Report to PDF (Themed with Active App Colors & Company Logo)
export const exportWinnersReportPDF = async (
  winners: DrawWinner[],
  brand: BrandConfig,
  config?: ReportPdfConfig
) => {
  const doc = new jsPDF();
  const now = new Date();
  const primary = hexToRgb(brand.primaryColor || '#E30613');
  const secondary = hexToRgb(brand.secondaryColor || '#B91C1C');

  // Convert company logo
  const logoData = await getLogoImageForPdf(brand.logoUrl || '/favicon.svg');

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

  // Header Banner - Active App Primary Color (#E30613)
  doc.setFillColor(primary[0], primary[1], primary[2]);
  doc.rect(0, 0, 210, 32, 'F');

  // Accent Line - Active App Secondary Color
  doc.setFillColor(secondary[0], secondary[1], secondary[2]);
  doc.rect(0, 31, 210, 1.8, 'F');

  // Render Company Logo
  renderLogoInDoc(doc, brand, logoData, 12, 5, 28, 18);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(brand.companyName || 'Sorteio Lacer OMD 2026', 45, 14);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(cfg.title || 'ATA E AUDITORIA OFICIAL DE SORTEIO', 45, 22);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Protocolo: ${cfg.protocolPrefix || 'LACER-'}${now.getTime().toString().slice(-8)}`,
    196,
    14,
    { align: 'right' }
  );
  doc.text(
    `Data: ${now.toLocaleDateString('pt-PT')} ${now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`,
    196,
    22,
    { align: 'right' }
  );

  // Body Information
  doc.setTextColor(primary[0], primary[1], primary[2]);
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
      fillColor: primary, // Active App Color
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
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('2. TERMO DE HOMOLOGAÇÃO E AUDITORIA', 14, finalY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(
    cfg.statementText ||
      'Certificamos que o sorteio foi realizado em tempo real utilizando algoritmo pseudo-aleatório criptográfico auditável sem duplicidade ou favorecimento, respeitando integralmente as regras do regulamento divulgado aos participantes.',
    14,
    finalY + 5,
    { maxWidth: 182 }
  );

  // Signature lines
  const sigY = finalY + 30;
  doc.setDrawColor(primary[0], primary[1], primary[2]);
  doc.line(14, sigY, 90, sigY);
  doc.line(120, sigY, 196, sigY);

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(cfg.organizerSignTitle || 'Assinatura do Organizador / Diretor', 52, sigY + 5, { align: 'center' });
  doc.text(cfg.auditorSignTitle || 'Assinatura da Comissão de Auditoria', 158, sigY + 5, { align: 'center' });

  doc.save(`relatorio_vencedores_${now.toISOString().slice(0, 10)}.pdf`);
};

// Export Individual Award Certificate to PDF (Themed with Active App Colors & Company Logo)
export const exportCertificatePDF = async (winner: DrawWinner, brand: BrandConfig) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  const primary = hexToRgb(brand.primaryColor || '#E30613');
  const secondary = hexToRgb(brand.secondaryColor || '#B91C1C');

  // Convert company logo
  const logoData = await getLogoImageForPdf(brand.logoUrl || '/favicon.svg');

  // Border ornament in Active App Color
  doc.setDrawColor(primary[0], primary[1], primary[2]);
  doc.setLineWidth(3);
  doc.rect(10, 10, 277, 190);

  doc.setDrawColor(secondary[0], secondary[1], secondary[2]);
  doc.setLineWidth(0.8);
  doc.rect(14, 14, 269, 182);

  // Top Accent Bar
  doc.setFillColor(primary[0], primary[1], primary[2]);
  doc.rect(14, 14, 269, 15, 'F');
  doc.setFillColor(secondary[0], secondary[1], secondary[2]);
  doc.rect(14, 28, 269, 1.5, 'F');

  // Render Logo inside top left bar
  renderLogoInDoc(doc, brand, logoData, 20, 15, 20, 11);

  // Header inside top bar
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text((brand.companyName || 'Sorteio Oficial Lacer OMD 2026').toUpperCase(), 148, 23, { align: 'center' });

  // Certificate Title
  doc.setTextColor(primary[0], primary[1], primary[2]);
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

  // Winning ticket badge in Active App Color
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.text(`BILHETE PREMIADO: #${winner.participantTicket}`, 148, 110, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('Foi legitimamente contemplado(a) no sorteio oficial com a seguinte atribuição:', 148, 122, { align: 'center' });

  // Prize Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primary[0], primary[1], primary[2]);
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
  doc.setDrawColor(primary[0], primary[1], primary[2]);
  doc.line(40, 178, 110, 178);
  doc.line(186, 178, 256, 178);

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Assinatura do Responsável Lacer / Direção', 75, 183, { align: 'center' });
  doc.text('Assinatura da Comissão de Auditoria', 221, 183, { align: 'center' });

  doc.save(`certificado_${winner.participantTicket}_${winner.participantName.replace(/\s+/g, '_')}.pdf`);
};

// Generate Official Raffle Regulation & Privacy Policy (RGPD) jsPDF document
export const generateRegulationPDFDoc = (brand: BrandConfig, logoData?: string | null): jsPDF => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const company = brand.companyName || 'Sorteio Lacer OMD 2026';
  const primary = hexToRgb(brand.primaryColor || '#E30613');
  const secondary = hexToRgb(brand.secondaryColor || '#B91C1C');

  // --- HEADER BANNER: Active App Primary Color (#E30613) ---
  doc.setFillColor(primary[0], primary[1], primary[2]);
  doc.rect(0, 0, 210, 32, 'F');

  // Accent Line: Active App Secondary Color
  doc.setFillColor(secondary[0], secondary[1], secondary[2]);
  doc.rect(0, 31, 210, 1.8, 'F');

  // Render Company Logo
  renderLogoInDoc(doc, brand, logoData || null, 12, 5, 28, 18);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('REGULAMENTO OFICIAL DO SORTEIO & POLÍTICA DE PRIVACIDADE', 44, 15);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${company.toUpperCase()} • LACER FARMACÊUTICA • EDIÇÃO OFICIAL 2026`, 44, 23);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text('DOCUMENTO HOMOLOGADO • RGPD UE 2016/679', 196, 23, { align: 'right' });

  let y = 40;

  const addSection = (num: string, title: string, text: string) => {
    doc.setTextColor(primary[0], primary[1], primary[2]);
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
  doc.setDrawColor(primary[0], primary[1], primary[2]);
  doc.line(14, sigY, 95, sigY);
  doc.line(115, sigY, 196, sigY);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Direção Comercial & Marketing • Lacer Farmacêutica', 54.5, sigY + 4, { align: 'center' });
  doc.text('Comissão Oficial de Auditoria e Sorteios OMD', 155.5, sigY + 4, { align: 'center' });

  return doc;
};

// Export Official Raffle Regulation & Privacy Policy (RGPD) to PDF
export const exportRegulationPDF = async (brand: BrandConfig) => {
  const logoData = await getLogoImageForPdf(brand.logoUrl || '/favicon.svg');
  const doc = generateRegulationPDFDoc(brand, logoData);
  doc.save('Regulamento_Oficial_Sorteio_Lacer_OMD_2026.pdf');
};

// Get Regulation PDF Blob URL for in-app viewing or target="_blank"
export const getRegulationPDFBlobUrl = (brand: BrandConfig): string => {
  const doc = generateRegulationPDFDoc(brand);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
};
