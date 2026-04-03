'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import api from '../../../lib/api'
import Sidebar from '../../../components/Sidebar'
import ModalEmail from '../../../components/ModalEmail'
import {
  Building2, Mail, Phone, MapPin, Globe, FileText,
  Users, Briefcase, TrendingUp, Edit2, Save, X, Send
} from 'lucide-react'

interface Cliente {
  id: number; nome: string; empresa: string; email: string; telefone: string
  cidade?: string; estado?: string; segmento?: string; cnpj?: string; site?: string
  resumo_atendente?: string; criado_em: string
}
interface Lead {
  id: number; status: string; prioridade: number; origem: string; criado_em: string; notas?: string
}
interface Oport {
  id: number; titulo: string; valor: number; estagio: string; data_fechamento?: string; lead_id: number
}
interface Hist {
  id: number; tipo: string; descricao: string; criado_em: string; lead_id: number
}

const STATUS_COLOR: Record<string, string> = {
  novo: 'bg-blue-600', contatado: 'bg-yellow-600', qualificado: 'bg-green-600', perdido: 'bg-red-600'
}
const ESTAGIO_COLOR: Record<string, string> = {
  'prospecção': 'bg-gray-600', 'proposta': 'bg-blue-600', 'negociação': 'bg-yellow-600',
  'fechado_ganho': 'bg-green-600', 'fechado_perdido': 'bg-red-600'
}

