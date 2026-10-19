import { fromApiListRow, type ApiBillListRow } from '../../api-mappers'
import type { SavedBill } from '../../../domain/types'

/** A fully filled sample bill, to show what an edited bill looks like. */
const sampleBill: SavedBill = {
  id: 3000,
  created: '2026-09-18T08:00:00.000Z',
  updated: '2026-09-18T08:00:00.000Z',
  values: {
    jobNumber: '2081',
    exporterName: 'Aarav Textiles Pvt Ltd',
    consigneeName: 'Northstar Trading Inc',
    jobDate: '2026-09-18',
    exporterId: '1000',
    exporterBranchId: '1001',
    consigneeId: '2002',
    consigneeBranchId: '2003',
    loadingPort: 'INMUN1',
    finalDestinationPort: 'USMSY',
    natureOfCargo: 'P',
    grossWeight: '34.6',
    netWeight: '23.5',
    measurementUnit: 'KG',
    totalPackages: '12',
    invoices: [
      {
        invoiceNumber: 'EX/2081/2026',
        invoiceDate: '2026-09-17',
        currency: 'USD',
        contractType: 'FOB',
        buyerSameAsConsignee: true,
        buyerId: '2002',
        buyerBranchId: '2003',
        items: [
          {
            ritcCode: '61091000',
            goodsDescription1: 'Cotton T-shirts',
            quantity: '51',
            unitOfMeasurement: 'PCS',
            unitPrice: '3.831',
            igstPaymentStatus: 'LUT',
            rewardItem: true
          }
        ]
      }
    ],
    containers: [],
    packingRanges: [],
    documents: [],
    licenses: []
  }
}

