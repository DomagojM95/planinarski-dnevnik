import { useEffect, useRef, useState } from 'react'
import './App.css'

const INITIAL_TRIPS = [
  {
    id: 1,
    title: 'Papuk',
    date: '14. rujna 2026.',
    region: 'Papuk',
    country: 'Hrvatska',
    description: 'Jedan dan u prirodi, staza kroz šumu i pogled koji vrijedi zapamtiti.',
    story: '',
    photo: null,
  },
  {
    id: 2,
    title: 'Dolomiti',
    date: '2026.',
    region: 'Dolomiti',
    country: 'Italija',
    description: 'Nova planina, nova priča i nova stranica ovog dnevnika.',
    story: '',
    photo: null,
  },
]

const STEP_DELAY = 0.09 // razmak između listova kad se prelista više stranica odjednom
const DURATION = 1.1

/* Redoslijed stranica: naslovnica, naslovna stranica, sadržaj,
   po dvije stranice za svaki izlet, zadnja korica. */
function buildPages(trips) {
  return [
    { kind: 'cover' },
    { kind: 'title' },
    { kind: 'contents' },
    ...trips.flatMap((trip, k) => [
      { kind: 'photo', trip, number: k + 1 },
      { kind: 'story', trip, number: k + 1 },
    ]),
    { kind: 'back' },
  ]
}

const pad2 = (n) => String(n).padStart(2, '0')

function Marker() {
  return <span className="marker" aria-hidden="true" />
}

// Graviran motiv planine za korice
function Emblem() {
  return (
    <svg className="emblem" viewBox="0 0 120 80" aria-hidden="true">
      <circle cx="88" cy="20" r="8" />
      <path d="M4 70 L38 18 L54 42 L66 28 L116 70" />
      <path d="M27 36 L38 18 L49 36" />
      <path d="M2 74 H118" />
    </svg>
  )
}

function Folio({ n }) {
  return <div className="folio">— {n} —</div>
}

function Page({ page, index, trips, goTo, addTrip }) {
  const stop = (fn) => (e) => {
    e.stopPropagation()
    fn()
  }

  if (page.kind === 'cover') {
    return (
      <div className="cover-body">
        <div className="cover-frame" />
        <span className="corner tr" />
        <span className="corner br" />

        <div className="cover-content">
          <Emblem />
          <p className="cover-kicker">Planinarski</p>
          <h1>Dnevnik</h1>
          <div className="cover-ornament"><i /></div>
          <p className="cover-year">2026</p>
        </div>
      </div>
    )
  }

  if (page.kind === 'back') {
    return (
      <div className="cover-body">
        <div className="cover-frame" />
        <span className="corner tl" />
        <span className="corner bl" />

        <div className="cover-content">
          <Emblem />
          <p className="cover-year">Do sljedeće planine</p>
        </div>
      </div>
    )
  }

  if (page.kind === 'title') {
    return (
      <div className="page-body">
        <p className="label">
          <Marker />
          Osobni dnevnik
        </p>
        <h2 className="title-xl">
          Moj
          <br />
          planinarski
          <br />
          dnevnik
        </h2>
        <div className="rule" />
        <p className="quote">
          Mjesta koja sam prošao.
          <br />
          Priče koje želim zapamtiti.
        </p>
      </div>
    )
  }

  if (page.kind === 'contents') {
    return (
      <div className="page-body">
        <p className="label">Sadržaj</p>
        <h2 className="title-lg">Moje planine</h2>
        <p className="lead">Svaki izlet je jedna nova stranica.</p>

        <div className="toc">
          {trips.map((t, k) => (
            <button key={t.id} className="toc-row" onClick={stop(() => goTo(k + 2))}>
              <span className="toc-number">{pad2(k + 1)}</span>
              <span className="toc-title">{t.title}</span>
              <span className="toc-dots" />
              <span className="toc-page">{3 + 2 * k}</span>
            </button>
          ))}
        </div>

        <button className="new-trip-button" onClick={stop(addTrip)}>
          + Novi izlet
        </button>

        <Folio n={index} />
      </div>
    )
  }

  const { trip, number } = page

  if (page.kind === 'photo') {
    return (
      <div className="page-body">
        <p className="label">Izlet {pad2(number)}</p>

        <div className="photo">
          {trip.photo ? (
            <img src={trip.photo} alt={trip.title} />
          ) : (
            <span>Fotografija izleta</span>
          )}
          <i className="mount tl" />
          <i className="mount br" />
        </div>

        <h2 className="title-lg trip-title">{trip.title}</h2>
        <p className="trip-meta">
          {trip.date}
          <br />
          {trip.region}, {trip.country}
        </p>

        <Folio n={index} />
      </div>
    )
  }

  // story
  return (
    <div className="page-body">
      <p className="label">{trip.region}</p>
      <p className="lead story-lead">{trip.description}</p>

      <h3 className="story-heading">Moja priča</h3>
      <p className="story-text">
        {trip.story || 'Ovdje će biti tvoja priča, osjećaji i uspomene s ovog izleta.'}
      </p>

      <div className="track-box">
        <span>Garmin trag i GPX</span>
        <div className="track-stats">
          <div><b>—</b> km</div>
          <div><b>—</b> m D+</div>
          <div><b>—</b> h</div>
        </div>
      </div>

      <Folio n={index} />
    </div>
  )
}

