import React from "react";
import "../styles/terms.css";

export default function Terminos() {
  return (
    <section className="tyc">
      <h1>Términos y Condiciones — Promociones y Sorteos GameZtorePremios</h1>

      <p>
        Estos términos regulan la participación en las promociones y sorteos organizados por
        <strong> GameZtorePremios</strong>, empresa dedicada a la comercialización de productos electrónicos y de computación.
      </p>

      {/* 1. Organización */}
      <details className="acc" open>
        <summary>1. Organización</summary>
        <div className="acc-body">
          <p>
            Los sorteos son organizados por <strong>GameZtorePremios</strong>. La dirección y datos de contacto
            oficiales estarán establecidos y disponibles en la página web de la empresa.
          </p>
        </div>
      </details>

      {/* 2. Participantes */}
      <details className="acc">
        <summary>2. Participantes</summary>
        <div className="acc-body">
          <p>Pueden participar personas mayores de 18 años con residencia en el territorio nacional.</p>
          <ul>
            <li>Quedan excluidos empleados, proveedores y familiares directos del organizador.</li>
            <li>Se anularán participaciones fraudulentas o automatizadas.</li>
          </ul>
        </div>
      </details>

      {/* 3. Vigencia */}
      <details className="acc">
        <summary>3. Vigencia de la promoción</summary>
        <div className="acc-body">
          <p>
            Cada promoción indicará fechas de inicio y cierre, zona horaria y condiciones específicas en su
            publicación oficial (web y/o redes del organizador).
          </p>
        </div>
      </details>

      {/* 4. Premios */}
      <details className="acc">
        <summary>4. Premios</summary>
        <div className="acc-body">
          <p>
            Los premios serán especificados con anterioridad en la publicación oficial de cada promoción o sorteo,
            indicando sus características técnicas, valor referencial y, de aplicar, condiciones de uso o canje
            (por ejemplo: cupones, vales o similares).
          </p>
          <p>
            En caso de falta de stock o discontinuación, el organizador podrá ofrecer un artículo de valor y
            prestaciones similares, lo cual se informará al ganador.
          </p>
        </div>
      </details>

      {/* 5. Mecanismo */}
      <details className="acc">
        <summary>5. Mecanismo de participación</summary>
        <div className="acc-body">
          <ul>
            <li>Adquirir un ticket por los canales oficiales y completar el registro en la plataforma.</li>
            <li>Cada ticket válido equivale a una (1) oportunidad, salvo que la promoción disponga otra mecánica.</li>
            <li>Se invalidarán registros con datos incompletos, ilegibles o inconsistentes.</li>
          </ul>
        </div>
      </details>

      {/* 6. Selección de ganadores */}
      <details className="acc">
        <summary>6. Selección de ganadores</summary>
        <div className="acc-body">
          <p>
            La selección será aleatoria entre tickets válidos, mediante herramientas digitales o método equivalente,
            conforme a las reglas publicadas para cada promoción.
          </p>
        </div>
      </details>

      {/* 7. Notificación y entrega */}
      <details className="acc">
        <summary>7. Notificación y entrega</summary>
        <div className="acc-body">
          <ul>
            <li>Se contactará al ganador con los datos de su registro; deberá responder en un plazo ≤ 72 horas.</li>
            <li>De no responder, se elegirá un suplente siguiendo el mismo procedimiento.</li>
            <li>
              La entrega podrá ser presencial o por envío. Tiempos y costos (si aplican) se informarán al ganador.
            </li>
          </ul>
        </div>
      </details>

      {/* 8. Garantía y soporte */}
      <details className="acc">
        <summary>8. Garantía y soporte</summary>
        <div className="acc-body">
          <p>
            Los productos cuentan con garantía del fabricante según sus políticas y centros autorizados. Para cupones
            o vales, aplican las condiciones del emisor. Artículos promocionales sin garantía serán informados en la publicación.
          </p>
        </div>
      </details>

      {/* 9. Términos de Seguridad */}
      <details className="acc">
        <summary>9. Términos de Seguridad</summary>
        <div className="acc-body">
          <ul>
            <li>
              <strong>Integridad de la plataforma:</strong> Prohibido acceder a áreas no autorizadas, evadir controles, inyectar código o realizar ingeniería inversa. Los intentos serán bloqueados y podrían ser reportados.
            </li>
            <li>
              <strong>Protección de datos:</strong> Se aplican medidas razonables (TLS/SSL, control de accesos, registros de auditoría). No se garantiza seguridad absoluta ante riesgos externos.
            </li>
            <li>
              <strong>Tickets y códigos:</strong> Son únicos e intransferibles. El participante debe custodiar los suyos. Tickets alterados, duplicados o comprometidos serán anulados.
            </li>
            <li>
              <strong>Pagos y comprobantes:</strong> Cuando corresponda, la verificación se cruza con la pasarela/emisor autorizado. Comprobantes inválidos o inconsistentes anulan la participación.
            </li>
            <li>
              <strong>Comunicación oficial:</strong> Solo se consideran válidas las comunicaciones desde los canales publicados en la web del organizador.
            </li>
            <li>
              <strong>Fraude y abuso:</strong> Se anularán participaciones con bots, suplantación, manipulación del sorteo o vulneraciones de seguridad. El organizador podrá iniciar acciones legales.
            </li>
            <li>
              <strong>Mantenimiento y disponibilidad:</strong> Podrán realizarse mantenimientos que afecten temporalmente la disponibilidad.
            </li>
          </ul>
        </div>
      </details>

      {/* 10. Modificaciones */}
      <details className="acc">
        <summary>10. Modificaciones</summary>
        <div className="acc-body">
          <p>El organizador podrá actualizar estos términos. Los cambios se publicarán en la web oficial.</p>
        </div>
      </details>

      {/* 11. Aceptación */}
      <details className="acc">
        <summary>11. Aceptación</summary>
        <div className="acc-body">
          <p>La participación implica la aceptación íntegra de estos Términos y Condiciones.</p>
        </div>
      </details>
    </section>
  );
}