export default function ClientePerfilPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [leads, setLeads]     = useState<Lead[]>([])
  const [oports, setOports]   = useState<Oport[]>([])
  const [hist, setHist]       = useState<Hist[]>([])

  const [editandoResumo, setEditandoResumo] = useState(false)
  const [resumoEdit, setResumoEdit]         = useState('')
  const [editandoInfo, setEditandoInfo]     = useState(false)
  const [infoEdit, setInfoEdit]             = useState<Partial<Cliente>>({})
  const [salvando, setSalvando]             = useState(false)
  const [emailModal, setEmailModal]         = useState(false)

  const carregar = async () => {
    if (!localStorage.getItem('token')) { router.push('/login'); return }
    const [cRes, lRes, oRes] = await Promise.all([
      api.get(`/clientes/${id}`),
      api.get(`/leads?cliente_id=${id}`),
      api.get(`/oportunidades?cliente_id=${id}`),
    ])
    setCliente(cRes.data)
    setLeads(lRes.data)
    setOports(oRes.data)

    // Fetch historico for each lead
    const leadIds = lRes.data.map((l: Lead) => l.id)
    if (leadIds.length > 0) {
      const histPromises = leadIds.slice(0, 5).map((lid: number) =>
        api.get(`/historico/${lid}`).then(r => r.data).catch(() => [])
      )
      const allHist = (await Promise.all(histPromises)).flat()
      allHist.sort((a: Hist, b: Hist) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())
      setHist(allHist.slice(0, 10))
    }
  }

  useEffect(() => { carregar() }, [id])

  if (!cliente) return (
    <div className="flex"><Sidebar />
      <main className="ml-56 p-8 text-gray-400 animate-pulse">Carregando perfil...</main>
    </div>
  )

  const pipelineTotal = oports.reduce((s, o) => s + Number(o.valor), 0)
  const totalGanhos   = oports.filter(o => o.estagio === 'fechado_ganho').reduce((s, o) => s + Number(o.valor), 0)

  const salvarResumo = async () => {
    setSalvando(true)
    await api.put(`/clientes/${id}`, { ...cliente, resumo_atendente: resumoEdit })
    setCliente(c => c ? { ...c, resumo_atendente: resumoEdit } : c)
    setEditandoResumo(false)
    setSalvando(false)
  }

  const salvarInfo = async () => {
    setSalvando(true)
    const payload = { ...cliente, ...infoEdit }
    await api.put(`/clientes/${id}`, payload)
    setCliente(payload as Cliente)
    setEditandoInfo(false)
    setSalvando(false)
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-56 p-8 w-full max-w-5xl space-y-8">

        {/* Voltar */}
        <button onClick={() => router.back()} className="text-gray-500 hover:text-white text-sm">← Voltar</button>

        {/* Header */}
        <div className="bg-gray-800 rounded-2xl p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              {editandoInfo ? (
                <div className="space-y-3 min-w-80">
                  <input defaultValue={cliente.nome} onChange={e => setInfoEdit(s => ({ ...s, nome: e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-lg font-bold focus:outline-none focus:border-blue-500" />
                  <div className="grid grid-cols-2 gap-2">
                    <input defaultValue={cliente.empresa} onChange={e => setInfoEdit(s => ({ ...s, empresa: e.target.value }))}
                      placeholder="Empresa" className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                    <input defaultValue={cliente.segmento} onChange={e => setInfoEdit(s => ({ ...s, segmento: e.target.value }))}
                      placeholder="Segmento" className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                    <input defaultValue={cliente.email} onChange={e => setInfoEdit(s => ({ ...s, email: e.target.value }))}
                      placeholder="Email" className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                    <input defaultValue={cliente.telefone} onChange={e => setInfoEdit(s => ({ ...s, telefone: e.target.value }))}
                      placeholder="Telefone" className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                    <input defaultValue={cliente.cidade} onChange={e => setInfoEdit(s => ({ ...s, cidade: e.target.value }))}
                      placeholder="Cidade" className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                    <input defaultValue={cliente.estado} onChange={e => setInfoEdit(s => ({ ...s, estado: e.target.value }))}
                      placeholder="Estado" className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                    <input defaultValue={cliente.cnpj} onChange={e => setInfoEdit(s => ({ ...s, cnpj: e.target.value }))}
                      placeholder="CNPJ" className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                    <input defaultValue={cliente.site} onChange={e => setInfoEdit(s => ({ ...s, site: e.target.value }))}
                      placeholder="Site" className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={salvarInfo} disabled={salvando}
                      className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition">
                      <Save size={14} /> {salvando ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button onClick={() => setEditandoInfo(false)}
                      className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition">
                      <X size={14} /> Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-blue-400 mb-1">{cliente.nome}</h1>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-400">
                    {cliente.empresa && (
                      <span className="flex items-center gap-1"><Building2 size={13} /> {cliente.empresa}</span>
                    )}
                    {cliente.segmento && (
                      <span className="bg-gray-700 text-xs px-2 py-0.5 rounded-full">{cliente.segmento}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-400 mt-2">
                    <span className="flex items-center gap-1"><Mail size={13} /> {cliente.email}</span>
                    {cliente.telefone && <span className="flex items-center gap-1"><Phone size={13} /> {cliente.telefone}</span>}
                    {cliente.cidade && <span className="flex items-center gap-1"><MapPin size={13} /> {cliente.cidade}{cliente.estado ? `, ${cliente.estado}` : ''}</span>}
                    {cliente.cnpj && <span className="flex items-center gap-1"><FileText size={13} /> CNPJ: {cliente.cnpj}</span>}
                    {cliente.site && (
                      <a href={cliente.site} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-blue-400 hover:text-blue-300">
                        <Globe size={13} /> {cliente.site}
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2">
              {!editandoInfo && (
                <button onClick={() => { setEditandoInfo(true); setInfoEdit({}) }}
                  className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition">
                  <Edit2 size={14} /> Editar
                </button>
              )}
              <button onClick={() => setEmailModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition">
                <Send size={14} /> Enviar Email
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-700">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-blue-400 mb-1"><Users size={16} /></div>
              <p className="text-2xl font-bold">{leads.length}</p>
              <p className="text-xs text-gray-500">Leads</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-yellow-400 mb-1"><Briefcase size={16} /></div>
              <p className="text-2xl font-bold">{oports.length}</p>
              <p className="text-xs text-gray-500">Oportunidades</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-green-400 mb-1"><TrendingUp size={16} /></div>
              <p className="text-xl font-bold text-green-400">R$ {pipelineTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
              <p className="text-xs text-gray-500">Pipeline Total</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-400 mb-1"><TrendingUp size={16} /></div>
              <p className="text-xl font-bold text-emerald-400">R$ {totalGanhos.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
              <p className="text-xs text-gray-500">Total Ganhos</p>
            </div>
          </div>
        </div>

        {/* Resumo do Atendente */}
        <div className="bg-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-200">📝 Resumo do Atendente</h2>
            {!editandoResumo && (
              <button onClick={() => { setEditandoResumo(true); setResumoEdit(cliente.resumo_atendente || '') }}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition">
                <Edit2 size={13} /> Editar
              </button>
            )}
          </div>
          {editandoResumo ? (
            <div className="space-y-3">
              <textarea value={resumoEdit} onChange={e => setResumoEdit(e.target.value)}
                rows={4} placeholder="Resumo sobre o cliente, preferências, histórico relevante..."
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" />
              <div className="flex gap-2">
                <button onClick={salvarResumo} disabled={salvando}
                  className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition">
                  <Save size={14} /> {salvando ? 'Salvando...' : 'Salvar'}
                </button>
                <button onClick={() => setEditandoResumo(false)}
                  className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition">
                  <X size={14} /> Cancelar
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
              {cliente.resumo_atendente || <span className="italic text-gray-600">Nenhum resumo adicionado ainda. Clique em Editar para adicionar.</span>}
            </p>
          )}
        </div>

        {/* Leads */}
        <div className="bg-gray-800 rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <Users size={18} className="text-blue-400" /> Leads ({leads.length})
          </h2>
          {leads.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum lead cadastrado para este cliente.</p>
          ) : (
            <div className="space-y-2">
              {leads.map(l => (
                <Link key={l.id} href={`/leads/${l.id}`}
                  className="flex items-center justify-between bg-gray-900 hover:bg-gray-750 rounded-xl p-3 transition">
                  <div className="flex items-center gap-3">
                    <span className={`${STATUS_COLOR[l.status] || 'bg-gray-600'} text-xs px-2 py-0.5 rounded-full`}>{l.status}</span>
                    <span className="text-sm text-gray-300">Origem: {l.origem}</span>
                    <span className="text-xs text-gray-500">Prioridade {l.prioridade}</span>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(l.criado_em).toLocaleDateString('pt-BR')}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Oportunidades */}
        <div className="bg-gray-800 rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <Briefcase size={18} className="text-yellow-400" /> Oportunidades ({oports.length})
          </h2>
          {oports.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma oportunidade encontrada.</p>
          ) : (
            <div className="space-y-2">
              {oports.map(o => (
                <div key={o.id} className="flex items-center justify-between bg-gray-900 rounded-xl p-3">
                  <div>
                    <p className="font-medium text-sm">{o.titulo}</p>
                    <span className={`${ESTAGIO_COLOR[o.estagio] || 'bg-gray-600'} text-xs px-2 py-0.5 rounded-full mt-1 inline-block`}>{o.estagio}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-mono font-semibold">R$ {Number(o.valor).toLocaleString('pt-BR')}</p>
                    {o.data_fechamento && (
                      <p className="text-xs text-gray-500">{new Date(o.data_fechamento).toLocaleDateString('pt-BR')}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Histórico recente */}
        {hist.length > 0 && (
          <div className="bg-gray-800 rounded-2xl p-5">
            <h2 className="text-lg font-semibold text-gray-200 mb-4">🕐 Histórico Recente</h2>
            <div className="space-y-3">
              {hist.map(h => (
                <div key={h.id} className="flex items-start gap-3 bg-gray-900 rounded-xl p-3">
                  <span className="text-xs bg-gray-700 px-2 py-0.5 rounded-full whitespace-nowrap mt-0.5">{h.tipo}</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-200">{h.descricao}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(h.criado_em).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {emailModal && (
        <ModalEmail
          clienteEmail={cliente.email}
          onClose={() => setEmailModal(false)}
        />
      )}
    </div>
  )
}
