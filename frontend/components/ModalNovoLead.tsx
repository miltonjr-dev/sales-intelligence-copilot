'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import api from '../lib/api'

interface Props {
  onClose: () => void
  onSaved: () => void
}

export default function ModalNovoLead({ onClose, onSaved }: Props) {
  const [step, setStep] = useState(1)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [cliente, setCliente] = useState({ nome: '', empresa: '', email: '', telefone: '' })
  const [lead, setLead]       = useState({ origem: 'LinkedIn', status: 'novo', prioridade: '5', notas: '' })
  const [oport, setOport]     = useState({ titulo: '', valor: '', estagio: 'prospecção', data_fechamento: '' })

  const salvar = async () => {
    if (!cliente.nome) return setErro('Nome do cliente é obrigatório.')
    setSalvando(true); setErro('')
    try {
      // 1. Cria cliente
      const { data: cl } = await api.post('/clientes', cliente)
      // 2. Cria lead
      const { data: ld } = await api.post('/leads', { cliente_id: cl.id, ...lead })
      // 3. Cria oportunidade (se preenchida)
      if (oport.titulo) await api.post('/oportunidades', { lead_id: ld.id, ...oport })
      onSaved()
    } catch (e: any) {
      setErro(e?.response?.data?.erro || 'Erro ao salvar.')
    } finally { setSalvando(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-white">Novo Lead</h2>
            <p className="text-xs text-gray-500">Passo {step} de 3</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>

        {/* Progress */}
        <div className="flex px-6 pt-4 gap-2">
          {['Cliente','Lead','Oportunidade'].map((l, i) => (
            <div key={l} className="flex-1">
              <div className={`h-1.5 rounded-full ${step > i ? 'bg-blue-500' : 'bg-gray-700'}`} />
              <p className={`text-xs mt-1 ${step === i+1 ? 'text-blue-400' : 'text-gray-500'}`}>{l}</p>
            </div>
          ))}
        </div>

        <div className="px-6 py-5 space-y-3">
          {/* Passo 1: Cliente */}
          {step === 1 && <>
            <Input label="Nome *" value={cliente.nome} onChange={v => setCliente(s => ({...s, nome: v}))} />
            <Input label="Empresa" value={cliente.empresa} onChange={v => setCliente(s => ({...s, empresa: v}))} />
            <Input label="Email" type="email" value={cliente.email} onChange={v => setCliente(s => ({...s, email: v}))} />
            <Input label="Telefone" value={cliente.telefone} onChange={v => setCliente(s => ({...s, telefone: v}))} />
          </>}

          {/* Passo 2: Lead */}
          {step === 2 && <>
            <Select label="Origem" value={lead.origem} onChange={v => setLead(s => ({...s, origem: v}))}
              options={['LinkedIn','Indicação','Site','Evento','WhatsApp','Outros']} />
            <Select label="Status" value={lead.status} onChange={v => setLead(s => ({...s, status: v}))}
              options={['novo','contatado','qualificado','perdido']} />
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Prioridade: {lead.prioridade} / 10</label>
              <input type="range" min="1" max="10" value={lead.prioridade}
                onChange={e => setLead(s => ({...s, prioridade: e.target.value}))}
                className="w-full accent-blue-500" />
              <div className="flex justify-between text-xs text-gray-500"><span>Alta (1)</span><span>Baixa (10)</span></div>
            </div>
            <Textarea label="Notas" value={lead.notas} onChange={v => setLead(s => ({...s, notas: v}))} />
          </>}

          {/* Passo 3: Oportunidade (opcional) */}
          {step === 3 && <>
            <p className="text-xs text-gray-400 bg-gray-800 rounded-lg px-3 py-2">Opcional — crie uma oportunidade junto com o lead.</p>
            <Input label="Título da Oportunidade" value={oport.titulo} onChange={v => setOport(s => ({...s, titulo: v}))} />
            <Input label="Valor (R$)" type="number" value={oport.valor} onChange={v => setOport(s => ({...s, valor: v}))} />
            <Select label="Estágio" value={oport.estagio} onChange={v => setOport(s => ({...s, estagio: v}))}
              options={['prospecção','proposta','negociação','fechado_ganho','fechado_perdido']} />
            <Input label="Previsão de Fechamento" type="date" value={oport.data_fechamento} onChange={v => setOport(s => ({...s, data_fechamento: v}))} />
          </>}

          {erro && <p className="text-red-400 text-sm">{erro}</p>}
        </div>

        {/* Footer */}
        <div className="flex justify-between px-6 pb-5">
          <button onClick={() => step > 1 ? setStep(s => s-1) : onClose()}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition">
            {step === 1 ? 'Cancelar' : '← Anterior'}
          </button>
          {step < 3
            ? <button onClick={() => { if(!cliente.nome && step===1) return setErro('Nome obrigatório'); setErro(''); setStep(s => s+1) }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition">
                Próximo →
              </button>
            : <button onClick={salvar} disabled={salvando}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg text-sm font-semibold transition">
                {salvando ? 'Salvando...' : '✓ Salvar Lead'}
              </button>
          }
        </div>
      </div>
    </div>
  )
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs text-gray-400 mb-1 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
    </div>
  )
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="text-xs text-gray-400 mb-1 block">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs text-gray-400 mb-1 block">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={3}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" />
    </div>
  )
}
