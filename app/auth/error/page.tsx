import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Sprout } from "lucide-react"

export default function AuthErrorPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-lg shadow-xl border-2 border-destructive text-center">
        <CardHeader className="space-y-4 pb-6">
          <div className="mx-auto w-20 h-20 bg-destructive rounded-full flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-destructive-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold text-foreground">
            Error de Autenticación
          </CardTitle>
          <CardDescription className="text-xl text-muted-foreground">
            Algo salió mal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg text-foreground">
            Hubo un problema al verificar su cuenta. 
            El enlace puede haber expirado o ya fue utilizado.
          </p>

          <div className="flex flex-col gap-4">
            <Button asChild className="w-full h-14 text-lg font-bold">
              <Link href="/auth/login">
                Intentar Iniciar Sesión
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full h-14 text-lg font-bold border-2">
              <Link href="/auth/sign-up">
                Crear Nueva Cuenta
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
