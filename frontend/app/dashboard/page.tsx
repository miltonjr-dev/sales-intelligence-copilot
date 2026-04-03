'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '../../lib/api'
import Sidebar from '../../components/Sidebar'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Users, Briefcase, Target } from 'lucide-react'

interface Resumo {
  total_leads: number
  ticket_medio: number
  taxa_conversao: number
  por_estagio: { estagio: string; quantidade: string; volume: string }[]
}
interface Lead {
  id: number; cliente_nome: string; empresa: string; status: string; prioridade: number; criado_em: string
}
interface Hist {
  id: number; tipo: string; descricao: string; criado_em: string
}

const META_MENSAL = 100000

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData]   = useState<Resumo | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [hist, setHist]   = useState<Hist[]>([])
  const [erro, setErro]   = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return }
    Promise.all([
      api.get('/metrics/resumo'),
      api.get('/leads'),
    ]).then(([mRes, lRes]) => {
      setData(mRes.data)
      const sorted = [...lRes.data].sort((a: Lead, b: Lead) => a.prioridade - b.prioridade)
      setLeads(sorted.slice(0, 5))
    }).catch(() => setErro(true))
  }, [router])

  if (erro) return (
    <div className="flex"><Sidebar />
      <main className="ml-56 p-8 text-red-400">Erro ao carregar métricas.</main>
    </div>
  )
  if (!data) return (
    <div className="flex"><Sidebar />
      <main className="ml-56 p-8 text-gray-400 animate-pulse">Carregando...</main>
    </div>
  )

  const pipeline = data.por_estagio.reduce((s, e) => s + Number(e.volume), 0)
  const ativas   = data.por_estagio.filter(e => !e.estagio.startsWith('fechado')).reduce((s, e) => s + Number(e.quantidade), 0)
  const progresso = Math.min((pipeline / META_MENSAL) * 100, 100)

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-56 p-8 space-y-8 w-full max-w-6xl">
        <h1 className="text-3xl font-bold text-blue-400">Dashboard</h1>

        {/* 4 metric cards */}
        <div className="grid grid-cols-4 gap-4">
          <MetricCard label="Total de Leads" value={String(data.total_leads)} icon={<Users size={20} className="text-blue-400" />} color="blue" />
          <MetricCard label="Oportunidades Ativas" value={String(ativas)} icon={<Briefcase size={20} className="text-yellow-400" />} color="yellow" />
          <MetricCard label="Pipeline Total" value={`R$ ${pipeline.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`} icon={<TrendingUp size={20} className="text-green-400" />} color="green" />
          <MetricCard label="Taxa de Conversão" value={`${Number(data.taxa_conversao || 0).toFixed(1)}%`} icon={<Target size={20} className="text-purple-400" />} color="purple" />
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Bar chart */}
          <div className="col-span-2 bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Funil de Vendas</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.por_estagio}>
                <XAxis dataKey="estagio" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px' }}
                  formatter={(v: number) => [v, 'Quantidade']} />
                <Bar dataKey="quantidade" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Meta mensal */}
          <div className="bg-gray-800 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-1">Meta Mensal</h2>
              <p className="text-xs text-gray-500 mb-4">Objetivo: R$ {META_MENSAL.toLocaleString('pt-BR')}</p>
              <div className="text-3xl font-bold text-green-400 mb-1">
                R$ {pipeline.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-gray-400 mb-4">{progresso.toFixed(1)}% da meta</p>
              <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-4 rounded-full transition-all duration-500 ${progresso >= 100 ? 'bg-green-500' : progresso >= 60 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                  style={{ width: `${progresso}%` }}
                />
              </div>
            </div>
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                {progresso >= 100 ? '🎉 Meta atingida!' : `Faltam R$ ${(META_MENSAL - pipeline).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Top 5 leads */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">🔥 Top 5 Leads por Prioridade</h2>
            {leads.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhum lead cadastrado.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs border-b border-gray-700">
                    <th className="pb-2 text-left">Cliente</th>
                    <th className="pb-2 text-left">Status</th>
                    <th className="pb-2 text-right">Prioridade</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map(l => (
                    <tr key={l.id} className="border-b border-gray-700/50 hover:bg-gray-750">
                      <td className="py-2 pr-2">
                        <p className="font-medium text-xs truncate max-w-[140px]">{l.cliente_nome}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[140px]">{l.empresa}</p>
                      </td>
                      <td className="py-2 pr-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${l.status === 'qualificado' ? 'bg-green-600' : l.status === 'perdido' ? 'bg-red-600' : l.status === 'contatado' ? 'bg-yellow-600' : 'bg-blue-600'}`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="py-2 text-right text-xs font-mono">{l.prioridade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Recent activity */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">⚡ Atividade Recente</h2>
            {hist.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhuma atividade registrada.</p>
            ) : (
              <div className="space-y-3">
                {hist.map(h => (
                  <div key={h.id} className="flex gap-3 text-sm">
                    <span className="text-xs bg-gray-700 px-2 py-0.5 rounded-full whitespace-nowrap h-fit mt-0.5">{h.tipo}</span>
                    <div>
                      <p className="text-gray-300 text-xs leading-snug line-clamp-2">{h.descricao}</p>
                      <p className="text-gray-600 text-xs mt-0.5">{new Date(h.criado_em).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function MetricCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  const border = color === 'blue' ? 'border-blue-500/30' : color === 'yellow' ? 'border-yellow-500/30' : color === 'green' ? 'border-green-500/30' : 'border-purple-500/30'
  return (
    <div className={`bg-gray-800 border ${border} rounded-xl p-5`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-400 text-xs">{label}</span>
        {icon}
      </div>
      <span className="text-2xl font-bold text-white">{value}</span>
    </div>
  )
}

