'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '../../lib/api'
import Sidebar from '../../components/Sidebar'

const ACOES = [
  { key: 'resumir',        label: '📋 Resumir Negociação',       endpoint: '/ia/resumir',       campo: 'resumo'   },
  { key: 'proximo-passo',  label: '🎯 Sugerir Próximo Passo',    endpoint: '/ia/proximo-passo', campo: 'sugestao' },
  { key: 'urgencia',       label: '🚨 Classificar Urgência',     endpoint: '/ia/urgencia',      campo: 'urgencia' },
  { key: 'mensagem',       label: '✉️ Gerar Mensagem Comercial', endpoint: '/ia/mensagem',      campo: 'mensagem' },
]

export default function AssistentePage() {
  const router = useRouter()
  const [leadId,     setLeadId]     = useState('')
  const [objetivo,   setObjetivo]   = useState('')
  const [resultado,  setResultado]  = useState('')
  const [carregando, setCarregando] = useState(false)
  const [acaoAtiva,  setAcaoAtiva]  = useState('')

  useEffect(() => {
    if (!localStorage.getItem('token')) router.push('/login')
  }, [router])

  const executar = async (acao: typeof ACOES[0]) => {
    if (!leadId) return alert('Informe o ID do lead')
    setCarregando(true); setResultado(''); setAcaoAtiva(acao.label)
    try {
      const body: Record<string, string> = { lead_id: leadId }
      if (acao.key === 'mensagem') body.objetivo = objetivo
      const { data } = await api.post(acao.endpoint, body)
      setResultado(data[acao.campo] || JSON.stringify(data))
    } catch {
      setResultado('❌ Erro ao chamar a IA. Verifique se Ollama ou OpenAI está configurado.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-56 p-8 w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-blue-400 mb-6">Assistente de IA</h1>

        <div className="space-y-3 mb-6">
          <input
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
            placeholder="ID do Lead (ex: 1)"
            value={leadId}
            onChange={e => setLeadId(e.target.value)}
          />
          <input
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
            placeholder="Objetivo da mensagem (somente para 'Gerar Mensagem')"
            value={objetivo}
            onChange={e => setObjetivo(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {ACOES.map(a => (
            <button key={a.key} onClick={() => executar(a)} disabled={carregando}
              className="bg-gray-800 hover:bg-blue-600 border border-gray-700 hover:border-blue-500 disabled:opacity-50 px-4 py-3 rounded-lg text-sm font-medium transition text-left">
              {a.label}
            </button>
          ))}
        </div>

        {carregando && <p className="text-blue-400 animate-pulse text-sm">⏳ {acaoAtiva}...</p>}

        {resultado && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 whitespace-pre-wrap text-gray-200 text-sm leading-relaxed">
            <p className="text-xs text-gray-500 mb-2">{acaoAtiva}</p>
            {resultado}
          </div>
        )}
      </main>
    </div>
  )
}
