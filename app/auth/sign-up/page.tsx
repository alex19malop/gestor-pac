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

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
          `${window.location.origin}/dashboard`,
      },
    })

    if (error) {
      setError("Error al crear la cuenta. Inténtelo de nuevo.")
      setLoading(false)
      return
    }

    router.push("/auth/sign-up-success")
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-lg shadow-xl border-2 border-border">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-20 h-20 bg-primary rounded-full flex items-center justify-center">
            <Sprout className="w-10 h-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold text-foreground">
            Crear Cuenta
          </CardTitle>
          <CardDescription className="text-xl text-muted-foreground">
            Regístrese para gestionar sus parcelas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-6">
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
                    placeholder="Mínimo 6 caracteres"
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
              <Field>
                <FieldLabel className="text-lg font-semibold">
                  Confirmar Contraseña
                </FieldLabel>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Repita su contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-14 text-lg px-4 border-2"
                />
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
              {loading ? "Creando cuenta..." : "Crear Cuenta"}
            </Button>

            <p className="text-center text-lg text-muted-foreground pt-4">
              ¿Ya tiene cuenta?{" "}
              <Link
                href="/auth/login"
                className="text-primary font-bold underline underline-offset-4 hover:text-primary/80"
              >
                Inicie sesión
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
