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
      link: 'https://open.spotify.com/track/2uGjILne0Ox9rl5n1CKwoj?si=128d1b8350304cf6',
    },
    {
      title: 'apple music',
      icon: '/plataformas/Apple-Music-logo1.png',
      link: 'https://music.apple.com/es/album/donde-empieza-termina-single/1834330885',
    },
    {
      title: 'amazon music',
      icon: '/plataformas/Amazon_Music_White.png',
      link: 'https://music.amazon.com.mx/albums/B0FN3S5T7F?marketplaceId=ART4WZ8MWBX2Y&musicTerritory=MX&ref=dm_sh_GFBiBer3e4mGbhhpcFRXH6lNa&trackAsin=B0FN3Q3L56',
    },
    {
      title: 'Deezer music',
      icon: '/plataformas/deezer-logo_brandlogos.net_kzlnq-white.png',
      link: 'https://link.deezer.com/s/31tCZuJCIe2PVsrkIFdXE',
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
            src="/webaudio4.mp3"
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
              src="/DondeEmpieza.jpg"
              alt="DONDE EMPIEZA & TERMINA"
              width={350}
              height={350}
            />
          </div>
          <Link
            className={styles.titleReleases}
            href="https://youtu.be/ZsFVXXkgxh4"
          >
            <h4>DONDE EMPIEZA & TERMINA</h4>
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
