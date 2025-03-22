'use client';
import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.css';
import { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlayCircle } from '@fortawesome/free-regular-svg-icons';

export default function Home() {
  const audioPlayer = useRef(null);

  const StreamingPLatforms = [
    {
      title: 'spotify',
      icon: '/plataformas/Spotify_Logo_RGB_Green.png',
      link: 'https://open.spotify.com/track/75QljW8Oln5LN1IfCkiCXb?si=b294f76c4ebc4024',
    },
    // {
    //   title: 'apple music',
    //   icon: '/plataformas/Apple-Music-logo1.png',
    //   link: 'https://music.apple.com/mx/album/pausa-al-amor/1725307186?i=1725307324&l=en-GB',
    // },
    {
      title: 'amazon music',
      icon: '/plataformas/Amazon_Music_White.png',
      link: 'https://music.amazon.com.mx/albums/B0F1CB58G8?marketplaceId=ART4WZ8MWBX2Y&musicTerritory=MX&ref=dm_sh_FywHFFu7M6MwDaV50Us2LQm7X&trackAsin=B0F1CDWWQS',
    },
    {
      title: 'Deezer music',
      icon: '/plataformas/deezer-logo_brandlogos.net_kzlnq-white.png',
      link: 'https://dzr.page.link/diDztj33X8xPAjiC8',
    },
  ];

  const PlayAudio = () => {
    audioPlayer.current.play();
  };
  return (
    <div className={styles.main}>
      <main>
        <div className={styles.center}>
          <audio
            id="audio-player"
            src="/webaudio3.mp3"
            // autoPlay
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
              src="/andamospresentes.jpg"
              alt="ANDAMOS PRESENTES"
              width={350}
              height={350}
            />
          </div>
          <Link
            className={styles.titleReleases}
            href="https://youtu.be/vUcZ0PLADuU?si=-JmL17mUI_cfP5If"
          >
            <h4>ANDAMOS PRESENTES</h4>
            <span>FRAGMENTADO</span>
            {/* <span className={styles.tag}>(Video Lyric)</span> */}
            <Image
              src="/plataformas/yt_logo_rgb_light.png"
              layout="intrinsic"
              height={40}
              width={80}
              alt="logo youtube"
            />
          </Link>

          {StreamingPLatforms.map((platform) => (
            <div className={styles.streamingLinkWrap} key={platform.title}>
              <Image
                src={platform.icon}
                layout="intrinsic"
                height={40}
                width={80}
                alt={platform.title}
              />
              <Link className={styles.streamingLink} href={platform.link}>
                Escuchar
              </Link>
            </div>
          ))}
        </div>
      </main>
      <footer className={styles.footer}>
        <Link href="http://www.yootsmusic.com">www.yootsmusic.com</Link>
      </footer>
    </div>
  );
}
