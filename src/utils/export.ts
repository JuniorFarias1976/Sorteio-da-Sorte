import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { Participant, DrawWinner, BrandConfig, ReportPdfConfig, QRCodePosterConfig } from '../types';

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

export interface LogoImageResult {
  dataUrl: string;
  width: number;
  height: number;
  ratio: number;
}

// Convert SVG / Image URL to raster PNG data URL with real dimensions for jsPDF embedding
export const getLogoImageForPdf = async (logoUrl?: string): Promise<LogoImageResult | null> => {
  if (!logoUrl) return null;

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const natW = img.naturalWidth || 160;
          const natH = img.naturalHeight || 80;
          const ratio = (natW > 0 && natH > 0) ? natW / natH : 1.35;
          const canvas = document.createElement('canvas');
          const scale = 2;
          canvas.width = natW * scale;
          canvas.height = natH * scale;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve({
              dataUrl: canvas.toDataURL('image/png'),
              width: canvas.width,
              height: canvas.height,
              ratio
            });
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

// Draw crisp vector logo badge in jsPDF with guaranteed perfect proportions (NEVER stretched)
export const drawFallbackLogo = (
  doc: jsPDF,
  brand: BrandConfig,
  x: number,
  y: number,
  boxW: number,
  boxH: number
) => {
  const primary = hexToRgb(brand.primaryColor || '#E30613');

  // 1. Clean crisp white rounded card badge
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, boxW, boxH, 2.5, 2.5, 'F');

  // 2. Proportional Lacer Emblem (strict fixed aspect ratio of 1.35 : 1, never horizontally stretched)
  const pad = 2;
  const availW = Math.max(boxW - pad * 2, 4);
  const availH = Math.max(boxH - pad * 2, 4);

  let targetW = availW;
  let targetH = targetW / 1.35;
  if (targetH > availH) {
    targetH = availH;
    targetW = targetH * 1.35;
  }

  const cx = x + boxW / 2;
  const cy = y + boxH / 2;
  const rx = targetW / 2;
  const ry = targetH / 2;

  // Lacer Red Outline
  doc.setDrawColor(primary[0], primary[1], primary[2]);
  doc.setLineWidth(0.65);
  doc.ellipse(cx, cy, rx, ry, 'S');

  // Lacer Red Typography centered inside shield
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.setFont('helvetica', 'bold');
  const fontSize = Math.max(Math.min(ry * 1.45, 9), 6.5);
  doc.setFontSize(fontSize);
  doc.text('lacer', cx, cy + (ry * 0.32), { align: 'center' });
};

