"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Sprout, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError("Correo o contraseña incorrectos. Inténtelo de nuevo.")
      setLoading(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-lg shadow-xl border-2 border-border">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-20 h-20 bg-primary rounded-full flex items-center justify-center">
            <Sprout className="w-10 h-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold text-foreground">
            Gestor PAC
          </CardTitle>
          <CardDescription className="text-xl text-muted-foreground">
            Inicie sesión para gestionar sus parcelas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <FieldGroup>
              <Field>
                <FieldLabel className="text-lg font-semibold">
                  Correo electrónico
                </FieldLabel>
                <Input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-14 text-lg px-4 border-2"
                />
              </Field>
              <Field>
                <FieldLabel className="text-lg font-semibold">
                  Contraseña
                </FieldLabel>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Su contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-14 text-lg px-4 pr-14 border-2"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-6 w-6" />
                    ) : (
                      <Eye className="h-6 w-6" />
                    )}
                  </Button>
                </div>
              </Field>
            </FieldGroup>

            {error && (
              <div className="p-4 bg-destructive/10 border-2 border-destructive rounded-lg">
                <p className="text-lg text-destructive font-medium">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-16 text-xl font-bold"
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>

            <p className="text-center text-lg text-muted-foreground pt-4">
              ¿No tiene cuenta?{" "}
              <Link
                href="/auth/sign-up"
                className="text-primary font-bold underline underline-offset-4 hover:text-primary/80"
              >
                Regístrese aquí
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
