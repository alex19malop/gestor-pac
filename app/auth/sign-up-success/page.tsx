import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Sprout } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-lg shadow-xl border-2 border-border text-center">
        <CardHeader className="space-y-4 pb-6">
          <div className="mx-auto w-20 h-20 bg-primary rounded-full flex items-center justify-center">
            <Sprout className="w-10 h-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold text-foreground">
            ¡Cuenta Creada!
          </CardTitle>
          <CardDescription className="text-xl text-muted-foreground">
            Revise su correo electrónico
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 bg-secondary rounded-xl">
            <Mail className="w-12 h-12 mx-auto mb-4 text-primary" />
            <p className="text-lg text-foreground">
              Le hemos enviado un enlace de confirmación a su correo. 
              Haga clic en el enlace para activar su cuenta.
            </p>
          </div>
          
          <p className="text-muted-foreground text-lg">
            Si no ve el correo, revise la carpeta de spam.
          </p>

          <Button asChild className="w-full h-14 text-lg font-bold">
            <Link href="/auth/login">
              Volver a Iniciar Sesión
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
