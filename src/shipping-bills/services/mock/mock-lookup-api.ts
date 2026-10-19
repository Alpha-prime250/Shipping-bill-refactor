import type { Option, PortOption } from '../../domain/types'
import type { LookupApi } from '../types'
import { documentCodes } from './data/e-sanchit-codes'
import { fileTypes, foreignPorts, loadingPorts, marksByExporter } from './data/code-lists'
import { formOptions } from './data/form-options'
import { respond } from './network'

const matches = (query: string, ...texts: string[]) => {
  const q = query.trim().toLowerCase()
  return texts.some((text) => text.toLowerCase().includes(q))
}

const searchOptions = (options: Option[], query: string) =>
  options.filter((option) => matches(query, option.label, String(option.value)))

const searchPorts = (ports: PortOption[], query: string) => ports.filter((port) => matches(query, port.name, port.code))

export const mockLookupApi: LookupApi = {
  getFormOptions: () => respond(() => formOptions, 400),

  getMarksAndNumbers: (exporterId) => respond(() => marksByExporter[exporterId] ?? []),

  searchLoadingPorts: (query) => respond(() => searchPorts(loadingPorts, query)),

  searchDestinationPorts: (query) => respond(() => searchPorts(foreignPorts, query)),

  getPort: (code) => respond(() => [...loadingPorts, ...foreignPorts].find((port) => port.code === code), 100),

  searchDocumentTypes: (query) => respond(() => searchOptions(documentCodes, query), 150),

  getDocumentType: (code) => respond(() => documentCodes.find((doc) => doc.value === code), 100),

  searchFileTypes: (query) => respond(() => searchOptions(fileTypes, query), 100),

  getFileType: (code) => respond(() => fileTypes.find((type) => type.value === code), 100)
}
