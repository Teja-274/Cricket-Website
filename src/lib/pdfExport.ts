import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Player } from '@/data/players'
import type { Franchise } from '@/data/franchises'
import type { AuctionRoom } from '@/store/auctionStore'

export function exportAuctionResultsPDF(
  room: AuctionRoom | null,
  franchises: Franchise[],
  players: Player[]
) {
  if (!room) return

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width

  // Header
  doc.setFillColor(245, 166, 35)
  doc.rect(0, 0, pageWidth, 25, 'F')
  doc.setTextColor(7, 13, 18)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('SCOUT INDIA', 14, 16)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('IPL Auction Results', pageWidth - 14, 16, { align: 'right' })

  // Room info
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(room.name, 14, 36)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Format: ${room.format.toUpperCase()} | Purse: ${room.totalPurseCr} Cr | ${new Date().toLocaleDateString()}`, 14, 42)

  let y = 50

  // Summary
  const soldPlayers = players.filter(p => p.status === 'sold')
  const totalSpent = soldPlayers.reduce((s, p) => s + (p.soldPriceCr || 0), 0)
  const unsoldCount = players.filter(p => p.status === 'unsold').length

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Auction Summary', 14, y)
  y += 6
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Total Players Sold: ${soldPlayers.length}`, 14, y)
  doc.text(`Total Spent: ${totalSpent.toFixed(1)} Cr`, 80, y)
  doc.text(`Unsold: ${unsoldCount}`, 150, y)
  y += 10

  // Per franchise breakdown
  for (const f of franchises) {
    const bought = soldPlayers.filter(p => p.soldToId === f.id)
    if (bought.length === 0) continue

    // Franchise header
    if (y > 260) {
      doc.addPage()
      y = 20
    }

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(f.name, 14, y)
    const spent = bought.reduce((s, p) => s + (p.soldPriceCr || 0), 0)
    doc.text(`${bought.length} players - ${spent.toFixed(1)} Cr`, pageWidth - 14, y, { align: 'right' })
    y += 3

    // Colored underline
    const hex = f.color.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    doc.setDrawColor(r, g, b)
    doc.setLineWidth(1)
    doc.line(14, y, pageWidth - 14, y)
    y += 4

    autoTable(doc, {
      startY: y,
      head: [['#', 'Player', 'Role', 'Base', 'Sold For']],
      body: bought.map((p, i) => [
        i + 1,
        p.name,
        p.role,
        `${p.basePriceCr} Cr`,
        `${p.soldPriceCr} Cr`,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [30, 40, 50], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    })

    y = (doc as any).lastAutoTable.finalY + 8
  }

  // Footer
  const pageCount = doc.internal.pages.length - 1
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text(`Scout India | Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' })
  }

  doc.save(`scout-india-auction-${room.name.replace(/\s+/g, '-')}.pdf`)
}
