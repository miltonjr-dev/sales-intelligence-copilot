'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '../../lib/api'
import Sidebar from '../../components/Sidebar'
import { Download, FileText, TrendingUp } from 'lucide-react'

interface Oport { id: number; titulo: string; cliente_nome: string; empresa: string; valor: number; estagio: string; data_fechamento: string; lead_id: number }

const COR: Record<string, string> = {
  'prospecção':      'bg-gray-600',
  'proposta':        'bg-blue-600',
  'negociação':      'bg-yellow-600',
  'fechado_ganho':   'bg-green-600',
  'fechado_perdido': 'bg-red-600',
}

export default function RelatoriosPage() {
  const router = useRouter()
  const [oports, setOports]   = useState<Oport[]>([])
  const [filtro, setFiltro]   = useState('todos')
  const [baixando, setBaixando] = useState<string | null>(null)

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return }
    api.get('/oportunidades').then(r => setOports(r.data))
  }, [router])

  const baixarPDF = async (tipo: string, id: number) => {
    setBaixando(`${tipo}-${id}`)
    const token = localStorage.getItem('token')
    const url   = `${process.env.NEXT_PUBLIC_API_URL}/api/relatorios/${tipo}/${id}`
    try {
      const r    = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      const blob = await r.blob()
      const a    = document.createElement('a')
      a.href     = URL.createObjectURL(blob)
      a.download = `${tipo}-${id}.pdf`
      a.click()
      URL.revokeObjectURL(a.href)
    } finally { setBaixando(null) }
  }

  const baixarPipeline = async () => {
    setBaixando('pipeline')
    const token = localStorage.getItem('token')
    const r    = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/relatorios/pipeline`, { headers: { Authorization: `Bearer ${token}` } })
    const blob = await r.blob()
    const a    = document.createElement('a')
    a.href     = URL.createObjectURL(blob)
    a.download = 'pipeline-completo.pdf'
    a.click()
    URL.revokeObjectURL(a.href)
    setBaixando(null)
  }

  const filtradas = filtro === 'todos' ? oports : oports.filter(o => o.estagio === filtro)
  const totalPipeline = oports.reduce((s, o) => s + Number(o.valor), 0)
  const totalGanhos   = oports.filter(o => o.estagio === 'fechado_ganho').reduce((s, o) => s + Number(o.valor), 0)

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-56 p-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-blue-400">Relatórios</h1>
          <button onClick={baixarPipeline} disabled={!!baixando}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-semibold transition">
            <TrendingUp size={14} />
            {baixando === 'pipeline' ? 'Gerando...' : 'Pipeline Completo PDF'}
          </button>
        </div>

        {/* Sumário */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Total de Oportunidades</p>
            <p className="text-2xl font-bold">{oports.length}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Volume Total do Pipeline</p>
            <p className="text-2xl font-bold text-blue-400">R$ {totalPipeline.toLocaleString('pt-BR')}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Total Ganho</p>
            <p className="text-2xl font-bold text-green-400">R$ {totalGanhos.toLocaleString('pt-BR')}</p>
          </div>
        </div>

        {/* Filtro por estágio */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {['todos','prospecção','proposta','negociação','fechado_ganho','fechado_perdido'].map(e => (
            <button key={e} onClick={() => setFiltro(e)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition
                ${filtro === e ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
              {e}
            </button>
          ))}
        </div>

        {/* Tabela de oportunidades com PDF */}
        <div className="space-y-2">
          {filtradas.map(o => (
            <div key={o.id} className="bg-gray-800 rounded-xl p-4 flex items-center justify-between hover:bg-gray-750 transition">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className={`${COR[o.estagio] || 'bg-gray-600'} px-2 py-0.5 rounded-full text-xs`}>{o.estagio}</span>
                  <span className="font-semibold">{o.titulo}</span>
                </div>
                <p className="text-sm text-gray-400">{o.cliente_nome} · {o.empresa}</p>
                {o.data_fechamento && (
                  <p className="text-xs text-gray-500 mt-0.5">Prev. fechamento: {new Date(o.data_fechamento).toLocaleDateString('pt-BR')}</p>
                )}
              </div>

              <div className="flex items-center gap-4">
                <span className="text-green-400 font-mono font-semibold">R$ {Number(o.valor).toLocaleString('pt-BR')}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => baixarPDF('proposta', o.id)}
                    disabled={!!baixando}
                    title="Baixar Proposta PDF"
                    className="flex items-center gap-1 bg-gray-700 hover:bg-blue-600 disabled:opacity-50 px-3 py-1.5 rounded-lg text-xs transition">
                    <FileText size={12} />
                    {baixando === `proposta-${o.id}` ? '...' : 'Proposta'}
                  </button>
                  <button
                    onClick={() => baixarPDF('negociacao', o.lead_id)}
                    disabled={!!baixando}
                    title="Baixar Resumo da Negociação PDF"
                    className="flex items-center gap-1 bg-gray-700 hover:bg-purple-600 disabled:opacity-50 px-3 py-1.5 rounded-lg text-xs transition">
                    <Download size={12} />
                    {baixando === `negociacao-${o.lead_id}` ? '...' : 'Negociação'}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filtradas.length === 0 && (
            <p className="text-gray-500 text-center py-10">Nenhuma oportunidade neste estágio.</p>
          )}
        </div>
      </main>
    </div>
  )
}
