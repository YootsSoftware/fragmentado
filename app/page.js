'use client';
import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.css';
import { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlayCircle } from '@fortawesome/free-regular-svg-icons';

export default function Home() {
  const audioPlayer = useRef(null);

  const PlayAudio = () => {
    audioPlayer.current.play();
  };
  return (
    <div className={styles.main}>
      <main>
        <div className={styles.center}>
          <audio
            id="audio-player"
            src="/webaudio.mp3"
            autoPlay
            loop
            ref={audioPlayer}
          />
          <div className={styles.cover_container}>
            <FontAwesomeIcon
              icon={faPlayCircle}
              className={styles.play_icon}
              onClick={PlayAudio}
            />
            <Image
              className={styles.cover}
              src="/tjuro-min.png"
              alt="T-JURO PORTADA"
              width={350}
              height={350}
            />
          </div>

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
