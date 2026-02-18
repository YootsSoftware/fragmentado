import styles from '../page.module.css';

export default function FullscreenLoader({ message }) {
  if (!message) return null;

  return (
    <div className={styles.fullscreenLoader} role="status" aria-live="polite" aria-busy="true">
      <div className={styles.fullscreenLoaderCard}>
        <span className={styles.loaderDot} />
        <p>{message}</p>
      </div>
    </div>
  );
}
