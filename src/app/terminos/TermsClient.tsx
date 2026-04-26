'use client';

import LegalLayout, { LegalSection } from '@/app/components/LegalLayout';
import { useTranslation } from '@/app/shared/useTranslation';

const sectionsEs: LegalSection[] = [
  { id: 'aceptacion', title: '1. Aceptación de los términos' },
  { id: 'servicio', title: '2. Descripción del servicio' },
  { id: 'cuenta', title: '3. Cuenta y responsabilidades' },
  { id: 'planes', title: '4. Planes y pagos' },
  { id: 'usoaceptable', title: '5. Uso aceptable' },
  { id: 'propiedad', title: '6. Propiedad intelectual' },
  { id: 'contenido', title: '7. Contenido del usuario' },
  { id: 'ia', title: '8. Funciones de IA' },
  { id: 'limitacion', title: '9. Limitación de responsabilidad' },
  { id: 'terminacion', title: '10. Terminación' },
  { id: 'ley', title: '11. Ley aplicable' },
  { id: 'contacto', title: '12. Contacto' },
];

const sectionsPt: LegalSection[] = [
  { id: 'aceptacion', title: '1. Aceitação dos termos' },
  { id: 'servicio', title: '2. Descrição do serviço' },
  { id: 'cuenta', title: '3. Conta e responsabilidades' },
  { id: 'planes', title: '4. Planos e pagamentos' },
  { id: 'usoaceptable', title: '5. Uso aceitável' },
  { id: 'propiedad', title: '6. Propriedade intelectual' },
  { id: 'contenido', title: '7. Conteúdo do usuário' },
  { id: 'ia', title: '8. Funções de IA' },
  { id: 'limitacion', title: '9. Limitação de responsabilidade' },
  { id: 'terminacion', title: '10. Encerramento' },
  { id: 'ley', title: '11. Lei aplicável' },
  { id: 'contacto', title: '12. Contato' },
];

