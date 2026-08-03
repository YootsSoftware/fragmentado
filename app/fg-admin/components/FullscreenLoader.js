import monogram from '../../assets/Monograma.avif';
import styles from '../page.module.css';

export default function FullscreenLoader({ message, inline = false }) {
  if (!message) return null;

  return (
    <div
      className={inline ? styles.inlineBrandLoader : styles.fullscreenLoader}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <video
        className={styles.officialLoaderMonogram}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster={monogram.src}
        aria-hidden="true"
      >
        <source src="/fragmentado-loader.webm" type="video/webm" />
        <source src="/fragmentado-loader.mp4" type="video/mp4" />
      </video>
      <p>{message}</p>
    </div>
  );
}
