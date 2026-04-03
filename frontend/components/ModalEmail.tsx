'use client'
import { useState } from 'react'
import api from '../lib/api'
import { X, Send, Paperclip } from 'lucide-react'

interface Props {
  leadId?: string | number
  oportunidadeId?: string | number
  clienteEmail?: string
  onClose: () => void
}

export default function ModalEmail({ leadId, oportunidadeId, clienteEmail, onClose }: Props) {
  const [para, setPara]       = useState(clienteEmail || '')
  const [assunto, setAssunto] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [anexarPDF, setAnexarPDF] = useState(false)
  const [enviando, setEnviando]   = useState(false)
  const [preview, setPreview]     = useState<string | null>(null)
  const [erro, setErro]           = useState('')

  const enviar = async () => {
    if (!para || !assunto || !mensagem) { setErro('Preencha todos os campos'); return }
    setErro('')
    setEnviando(true)
    try {
      let res
      if (anexarPDF && oportunidadeId) {
        res = await api.post(`/email/proposta/${oportunidadeId}`, { para, assunto, mensagem })
      } else {
        res = await api.post('/email/mensagem', { para, assunto, mensagem })
      }
      setPreview(res.data.preview)
    } catch {
      setErro('Erro ao enviar email. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Send size={18} className="text-blue-400" /> Enviar Email
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {preview ? (
          <div className="p-6 text-center space-y-4">
            <div className="text-4xl">📬</div>
            <p className="text-green-400 font-semibold">Email enviado com sucesso!</p>
            <a href={preview} target="_blank" rel="noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm underline break-all">
              Ver preview: {preview}
            </a>
            <button onClick={onClose}
              className="mt-4 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-sm font-medium transition">
              Fechar
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Para (email)</label>
              <input value={para} onChange={e => setPara(e.target.value)}
                placeholder="destinatario@email.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Assunto</label>
              <input value={assunto} onChange={e => setAssunto(e.target.value)}
                placeholder="Assunto do email"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Mensagem</label>
              <textarea value={mensagem} onChange={e => setMensagem(e.target.value)}
                rows={5} placeholder="Escreva sua mensagem..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" />
            </div>

            {oportunidadeId && (
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input type="checkbox" checked={anexarPDF} onChange={e => setAnexarPDF(e.target.checked)}
                  className="w-4 h-4 accent-blue-500" />
                <Paperclip size={14} className="text-gray-400" />
                Enviar como Proposta PDF (oportunidade #{oportunidadeId})
              </label>
            )}

            {erro && <p className="text-red-400 text-sm">{erro}</p>}

            <div className="flex gap-3 pt-2">
              <button onClick={onClose}
                className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 px-4 py-2 rounded-lg text-sm transition">
                Cancelar
              </button>
              <button onClick={enviar} disabled={enviando}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-semibold transition">
                <Send size={14} /> {enviando ? 'Enviando...' : 'Enviar Email'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