export default function App() {
  const [trips, setTrips] = useState(INITIAL_TRIPS)
  const [spread, setSpread] = useState(0) // 0 = zatvorena prednja korica
  const [anim, setAnim] = useState(null) // { from, to }
  const timer = useRef(null)

  const pages = buildPages(trips)
  const leaves = pages.length / 2
  const state = spread === 0 ? 'front' : spread === leaves ? 'back' : 'open'

  const goTo = (target) => {
    const to = Math.max(0, Math.min(leaves, target))
    if (to === spread) return

    setAnim({ from: spread, to })
    setSpread(to)

    clearTimeout(timer.current)
    timer.current = setTimeout(
      () => setAnim(null),
      (DURATION + Math.abs(to - spread) * STEP_DELAY) * 1000 + 100
    )
  }

  const addTrip = () => {
    const date = new Date().toLocaleDateString('hr-HR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    const newTrip = {
      id: Date.now(),
      title: 'Novi izlet',
      date,
      region: 'Nova planina',
      country: 'Hrvatska',
      description: 'Ovdje će biti kratki opis izleta.',
      story: '',
      photo: null,
    }

    setTrips((current) => [...current, newTrip])
    setSpread(trips.length + 2) // otvara stranicu novog izleta
  }

  // Tipkovnica: strelice za listanje, Esc zatvara knjigu
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') goTo(spread + 1)
      if (e.key === 'ArrowLeft') goTo(spread - 1)
      if (e.key === 'Escape') goTo(0)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Kašnjenje po listu, da se više listova okreće jedan za drugim
  const leafTiming = (i) => {
    if (!anim) return { delay: 0, turning: false }
    const { from, to } = anim

    if (to > from && i >= from && i < to) return { delay: (i - from) * STEP_DELAY, turning: true }
    if (to < from && i >= to && i < from) return { delay: (from - 1 - i) * STEP_DELAY, turning: true }
    return { delay: 0, turning: false }
  }

  const label =
    state === 'front'
      ? 'Klikni na knjigu da je otvoriš'
      : state === 'back'
        ? 'Zadnja korica'
        : `Stranice ${2 * spread - 1} i ${2 * spread}`

  return (
    <main className="stage">
      <div className="book" data-state={state}>
        <div className="shadow left" />
        <div className="shadow right" />
        <div className="stack left" />
        <div className="stack right" />
        <div className="ribbon" />

        {Array.from({ length: leaves }, (_, i) => {
          const { delay, turning } = leafTiming(i)
          const front = pages[2 * i]
          const back = pages[2 * i + 1]
          const faceProps = { trips, goTo, addTrip }

          return (
            <div
              key={i}
              className={`leaf ${i < spread ? 'flipped' : ''} ${turning ? 'turning' : ''}`}
              style={{ '--i': i, '--d': `${delay}s` }}
            >
              <div
                className={`face front ${front.kind === 'cover' ? 'cover' : ''}`}
                onClick={() => spread === i && goTo(i + 1)}
              >
                <Page page={front} index={2 * i} {...faceProps} />
              </div>

              <div
                className={`face back ${back.kind === 'back' ? 'cover' : ''}`}
                onClick={() => spread === i + 1 && goTo(i)}
              >
                <Page page={back} index={2 * i + 1} {...faceProps} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="controls">
        <button onClick={() => goTo(spread - 1)} disabled={spread === 0} aria-label="Prethodna stranica">
          ‹
        </button>
        <span>{label}</span>
        <button onClick={() => goTo(spread + 1)} disabled={spread === leaves} aria-label="Sljedeća stranica">
          ›
        </button>
        {spread > 0 && (
          <button className="close-book" onClick={() => goTo(0)}>
            Zatvori knjigu
          </button>
        )}
      </div>
    </main>
  )
}
