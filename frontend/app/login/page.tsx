'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '../../lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm]     = useState({ email: '', senha: '' })
  const [erro, setErro]     = useState('')
  const [loading, setLoading] = useState(false)

  const handle = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(''); setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      localStorage.setItem('token', data.token)
      localStorage.setItem('usuario', JSON.stringify(data.usuario))
      router.push('/dashboard')
    } catch {
      setErro('Email ou senha inválidos.')
    } finally {
      setLoading(false)
    }
  }

  const registrar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(''); setLoading(true)
    try {
      await api.post('/auth/register', { nome: 'Gestor', ...form })
      const { data } = await api.post('/auth/login', form)
      localStorage.setItem('token', data.token)
      localStorage.setItem('usuario', JSON.stringify(data.usuario))
      router.push('/dashboard')
    } catch {
      setErro('Erro ao criar conta. Email já cadastrado?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-950">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-blue-400">Sales Intelligence Copilot</h1>
          <p className="text-gray-500 text-sm mt-1">Acesse sua conta</p>
        </div>

        <form className="space-y-4">
          <input
            name="email" type="email" placeholder="Email"
            value={form.email} onChange={handle}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
          />
          <input
            name="senha" type="password" placeholder="Senha"
            value={form.senha} onChange={handle}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
          />

          {erro && <p className="text-red-400 text-sm">{erro}</p>}

          <div className="flex gap-3 pt-2">
            <button onClick={login} disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-3 rounded-lg font-semibold transition">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
            <button onClick={registrar} disabled={loading}
              className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 py-3 rounded-lg font-semibold transition">
              Criar conta
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
