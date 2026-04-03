'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '../lib/api'
import Sidebar from '../components/Sidebar'

interface Lead {
  id: number; cliente_nome: string; empresa: string
  status: string; prioridade: number; temperatura: string
  dias_fechamento: number | null; criado_em: string
}
interface Metricas {
  total_leads: number; leads_qualificados: number
  oportunidades_ativas: number; pipeline_total: number
  taxa_conversao: number; ticket_medio: number
}
interface Hist { id: number; tipo: string; descricao: string; criado_em: string; cliente_nome?: string }

const TEMP_CONFIG: Record<string, { emoji: string; label: string; cor: string; bg: string }> = {
  quente: { emoji: '🔥', label: 'Quente',  cor: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30' },
  morno:  { emoji: '🌡️', label: 'Morno',   cor: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  frio:   { emoji: '🧊', label: 'Frio',    cor: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/30' },
}

export default function Home() {
  const router  = useRouter()
  const [logado, setLogado]   = useState(false)
  const [metricas, setMetricas] = useState<Metricas | null>(null)
  const [leads, setLeads]     = useState<Lead[]>([])
  const [hist, setHist]       = useState<Hist[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }
    setLogado(true)
    Promise.all([
      api.get('/metrics/resumo').then(r => setMetricas(r.data)).catch(() => {}),
      api.get('/leads').then(r => setLeads(r.data.slice(0, 8))).catch(() => {}),
      api.get('/historico/recentes').then(r => setHist(r.data.slice(0, 6))).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-blue-400 animate-pulse text-xl">⚡ Carregando...</div>
    </div>
  )

  // ── Página de login (não autenticado) ──────────────────────────────────────
  if (!logado) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950 flex flex-col items-center justify-center p-8">
      {/* Logo + título */}
      <div className="text-center mb-12">
        <div className="text-6xl mb-4">🚀</div>
        <h1 className="text-5xl font-black text-white mb-3 tracking-tight">
          Sales Intelligence <span className="text-blue-400">Copilot</span>
        </h1>
        <p className="text-gray-400 text-xl max-w-lg mx-auto">
          Gerencie leads, oportunidades e equipe com inteligência artificial
        </p>
      </div>

      {/* Cards de funcionalidades */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-3xl w-full">
        {[
          { icon: '🔥', title: 'Leads Quentes', desc: 'Priorize os que convertem' },
          { icon: '📊', title: 'Dashboard', desc: 'Métricas em tempo real' },
          { icon: '🤖', title: 'IA Integrada', desc: 'Resumos e sugestões' },
          { icon: '📄', title: 'PDFs Profissionais', desc: 'Propostas automáticas' },
        ].map(f => (
          <div key={f.title} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center backdrop-blur">
            <div className="text-3xl mb-2">{f.icon}</div>
            <div className="text-white font-semibold text-sm">{f.title}</div>
            <div className="text-gray-500 text-xs mt-1">{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Métricas fake para demonstração */}
      <div className="grid grid-cols-3 gap-6 mb-12 max-w-md w-full text-center">
        {[['1.200+','Leads Gerenciados'],['R$ 4,5M','Pipeline Rastreado'],['38%','Taxa de Conversão']].map(([v,l]) => (
          <div key={l}>
            <div className="text-3xl font-black text-blue-400">{v}</div>
            <div className="text-gray-500 text-xs mt-1">{l}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <Link href="/login"
          className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-lg transition shadow-lg shadow-blue-500/25">
          Entrar no Sistema →
        </Link>
        <Link href="/login?tab=register"
          className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-lg transition border border-white/20">
          Criar Conta
        </Link>
      </div>
      <p className="text-gray-600 text-xs mt-8">Projeto de Portfólio · Sales Intelligence Copilot v1.0</p>
    </div>
  )

  // ── Dashboard home (autenticado) ──────────────────────────────────────────
  const quentes = leads.filter(l => l.temperatura === 'quente')
  const mornos  = leads.filter(l => l.temperatura === 'morno')
  const frios   = leads.filter(l => l.temperatura === 'frio')

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <main className="ml-56 p-8 w-full">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white">Visão Geral</h1>
            <p className="text-gray-500 text-sm mt-1">{new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })}</p>
          </div>
          <Link href="/leads" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-semibold transition">
            + Novo Lead
          </Link>
        </div>

        {/* Métricas */}
        {metricas && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total de Leads',       val: metricas.total_leads,              icon: '👥', cor: 'text-blue-400' },
              { label: 'Oport. Ativas',        val: metricas.oportunidades_ativas,     icon: '💼', cor: 'text-yellow-400' },
              { label: 'Pipeline (R$)',        val: `R$ ${Number(metricas.pipeline_total || 0).toLocaleString('pt-BR')}`, icon: '💰', cor: 'text-green-400' },
              { label: 'Taxa de Conversão',    val: `${Number(metricas.taxa_conversao || 0).toFixed(1)}%`, icon: '📈', cor: 'text-purple-400' },
            ].map(m => (
              <div key={m.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="text-2xl mb-1">{m.icon}</div>
                <div className={`text-2xl font-black ${m.cor}`}>{m.val}</div>
                <div className="text-gray-500 text-xs mt-1">{m.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Termômetro de leads */}
          <div className="col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-5">🌡️ Termômetro de Leads</h2>

            {/* Contadores de temperatura */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { key: 'quente', lista: quentes },
                { key: 'morno',  lista: mornos  },
                { key: 'frio',   lista: frios   },
              ].map(({ key, lista }) => {
                const cfg = TEMP_CONFIG[key]
                return (
                  <div key={key} className={`${cfg.bg} border rounded-xl p-4 text-center`}>
                    <div className="text-3xl mb-1">{cfg.emoji}</div>
                    <div className={`text-2xl font-black ${cfg.cor}`}>{lista.length}</div>
                    <div className="text-gray-400 text-xs">{cfg.label}</div>
                  </div>
                )
              })}
            </div>

            {/* Lista de leads quentes / urgentes */}
            <div className="space-y-2">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Leads Prioritários</p>
              {leads.slice(0, 5).map(l => {
                const cfg = TEMP_CONFIG[l.temperatura] || TEMP_CONFIG.frio
                return (
                  <Link key={l.id} href={`/leads/${l.id}`}
                    className="flex items-center justify-between bg-gray-800/60 hover:bg-gray-800 border border-gray-700/50 rounded-xl px-4 py-3 transition group">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{cfg.emoji}</span>
                      <div>
                        <div className="text-sm font-semibold text-white group-hover:text-blue-400 transition">{l.cliente_nome}</div>
                        <div className="text-xs text-gray-500">{l.empresa}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {l.dias_fechamento !== null && l.dias_fechamento <= 30 && (
                        <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
                          ⏰ {Math.round(l.dias_fechamento)}d
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.cor}`}>{l.status}</span>
                      <span className="text-gray-600 text-xs">P{l.prioridade}</span>
                    </div>
                  </Link>
                )
              })}
              {leads.length === 0 && (
                <div className="text-center text-gray-600 py-8">
                  <div className="text-4xl mb-2">📭</div>
                  <p className="text-sm">Nenhum lead ainda.</p>
                  <Link href="/leads" className="text-blue-400 text-sm hover:underline mt-1 block">Criar primeiro lead →</Link>
                </div>
              )}
            </div>
          </div>

          {/* Atividade recente */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-5">📡 Atividade Recente</h2>
            <div className="space-y-3">
              {hist.length === 0 && <p className="text-gray-500 text-sm">Nenhuma atividade ainda.</p>}
              {hist.map(h => (
                <div key={h.id} className="flex gap-3 items-start">
                  <span className="text-lg mt-0.5">
                    {h.tipo==='ligação'?'📞':h.tipo==='email'?'📧':h.tipo==='reunião'?'🤝':h.tipo==='ia_resumo'?'🤖':'📝'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">{h.descricao}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{new Date(h.criado_em).toLocaleString('pt-BR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/leads" className="block text-center text-blue-400 text-xs mt-5 hover:underline">Ver todos →</Link>
          </div>
        </div>

        {/* Atalhos rápidos */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          {[
            { href: '/leads',        icon: '👥', title: 'Leads',        desc: 'Gerenciar leads' },
            { href: '/oportunidades',icon: '📋', title: 'Oportunidades', desc: 'Kanban de vendas' },
            { href: '/assistente',   icon: '🤖', title: 'Assistente IA', desc: 'Resumos e sugestões' },
            { href: '/relatorios',   icon: '📊', title: 'Relatórios',    desc: 'PDFs e exportações' },
          ].map(a => (
            <Link key={a.href} href={a.href}
              className="bg-gray-900 border border-gray-800 hover:border-blue-500/50 rounded-2xl p-5 transition group">
              <div className="text-3xl mb-2">{a.icon}</div>
              <div className="text-white font-semibold text-sm group-hover:text-blue-400 transition">{a.title}</div>
              <div className="text-gray-600 text-xs mt-0.5">{a.desc}</div>
            </Link>
          ))}
        </div>

      </main>
    </div>
  )
}