// Render Logo in PDF (Raster PNG image or vector badge, ALWAYS preserving exact aspect ratio with contain logic)
export const renderLogoInDoc = (
  doc: jsPDF,
  brand: BrandConfig,
  logoInfo: LogoImageResult | string | null,
  x: number,
  y: number,
  boxW: number,
  boxH: number
) => {
  const dataUrl = typeof logoInfo === 'string' ? logoInfo : logoInfo?.dataUrl;
  const ratio = (typeof logoInfo === 'object' && logoInfo?.ratio) ? logoInfo.ratio : 1.35;

  if (dataUrl) {
    try {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, y, boxW, boxH, 2.5, 2.5, 'F');

      // Keep generous inner padding so image doesn't touch the border
      const pad = 2;
      const availW = Math.max(boxW - pad * 2, 2);
      const availH = Math.max(boxH - pad * 2, 2);

      let drawW = availW;
      let drawH = availH;

      if (ratio > availW / availH) {
        // Image is wider than available container
        drawW = availW;
        drawH = availW / ratio;
      } else {
        // Image is taller or square
        drawH = availH;
        drawW = availH * ratio;
      }

      // Center perfectly inside white container without any distortion
      const drawX = x + (boxW - drawW) / 2;
      const drawY = y + (boxH - drawH) / 2;

      doc.addImage(
        dataUrl,
        'PNG',
        drawX,
        drawY,
        drawW,
        drawH,
        undefined,
        'FAST'
      );
      return;
    } catch {
      // fallback
    }
  }
  drawFallbackLogo(doc, brand, x, y, boxW, boxH);
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

  // Render Company Logo on top left (compact rounded square, never stretched)
  renderLogoInDoc(doc, brand, logoData, 12, 4, 22, 20);

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(brand.companyName || 'Lacer - Sorteio OMD 2026', 39, 13.5);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Relatório Oficial de Participantes & Contactos Profissionais', 39, 21.5);

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

  // Render Company Logo (compact rounded card, never stretched)
  renderLogoInDoc(doc, brand, logoData, 12, 5, 24, 20);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(brand.companyName || 'Sorteio Lacer OMD 2026', 40, 14);

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
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const primary = hexToRgb(brand?.primaryColor || '#E30613');
  const secondary = hexToRgb(brand?.secondaryColor || '#B91C1C');

  // Convert company logo
  const logoData = await getLogoImageForPdf(brand?.logoUrl || '/favicon.svg');

  // 1. Double Luxury Border in Active App Colors (Lacer Red & Dark Red)
  // Outer frame
  doc.setDrawColor(primary[0], primary[1], primary[2]);
  doc.setLineWidth(2.2);
  doc.rect(10, 10, 277, 190);

  // Inner frame
  doc.setDrawColor(secondary[0], secondary[1], secondary[2]);
  doc.setLineWidth(0.7);
  doc.rect(13.5, 13.5, 270, 183);

  // Corner decorative accents in primary color
  doc.setFillColor(primary[0], primary[1], primary[2]);
  doc.rect(9, 9, 6, 6, 'F');
  doc.rect(282, 9, 6, 6, 'F');
  doc.rect(9, 195, 6, 6, 'F');
  doc.rect(282, 195, 6, 6, 'F');

  // 2. Top Header Ribbon in Active App Primary Color (#E30613)
  doc.setFillColor(primary[0], primary[1], primary[2]);
  doc.rect(14, 14, 269, 20, 'F');

  // Accent Line in Secondary Color
  doc.setFillColor(secondary[0], secondary[1], secondary[2]);
  doc.rect(14, 34, 269, 1.6, 'F');

  // Render Crisp Company Logo on top left (22mm x 16mm, perfectly proportioned)
  renderLogoInDoc(doc, brand, logoData, 20, 16, 20, 16);

  // Top Bar Brand Titles
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text((brand?.companyName || 'LACER - SORTEIO OMD 2026').toUpperCase(), 45, 23.5);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(brand?.companySlogan || 'Higiene e Saúde Oral • Stand Lacer', 45, 29.5);

  // Top Bar Right Metadata
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('SISTEMA OFICIAL DE AUDITORIA', 273, 22.5, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text('HOMOLOGAÇÃO 100% EM TEMPO REAL', 273, 28.5, { align: 'right' });

  // 3. Main Certificate Heading in Primary Color
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.setFontSize(23);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICADO OFICIAL DE HOMOLOGAÇÃO', 148.5, 52, { align: 'center' });

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text('COMPROVATIVO DE CONTEMPLAÇÃO E AUDITORIA EM TEMPO REAL', 148.5, 60, { align: 'center' });

  // 4. Recipient Introduction
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Certificamos para os devidos efeitos que o(a) participante profissional', 148.5, 74, { align: 'center' });

  // 5. Winner Name (Bold, Large, Dark Slate)
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(winner.participantName.toUpperCase(), 148.5, 88, { align: 'center' });

  // 6. Clinic & Specialty Details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const clinicText = winner.participantClinic ? `Clínica: ${winner.participantClinic}` : '';
  const specText = winner.participantSpecialty ? `Especialidade: ${winner.participantSpecialty}` : '';
  const details = [clinicText, specText].filter(Boolean).join('   •   ');
  if (details) {
    doc.text(details, 148.5, 96, { align: 'center' });
  }

  // 7. Winning Lucky Ticket Badge (Active App Color: Red Badge)
  doc.setFillColor(255, 241, 242); // Soft Red #FFF1F2
  doc.setDrawColor(primary[0], primary[1], primary[2]);
  doc.setLineWidth(0.8);
  doc.roundedRect(148.5 - 45, 103, 90, 11, 2.5, 2.5, 'FD');

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.text(`BILHETE PREMIADO: #${winner.participantTicket}`, 148.5, 110.5, { align: 'center' });

  // 8. Prize Announcement
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('Foi legitimamente contemplado(a) no sorteio oficial com a seguinte atribuição:', 148.5, 123, { align: 'center' });

  // Prize Title in Bold Red (cleanly formatted with stars)
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.text(`★  ${winner.prizeTitle.toUpperCase()}  ★`, 148.5, 135, { align: 'center' });

  // 9. Audit Details & Security Hash
  const wonDate = new Date(winner.wonAt);
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Sorteio realizado em ${wonDate.toLocaleDateString('pt-PT')} às ${wonDate.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })} (Horário de Portugal Continental)`,
    148.5,
    148,
    { align: 'center' }
  );
  doc.text(`Código Criptográfico de Auditoria: ${winner.validationHash}`, 148.5, 154, { align: 'center' });

  // 10. Official Signatures with Active App Red Lines
  doc.setDrawColor(primary[0], primary[1], primary[2]);
  doc.setLineWidth(0.8);
  doc.line(40, 175, 115, 175);
  doc.line(182, 175, 257, 175);

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Assinatura do Responsável Lacer / Direção', 77.5, 180, { align: 'center' });
  doc.text('Assinatura da Comissão de Auditoria', 219.5, 180, { align: 'center' });

  // Circular Seal in Secondary Red in bottom center
  doc.setDrawColor(secondary[0], secondary[1], secondary[2]);
  doc.setLineWidth(0.6);
  doc.circle(148.5, 175, 7.5, 'S');
  doc.setFontSize(5.5);
  doc.setTextColor(secondary[0], secondary[1], secondary[2]);
  doc.text('LACER', 148.5, 173.5, { align: 'center' });
  doc.text('HOMOLOGADO', 148.5, 177, { align: 'center' });

  doc.save(`certificado_${winner.participantTicket}_${winner.participantName.replace(/\s+/g, '_')}.pdf`);
};

// Generate Official Raffle Regulation & Privacy Policy (RGPD) jsPDF document
export const generateRegulationPDFDoc = (brand: BrandConfig, logoData?: LogoImageResult | string | null): jsPDF => {
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

  // Render Company Logo (compact rounded card, never stretched)
  renderLogoInDoc(doc, brand, logoData || null, 12, 5, 24, 20);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('REGULAMENTO OFICIAL DO SORTEIO & POLÍTICA DE PRIVACIDADE', 40, 15);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${company.toUpperCase()} • LACER FARMACÊUTICA • EDIÇÃO OFICIAL 2026`, 40, 23);

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
// Safe PDF opener (handles Base64 Data URLs, Blob URLs, and static server URLs)
export const openPdfDocument = (pdfUrl?: string, fileName = 'Regulamento_Oficial.pdf') => {
  if (!pdfUrl) return;

  // Handle Base64 Data URL by converting to Blob URL (avoids Chrome top-frame navigation block!)
  if (pdfUrl.startsWith('data:')) {
    try {
      const parts = pdfUrl.split(';base64,');
      const contentType = parts[0].replace('data:', '') || 'application/pdf';
      const b64Data = parts[1] || '';
      const byteCharacters = atob(b64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: contentType });
      const blobUrl = URL.createObjectURL(blob);
      const win = window.open(blobUrl, '_blank', 'noopener,noreferrer');
      if (!win) {
        // Fallback for popup blocker
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      return;
    } catch (e) {
      console.error('Error opening base64 PDF:', e);
    }
  }

  // Regular URL
  window.open(pdfUrl, '_blank', 'noopener,noreferrer');
};

