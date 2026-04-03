'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '../../lib/api'
import Sidebar from '../../components/Sidebar'
import ModalNovoLead from '../../components/ModalNovoLead'
import { Plus, Search, ChevronUp, ChevronDown, Download } from 'lucide-react'

interface Lead {
  id: number; cliente_nome: string; empresa: string
  status: string; prioridade: number; origem: string
  temperatura: string; dias_fechamento: number | null; criado_em: string
}

const STATUS_COLOR: Record<string, string> = {
  novo:        'bg-gray-600',
  contatado:   'bg-yellow-600',
  qualificado: 'bg-green-600',
  perdido:     'bg-red-600',
}

const TEMP: Record<string, { emoji: string; cor: string; bg: string }> = {
  quente: { emoji: '🔥', cor: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/40' },
  morno:  { emoji: '🌡️', cor: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/40' },
  frio:   { emoji: '🧊', cor: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/40' },
}

export default function LeadsPage() {
  const router   = useRouter()
  const [leads, setLeads]   = useState<Lead[]>([])
  const [busca, setBusca]   = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [filtroTemp, setFiltroTemp]     = useState('todos')
  const [sortDir, setSortDir]     = useState<'desc'|'asc'>('desc')
  const [modal, setModal] = useState(false)

  const carregar = () =>
    api.get('/leads').then(r => setLeads(r.data)).catch(() => router.push('/login'))

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return }
    carregar()
  }, [])

  const filtrados = leads
    .filter(l => filtroStatus === 'todos' || l.status === filtroStatus)
    .filter(l => filtroTemp  === 'todos' || l.temperatura === filtroTemp)
    .filter(l => {
      if (!busca) return true
      const q = busca.toLowerCase()
      return l.cliente_nome.toLowerCase().includes(q) || l.empresa.toLowerCase().includes(q)
    })
    .sort((a, b) => sortDir === 'desc' ? b.prioridade - a.prioridade : a.prioridade - b.prioridade)

  const contadores = {
    quente: leads.filter(l => l.temperatura === 'quente').length,
    morno:  leads.filter(l => l.temperatura === 'morno').length,
    frio:   leads.filter(l => l.temperatura === 'frio').length,
  }

  const exportarCSV = () => {
    const token = localStorage.getItem('token')
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/csv/export`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.blob()).then(blob => {
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
      a.download = 'leads.csv'; a.click()
    })
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <main className="ml-56 p-8 w-full">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-400">Leads</h1>
            <p className="text-gray-500 text-sm">{filtrados.length} de {leads.length} leads</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportarCSV}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-2 rounded-lg text-sm transition">
              <Download size={14}/> CSV
            </button>
            <button onClick={() => setModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-semibold transition">
              <Plus size={16}/> Novo Lead
            </button>
          </div>
        </div>

        {/* Termômetro resumo */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {(['quente','morno','frio'] as const).map(t => {
            const cfg = TEMP[t]
            return (
              <button key={t} onClick={() => setFiltroTemp(filtroTemp === t ? 'todos' : t)}
                className={`${cfg.bg} border rounded-xl p-4 flex items-center gap-3 transition hover:opacity-80 ${filtroTemp === t ? 'ring-2 ring-blue-500' : ''}`}>
                <span className="text-3xl">{cfg.emoji}</span>
                <div className="text-left">
                  <div className={`text-2xl font-black ${cfg.cor}`}>{contadores[t]}</div>
                  <div className="text-gray-400 text-xs capitalize">{t}</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Filtros e busca */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
            <input value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por nome ou empresa..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex gap-1">
            {['todos','novo','contatado','qualificado','perdido'].map(s => (
              <button key={s} onClick={() => setFiltroStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filtroStatus === s ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-400'}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={() => setSortDir(d => d==='desc'?'asc':'desc')}
            className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-2 rounded-lg text-xs transition">
            {sortDir === 'desc' ? <ChevronDown size={13}/> : <ChevronUp size={13}/>} Prioridade
          </button>
        </div>

        {/* Tabela */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800 text-left text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Temp.</th>
                <th className="py-3 px-4">Nome</th>
                <th className="py-3 px-4">Empresa</th>
                <th className="py-3 px-4">Origem</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Prioridade</th>
                <th className="py-3 px-4">Fechamento</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(l => {
                const cfg = TEMP[l.temperatura] || TEMP.frio
                const urgente = l.dias_fechamento !== null && l.dias_fechamento <= 7
                return (
                  <tr key={l.id} className={`border-b border-gray-800/60 hover:bg-gray-800/40 transition ${urgente ? 'bg-red-500/5' : ''}`}>
                    <td className="py-3 px-4">
                      <span className={`${cfg.bg} border px-2 py-1 rounded-lg text-xs flex items-center gap-1 w-fit ${cfg.cor}`}>
                        {cfg.emoji} {l.temperatura}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">
                      <Link href={`/leads/${l.id}`} className="hover:text-blue-400 transition">
                        {l.cliente_nome}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-gray-400">{l.empresa}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{l.origem}</td>
                    <td className="py-3 px-4">
                      <span className={`${STATUS_COLOR[l.status] || 'bg-gray-600'} px-2 py-0.5 rounded-full text-xs`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${l.prioridade * 10}%` }}/>
                        </div>
                        <span className="text-gray-400 text-xs">{l.prioridade}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {l.dias_fechamento !== null
                        ? <span className={urgente ? 'text-red-400 font-semibold' : 'text-gray-400'}>
                            {urgente && '⚠️ '}{Math.round(l.dias_fechamento)}d
                          </span>
                        : <span className="text-gray-600">—</span>
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtrados.length === 0 && (
            <div className="text-center py-16 text-gray-600">
              <div className="text-4xl mb-3">🔍</div>
              <p>Nenhum lead encontrado com esses filtros</p>
            </div>
          )}
        </div>
      </main>
      {modal && <ModalNovoLead onClose={() => setModal(false)} onSaved={() => { setModal(false); carregar() }} />}
    </div>
  )
}