function ContentEs() {
  return (
    <>
      <section id="aceptacion">
        <h2>1. Aceptación de los términos</h2>
        <p>Al acceder, registrarse o utilizar refeit (en adelante, &quot;el servicio&quot;), aceptas quedar obligado por estos Términos de uso, así como por la <a href="/politica-privacidad">Política de privacidad</a>. Si no estás de acuerdo con alguno de los términos, debes abstenerte de usar el servicio.</p>
      </section>
      <section id="servicio">
        <h2>2. Descripción del servicio</h2>
        <p>refeit es una plataforma de software como servicio (SaaS) dirigida a profesionales de la nutrición, que permite gestionar pacientes, crear planes nutricionales, mantener un recetario, agendar citas y dar seguimiento a la evolución de cada paciente.</p>
        <p>El servicio <strong>no constituye consejo médico</strong>. Todas las decisiones clínicas son responsabilidad exclusiva del profesional que utiliza la herramienta.</p>
      </section>
      <section id="cuenta">
        <h2>3. Cuenta y responsabilidades</h2>
        <ul>
          <li>Debes ser mayor de edad y profesional habilitado en tu jurisdicción.</li>
          <li>Eres responsable de la veracidad de los datos proporcionados al registrarte.</li>
          <li>Eres responsable de mantener segura tu contraseña y de toda actividad realizada en tu cuenta.</li>
          <li>Debes notificarnos de inmediato cualquier uso no autorizado de tu cuenta.</li>
          <li>Garantizas haber obtenido el consentimiento de tus pacientes para el tratamiento de sus datos.</li>
        </ul>
      </section>
      <section id="planes">
        <h2>4. Planes y pagos</h2>
        <p>refeit ofrece un plan gratuito con funcionalidades limitadas y planes de pago con funcionalidades avanzadas. Los precios se publican en la página de precios y pueden modificarse con un preaviso de 30 días.</p>
        <ul>
          <li>La facturación es mensual o anual, según elijas.</li>
          <li>Los pagos se procesan de forma segura mediante Stripe.</li>
          <li>Puedes cancelar en cualquier momento. La cancelación surte efecto al final del periodo facturado.</li>
          <li>No realizamos reembolsos por periodos parciales, salvo obligación legal.</li>
        </ul>
      </section>
      <section id="usoaceptable">
        <h2>5. Uso aceptable</h2>
        <p>Te comprometes a no:</p>
        <ul>
          <li>Usar el servicio para actividades ilegales o fraudulentas.</li>
          <li>Intentar acceder a cuentas o datos que no te pertenecen.</li>
          <li>Realizar ingeniería inversa, descompilar o intentar extraer el código fuente.</li>
          <li>Sobrecargar la infraestructura mediante automatizaciones, scraping o ataques.</li>
          <li>Revender, sublicenciar o redistribuir el servicio sin autorización escrita.</li>
        </ul>
      </section>
      <section id="propiedad">
        <h2>6. Propiedad intelectual</h2>
        <p>El software, marca, logos, diseños y contenidos originales de refeit son propiedad exclusiva de sus titulares y están protegidos por las leyes de propiedad intelectual. Te otorgamos una licencia limitada, no exclusiva e intransferible para usar el servicio conforme a estos términos.</p>
      </section>
      <section id="contenido">
        <h2>7. Contenido del usuario</h2>
        <p>Conservas la propiedad de los datos clínicos, planes, recetas y demás contenido que generes en el servicio. Nos otorgas una licencia limitada únicamente para almacenar, procesar y mostrar dicho contenido en el ámbito necesario para prestarte el servicio.</p>
        <p>Eres responsable de tener copias de respaldo de la información crítica.</p>
      </section>
      <section id="ia">
        <h2>8. Funciones de IA</h2>
        <p>refeit ofrece funciones asistidas por inteligencia artificial (generación de planes, sugerencias de recetas). Los resultados son <strong>orientativos</strong> y deben ser revisados por el profesional antes de ser entregados al paciente. No nos hacemos responsables de errores, omisiones o inadecuaciones derivadas de su uso sin supervisión.</p>
      </section>
      <section id="limitacion">
        <h2>9. Limitación de responsabilidad</h2>
        <p>En la máxima medida permitida por la ley, refeit no será responsable de daños indirectos, incidentales, especiales o consecuentes derivados del uso o la imposibilidad de usar el servicio. Nuestra responsabilidad total no excederá las cantidades pagadas por ti durante los 12 meses anteriores al hecho que dio origen al reclamo.</p>
      </section>
      <section id="terminacion">
        <h2>10. Terminación</h2>
        <p>Podemos suspender o cancelar tu cuenta si infringes estos términos, con o sin previo aviso, según la gravedad. Tú puedes cancelar en cualquier momento desde tu perfil. Tras la cancelación, conservaremos tus datos durante 30 días por si decides reactivar la cuenta.</p>
      </section>
      <section id="ley">
        <h2>11. Ley aplicable</h2>
        <p>Estos términos se rigen por las leyes del país de constitución de la sociedad titular del servicio. Cualquier disputa será sometida a los tribunales competentes de dicha jurisdicción, salvo cuando una norma imperativa de protección al consumidor disponga lo contrario.</p>
      </section>
      <section id="contacto">
        <h2>12. Contacto</h2>
        <p>Para preguntas sobre estos términos, escríbenos a <a href="mailto:legal@refeit.app">legal@refeit.app</a>.</p>
      </section>
    </>
  );
}

