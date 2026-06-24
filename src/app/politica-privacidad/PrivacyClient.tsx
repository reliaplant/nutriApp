'use client';

import LegalLayout, { LegalSection } from '@/app/components/LegalLayout';
import { useTranslation } from '@/app/shared/useTranslation';

const sectionsEs: LegalSection[] = [
  { id: 'introduccion', title: '1. Introducción' },
  { id: 'datos', title: '2. Datos que recopilamos' },
  { id: 'uso', title: '3. Cómo usamos tus datos' },
  { id: 'compartir', title: '4. Con quién los compartimos' },
  { id: 'almacenamiento', title: '5. Almacenamiento y seguridad' },
  { id: 'derechos', title: '6. Tus derechos' },
  { id: 'cookies', title: '7. Cookies y rastreo' },
  { id: 'menores', title: '8. Menores de edad' },
  { id: 'cambios', title: '9. Cambios a esta política' },
  { id: 'contacto', title: '10. Contacto' },
];

const sectionsPt: LegalSection[] = [
  { id: 'introduccion', title: '1. Introdução' },
  { id: 'datos', title: '2. Dados que coletamos' },
  { id: 'uso', title: '3. Como usamos seus dados' },
  { id: 'compartir', title: '4. Com quem compartilhamos' },
  { id: 'almacenamiento', title: '5. Armazenamento e segurança' },
  { id: 'derechos', title: '6. Seus direitos' },
  { id: 'cookies', title: '7. Cookies e rastreamento' },
  { id: 'menores', title: '8. Menores de idade' },
  { id: 'cambios', title: '9. Alterações desta política' },
  { id: 'contacto', title: '10. Contato' },
];

function ContentEs() {
  return (
    <>
      <section id="introduccion">
        <h2>1. Introducción</h2>
        <p>
          En refeit (en adelante, &quot;nosotros&quot;, &quot;nuestro&quot; o &quot;la aplicación&quot;) respetamos tu privacidad
          y nos comprometemos a proteger los datos personales que tú y tus pacientes nos confían.
          Esta política describe cómo recopilamos, usamos, almacenamos y compartimos información,
          así como los derechos que te asisten conforme a las leyes aplicables (RGPD, LGPD y normativas
          locales).
        </p>
        <p>
          refeit se encuentra actualmente en <strong>fase beta</strong>. Durante este periodo el servicio
          puede cambiar y <strong>no se procesan pagos ni se recopilan datos de tarjetas</strong>.
        </p>
      </section>
      <section id="datos">
        <h2>2. Datos que recopilamos</h2>
        <p>Recopilamos las siguientes categorías de información:</p>
        <ul>
          <li><strong>Datos de cuenta del nutricionista:</strong> nombre, email, contraseña cifrada, foto de perfil, datos de contacto profesional.</li>
          <li><strong>Datos clínicos de pacientes:</strong> nombre, fecha de nacimiento, género, peso, altura, antropometría, objetivos nutricionales, historial de consultas, planes asignados, fotos de evolución, notas clínicas.</li>
          <li><strong>Datos de uso:</strong> páginas visitadas, acciones realizadas en la app, tiempo de sesión, dispositivo y navegador. Para medir esto usamos herramientas de analítica como Google Analytics y Google Tag Manager, y empleamos la información para mejorar el producto.</li>
          <li><strong>Datos de pago:</strong> durante la fase beta no recopilamos datos de pago. Cuando se activen los planes de pago, se procesarán a través de un proveedor de pagos certificado y no almacenaremos números de tarjeta en nuestros servidores.</li>
        </ul>
      </section>
      <section id="uso">
        <h2>3. Cómo usamos tus datos</h2>
        <p>Usamos los datos recopilados para:</p>
        <ul>
          <li>Proveer y mantener el servicio que has contratado.</li>
          <li>Generar planes nutricionales con asistencia de IA, cuando lo solicitas.</li>
          <li>Enviar notificaciones relevantes (recordatorios de citas, cambios en tu cuenta).</li>
          <li>Detectar y prevenir fraude, abuso y uso indebido.</li>
          <li>Cumplir con obligaciones legales y regulatorias.</li>
          <li>Mejorar el producto mediante análisis agregado y anonimizado.</li>
        </ul>
      </section>
      <section id="compartir">
        <h2>4. Con quién los compartimos</h2>
        <p><strong>No vendemos tus datos.</strong> Compartimos información solo con proveedores esenciales para operar el servicio:</p>
        <ul>
          <li><strong>Firebase / Google Cloud:</strong> almacenamiento y autenticación.</li>
          <li><strong>Google (Analytics y Tag Manager):</strong> medición de uso de forma agregada para mejorar el producto.</li>
          <li><strong>Proveedores de IA (p. ej. OpenAI):</strong> generación de planes con IA. Solo se envían los datos necesarios para generar el plan.</li>
          <li><strong>Proveedor de pagos (p. ej. Stripe):</strong> procesamiento de pagos cuando se activen los planes de pago (no durante la beta).</li>
          <li><strong>Autoridades:</strong> cuando una orden judicial válida así lo requiera.</li>
        </ul>
      </section>
      <section id="almacenamiento">
        <h2>5. Almacenamiento y seguridad</h2>
        <p>Los datos se almacenan en servidores de Google Cloud localizados en regiones con altos estándares de protección. Aplicamos cifrado en tránsito (TLS 1.3) y en reposo (AES-256), control de acceso por roles, auditoría continua y backups diarios.</p>
        <p>Conservamos la información mientras tu cuenta esté activa y hasta 30 días después de su cancelación, excepto cuando una obligación legal exija un periodo mayor.</p>
      </section>
      <section id="derechos">
        <h2>6. Tus derechos</h2>
        <p>Como titular de los datos tienes derecho a:</p>
        <ul>
          <li><strong>Acceder</strong> a la información que tenemos sobre ti.</li>
          <li><strong>Rectificar</strong> datos inexactos o incompletos.</li>
          <li><strong>Eliminar</strong> tu cuenta y los datos asociados.</li>
          <li><strong>Portabilidad:</strong> recibir tus datos en un formato estructurado.</li>
          <li><strong>Oponerte</strong> al tratamiento o limitarlo.</li>
        </ul>
        <p>Para ejercer cualquiera de estos derechos, escríbenos a <a href="mailto:privacidad@refeit.com">privacidad@refeit.com</a>.</p>
      </section>
      <section id="cookies">
        <h2>7. Cookies y rastreo</h2>
        <p>Usamos cookies estrictamente necesarias para el funcionamiento del servicio (sesión, preferencias de idioma) y cookies analíticas de Google Analytics y Google Tag Manager para entender el uso de forma agregada. No usamos cookies publicitarias ni vendemos datos a terceros con fines de perfilamiento.</p>
      </section>
      <section id="menores">
        <h2>8. Menores de edad</h2>
        <p>refeit no está dirigida directamente a menores de 16 años. Cuando un nutricionista gestiona el plan de un menor, el responsable legal del menor debe haber otorgado su consentimiento al nutricionista para el tratamiento de los datos.</p>
      </section>
      <section id="cambios">
        <h2>9. Cambios a esta política</h2>
        <p>Podemos actualizar esta política periódicamente. Si los cambios son sustanciales, te notificaremos por email con al menos 30 días de antelación. La fecha de última actualización aparece al inicio de este documento.</p>
      </section>
      <section id="contacto">
        <h2>10. Contacto</h2>
        <p>Si tienes preguntas, dudas o reclamaciones sobre esta política, puedes escribirnos a <a href="mailto:privacidad@refeit.com">privacidad@refeit.com</a>. Responderemos en un plazo máximo de 30 días.</p>
      </section>
    </>
  );
}

