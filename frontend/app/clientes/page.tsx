'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '../../lib/api'
import Sidebar from '../../components/Sidebar'
import { Building2, Mail, Phone, Users, Briefcase, TrendingUp } from 'lucide-react'

interface Cliente {
  id: number
  nome: string
  empresa: string
  email: string
  telefone: string
  cidade?: string
  estado?: string
  segmento?: string
  criado_em: string
  total_leads: number
  total_oportunidades: number
  pipeline_total: number
}

export default function ClientesPage() {
  const router = useRouter()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return }
    api.get('/clientes')
      .then(r => setClientes(r.data))
      .catch(() => router.push('/login'))
      .finally(() => setCarregando(false))
  }, [router])

  const filtrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (c.empresa || '').toLowerCase().includes(busca.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(busca.toLowerCase())
  )

  const totalPipeline = clientes.reduce((s, c) => s + Number(c.pipeline_total), 0)

  if (carregando) return (
    <div className="flex"><Sidebar />
      <main className="ml-56 p-8 text-gray-400 animate-pulse">Carregando clientes...</main>
    </div>
  )

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-56 p-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-400">Clientes</h1>
            <p className="text-gray-500 text-sm">
              {clientes.length} clientes · Pipeline total:{' '}
              <span className="text-green-400 font-semibold">
                R$ {totalPipeline.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </p>
          </div>
        </div>

        <div className="mb-5">
          <input
            value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome, empresa ou email..."
            className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {filtrados.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-3">🏢</p>
            <p>Nenhum cliente encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700 text-left">
                  <th className="py-3 pr-4">Cliente</th>
                  <th className="py-3 pr-4">Empresa</th>
                  <th className="py-3 pr-4">Contato</th>
                  <th className="py-3 pr-4 text-center">Leads</th>
                  <th className="py-3 pr-4 text-center">Oportunidades</th>
                  <th className="py-3 pr-4 text-right">Pipeline</th>
                  <th className="py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(c => (
                  <tr key={c.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition">
                    <td className="py-3 pr-4">
                      <Link href={`/clientes/${c.id}`} className="font-medium hover:text-blue-400 transition">
                        {c.nome}
                      </Link>
                      {c.cidade && (
                        <p className="text-xs text-gray-500 mt-0.5">{c.cidade}{c.estado ? `, ${c.estado}` : ''}</p>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-gray-500 flex-shrink-0" />
                        <span className="text-gray-300">{c.empresa || '—'}</span>
                      </div>
                      {c.segmento && <p className="text-xs text-gray-500 mt-0.5 ml-5">{c.segmento}</p>}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1 text-gray-400 text-xs">
                        <Mail size={12} /> {c.email}
                      </div>
                      {c.telefone && (
                        <div className="flex items-center gap-1 text-gray-500 text-xs mt-0.5">
                          <Phone size={12} /> {c.telefone}
                        </div>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users size={13} className="text-blue-400" />
                        <span className="font-semibold">{c.total_leads}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Briefcase size={13} className="text-yellow-400" />
                        <span className="font-semibold">{c.total_oportunidades}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <TrendingUp size={13} className="text-green-400" />
                        <span className="text-green-400 font-mono text-sm font-semibold">
                          R$ {Number(c.pipeline_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <Link href={`/clientes/${c.id}`}
                        className="text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition">
                        Ver perfil
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
