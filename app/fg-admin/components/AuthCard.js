import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleExclamation, faLock, faUser } from '@fortawesome/free-solid-svg-icons';
import styles from '../page.module.css';

export default function AuthCard({
  mode,
  credentials,
  authSubmitting,
  authError,
  onChangeCredentials,
  onSubmit,
  onKeyDown,
}) {
  const isBootstrap = mode === 'bootstrap';

  return (
    <section className={`${styles.card} ${styles.authShellCard}`}>
      <aside className={styles.authPromoPane} aria-hidden="true">
        <div className={styles.authPromoGlow} />
        <p className={styles.authPromoKicker}>Yoots Music</p>
        <h2 className={styles.authPromoTitle}>Controla tus lanzamientos en un solo panel</h2>
        <p className={styles.authPromoText}>
          Administra discografia, sincroniza Spotify y publica cambios en tiempo real.
        </p>
      </aside>

      <div className={styles.authFormPane}>
        <span className={styles.authEyebrow}>fg-admin</span>
        <h1>{isBootstrap ? 'Crear cuenta inicial' : 'Acceso de administrador'}</h1>
        <p className={styles.authSubtitle}>
          {isBootstrap
            ? 'Configura el primer usuario para gestionar el proyecto.'
            : 'Inicia sesion para administrar contenido.'}
        </p>
        <form className={`${styles.form} ${styles.authForm}`} onSubmit={onSubmit} onKeyDown={onKeyDown}>
          <label className={styles.authField}>
            Usuario
            <span className={styles.authInputWrap}>
              <FontAwesomeIcon icon={faUser} aria-hidden="true" />
              <input
                className={styles.authInput}
                value={credentials.username}
                onChange={(event) => onChangeCredentials('username', event.target.value)}
                required
                minLength={isBootstrap ? 4 : undefined}
                disabled={authSubmitting}
              />
            </span>
          </label>
          <label className={styles.authField}>
            Contraseña
            <span className={styles.authInputWrap}>
              <FontAwesomeIcon icon={faLock} aria-hidden="true" />
              <input
                className={styles.authInput}
                type="password"
                value={credentials.password}
                onChange={(event) => onChangeCredentials('password', event.target.value)}
                required
                minLength={isBootstrap ? 8 : undefined}
                disabled={authSubmitting}
              />
            </span>
          </label>
          {authError ? (
            <div className={styles.authErrorBox} role="alert" aria-live="assertive">
              <FontAwesomeIcon icon={faCircleExclamation} aria-hidden="true" />
              <p>{authError}</p>
            </div>
          ) : null}
          {authSubmitting ? (
            <div className={styles.loaderRow} role="status" aria-live="polite">
              <span className={styles.loaderDot} />
              <span>{isBootstrap ? 'Creando cuenta...' : 'Iniciando sesion...'}</span>
            </div>
          ) : null}
          <button type="submit" disabled={authSubmitting} className={styles.authSubmit}>
            {authSubmitting
              ? isBootstrap
                ? 'Procesando...'
                : 'Validando...'
              : isBootstrap
                ? 'Crear cuenta'
                : 'Entrar'}
          </button>
        </form>
      </div>
    </section>
  );
}
