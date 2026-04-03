'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '../../lib/api'
import Sidebar from '../../components/Sidebar'
import ModalEditarOportunidade from '../../components/ModalEditarOportunidade'
import { LayoutGrid, List, Plus, Download, Edit2 } from 'lucide-react'

interface Oport {
  id: number; titulo: string; cliente_nome: string; empresa: string
  valor: number; estagio: string; data_fechamento: string; lead_id: number
  notas?: string; email?: string
}

const ESTAGIOS = ['prospecção','proposta','negociação','fechado_ganho','fechado_perdido']
const COR_BORDA: Record<string, string> = {
  'prospecção':      'border-gray-500',
  'proposta':        'border-blue-500',
  'negociação':      'border-yellow-500',
  'fechado_ganho':   'border-green-500',
  'fechado_perdido': 'border-red-500',
}
const COR_BADGE: Record<string, string> = {
  'prospecção':      'bg-gray-600',
  'proposta':        'bg-blue-600',
  'negociação':      'bg-yellow-600',
  'fechado_ganho':   'bg-green-600',
  'fechado_perdido': 'bg-red-600',
}
const EMOJI: Record<string, string> = {
  'prospecção':'🔍','proposta':'📋','negociação':'🤝','fechado_ganho':'✅','fechado_perdido':'❌'
}

export default function OportunidadesPage() {
  const router = useRouter()
  const [oports, setOports]   = useState<Oport[]>([])
  const [view, setView]       = useState<'kanban'|'lista'>('kanban')
  const [baixando, setBaixando] = useState<string|null>(null)
  const [editando, setEditando] = useState<Oport | null>(null)

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return }
    api.get('/oportunidades').then(r => setOports(r.data)).catch(() => router.push('/login'))
  }, [router])

  const moverEstagio = async (id: number, estagio: string) => {
    await api.put(`/oportunidades/${id}`, { estagio })
    setOports(prev => prev.map(o => o.id === id ? { ...o, estagio } : o))
  }

  const baixarPDF = async (tipo: string, id: number) => {
    setBaixando(`${tipo}-${id}`)
    const token = localStorage.getItem('token')
    const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/relatorios/${tipo}/${id}`,
      { headers: { Authorization: `Bearer ${token}` } })
    const blob = await r.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${tipo}-${id}.pdf`
    a.click()
    URL.revokeObjectURL(a.href)
    setBaixando(null)
  }

  const total  = oports.reduce((s, o) => s + Number(o.valor), 0)
  const ganhos = oports.filter(o => o.estagio==='fechado_ganho').reduce((s,o) => s+Number(o.valor),0)

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-56 p-8 w-full">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-400">Oportunidades</h1>
            <p className="text-gray-500 text-sm">
              Pipeline: <span className="text-white font-semibold">R$ {total.toLocaleString('pt-BR')}</span>
              &nbsp;·&nbsp;Ganhos: <span className="text-green-400 font-semibold">R$ {ganhos.toLocaleString('pt-BR')}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setView('kanban')} className={`p-2 rounded-lg transition ${view==='kanban'?'bg-blue-600':'bg-gray-800 hover:bg-gray-700'}`}><LayoutGrid size={16}/></button>
            <button onClick={() => setView('lista')}  className={`p-2 rounded-lg transition ${view==='lista' ?'bg-blue-600':'bg-gray-800 hover:bg-gray-700'}`}><List size={16}/></button>
          </div>
        </div>

        {/* KANBAN */}
        {view === 'kanban' && (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {ESTAGIOS.map(estagio => {
              const cards = oports.filter(o => o.estagio === estagio)
              const volumeEstagio = cards.reduce((s,o) => s+Number(o.valor),0)
              return (
                <div key={estagio} className="flex-shrink-0 w-64">
                  <div className={`bg-gray-800 border-t-4 ${COR_BORDA[estagio]} rounded-t-xl px-3 py-3 mb-2`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{EMOJI[estagio]} {estagio}</span>
                      <span className="bg-gray-700 text-xs px-1.5 py-0.5 rounded-full">{cards.length}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">R$ {volumeEstagio.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="space-y-2">
                    {cards.map(o => (
                      <div key={o.id} className={`bg-gray-800 border ${COR_BORDA[o.estagio]} border-opacity-30 rounded-xl p-3 hover:border-opacity-70 transition`}>
                        <p className="font-semibold text-sm mb-1 leading-tight">{o.titulo}</p>
                        <p className="text-xs text-gray-400 mb-2">{o.cliente_nome} · {o.empresa}</p>
                        <p className="text-green-400 font-mono text-sm font-bold mb-2">R$ {Number(o.valor).toLocaleString('pt-BR')}</p>
                        {o.data_fechamento && (
                          <p className="text-xs text-gray-500 mb-2">📅 {new Date(o.data_fechamento).toLocaleDateString('pt-BR')}</p>
                        )}
                        <div className="flex gap-1 flex-wrap mt-2">
                          {ESTAGIOS.filter(e => e !== estagio).slice(0,2).map(e => (
                            <button key={e} onClick={() => moverEstagio(o.id, e)}
                              className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-0.5 rounded transition">
                              → {e.split('_')[0]}
                            </button>
                          ))}
                          <button onClick={() => setEditando(o)}
                            className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-0.5 rounded transition">
                            <Edit2 size={10} className="inline mr-1" />Editar
                          </button>
                          <button onClick={() => baixarPDF('proposta', o.id)} disabled={!!baixando}
                            className="text-xs bg-gray-700 hover:bg-blue-700 px-2 py-0.5 rounded transition ml-auto">
                            {baixando===`proposta-${o.id}` ? '...' : '📄 PDF'}
                          </button>
                        </div>
                      </div>
                    ))}
                    {cards.length === 0 && (
                      <div className="border-2 border-dashed border-gray-700 rounded-xl p-4 text-center text-gray-600 text-xs">vazio</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* LISTA */}
        {view === 'lista' && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700 text-left">
                <th className="py-3 pr-4">Título</th><th className="py-3 pr-4">Cliente</th>
                <th className="py-3 pr-4">Valor</th><th className="py-3 pr-4">Estágio</th>
                <th className="py-3 pr-4">Fechamento</th><th className="py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {oports.map(o => (
                <tr key={o.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition">
                  <td className="py-3 pr-4 font-medium">{o.titulo}</td>
                  <td className="py-3 pr-4 text-gray-400">{o.cliente_nome}</td>
                  <td className="py-3 pr-4 text-green-400 font-mono">R$ {Number(o.valor).toLocaleString('pt-BR')}</td>
                  <td className="py-3 pr-4"><span className={`${COR_BADGE[o.estagio]||'bg-gray-600'} px-2 py-0.5 rounded-full text-xs`}>{o.estagio}</span></td>
                  <td className="py-3 pr-4 text-gray-400 text-xs">{o.data_fechamento?.split('T')[0] ?? '—'}</td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setEditando(o)}
                        className="flex items-center gap-1 text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition">
                        <Edit2 size={10} /> Editar
                      </button>
                      <button onClick={() => baixarPDF('proposta', o.id)} disabled={!!baixando}
                        className="flex items-center gap-1 text-xs bg-gray-700 hover:bg-blue-700 px-2 py-1 rounded transition">
                        <Download size={10}/>{baixando===`proposta-${o.id}`?'...':'PDF'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>

      {editando && (
        <ModalEditarOportunidade
          oport={editando}
          onClose={() => setEditando(null)}
          onSaved={updated => {
            setOports(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o))
            setEditando(null)
          }}
        />
      )}
    </div>
  )
}

