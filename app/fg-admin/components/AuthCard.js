import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
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
    <section className={styles.card}>
      <h1>fg-admin</h1>
      <p>
        {isBootstrap
          ? 'Crea tu cuenta inicial de administrador.'
          : 'Inicia sesion para administrar contenido.'}
      </p>
      <form className={styles.form} onSubmit={onSubmit} onKeyDown={onKeyDown}>
        <label>
          Usuario
          <input
            value={credentials.username}
            onChange={(event) => onChangeCredentials('username', event.target.value)}
            required
            minLength={isBootstrap ? 4 : undefined}
            disabled={authSubmitting}
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={credentials.password}
            onChange={(event) => onChangeCredentials('password', event.target.value)}
            required
            minLength={isBootstrap ? 8 : undefined}
            disabled={authSubmitting}
          />
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
        <button type="submit" disabled={authSubmitting}>
          {authSubmitting
            ? isBootstrap
              ? 'Procesando...'
              : 'Validando...'
            : isBootstrap
              ? 'Crear cuenta'
              : 'Entrar'}
        </button>
      </form>
    </section>
  );
}
