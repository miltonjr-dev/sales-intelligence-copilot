'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import api from '../../../lib/api'
import Sidebar from '../../../components/Sidebar'
import ModalEditarOportunidade from '../../../components/ModalEditarOportunidade'
import ModalEmail from '../../../components/ModalEmail'
import { FileText, Plus, Download, Edit2, Mail } from 'lucide-react'

interface Historico { id: number; tipo: string; descricao: string; criado_em: string }
interface Lead { id: number; cliente_nome: string; empresa: string; email: string; telefone: string; status: string; prioridade: number; origem: string; notas: string; cliente_id: number }
interface Oport { id: number; titulo: string; valor: number; estagio: string; data_fechamento: string; notas?: string; email?: string }

const TIPO_COR: Record<string, string> = {
  ligação:   'bg-blue-500',
  email:     'bg-green-500',
  reunião:   'bg-yellow-500',
  nota:      'bg-gray-500',
  ia_resumo: 'bg-purple-500',
}

export default function LeadDetalhePage() {
  const router   = useRouter()
  const { id }   = useParams<{ id: string }>()
  const [lead,   setLead]   = useState<Lead | null>(null)
  const [hist,   setHist]   = useState<Historico[]>([])
  const [oports, setOports] = useState<Oport[]>([])
  const [novaInteracao, setNovaInteracao] = useState({ tipo: 'nota', descricao: '' })
  const [salvando, setSalvando] = useState(false)
  const [editandoOport, setEditandoOport] = useState<Oport | null>(null)
  const [emailModal, setEmailModal] = useState(false)

  const carregar = () => {
    api.get(`/leads/${id}`).then(r => setLead(r.data))
    api.get(`/historico/${id}`).then(r => setHist(r.data))
    api.get(`/oportunidades?lead_id=${id}`).then(r => setOports(r.data))
  }

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return }
    carregar()
  }, [id])

  const adicionarInteracao = async () => {
    if (!novaInteracao.descricao.trim()) return
    setSalvando(true)
    await api.post('/historico', { lead_id: id, ...novaInteracao })
    setNovaInteracao({ tipo: 'nota', descricao: '' })
    carregar()
    setSalvando(false)
  }

  const baixarPDF = (tipo: 'negociacao', refId: string) => {
    const token = localStorage.getItem('token')
    const url   = `${process.env.NEXT_PUBLIC_API_URL}/api/relatorios/${tipo}/${refId}`
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `${tipo}-${refId}.pdf`
        a.click()
        URL.revokeObjectURL(a.href)
      })
  }

  if (!lead) return <div className="flex"><Sidebar /><main className="ml-56 p-8 text-gray-400 animate-pulse">Carregando...</main></div>

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-56 p-8 w-full max-w-4xl space-y-8">

        {/* Cabeçalho */}
        <div className="flex items-start justify-between">
          <div>
            <button onClick={() => router.back()} className="text-gray-500 hover:text-white text-sm mb-2">← Voltar</button>
            <h1 className="text-3xl font-bold text-blue-400">{lead.cliente_nome}</h1>
            <p className="text-gray-400">{lead.empresa} · {lead.email} · {lead.telefone}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEmailModal(true)}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition">
              <Mail size={14} /> Email
            </button>
            <button onClick={() => baixarPDF('negociacao', id)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition">
              <Download size={14} /> PDF Negociação
            </button>
          </div>
        </div>

        {/* Oportunidades */}
        {oports.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-300 mb-3">Oportunidades</h2>
            <div className="grid grid-cols-2 gap-3">
              {oports.map(o => (
                <div key={o.id} className="bg-gray-800 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{o.titulo}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{o.estagio}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-mono text-sm">R$ {Number(o.valor).toLocaleString('pt-BR')}</p>
                    <div className="flex gap-2 mt-1 justify-end">
                      <button onClick={() => setEditandoOport({ ...o, email: lead.email })}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition">
                        <Edit2 size={11} /> Editar
                      </button>
                      <button onClick={() => {
                        const token = localStorage.getItem('token')
                        const url = `${process.env.NEXT_PUBLIC_API_URL}/api/relatorios/proposta/${o.id}`
                        fetch(url, { headers: { Authorization: `Bearer ${token}` } })
                          .then(r => r.blob()).then(blob => {
                            const a = document.createElement('a')
                            a.href = URL.createObjectURL(blob)
                            a.download = `proposta-${o.id}.pdf`
                            a.click()
                          })
                      }} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition">
                        <FileText size={12} /> PDF
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Nova interação */}
        <section className="bg-gray-800 rounded-xl p-5 space-y-3">
          <h2 className="text-lg font-semibold text-gray-300 flex items-center gap-2"><Plus size={16} /> Registrar Interação</h2>
          <div className="flex gap-3">
            <select value={novaInteracao.tipo} onChange={e => setNovaInteracao(s => ({ ...s, tipo: e.target.value }))}
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm">
              {['nota','ligação','email','reunião'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input value={novaInteracao.descricao}
              onChange={e => setNovaInteracao(s => ({ ...s, descricao: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && adicionarInteracao()}
              placeholder="Descreva a interação... (Enter para salvar)"
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <button onClick={adicionarInteracao} disabled={salvando}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition">
              {salvando ? '...' : 'Salvar'}
            </button>
          </div>
        </section>

        {/* Timeline */}
        <section>
          <h2 className="text-lg font-semibold text-gray-300 mb-4">Timeline de Interações</h2>
          {hist.length === 0
            ? <p className="text-gray-500 text-sm">Nenhuma interação registrada ainda.</p>
            : (
            <div className="relative border-l-2 border-gray-700 ml-4 space-y-6">
              {hist.map(h => (
                <div key={h.id} className="relative pl-6">
                  <span className={`absolute -left-2 top-1 w-4 h-4 rounded-full ${TIPO_COR[h.tipo] || 'bg-gray-500'} border-2 border-gray-900`} />
                  <div className="bg-gray-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`${TIPO_COR[h.tipo] || 'bg-gray-600'} px-2 py-0.5 rounded-full text-xs`}>{h.tipo}</span>
                      <span className="text-xs text-gray-500">{new Date(h.criado_em).toLocaleString('pt-BR')}</span>
                    </div>
                    <p className="text-sm text-gray-200 leading-relaxed">{h.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {editandoOport && (
        <ModalEditarOportunidade
          oport={editandoOport}
          onClose={() => setEditandoOport(null)}
          onSaved={updated => {
            setOports(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o))
            setEditandoOport(null)
          }}
        />
      )}

      {emailModal && (
        <ModalEmail
          clienteEmail={lead.email}
          onClose={() => setEmailModal(false)}
        />
      )}
    </div>
  )
}

