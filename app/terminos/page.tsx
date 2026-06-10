import type { Metadata } from 'next'
import Link from 'next/link'
import PageLayout from '@/components/layout/PageLayout'

export const metadata: Metadata = {
  title: 'Términos y Condiciones | 4U Studio Academy',
  description: 'Términos y condiciones de inscripción de 4U Studio Academy. Conoce las políticas de asistencia, pagos, datos personales y uso de imagen.',
}

const ORANGE = '#ff7a00'

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold text-white font-poppins mb-4 flex items-baseline gap-2">
        <span style={{ color: ORANGE }} className="text-base font-black">{number}.</span>
        {title}
      </h2>
      <div className="space-y-3 text-white/65 text-sm font-roboto leading-relaxed">
        {children}
      </div>
    </section>
  )
}

function Clause({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p>
      <span className="text-white/30 font-semibold mr-2">{id}</span>
      {children}
    </p>
  )
}

export default function TerminosPage() {
  return (
    <PageLayout>
      <section className="relative w-full min-h-screen">
        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 10%, rgba(255,122,0,0.06), transparent 70%)' }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">

          {/* Encabezado */}
          <div className="mb-12 pb-8 border-b border-white/10">
            <p className="text-xs font-semibold uppercase tracking-widest font-roboto mb-3" style={{ color: ORANGE }}>
              Documento legal
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white font-poppins leading-tight mb-2">
              Términos y Condiciones
            </h1>
            <p className="text-white/40 text-sm font-roboto">4U Studio Academy — Academia de Formación Musical y Cultural</p>
            <div className="flex flex-wrap gap-4 mt-4 text-xs text-white/30 font-roboto">
              <span>Versión 2.0</span>
              <span>·</span>
              <span>Vigencia: Junio 2026</span>
              <span>·</span>
              <span>Bogotá, Colombia</span>
            </div>
          </div>

          {/* Secciones */}
          <Section number="1" title="Objeto">
            <p>
              El presente documento regula la relación académica entre <strong className="text-white/80">4U Studio Academy</strong> (en adelante, "la Academia") y el estudiante o su representante legal (en adelante, "el Estudiante"), en el marco de la prestación de servicios de formación musical. Establece las condiciones aplicables a la inscripción, la asistencia, los pagos, el uso de instalaciones, el tratamiento de datos personales y demás aspectos relacionados con el vínculo académico.
            </p>
            <p>
              Al completar el proceso de inscripción —ya sea de forma presencial o digital—, el Estudiante declara haber leído, comprendido y aceptado en su totalidad los presentes Términos y Condiciones.
            </p>
          </Section>

          <Section number="2" title="Inscripción y matrícula">
            <Clause id="2.1">Para formalizar la vinculación a cualquier programa ofrecido por la Academia, el Estudiante deberá completar el formulario de inscripción y realizar el pago de la matrícula dentro de los plazos establecidos.</Clause>
            <Clause id="2.2">La Academia se reserva el derecho de definir los cupos disponibles por programa, nivel e instructor. La inscripción no garantiza la asignación de un horario específico hasta tanto no sea confirmada formalmente por el equipo académico.</Clause>
            <Clause id="2.3">Los datos suministrados en el formulario de inscripción deben ser verídicos y actualizados. El Estudiante asume la responsabilidad de informar cualquier cambio relevante (número de contacto, correo electrónico, representante legal, entre otros).</Clause>
          </Section>

          <Section number="3" title="Asistencia y cancelación de clases">
            <Clause id="3.1"><strong className="text-white/70">Cancelación por parte del Estudiante.</strong> Las clases canceladas con menos de veinticuatro (24) horas de anticipación, o aquellas a las que el Estudiante no asista sin previo aviso, podrán considerarse como clases tomadas y serán descontadas del plan correspondiente.</Clause>
            <Clause id="3.2"><strong className="text-white/70">Cancelación por parte de la Academia o el instructor.</strong> Cuando la cancelación sea responsabilidad de la Academia o del instructor asignado, la clase será reprogramada sin costo adicional y no afectará los créditos, beneficios ni el historial académico del Estudiante.</Clause>
            <Clause id="3.3"><strong className="text-white/70">Canal de comunicación.</strong> Las solicitudes de cancelación o reprogramación deberán realizarse por los canales oficiales habilitados por la Academia (WhatsApp, correo electrónico o plataforma digital). No se aceptarán cancelaciones verbales no registradas.</Clause>
            <Clause id="3.4"><strong className="text-white/70">Inasistencia reiterada.</strong> La inasistencia injustificada de forma reiterada podrá generar la suspensión temporal del plan, sin que esto implique derecho a devolución de los valores pagados.</Clause>
          </Section>

          <Section number="4" title="Planes y vigencia">
            <Clause id="4.1">Los planes de formación ofrecidos por la Academia tienen una duración determinada según las condiciones acordadas al momento de la inscripción. La Academia informará al Estudiante los plazos de vigencia aplicables a su plan.</Clause>
            <Clause id="4.2">Las clases no tomadas dentro del período de vigencia del plan no podrán acumularse ni trasladarse a períodos posteriores, salvo autorización expresa de la Academia.</Clause>
            <Clause id="4.3">La renovación del plan deberá realizarse antes del vencimiento del período vigente. La Academia no garantiza la disponibilidad del mismo horario o instructor en caso de renovación tardía.</Clause>
            <Clause id="4.4">La Academia podrá suspender temporalmente la prestación del servicio ante incumplimientos reiterados de pago, sin responsabilidad por las clases no tomadas durante dicho período.</Clause>
          </Section>

          <Section number="5" title="Pagos y devoluciones">
            <Clause id="5.1"><strong className="text-white/70">Pagos.</strong> Los pagos deberán realizarse dentro de los plazos y mediante los métodos de pago establecidos por la Academia. El incumplimiento en el pago puede implicar la suspensión del servicio.</Clause>
            <Clause id="5.2"><strong className="text-white/70">Devoluciones.</strong> Las solicitudes de devolución deberán presentarse por los canales oficiales y estarán sujetas a las políticas vigentes informadas al Estudiante al momento de la inscripción.</Clause>
            <Clause id="5.3">No se realizarán devoluciones por clases no tomadas por decisión del Estudiante, ni por períodos de inasistencia injustificada.</Clause>
            <Clause id="5.4">En caso de cancelación del plan por causas imputables a la Academia, se procederá con el reembolso proporcional de los valores pagados y no ejecutados.</Clause>
          </Section>

          <Section number="6" title="Responsabilidades del Estudiante">
            <Clause id="6.1"><strong className="text-white/70">Conducta.</strong> El Estudiante deberá mantener en todo momento un comportamiento respetuoso hacia instructores, personal administrativo y demás participantes de la Academia. Conductas irrespetuosas, agresivas o que alteren el ambiente académico podrán dar lugar a la suspensión o cancelación de la inscripción, sin derecho a devolución.</Clause>
            <Clause id="6.2"><strong className="text-white/70">Uso de instalaciones e instrumentos.</strong> Los instrumentos, equipos e instalaciones de la Academia deberán utilizarse de forma responsable y conforme a las instrucciones del instructor. Los daños ocasionados por uso indebido o negligente podrán generar responsabilidad económica a cargo del Estudiante o su representante legal.</Clause>
            <Clause id="6.3"><strong className="text-white/70">Propiedad intelectual.</strong> Los materiales académicos, guías, partituras y contenidos suministrados por la Academia son de uso exclusivo del Estudiante y no podrán ser reproducidos, distribuidos ni comercializados sin autorización previa y escrita de la Academia.</Clause>
            <Clause id="6.4"><strong className="text-white/70">Puntualidad.</strong> El Estudiante deberá presentarse a sus clases con puntualidad. Los retrasos no darán derecho a extensión del tiempo de clase, salvo acuerdo con el instructor.</Clause>
          </Section>

          <Section number="7" title="Responsabilidades de la Academia">
            <Clause id="7.1">La Academia se compromete a prestar los servicios de formación con instructores calificados, en instalaciones adecuadas y con los recursos necesarios para el desarrollo del programa académico contratado.</Clause>
            <Clause id="7.2">Cuando por causas internas la Academia deba cancelar una clase, se informará al Estudiante con la mayor anticipación posible y se garantizará su reprogramación sin costo adicional.</Clause>
            <Clause id="7.3">La Academia mantendrá la confidencialidad de los datos personales del Estudiante conforme a lo establecido en la sección 8 del presente documento.</Clause>
            <Clause id="7.4">La Academia no se hace responsable por objetos de valor dejados en sus instalaciones ni por situaciones externas ajenas a su control (suspensiones de servicios públicos, emergencias, eventos de fuerza mayor, entre otros).</Clause>
          </Section>

          <Section number="8" title="Tratamiento de datos personales">
            <Clause id="8.1">Los datos personales recopilados durante el proceso de inscripción y durante la vigencia del vínculo académico serán tratados conforme a lo establecido en la <strong className="text-white/80">Ley 1581 de 2012</strong> (Régimen General de Protección de Datos Personales de Colombia) y sus decretos reglamentarios.</Clause>
            <Clause id="8.2">La información será utilizada exclusivamente para los fines académicos, administrativos y de comunicación institucional relacionados con los servicios contratados.</Clause>
            <Clause id="8.3">El titular de los datos podrá ejercer en cualquier momento sus derechos de consulta, actualización, rectificación y supresión, contactando a la Academia a través de sus canales oficiales.</Clause>
            <Clause id="8.4">La Academia no compartirá la información personal del Estudiante con terceros sin su consentimiento previo, salvo en los casos previstos por la ley.</Clause>
          </Section>

          <Section number="9" title="Uso de imagen y material audiovisual">
            <Clause id="9.1">El Estudiante autoriza expresamente a 4U Studio Academy para utilizar su imagen, voz y nombre en contenidos fotográficos y audiovisuales con fines institucionales, académicos y promocionales, incluyendo publicaciones en redes sociales, sitio web y material impreso de la Academia.</Clause>
            <Clause id="9.2">Esta autorización se otorga sin contraprestación económica y por tiempo indefinido, salvo revocación expresa.</Clause>
            <Clause id="9.3">El Estudiante podrá revocar esta autorización en cualquier momento mediante comunicación escrita dirigida a la Academia. Dicha revocación aplicará únicamente para el uso futuro de los contenidos, sin que la Academia esté obligada a retirar material ya publicado o difundido.</Clause>
            <Clause id="9.4">En el caso de menores de edad, la autorización deberá ser otorgada por su representante legal.</Clause>
          </Section>

          <Section number="10" title="Menores de edad">
            <Clause id="10.1">Cuando el Estudiante sea menor de dieciocho (18) años, la inscripción, aceptación de los presentes Términos y Condiciones, y todas las autorizaciones correspondientes deberán ser realizadas por su representante legal (padre, madre o tutor legalmente reconocido).</Clause>
            <Clause id="10.2">El representante legal asumirá la responsabilidad conjunta sobre el cumplimiento de las obligaciones derivadas del presente documento.</Clause>
            <Clause id="10.3">La Academia podrá solicitar documentos que acrediten la representación legal cuando lo considere necesario.</Clause>
          </Section>

          <Section number="11" title="Modificaciones de los términos">
            <Clause id="11.1">La Academia se reserva el derecho de modificar los presentes Términos y Condiciones en cualquier momento, siempre que lo considere necesario para el adecuado funcionamiento del servicio o por cambios normativos aplicables.</Clause>
            <Clause id="11.2">Las modificaciones serán comunicadas al Estudiante con un mínimo de quince (15) días calendario de anticipación, a través de los canales oficiales de la Academia (correo electrónico, WhatsApp o plataforma digital).</Clause>
            <Clause id="11.3">El uso continuado del servicio tras la comunicación de cambios implicará la aceptación de los nuevos términos. Si el Estudiante no está de acuerdo, podrá solicitar la cancelación de su plan conforme a lo establecido en la sección 5.</Clause>
          </Section>

          <Section number="12" title="Aceptación">
            <Clause id="12.1">La aceptación electrónica de los presentes Términos y Condiciones —mediante los sistemas digitales de inscripción de 4U Studio Academy— tiene la misma validez jurídica que una firma manuscrita, de conformidad con la <strong className="text-white/80">Ley 527 de 1999</strong> (Comercio Electrónico) y demás normas aplicables en Colombia.</Clause>
            <Clause id="12.2">Al completar el formulario de inscripción y marcar la casilla de aceptación, el Estudiante o su representante legal declara haber leído y comprendido en su totalidad los presentes Términos y Condiciones, aceptar las políticas de asistencia, cancelación, pagos y devoluciones, autorizar el tratamiento de sus datos personales y comprometerse a cumplir el reglamento interno y las normas de convivencia de la Academia.</Clause>
          </Section>

          {/* Footer del documento */}
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-white/25 text-xs font-roboto">
              4U Studio Academy · Bogotá, Colombia · contacto@4ustudioacademy.com
              <br />Versión 2.0 — Junio 2026
            </p>
            <Link
              href="/inscripcion"
              className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold text-white transition-all hover:brightness-110 shrink-0"
              style={{ backgroundColor: ORANGE }}
            >
              Inscribirme ahora
            </Link>
          </div>

        </div>
      </section>
    </PageLayout>
  )
}
