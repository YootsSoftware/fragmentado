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
      link: 'https://open.spotify.com/track/5qdFk8TPnksQginDPcXrbY?si=a157fa13cfdd4d57',
    },
    {
      title: 'apple music',
      icon: '/plataformas/Apple-Music-logo1.png',
      link: 'https://music.apple.com/mx/album/pausa-al-amor/1725307186?i=1725307324&l=en-GB',
    },
    {
      title: 'amazon music',
      icon: '/plataformas/Amazon_Music_White.png',
      link: 'https://music.amazon.com.mx/albums/B0CS3SMQ7P?marketplaceId=ART4WZ8MWBX2Y&musicTerritory=MX&ref=dm_sh_h4PX4RTZqTRxwbisYq0Ce2bSk&trackAsin=B0CS3R4KZ1',
    },
    {
      title: 'Deezer music',
      icon: '/plataformas/deezer-logo_brandlogos.net_kzlnq-white.png',
      link: 'https://deezer.page.link/a2Eg2etxmFe9cqHv9',
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
            src="/webaudio2.mp3"
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
              src="/pausa-min.jpg"
              alt="T-JURO PORTADA"
              width={350}
              height={350}
            />
          </div>
          <Link
            className={styles.titleReleases}
            href="https://youtu.be/wLv24iTLSs4?si=iH2G9XwwDw5QDJXh"
          >
            <h4>PAUSA AL AMOR</h4>
            <span>FRAGMENTADO</span>
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