/** Summaries as the list endpoint would return them. */
export const seedBillListRows: ApiBillListRow[] = [
  {
    id: 1000,
    jobNumber: 150011,
    jobDate: 20728,
    exporterName: 'Amit Exports',
    consigneeName: 'H&M HENNES & MAURITZ LTD',
    loadingPort: 'INMUN1',
    dischargePort: 'KRBUS',
    destinationPort: 'KRBUS',
    updated: 1790967817
  },
  {
    id: 1001,
    jobNumber: 150012,
    jobDate: 20728,
    exporterName: 'Amit Exports',
    consigneeName: 'H&M HENNES & MAURITZ LTD',
    loadingPort: 'INMUN1',
    dischargePort: 'KRBUS',
    destinationPort: 'KRBUS',
    updated: 1790968385
  },
  {
    id: 1002,
    jobNumber: 150013,
    jobDate: 20728,
    exporterName: 'Amit Exports',
    consigneeName: 'H&M HENNES & MAURITZ LTD',
    loadingPort: 'INMUN1',
    dischargePort: 'KRBUS',
    destinationPort: 'KRBUS',
    updated: 1790969061
  },
  {
    id: 1003,
    jobNumber: 150014,
    jobDate: 20728,
    exporterName: 'Amit Exports',
    consigneeName: 'H&M HENNES & MAURITZ LTD',
    loadingPort: 'INMUN1',
    dischargePort: 'KRBUS',
    destinationPort: 'KRBUS',
    updated: 1790969592
  },
  {
    id: 1004,
    jobNumber: 150015,
    jobDate: 20728,
    exporterName: 'Amit Exports',
    consigneeName: 'H&M HENNES & MAURITZ LTD',
    loadingPort: 'INMUN1',
    dischargePort: 'KRBUS',
    destinationPort: 'KRBUS',
    updated: 1791003787
  },
  {
    id: 1005,
    jobNumber: 150016,
    jobDate: 20728,
    exporterName: 'Amit Exports',
    consigneeName: 'H&M HENNES & MAURITZ LTD',
    loadingPort: 'INMUN1',
    dischargePort: 'KRBUS',
    destinationPort: 'KRBUS',
    updated: 1791010527
  },
  {
    id: 1006,
    jobNumber: 150017,
    jobDate: 20728,
    exporterName: 'Amit Exports',
    consigneeName: 'H&M HENNES & MAURITZ LTD',
    loadingPort: 'INMUN1',
    dischargePort: 'KRBUS',
    destinationPort: 'KRBUS',
    updated: 1791138507
  },
  {
    id: 1007,
    jobNumber: 150018,
    jobDate: 20728,
    exporterName: 'Amit Exports',
    consigneeName: 'H&M HENNES & MAURITZ LTD',
    loadingPort: 'INMUN1',
    dischargePort: 'KRBUS',
    destinationPort: 'KRBUS',
    updated: 1791139137
  },
  {
    id: 1008,
    jobNumber: 150019,
    jobDate: 20728,
    exporterName: 'Amit Exports',
    consigneeName: 'H&M HENNES & MAURITZ LTD',
    loadingPort: 'INMUN1',
    dischargePort: 'KRBUS',
    destinationPort: 'KRBUS',
    updated: 1791139150
  },
  {
    id: 1009,
    jobNumber: 150020,
    jobDate: 20728,
    exporterName: 'Amit Exports',
    consigneeName: 'H&M HENNES & MAURITZ LTD',
    loadingPort: 'INMUN1',
    dischargePort: 'KRBUS',
    destinationPort: 'KRBUS',
    updated: 1791139885
  },
  {
    id: 1010,
    jobNumber: 150021,
    jobDate: 20728,
    exporterName: 'Amit Exports',
    consigneeName: 'H&M HENNES & MAURITZ LTD',
    loadingPort: 'INMUN1',
    dischargePort: 'KRBUS',
    destinationPort: 'KRBUS',
    updated: 1791140799
  },
  {
    id: 1011,
    jobNumber: 150022,
    jobDate: 20728,
    exporterName: 'Amit Exports',
    consigneeName: 'H&M HENNES & MAURITZ LTD',
    loadingPort: 'INMUN1',
    dischargePort: 'KRBUS',
    destinationPort: 'KRBUS',
    updated: 1791140811
  },
  {
    id: 1012,
    jobNumber: 150023,
    jobDate: 20728,
    exporterName: 'Amit Exports',
    consigneeName: 'H&M HENNES & MAURITZ LTD',
    loadingPort: 'INMUN1',
    dischargePort: 'KRBUS',
    destinationPort: 'KRBUS',
    updated: 1791141353
  },
  {
    id: 1013,
    jobNumber: 150024,
    jobDate: 20728,
    exporterName: 'Amit Exports',
    consigneeName: 'H&M HENNES & MAURITZ LTD',
    loadingPort: 'INMUN1',
    dischargePort: 'KRBUS',
    destinationPort: 'KRBUS',
    updated: 1791141776
  },
  {
    id: 1014,
    jobNumber: 150025,
    jobDate: 20728,
    exporterName: 'Amit Exports',
    consigneeName: 'H&M HENNES & MAURITZ LTD',
    loadingPort: 'INMUN1',
    dischargePort: 'KRBUS',
    destinationPort: 'KRBUS',
    updated: 1791143087
  },
  {
    id: 1021,
    jobNumber: 150026,
    jobDate: 20714,
    exporterName: 'Amit Exports',
    consigneeName: 'H&M HENNES & MAURITZ LTD',
    loadingPort: 'INMUN1',
    dischargePort: 'INMUN1',
    destinationPort: 'USMSY',
    updated: 1791183194
  },
  {
    id: 1023,
    jobNumber: 150028,
    jobDate: 20714,
    exporterName: 'Amit Exports',
    consigneeName: 'H&M HENNES & MAURITZ LTD',
    loadingPort: 'INMUN1',
    dischargePort: 'INMUN1',
    destinationPort: 'USMSY',
    updated: 1791449123
  },
  {
    id: 1024,
    jobNumber: 150029,
    jobDate: 20714,
    exporterName: 'Amit Exports',
    consigneeName: 'H&M HENNES & MAURITZ LTD',
    loadingPort: 'INMUN1',
    dischargePort: 'INMUN1',
    destinationPort: 'USMSY',
    updated: 1791449142
  },
  {
    id: 1025,
    jobNumber: 150030,
    jobDate: 20714,
    exporterName: 'Amit Exports',
    consigneeName: 'H&M HENNES & MAURITZ LTD',
    loadingPort: 'INMUN1',
    dischargePort: 'INMUN1',
    destinationPort: 'USMSY',
    updated: 1791449171
  },
  {
    id: 1026,
    jobNumber: 150031,
    jobDate: 20714,
    exporterName: 'Amit Exports',
    consigneeName: 'H&M HENNES & MAURITZ LTD',
    loadingPort: 'INMUN1',
    dischargePort: 'INMUN1',
    destinationPort: 'USMSY',
    updated: 1791449252
  },
  {
    id: 1027,
    jobNumber: 150032,
    jobDate: 20714,
    exporterName: 'Amit Exports',
    consigneeName: 'H&M HENNES & MAURITZ LTD',
    loadingPort: 'INMUN1',
    dischargePort: 'INMUN1',
    destinationPort: 'USMSY',
    updated: 1791449308
  },
  {
    id: 1028,
    jobNumber: 150033,
    jobDate: 20714,
    exporterName: 'Amit Exports',
    consigneeName: 'H&M HENNES & MAURITZ LTD',
    loadingPort: 'INMUN1',
    dischargePort: 'INMUN1',
    destinationPort: 'USMSY',
    updated: 1791452556
  }
]

export const seedBills: SavedBill[] = [sampleBill, ...seedBillListRows.map(fromApiListRow)]