function ContentPt() {
  return (
    <>
      <section id="aceptacion">
        <h2>1. Aceitação dos termos</h2>
        <p>Ao acessar, cadastrar-se ou utilizar a refeit (doravante, &quot;o serviço&quot;), você concorda em ficar vinculado a estes Termos de uso, bem como à <a href="/politica-privacidad">Política de privacidade</a>. Se não concordar com algum dos termos, deverá abster-se de usar o serviço.</p>
      </section>
      <section id="servicio">
        <h2>2. Descrição do serviço</h2>
        <p>A refeit é uma plataforma de software como serviço (SaaS) destinada a profissionais de nutrição, que permite gerenciar pacientes, criar planos nutricionais, manter um receituário, agendar consultas e acompanhar a evolução de cada paciente.</p>
        <p>O serviço <strong>não constitui aconselhamento médico</strong>. Todas as decisões clínicas são de responsabilidade exclusiva do profissional que utiliza a ferramenta.</p>
      </section>
      <section id="cuenta">
        <h2>3. Conta e responsabilidades</h2>
        <ul>
          <li>Você deve ser maior de idade e profissional habilitado em sua jurisdição.</li>
          <li>É responsável pela veracidade dos dados fornecidos no cadastro.</li>
          <li>É responsável por manter sua senha segura e por toda atividade realizada em sua conta.</li>
          <li>Deve nos notificar imediatamente sobre qualquer uso não autorizado da conta.</li>
          <li>Garante ter obtido o consentimento de seus pacientes para o tratamento dos dados.</li>
        </ul>
      </section>
      <section id="planes">
        <h2>4. Planos e pagamentos</h2>
        <p>A refeit oferece um plano gratuito com funcionalidades limitadas e planos pagos com funcionalidades avançadas. Os preços são publicados na página de preços e podem ser alterados com aviso prévio de 30 dias.</p>
        <ul>
          <li>O faturamento é mensal ou anual, conforme sua escolha.</li>
          <li>Os pagamentos são processados de forma segura via Stripe.</li>
          <li>Você pode cancelar a qualquer momento. O cancelamento entra em vigor ao fim do período faturado.</li>
          <li>Não realizamos reembolsos por períodos parciais, exceto obrigação legal.</li>
        </ul>
      </section>
      <section id="usoaceptable">
        <h2>5. Uso aceitável</h2>
        <p>Você se compromete a não:</p>
        <ul>
          <li>Usar o serviço para atividades ilegais ou fraudulentas.</li>
          <li>Tentar acessar contas ou dados que não lhe pertencem.</li>
          <li>Realizar engenharia reversa, descompilar ou tentar extrair o código-fonte.</li>
          <li>Sobrecarregar a infraestrutura via automações, scraping ou ataques.</li>
          <li>Revender, sublicenciar ou redistribuir o serviço sem autorização por escrito.</li>
        </ul>
      </section>
      <section id="propiedad">
        <h2>6. Propriedade intelectual</h2>
        <p>O software, marca, logos, designs e conteúdos originais da refeit são de propriedade exclusiva de seus titulares e estão protegidos pelas leis de propriedade intelectual. Concedemos a você uma licença limitada, não exclusiva e intransferível para usar o serviço conforme estes termos.</p>
      </section>
      <section id="contenido">
        <h2>7. Conteúdo do usuário</h2>
        <p>Você mantém a propriedade dos dados clínicos, planos, receitas e demais conteúdos gerados no serviço. Concede-nos uma licença limitada apenas para armazenar, processar e exibir tais conteúdos no escopo necessário para prestar o serviço.</p>
        <p>Você é responsável por manter cópias de backup das informações críticas.</p>
      </section>
      <section id="ia">
        <h2>8. Funções de IA</h2>
        <p>A refeit oferece funções assistidas por inteligência artificial (geração de planos, sugestões de receitas). Os resultados são <strong>orientativos</strong> e devem ser revisados pelo profissional antes de serem entregues ao paciente. Não nos responsabilizamos por erros, omissões ou inadequações decorrentes de uso sem supervisão.</p>
      </section>
      <section id="limitacion">
        <h2>9. Limitação de responsabilidade</h2>
        <p>Na medida máxima permitida por lei, a refeit não será responsável por danos indiretos, incidentais, especiais ou consequentes decorrentes do uso ou da impossibilidade de uso do serviço. Nossa responsabilidade total não excederá os valores pagos por você nos 12 meses anteriores ao fato que deu origem à reclamação.</p>
      </section>
      <section id="terminacion">
        <h2>10. Encerramento</h2>
        <p>Podemos suspender ou cancelar sua conta caso você descumpra estes termos, com ou sem aviso prévio, conforme a gravidade. Você pode cancelar a qualquer momento pelo seu perfil. Após o cancelamento, conservaremos seus dados por 30 dias caso decida reativar a conta.</p>
      </section>
      <section id="ley">
        <h2>11. Lei aplicável</h2>
        <p>Estes termos são regidos pelas leis do país de constituição da sociedade titular do serviço. Qualquer disputa será submetida aos tribunais competentes dessa jurisdição, salvo quando norma imperativa de proteção ao consumidor dispuser de outra forma.</p>
      </section>
      <section id="contacto">
        <h2>12. Contato</h2>
        <p>Para perguntas sobre estes termos, escreva-nos para <a href="mailto:legal@refeit.app">legal@refeit.app</a>.</p>
      </section>
    </>
  );
}

export default function TermsClient() {
  const { t, lang } = useTranslation();
  const sections = lang === 'pt' ? sectionsPt : sectionsEs;
  return (
    <LegalLayout
      title={t('legal.terms.title')}
      subtitle={t('legal.terms.subtitle')}
      lastUpdated={t('legal.terms.date')}
      sections={sections}
    >
      {lang === 'pt' ? <ContentPt /> : <ContentEs />}
    </LegalLayout>
  );
}
