import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBullhorn,
  faChartLine,
  faCompactDisc,
  faGear,
  faHouse,
  faMagnifyingGlass,
  faRightFromBracket,
} from '@fortawesome/free-solid-svg-icons';
import monogram from '../../assets/Monograma.avif';
import styles from '../page.module.css';

const sections = [
  { id: 'dashboard', label: 'Inicio', icon: faHouse },
  { id: 'discografia', label: 'Lanzamientos', icon: faCompactDisc },
  { id: 'pre-save', label: 'Pre-save', icon: faBullhorn },
  { id: 'estadisticas', label: 'Estadísticas', icon: faChartLine },
  { id: 'configuracion', label: 'Ajustes', icon: faGear },
];

export default function AdminNavbar({
  globalArtistName,
  searchRef,
  searchQuery,
  isSearchOpen,
  searchResults,
  activeSection,
  sessionUsername,
  onSearchChange,
  onSearchFocus,
  onSearchSelect,
  onSetActiveSection,
  onLogout,
}) {
  return (
    <aside className={styles.navbar}>
      <div className={styles.adminBrand}>
        <Image src={monogram} alt="" aria-hidden="true" />
        <div>
          <strong>{globalArtistName || 'Fragmentado'}</strong>
          <span>Panel editorial</span>
        </div>
      </div>
      <div className={styles.navLead}>
        <div className={styles.navSearchWrap} ref={searchRef}>
          <label className={styles.navSearch} aria-label="Buscar">
            <FontAwesomeIcon icon={faMagnifyingGlass} />
            <input
              type="search"
              placeholder="Buscar lanzamiento"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              onFocus={onSearchFocus}
            />
          </label>
          {isSearchOpen && searchQuery.trim() ? (
            <ul className={styles.navSearchResults}>
              {searchResults.length ? (
                searchResults.map((result) => (
                  <li key={`${result.type}-${result.id}`}>
                    <button
                      type="button"
                      className={styles.navSearchResult}
                      onClick={() => onSearchSelect(result)}
                    >
                      <span className={styles.navSearchResultTitle}>{result.title}</span>
                      <span className={styles.navSearchResultMeta}>
                        {result.type === 'song' ? 'Cancion' : 'Disco'} • {result.subtitle}
                      </span>
                    </button>
                  </li>
                ))
              ) : (
                <li className={styles.navSearchEmpty}>Sin resultados</li>
              )}
            </ul>
          ) : null}
        </div>
      </div>
      <nav className={styles.navTabs} aria-label="Secciones del panel">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            className={activeSection === section.id ? styles.tabActive : styles.tab}
            onClick={() => onSetActiveSection(section.id)}
          >
            <FontAwesomeIcon icon={section.icon} aria-hidden="true" />
            {section.label}
          </button>
        ))}
      </nav>
      <div className={styles.navUserArea}>
        <div className={styles.userPill}>
          <span className={styles.userAvatar} aria-hidden="true">
            {(sessionUsername || 'admin').slice(0, 1).toUpperCase()}
          </span>
          <span>{sessionUsername || 'admin'}</span>
        </div>
        <button
          type="button"
          className={styles.navLogout}
          onClick={onLogout}
          aria-label="Cerrar sesion"
          title="Cerrar sesion"
        >
          <FontAwesomeIcon icon={faRightFromBracket} />
        </button>
      </div>
      <a className={styles.viewSiteLink} href="/" target="_blank" rel="noopener noreferrer">
        Ver sitio oficial ↗
      </a>
    </aside>
  );
}
