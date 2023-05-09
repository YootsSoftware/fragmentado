import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.css';
// import { faSpotify } from '@fortawesome/free-solid-svg-icons';
// import { faSurprise } from '@fortawesome/free-regular-svg-icons';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function Home() {
  return (
    <div className={styles.main}>
      <main>
        <div className={styles.center}>
          <Image
            className={styles.cover}
            src="/tjuro-min.png"
            alt="T-JURO PORTADA"
            width={350}
            height={350}
          />
          <h1>FRAGMENTADO</h1>
          <span>Relatando Historias</span>

          <Link
            className={styles.links}
            href="https://accounts.spotify.com/authorize?client_id=949a9d817b514ea1b74fdf9991c71f1a&redirect_uri=https%3A%2F%2Fsmartlink-api.amuse.io%2Fpre-saves%2Fcallback&scope=user-library-modify+user-follow-modify&response_type=code&state=eyJyZWxlYXNlX2lkIjogMjU0NTExOH0%3D"
          >
            <Image
              src="/Spotify_Icon_RGB_White.png"
              width={30}
              height={30}
              alt="logo spotify"
            />
            <p>Pre-Save on Spotify</p>
          </Link>
        </div>
      </main>
      <footer className={styles.footer}>
        <Link href="http://www.yootsmusic.com">www.yootsmusic.com</Link>
      </footer>
    </div>
  );
}
