import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRotateRight,
  faCalendarDay,
  faEnvelope,
  faLocationDot,
  faPhone,
} from '@fortawesome/free-solid-svg-icons';
import styles from '../page.module.css';

const FILTERS = [
  { id: 'all', label: 'Todas' },
  { id: 'new', label: 'Nuevas' },
  { id: 'contacted', label: 'Contactadas' },
  { id: 'closed', label: 'Cerradas' },
];

const STATUS_LABELS = {
  new: 'Nueva',
  contacted: 'Contactada',
  closed: 'Cerrada',
};

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const formatEventDate = (value) => {
  if (!value) return 'Por definir';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' }).format(date);
};

const getWhatsAppUrl = (phone, name) => {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (!digits) return '';
  const internationalNumber = digits.length === 10 ? `52${digits}` : digits;
  return `https://wa.me/${internationalNumber}?text=${encodeURIComponent(
    `Hola ${name}, recibimos tu solicitud de contratación para Fragmentado.`,
  )}`;
};

export default function InquiriesSection({
  inquiries,
  loading,
  error,
  updatingId,
  onRefresh,
  onStatusChange,
}) {
  const [filter, setFilter] = useState('all');
  const filtered = useMemo(
    () => inquiries.filter((inquiry) => filter === 'all' || inquiry.status === filter),
    [filter, inquiries],
  );
  const counts = useMemo(
    () => ({
      all: inquiries.length,
      new: inquiries.filter((item) => item.status === 'new').length,
      contacted: inquiries.filter((item) => item.status === 'contacted').length,
      closed: inquiries.filter((item) => item.status === 'closed').length,
    }),
    [inquiries],
  );

  return (
    <div className={styles.inquiriesSection}>
      <div className={styles.sectionTitleRow}>
        <div>
          <p className={styles.sectionEyebrow}>Contrataciones</p>
          <h2>Solicitudes</h2>
          <p className={styles.editorHint}>
            Da seguimiento a los mensajes recibidos desde el sitio oficial.
          </p>
        </div>
        <button type="button" className={styles.inquiriesRefresh} onClick={onRefresh} disabled={loading}>
          <FontAwesomeIcon icon={faArrowRotateRight} aria-hidden="true" />
          {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      <div className={styles.inquiryFilters} role="tablist" aria-label="Filtrar solicitudes">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            className={filter === item.id ? styles.inquiryFilterActive : styles.inquiryFilter}
            onClick={() => setFilter(item.id)}
          >
            {item.label} <span>{counts[item.id]}</span>
          </button>
        ))}
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
      {!loading && !filtered.length ? (
        <div className={styles.inquiriesEmpty}>
          <strong>No hay solicitudes en esta categoría.</strong>
          <p>Los nuevos mensajes de contrataciones aparecerán aquí.</p>
        </div>
      ) : null}

      <div className={styles.inquiryList}>
        {filtered.map((inquiry) => {
          const whatsappUrl = getWhatsAppUrl(inquiry.phone, inquiry.name);
          const emailSubject = encodeURIComponent('Contratación de Fragmentado');
          return (
            <article className={styles.inquiryCard} key={inquiry.id}>
              <div className={styles.inquiryCardHead}>
                <div>
                  <span className={`${styles.inquiryStatus} ${styles[`inquiryStatus${inquiry.status}`]}`}>
                    {STATUS_LABELS[inquiry.status]}
                  </span>
                  <h3>{inquiry.name}</h3>
                  {inquiry.organization ? <p>{inquiry.organization}</p> : null}
                </div>
                <label className={styles.inquiryStatusField}>
                  Estado
                  <select
                    value={inquiry.status}
                    onChange={(event) => onStatusChange(inquiry.id, event.target.value)}
                    disabled={updatingId === inquiry.id}
                  >
                    <option value="new">Nueva</option>
                    <option value="contacted">Contactada</option>
                    <option value="closed">Cerrada</option>
                  </select>
                </label>
              </div>

              <div className={styles.inquiryMeta}>
                <span><FontAwesomeIcon icon={faEnvelope} /> {inquiry.email}</span>
                {inquiry.phone ? <span><FontAwesomeIcon icon={faPhone} /> {inquiry.phone}</span> : null}
                {inquiry.location ? <span><FontAwesomeIcon icon={faLocationDot} /> {inquiry.location}</span> : null}
                <span><FontAwesomeIcon icon={faCalendarDay} /> Recibida {formatDateTime(inquiry.createdAt)}</span>
              </div>

              <dl className={styles.inquiryEventDetails}>
                <div><dt>Evento</dt><dd>{inquiry.eventType || 'No indicado'}</dd></div>
                <div><dt>Fecha</dt><dd>{formatEventDate(inquiry.eventDate)}</dd></div>
                <div><dt>Duración</dt><dd>{inquiry.duration || 'Por definir'}</dd></div>
                <div><dt>Audio</dt><dd>{inquiry.requiresAudio || 'No indicado'}</dd></div>
              </dl>

              <p className={styles.inquiryMessage}>{inquiry.message}</p>
              <div className={styles.inquiryActions}>
                <a href={`mailto:${inquiry.email}?subject=${emailSubject}`}>Responder por correo</a>
                {whatsappUrl ? (
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">Abrir WhatsApp</a>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
