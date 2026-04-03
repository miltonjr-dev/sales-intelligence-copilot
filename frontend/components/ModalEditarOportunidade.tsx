'use client'
import { useState } from 'react'
import api from '../lib/api'
import { X, Save, Send } from 'lucide-react'
import ModalEmail from './ModalEmail'

interface Oport {
  id: number
  titulo: string
  valor: number
  estagio: string
  data_fechamento?: string
  notas?: string
  cliente_nome?: string
  empresa?: string
  email?: string
}

interface Props {
  oport: Oport
  onClose: () => void
  onSaved: (updated: Oport) => void
}

const ESTAGIOS = ['prospecção', 'proposta', 'negociação', 'fechado_ganho', 'fechado_perdido']

export default function ModalEditarOportunidade({ oport, onClose, onSaved }: Props) {
  const [titulo, setTitulo]   = useState(oport.titulo)
  const [valor, setValor]     = useState(String(oport.valor))
  const [estagio, setEstagio] = useState(oport.estagio)
  const [dataFecha, setDataFecha] = useState(oport.data_fechamento?.split('T')[0] || '')
  const [notas, setNotas]     = useState(oport.notas || '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro]         = useState('')
  const [emailModal, setEmailModal] = useState(false)

  const salvar = async () => {
    if (!titulo.trim()) { setErro('Título é obrigatório'); return }
    setErro('')
    setSalvando(true)
    try {
      const { data } = await api.put(`/oportunidades/${oport.id}`, {
        titulo,
        valor: parseFloat(valor) || 0,
        estagio,
        data_fechamento: dataFecha || null,
        notas,
      })
      onSaved(data)
    } catch {
      setErro('Erro ao salvar. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold">Editar Oportunidade</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Título</label>
              <input value={titulo} onChange={e => setTitulo(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Valor (R$)</label>
                <input value={valor} onChange={e => setValor(e.target.value)} type="number" min="0" step="0.01"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Estágio</label>
                <select value={estagio} onChange={e => setEstagio(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                  {ESTAGIOS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Data de Fechamento</label>
              <input value={dataFecha} onChange={e => setDataFecha(e.target.value)} type="date"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Observações / Notas</label>
              <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={3}
                placeholder="Notas sobre a oportunidade..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" />
            </div>

            {erro && <p className="text-red-400 text-sm">{erro}</p>}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setEmailModal(true)}
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 px-4 py-2 rounded-lg text-sm transition">
                <Send size={14} /> Enviar Proposta
              </button>
              <div className="flex-1 flex gap-2">
                <button onClick={onClose}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 px-4 py-2 rounded-lg text-sm transition">
                  Cancelar
                </button>
                <button onClick={salvar} disabled={salvando}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-semibold transition">
                  <Save size={14} /> {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {emailModal && (
        <ModalEmail
          oportunidadeId={oport.id}
          clienteEmail={oport.email}
          onClose={() => setEmailModal(false)}
        />
      )}
    </>
  )
}