function ContentPt() {
  return (
    <>
      <section id="introduccion">
        <h2>1. Introdução</h2>
        <p>Na refeit (doravante, &quot;nós&quot;, &quot;nosso&quot; ou &quot;o aplicativo&quot;) respeitamos sua privacidade e nos comprometemos a proteger os dados pessoais que você e seus pacientes nos confiam. Esta política descreve como coletamos, usamos, armazenamos e compartilhamos informações, bem como os direitos que lhe assistem conforme as leis aplicáveis (LGPD, RGPD e normativas locais).</p>
        <p>A refeit está atualmente em <strong>fase beta</strong>. Durante este período o serviço pode mudar e <strong>não são processados pagamentos nem coletados dados de cartão</strong>.</p>
      </section>
      <section id="datos">
        <h2>2. Dados que coletamos</h2>
        <p>Coletamos as seguintes categorias de informação:</p>
        <ul>
          <li><strong>Dados de conta do nutricionista:</strong> nome, e-mail, senha criptografada, foto de perfil, dados de contato profissional.</li>
          <li><strong>Dados clínicos de pacientes:</strong> nome, data de nascimento, gênero, peso, altura, antropometria, objetivos nutricionais, histórico de consultas, planos atribuídos, fotos de evolução, notas clínicas.</li>
          <li><strong>Dados de uso:</strong> páginas visitadas, ações realizadas no app, tempo de sessão, dispositivo e navegador. Para medir isso usamos ferramentas de analítica como Google Analytics e Google Tag Manager, e empregamos a informação para melhorar o produto.</li>
          <li><strong>Dados de pagamento:</strong> durante a fase beta não coletamos dados de pagamento. Quando os planos pagos forem ativados, serão processados por um provedor de pagamentos certificado e não armazenaremos números de cartão em nossos servidores.</li>
        </ul>
      </section>
      <section id="uso">
        <h2>3. Como usamos seus dados</h2>
        <p>Usamos os dados coletados para:</p>
        <ul>
          <li>Prover e manter o serviço contratado.</li>
          <li>Gerar planos nutricionais com assistência de IA, quando solicitado.</li>
          <li>Enviar notificações relevantes (lembretes de consultas, alterações na conta).</li>
          <li>Detectar e prevenir fraude, abuso e uso indevido.</li>
          <li>Cumprir obrigações legais e regulatórias.</li>
          <li>Melhorar o produto por meio de análise agregada e anonimizada.</li>
        </ul>
      </section>
      <section id="compartir">
        <h2>4. Com quem compartilhamos</h2>
        <p><strong>Não vendemos seus dados.</strong> Compartilhamos informações somente com provedores essenciais para operar o serviço:</p>
        <ul>
          <li><strong>Firebase / Google Cloud:</strong> armazenamento e autenticação.</li>
          <li><strong>Google (Analytics e Tag Manager):</strong> medição de uso de forma agregada para melhorar o produto.</li>
          <li><strong>Provedores de IA (p. ex. OpenAI):</strong> geração de planos com IA. São enviados apenas os dados necessários para gerar o plano.</li>
          <li><strong>Provedor de pagamentos (p. ex. Stripe):</strong> processamento de pagamentos quando os planos pagos forem ativados (não durante a beta).</li>
          <li><strong>Autoridades:</strong> quando uma ordem judicial válida assim exigir.</li>
        </ul>
      </section>
      <section id="almacenamiento">
        <h2>5. Armazenamento e segurança</h2>
        <p>Os dados são armazenados em servidores Google Cloud localizados em regiões com altos padrões de proteção. Aplicamos criptografia em trânsito (TLS 1.3) e em repouso (AES-256), controle de acesso por papéis, auditoria contínua e backups diários.</p>
        <p>Conservamos as informações enquanto sua conta estiver ativa e por até 30 dias após o cancelamento, exceto quando uma obrigação legal exigir um período maior.</p>
      </section>
      <section id="derechos">
        <h2>6. Seus direitos</h2>
        <p>Como titular dos dados você tem direito a:</p>
        <ul>
          <li><strong>Acessar</strong> as informações que temos sobre você.</li>
          <li><strong>Retificar</strong> dados inexatos ou incompletos.</li>
          <li><strong>Excluir</strong> sua conta e os dados associados.</li>
          <li><strong>Portabilidade:</strong> receber seus dados em um formato estruturado.</li>
          <li><strong>Opor-se</strong> ao tratamento ou limitá-lo.</li>
        </ul>
        <p>Para exercer qualquer destes direitos, escreva-nos para <a href="mailto:privacidad@refeit.com">privacidad@refeit.com</a>.</p>
      </section>
      <section id="cookies">
        <h2>7. Cookies e rastreamento</h2>
        <p>Usamos cookies estritamente necessários para o funcionamento do serviço (sessão, preferências de idioma) e cookies analíticos do Google Analytics e Google Tag Manager para entender o uso de forma agregada. Não usamos cookies publicitários nem vendemos dados a terceiros com fins de perfilamento.</p>
      </section>
      <section id="menores">
        <h2>8. Menores de idade</h2>
        <p>A refeit não é direcionada diretamente a menores de 16 anos. Quando um nutricionista gerencia o plano de um menor, o responsável legal do menor deve ter dado seu consentimento ao nutricionista para o tratamento dos dados.</p>
      </section>
      <section id="cambios">
        <h2>9. Alterações desta política</h2>
        <p>Podemos atualizar esta política periodicamente. Se as alterações forem substanciais, notificaremos por e-mail com pelo menos 30 dias de antecedência. A data da última atualização aparece no início deste documento.</p>
      </section>
      <section id="contacto">
        <h2>10. Contato</h2>
        <p>Se tiver dúvidas ou reclamações sobre esta política, escreva-nos para <a href="mailto:privacidad@refeit.com">privacidad@refeit.com</a>. Responderemos em até 30 dias.</p>
      </section>
    </>
  );
}

export default function PrivacyClient() {
  const { t, lang } = useTranslation();
  const sections = lang === 'pt' ? sectionsPt : sectionsEs;
  return (
    <LegalLayout
      title={t('legal.privacy.title')}
      subtitle={t('legal.privacy.subtitle')}
      lastUpdated={t('legal.privacy.date')}
      sections={sections}
    >
      {lang === 'pt' ? <ContentPt /> : <ContentEs />}
    </LegalLayout>
  );
}