export const exportRegulationPDF = async (brand: BrandConfig) => {
  // If custom uploaded PDF exists, open it directly!
  if (brand.regulationPdfUrl && brand.regulationPdfUrl.trim()) {
    openPdfDocument(brand.regulationPdfUrl, brand.regulationPdfName || 'Regulamento_Oficial.pdf');
    return;
  }
  const logoData = await getLogoImageForPdf(brand.logoUrl || '/favicon.svg');
  const doc = generateRegulationPDFDoc(brand, logoData);
  doc.save('Regulamento_Oficial_Sorteio_Lacer_OMD_2026.pdf');
};

// Get Regulation PDF Blob URL for in-app viewing or target="_blank"
export const getRegulationPDFBlobUrl = (brand: BrandConfig): string => {
  if (brand.regulationPdfUrl && brand.regulationPdfUrl.trim()) {
    return brand.regulationPdfUrl;
  }
  const doc = generateRegulationPDFDoc(brand);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
};

// Export High-Resolution A4 Print Poster to PNG (300 DPI, 2480x3508px standard print format)
export const exportPosterToPNG = async (
  brand: BrandConfig,
  posterConfig: QRCodePosterConfig,
  qrCodeLink: string,
  filename?: string
): Promise<void> => {
  // 1. Generate high-resolution QR code canvas
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, qrCodeLink || (typeof window !== 'undefined' ? window.location.origin : 'https://sorteiolive.pt'), {
    width: 900,
    margin: 1,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });

  // 2. High-res standard A4 canvas (2480 x 3508 px at 300 DPI)
  const W = 2480;
  const H = 3508;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  // Outer primary brand border
  const primaryHex = brand.primaryColor || '#E30613';
  ctx.strokeStyle = primaryHex;
  ctx.lineWidth = 32;
  const radius = 54;
  
  const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  drawRoundedRect(75, 75, W - 150, H - 150, radius);
  ctx.stroke();

  // Inner subtle accent border
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 6;
  drawRoundedRect(115, 115, W - 230, H - 230, 36);
  ctx.stroke();

  // 4 Corner brackets (Classic poster ornaments)
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 14;
  const brk = 90;
  const off = 135;
  // Top-left
  ctx.beginPath(); ctx.moveTo(off, off + brk); ctx.lineTo(off, off); ctx.lineTo(off + brk, off); ctx.stroke();
  // Top-right
  ctx.beginPath(); ctx.moveTo(W - off - brk, off); ctx.lineTo(W - off, off); ctx.lineTo(W - off, off + brk); ctx.stroke();
  // Bottom-left
  ctx.beginPath(); ctx.moveTo(off, H - off - brk); ctx.lineTo(off, H - off); ctx.lineTo(off + brk, H - off); ctx.stroke();
  // Bottom-right
  ctx.beginPath(); ctx.moveTo(W - off - brk, H - off); ctx.lineTo(W - off, H - off); ctx.lineTo(W - off, H - off - brk); ctx.stroke();

  let curY = 220;

  // Draw Logo if provided
  if (brand.logoUrl) {
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      await new Promise<void>((resolve) => {
        logoImg.onload = () => resolve();
        logoImg.onerror = () => resolve();
        logoImg.src = brand.logoUrl!;
      });

      if (logoImg.width > 0 && logoImg.height > 0) {
        const maxLogoW = 460;
        const maxLogoH = 210;
        const ratio = logoImg.width / logoImg.height;
        let renderW = maxLogoW;
        let renderH = maxLogoW / ratio;
        if (renderH > maxLogoH) {
          renderH = maxLogoH;
          renderW = maxLogoH * ratio;
        }
        ctx.drawImage(logoImg, (W - renderW) / 2, curY, renderW, renderH);
        curY += renderH + 45;
      } else {
        curY += 30;
      }
    } catch {
      curY += 30;
    }
  } else {
    curY += 30;
  }

  // Company Name / Stand Subheading
  ctx.textAlign = 'center';
  ctx.font = 'bold 44px Inter, system-ui, -apple-system, sans-serif';
  ctx.fillStyle = primaryHex;
  const companyName = (brand.companyName || 'LACER • STAND OMD 2026').toUpperCase();
  ctx.fillText(companyName, W / 2, curY);
  curY += 75;

  // Main Poster Title (Wrapped text)
  const mainTitle = posterConfig.title || 'PARTICIPE NO NOSSO GRANDE SORTEIO!';
  ctx.font = '900 82px Inter, system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#0F172A';
  
  // Wrap title lines
  const words = mainTitle.split(' ');
  const titleLines: string[] = [];
  let currentLine = words[0] || '';
  for (let i = 1; i < words.length; i++) {
    const testLine = currentLine + ' ' + words[i];
    if (ctx.measureText(testLine).width > 2000) {
      titleLines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  titleLines.push(currentLine);

  for (const line of titleLines) {
    ctx.fillText(line, W / 2, curY);
    curY += 95;
  }

  // Subtitle
  const subtitle = posterConfig.subtitle || 'Habilite-se a prémios incríveis transmitidos 100% em direto!';
  ctx.font = '500 42px Inter, system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText(subtitle, W / 2, curY);
  curY += 65;

  // Schedule Highlight Banner (if enabled)
  if (posterConfig.showDate) {
    curY += 20;
    const scheduleText = posterConfig.scheduleHighlight || '2 Sorteios Diários Oficiais: 13:00 · 19:00';
    ctx.font = 'bold 38px Inter, system-ui, -apple-system, sans-serif';
    const textW = ctx.measureText(scheduleText).width;
    const badgeW = Math.max(textW + 120, 700);
    const badgeH = 78;
    const badgeX = (W - badgeW) / 2;

    ctx.fillStyle = '#FEF2F2';
    drawRoundedRect(badgeX, curY - 50, badgeW, badgeH, 39);
    ctx.fill();
    ctx.strokeStyle = '#FCA5A5';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#991B1B';
    ctx.fillText('🕒  ' + scheduleText, W / 2, curY);
    curY += 75;
  }

  // QR Code Frame Card
  curY += 30;
  const qrCardSize = 1060;
  const qrCardX = (W - qrCardSize) / 2;
  const qrCardY = curY;

  // Soft card shadow
  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.12)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 16;
  ctx.fillStyle = '#FFFFFF';
  drawRoundedRect(qrCardX, qrCardY, qrCardSize, qrCardSize, 64);
  ctx.fill();
  ctx.restore();

  // QR card border
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 8;
  drawRoundedRect(qrCardX, qrCardY, qrCardSize, qrCardSize, 64);
  ctx.stroke();

  // Draw QR code inside card
  const qrSize = 920;
  const qrPadding = (qrCardSize - qrSize) / 2;
  ctx.drawImage(qrCanvas, qrCardX + qrPadding, qrCardY + qrPadding, qrSize, qrSize);

  curY += qrCardSize + 55;

  // Scan instruction callout
  ctx.font = 'bold 36px Inter, system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText('📱 Aponte a câmara do telemóvel para se inscrever gratuitamente', W / 2, curY);
  curY += 65;

  // Prize highlight banner
  if (posterConfig.prizeHighlight) {
    const prizeText = '🏆 ' + posterConfig.prizeHighlight;
    ctx.font = 'bold 40px Inter, system-ui, -apple-system, sans-serif';
    const boxW = 1860;
    const boxH = 96;
    const boxX = (W - boxW) / 2;

    ctx.fillStyle = '#F8FAFC';
    drawRoundedRect(boxX, curY, boxW, boxH, 28);
    ctx.fill();
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#1E293B';
    ctx.fillText(prizeText, W / 2, curY + 62);
    curY += boxH + 35;
  }

  // 3-Steps Instructions Box (if enabled)
  if (posterConfig.showSteps) {
    const boxW = 1860;
    const boxH = 310;
    const boxX = (W - boxW) / 2;

    ctx.fillStyle = '#FFF1F2';
    drawRoundedRect(boxX, curY, boxW, boxH, 36);
    ctx.fill();
    ctx.strokeStyle = '#FECDD3';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Box Header
    ctx.font = '900 34px Inter, system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#9F1239';
    ctx.fillText('COMO PARTICIPAR EM 3 PASSOS SIMPLES:', W / 2, curY + 60);

    // Steps lines
    const startStepY = curY + 125;
    const stepSpacing = 65;
    const stepLeftX = boxX + 80;

    ctx.textAlign = 'left';

    const steps = [
      { num: '1.', text: posterConfig.step1 || 'Aponte a câmara do seu telemóvel para o Código QR acima.' },
      { num: '2.', text: posterConfig.step2 || 'Preencha os seus dados reais e receba o seu Número da Sorte oficial.' },
      { num: '3.', text: posterConfig.step3 || 'Assista à transmissão em direto e confirme se foi premiado!' },
    ];

    steps.forEach((st, idx) => {
      const lineY = startStepY + idx * stepSpacing;
      ctx.font = '900 34px Inter, system-ui, -apple-system, sans-serif';
      ctx.fillStyle = primaryHex;
      ctx.fillText(st.num, stepLeftX, lineY);

      ctx.font = '600 32px Inter, system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#1E293B';
      ctx.fillText(st.text, stepLeftX + 50, lineY);
    });

    curY += boxH + 40;
  }

  // Footer divider line
  const footerLineY = H - 200;
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(140, footerLineY);
  ctx.lineTo(W - 140, footerLineY);
  ctx.stroke();

  // Footer labels
  const footerTextY = H - 135;
  ctx.font = '600 34px Inter, system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#64748B';

  // Left
  ctx.textAlign = 'left';
  ctx.fillText(posterConfig.footerLeft || 'Inscrição 100% Gratuita', 150, footerTextY);

  // Center URL (bold monospace)
  ctx.textAlign = 'center';
  ctx.font = 'bold 36px monospace, Inter, sans-serif';
  ctx.fillStyle = '#0F172A';
  ctx.fillText(qrCodeLink || 'sorteiolive.lacer.pt', W / 2, footerTextY);

  // Right
  ctx.textAlign = 'right';
  ctx.font = '600 34px Inter, system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText(posterConfig.footerRight || 'Sorteio Seguro & Auditado', W - 150, footerTextY);

  // 12. Save to PNG file
  return new Promise<void>((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve();
        return;
      }
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const cleanCompName = (brand.companyName || 'lacer').toLowerCase().replace(/\s+/g, '_');
      link.download = filename || `cartaz_sorteio_impressao_${cleanCompName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
        resolve();
      }, 1000);
    }, 'image/png');
  });
};
