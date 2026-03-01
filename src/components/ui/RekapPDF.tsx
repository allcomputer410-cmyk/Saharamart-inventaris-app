import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RekapItem {
  productName: string;
  barcode: string;
  unit: string;
  qty: number;
  subtotal: number;
}

export interface RekapPDFProps {
  storeName: string;
  supplierName: string;
  supplierPhone?: string;
  supplierAddress?: string;
  items: RekapItem[];
  totalItems: number;
  totalValue: number;
  doNumbers?: string[];
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const C = {
  primary: '#1e40af',
  primaryLight: '#dbeafe',
  border: '#e5e7eb',
  muted: '#6b7280',
  dark: '#111827',
  white: '#ffffff',
  rowAlt: '#f9fafb',
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: C.dark,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: C.primary,
  },
  storeName: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: C.primary,
  },
  storeSubtitle: {
    fontSize: 8,
    color: C.muted,
    marginTop: 2,
  },
  docTitleBlock: {
    alignItems: 'flex-end',
  },
  docTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: C.dark,
  },
  docDate: {
    fontSize: 8,
    color: C.muted,
    marginTop: 3,
  },

  // ── Info block (Kepada) ──────────────────────────────────────────────────
  infoBox: {
    backgroundColor: C.primaryLight,
    borderRadius: 4,
    padding: 10,
    marginBottom: 14,
  },
  infoLabel: {
    fontSize: 7,
    color: C.primary,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: C.dark,
  },
  infoSub: {
    fontSize: 8,
    color: C.muted,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 24,
  },
  infoCol: {
    flex: 1,
  },

  // ── Ref numbers ─────────────────────────────────────────────────────────
  refRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  refLabel: {
    fontSize: 8,
    color: C.muted,
    marginRight: 4,
  },
  refBadge: {
    fontSize: 7,
    color: C.primary,
    backgroundColor: C.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },

  // ── Table ────────────────────────────────────────────────────────────────
  table: {
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.primary,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  thText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  tableRowAlt: {
    backgroundColor: C.rowAlt,
  },
  tdText: {
    fontSize: 9,
    color: C.dark,
  },
  tdMuted: {
    fontSize: 8,
    color: C.muted,
  },
  tableTotal: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 4,
    backgroundColor: C.primaryLight,
    borderTopWidth: 1,
    borderTopColor: C.primary,
    borderRadius: 3,
    marginTop: 1,
  },
  tdTotalText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: C.primary,
  },

  // ── Columns ──────────────────────────────────────────────────────────────
  colNo:      { width: 20 },
  colName:    { flex: 3, paddingRight: 4 },
  colBarcode: { flex: 2, paddingRight: 4 },
  colUnit:    { width: 36 },
  colQty:     { width: 36, alignItems: 'flex-end' },
  colTotal:   { flex: 2, alignItems: 'flex-end' },

  // ── Signature ────────────────────────────────────────────────────────────
  signSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  signBox: {
    width: 120,
    alignItems: 'center',
  },
  signLabel: {
    fontSize: 8,
    color: C.muted,
    textAlign: 'center',
  },
  signLine: {
    borderBottomWidth: 0.5,
    borderBottomColor: C.dark,
    width: 100,
    marginTop: 28,
    marginBottom: 4,
  },
  signName: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },

  // ── Footer ───────────────────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
  },
  footerText: {
    fontSize: 7,
    color: C.muted,
  },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRupiahPdf(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateId(date: Date): string {
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ─── PDF Document ─────────────────────────────────────────────────────────────

export function RekapPDFDocument({
  storeName,
  supplierName,
  supplierPhone,
  supplierAddress,
  items,
  totalItems,
  totalValue,
  doNumbers = [],
}: RekapPDFProps) {
  const today = new Date();
  const dateStr = formatDateId(today);
  const timestampStr = today.toLocaleString('id-ID');

  return (
    <Document
      title={`Surat Pesanan - ${supplierName}`}
      author={storeName}
      creator="Sistem Inventaris Multi-Toko"
    >
      <Page size="A4" style={styles.page}>

        {/* ── Header ── */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.storeName}>{storeName}</Text>
            <Text style={styles.storeSubtitle}>Sistem Inventaris Multi-Toko</Text>
          </View>
          <View style={styles.docTitleBlock}>
            <Text style={styles.docTitle}>SURAT PESANAN</Text>
            <Text style={styles.docDate}>Tanggal: {dateStr}</Text>
          </View>
        </View>

        {/* ── Info Supplier ── */}
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Kepada (Supplier)</Text>
              <Text style={styles.infoValue}>{supplierName}</Text>
              {supplierPhone ? (
                <Text style={styles.infoSub}>📞 {supplierPhone}</Text>
              ) : null}
              {supplierAddress ? (
                <Text style={styles.infoSub}>{supplierAddress}</Text>
              ) : null}
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Dari (Pembeli)</Text>
              <Text style={styles.infoValue}>{storeName}</Text>
              <Text style={styles.infoSub}>Dibuat: {dateStr}</Text>
            </View>
          </View>
        </View>

        {/* ── Nomor DO referensi ── */}
        {doNumbers.length > 0 && (
          <View style={styles.refRow}>
            <Text style={styles.refLabel}>Ref DO:</Text>
            {doNumbers.map((no) => (
              <Text key={no} style={styles.refBadge}>{no}</Text>
            ))}
          </View>
        )}

        {/* ── Tabel Item ── */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <View style={styles.colNo}>
              <Text style={styles.thText}>#</Text>
            </View>
            <View style={styles.colName}>
              <Text style={styles.thText}>Nama Produk</Text>
            </View>
            <View style={styles.colBarcode}>
              <Text style={styles.thText}>Barcode</Text>
            </View>
            <View style={styles.colUnit}>
              <Text style={styles.thText}>Sat.</Text>
            </View>
            <View style={styles.colQty}>
              <Text style={styles.thText}>Qty</Text>
            </View>
            <View style={styles.colTotal}>
              <Text style={styles.thText}>Subtotal</Text>
            </View>
          </View>

          {/* Rows */}
          {items.map((item, idx) => (
            <View
              key={idx}
              style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}
              wrap={false}
            >
              <View style={styles.colNo}>
                <Text style={styles.tdMuted}>{idx + 1}</Text>
              </View>
              <View style={styles.colName}>
                <Text style={styles.tdText}>{item.productName}</Text>
              </View>
              <View style={styles.colBarcode}>
                <Text style={styles.tdMuted}>{item.barcode}</Text>
              </View>
              <View style={styles.colUnit}>
                <Text style={styles.tdText}>{item.unit}</Text>
              </View>
              <View style={styles.colQty}>
                <Text style={styles.tdText}>{item.qty}</Text>
              </View>
              <View style={styles.colTotal}>
                <Text style={styles.tdText}>{formatRupiahPdf(item.subtotal)}</Text>
              </View>
            </View>
          ))}

          {/* Total row */}
          <View style={styles.tableTotal} wrap={false}>
            <View style={styles.colNo}><Text></Text></View>
            <View style={[styles.colName, { flex: 3 }]}>
              <Text style={styles.tdTotalText}>TOTAL</Text>
            </View>
            <View style={styles.colBarcode}><Text></Text></View>
            <View style={styles.colUnit}><Text></Text></View>
            <View style={styles.colQty}>
              <Text style={styles.tdTotalText}>{totalItems}</Text>
            </View>
            <View style={styles.colTotal}>
              <Text style={styles.tdTotalText}>{formatRupiahPdf(totalValue)}</Text>
            </View>
          </View>
        </View>

        {/* ── Catatan ── */}
        <View style={{ marginTop: 8, marginBottom: 4 }}>
          <Text style={{ fontSize: 8, color: C.muted }}>
            * Harga di atas adalah estimasi berdasarkan HPP terakhir. Harga final sesuai invoice supplier.
          </Text>
        </View>

        {/* ── Tanda Tangan ── */}
        <View style={styles.signSection} wrap={false}>
          <View style={styles.signBox}>
            <Text style={styles.signLabel}>Hormat kami,</Text>
            <View style={styles.signLine} />
            <Text style={styles.signName}>{storeName}</Text>
            <Text style={[styles.signLabel, { marginTop: 2 }]}>Pembeli</Text>
          </View>
          <View style={styles.signBox}>
            <Text style={styles.signLabel}>Disetujui,</Text>
            <View style={styles.signLine} />
            <Text style={styles.signName}>{supplierName}</Text>
            <Text style={[styles.signLabel, { marginTop: 2 }]}>Supplier</Text>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Dicetak oleh Sistem Inventaris Multi-Toko
          </Text>
          <Text style={styles.footerText}>{timestampStr}</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Halaman ${pageNumber} / ${totalPages}`
            }
          />
        </View>

      </Page>
    </Document>
  );
}
