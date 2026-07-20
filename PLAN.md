# Amapin – Projektplan (Social-Media Video/Audio-Downloader)

> **Für Claude: Diese Datei IMMER zuerst lesen, bevor irgendetwas an diesem Projekt gemacht wird.**

## Ziel des Projekts

Eine Web-App, in die Nutzer einen Link zu einem Video von **YouTube, Facebook, Instagram oder TikTok**
einfügen können. Danach kann der Nutzer wählen, in welchem Format er das Medium herunterladen möchte
(z. B. **MP4** als Video, oder **MP3 / WAV** als Audio-Extraktion) – abhängig davon, was für die jeweilige
Quelle technisch möglich ist. Zusätzlich soll die App Platz für **Google Ads** reservieren (mehrere
responsive Ad-Slots), da die App monetarisiert werden soll.

## Wie mit dieser Datei gearbeitet wird

1. Zu Beginn **jeder** Session diese Datei komplett lesen, bevor Code angefasst wird.
2. Es gibt genau **einen** Schritt mit Status `🔄 Aktuell`. Nur dieser wird bearbeitet – nie mehrere
   gleichzeitig, auch wenn es effizienter erscheint. Kleine, überprüfbare Schritte > große Sprünge.
3. Den Schritt wie ein **Senior Full-Stack-Entwickler und UX-Designer** angehen:
   - Architektur & Wartbarkeit sauber halten, keine Hacks.
   - Fehlerbehandlung und Edge Cases mitdenken (kaputte Links, private/gelöschte Videos, Rate-Limits
     der Plattformen, Timeouts, große Dateien).
   - **Responsivität** (Mobile/Tablet/Desktop), Zugänglichkeit (a11y) und Ladezeiten aktiv prüfen, nicht
     nur "funktioniert am Desktop".
   - Bestehende Konventionen im Projekt respektieren, bevor neue eingeführt werden.
4. Nach Abschluss eines Schritts:
   - Checkbox von `[ ]` auf `[x]` setzen, Status von `🔄 Aktuell` auf `✅ Erledigt`.
   - Unter dem Schritt kurz **"Ergebnis:"** ergänzen (was konkret gebaut/entschieden wurde, relevante
     Dateipfade, offene Punkte für später).
   - Den nächsten offenen Schritt auf `🔄 Aktuell` setzen.
   - Danach **stoppen** und auf Feedback warten – nicht automatisch weitermachen.
5. Erst wenn der Nutzer **"weiter"** (oder sinngemäß) schreibt, mit dem neuen `🔄 Aktuell`-Schritt
   beginnen.
6. Bei Unklarheiten im jeweiligen Schritt: kurz nachfragen statt etwas zu raten, das schwer rückgängig
   zu machen ist (z. B. Architekturentscheidungen, Hosting, bezahlte Dienste).
7. Diese Datei ist ein lebendes Dokument. Wenn sich während der Umsetzung herausstellt, dass ein
   späterer Schritt anders aussehen muss, den Plan anpassen und kurz begründen – nicht stillschweigend
   abweichen.

## Rechtlicher Hinweis (nicht ignorieren)

- Das Herunterladen von Inhalten Dritter kann gegen die Nutzungsbedingungen von YouTube/Meta/TikTok
  verstoßen und in einigen Fällen urheberrechtlich relevant sein. Die App wird technisch so gebaut,
  dass sie funktioniert; die **Verantwortung für die rechtmäßige Nutzung liegt beim Endnutzer**
  (dazu gehört ein klarer Hinweis/Disclaimer in der App, siehe Schritt zu Rechtstexten).
- Da Google Ads eingebunden werden und personenbezogene Daten (u. a. IP-Adressen) verarbeitet werden,
  sind aus deutscher/EU-Sicht **Impressum, Datenschutzerklärung und ein Cookie-Consent-Banner
  (Google Consent Mode)** technisch notwendig, nicht optional. Das ist fest im Plan eingeplant
  (Phase 3).

## Architektur-Entscheidungen (Stand: Analyse des Repos)

- **Ist-Zustand:** Frisches Angular-22-Standalone-Scaffold (Signals, `provideRouter`, Angular Material
  als Dependency vorhanden, aber noch ungenutzt). `package.json` referenziert bereits die Skripte
  `proxy` (`server/proxy.mjs`) und `dev` sowie `ng serve --proxy-config proxy.conf.json` – diese Dateien
  existieren aber noch nicht und werden in Phase 1 angelegt.
- **Frontend:** Angular 22 (Standalone Components, Signals), Angular Material + eigenes Theming, SCSS.
- **Backend:** Node.js/Express-Server (`server/`), der `yt-dlp` (robusteste, aktiv gepflegte Lösung für
  YouTube/Facebook/Instagram/TikTok u.v.m.) und `ffmpeg` für Audio-Extraktion/Konvertierung kapselt.
  Grund: Download & Konvertierung können aus einem Browser heraus nicht CORS-frei und ohne Server-Logik
  passieren – das ist zwingend ein Backend-Thema, kein reines Frontend-Feature.
- **Kommunikation:** Angular Dev-Server proxyt `/api/*` auf den Node-Server (`proxy.conf.json`),
  in Produktion läuft beides hinter demselben Reverse Proxy/Origin.
- **Hosting-Implikation:** Da `yt-dlp`/`ffmpeg`-Binaries benötigt werden, reicht **kein reines
  Static-Hosting** (z. B. Netlify/Vercel-Static) – es braucht eine Node-Laufzeitumgebung (Docker-Image,
  VPS o. Ä.). Wird in Phase 4 konkretisiert.

---

## Phase 0 – Grundlagen

### Schritt 1: Technische Machbarkeits-Recherche & Architektur-Feinentscheidung
Status: ✅ Erledigt

- [x] `yt-dlp` vs. Alternativen (z. B. `youtube-dl`, plattformspezifische APIs) kurz gegenprüfen –
      insbesondere Aktualität/Wartungsstand, da Plattformen ihre Player häufig ändern.
- [x] Klären, welche Formate/Qualitäten pro Plattform realistisch verfügbar sind (z. B. Instagram/TikTok
      oft nur ein MP4-Rendition, YouTube mit vielen Qualitätsstufen) – UI muss das später abbilden können.
- [x] Node-Wrapper für `yt-dlp` festlegen (z. B. `yt-dlp-wrap`) + `ffmpeg`-Bereitstellung (`ffmpeg-static`)
      festlegen.
- [x] Grobe Ordnerstruktur für `server/` festlegen (z. B. `server/index.mjs`, `server/routes/`,
      `server/services/ytdlp.mjs`, `server/services/convert.mjs`).

Ergebnis:
- **yt-dlp bestätigt als Wahl.** Aktiv gepflegt (aktuelle Version lokal via Homebrew: `2025.06.30`),
  einzige praxistaugliche Lösung, die alle vier geforderten Plattformen unter einem Dach abdeckt.
  `youtube-dl` selbst gilt als quasi unmaintained im Vergleich – daher raus.
- **Lokale Dev-Umgebung bereits startklar:** `yt-dlp` und `ffmpeg` sind auf diesem Rechner via Homebrew
  installiert (`/opt/homebrew/bin/yt-dlp`, `/opt/homebrew/bin/ffmpeg` 7.1.1) – Backend kann direkt lokal
  getestet werden, ohne erst Binaries zu besorgen.
- **Node-Wrapper:** `yt-dlp-wrap` (npm, aktuell `2.3.12`, aktiv gepflegt) – kapselt den `yt-dlp`-Prozess,
  liefert Events für Fortschritt/Fehler, passt gut zur geplanten Streaming-Architektur.
- **ffmpeg für Produktion:** `ffmpeg-static` (npm, aktuell `5.3.0`) für Docker/Deployment, damit kein
  System-ffmpeg auf dem Zielserver vorausgesetzt werden muss. Lokal reicht das Homebrew-ffmpeg.
- **Formatverfügbarkeit realistisch je Plattform (wichtig für Schritt 3/8 – UI darf nichts annehmen,
  sondern muss das anzeigen, was `/api/info` tatsächlich liefert):**
  - *YouTube*: viele Qualitätsstufen, oft getrennte Video-/Audio-Streams (müssen von yt-dlp/ffmpeg
    gemuxt werden) → reichhaltigste Auswahl.
  - *TikTok*: i. d. R. genau eine Video-Rendition; MP3/WAV nur als Audio-Extraktion aus dieser einen
    Datei via ffmpeg.
  - *Instagram*: Reels/Posts/IGTV öffentlich meist ok; Stories und private Accounts benötigen Login.
  - *Facebook*: öffentliche Videos meist ok; viele Facebook-Videos sind aber privat/eingeschränkt und
    schlagen ohne Login fehl.
- **Wichtige Risiko-/Scope-Entscheidung zu Login/Cookies:** In v1 werden **keine** Nutzer-Logins/Cookies
  für die Plattformen unterstützt oder gespeichert (Datenschutz- und ToS-Risiko, deutlich größerer Scope).
  Die App unterstützt nur **öffentlich zugängliche** Inhalte. Schlägt `yt-dlp` mit einem
  Auth-/Login-Fehler fehl, wird das im Frontend als klare, verständliche Fehlermeldung ausgegeben
  ("Video ist privat oder erfordert eine Anmeldung"), statt es technisch zu umgehen.
- **Bekanntes Betriebsrisiko (später in Phase 4 im Blick behalten, kein Blocker jetzt):** YouTube kann bei
  Anfragen von Server-IPs verstärkt Bot-Checks ("Sign in to confirm you're not a bot") auslösen und TikTok
  blockt unautorisiertes Scraping zunehmend. Für v1 akzeptiert (öffentliche Inhalte, moderates
  Rate-Limiting); falls das in der Praxis zum Problem wird, ist das ein späteres Ops-Thema, keine
  Architekturänderung.
- **Ordnerstruktur `server/` (wird in Schritt 2 angelegt):**
  ```
  server/
    index.mjs                 # Express-Bootstrap
    config.mjs                 # Env-Konfiguration (Port, Limits, ffmpeg-Pfad)
    routes/
      health.route.mjs
      info.route.mjs
      download.route.mjs
    services/
      platform.service.mjs     # URL-Erkennung + Whitelist-Validierung
      ytdlp.service.mjs        # yt-dlp-wrap Integration (Metadaten + Stream)
      convert.service.mjs      # ffmpeg-Pipe für mp3/wav
    middleware/
      rateLimit.mjs
      errorHandler.mjs
  ```

---

## Phase 1 – Backend

### Schritt 2: Backend-Grundgerüst
Status: ✅ Erledigt

- [x] `server/`-Verzeichnis mit Express-Server aufsetzen (ESM, wie in `package.json` mit `.mjs` vorgesehen).
- [x] `proxy.conf.json` anlegen, `ng serve` damit verbinden.
- [x] Basis-Middleware: JSON-Parsing, CORS (nur wenn nötig), zentrales Error-Handling, Request-Logging.
- [x] Health-Check-Endpoint (`/api/health`).

Ergebnis:
- `server/index.mjs` als Express-Bootstrap angelegt, nutzt die in Schritt 1 geplante Struktur
  (`config.mjs`, `routes/`, `middleware/`; `services/` folgt in Schritt 3/4, noch nicht angelegt, um
  keine leeren Platzhalterdateien zu haben).
- **CORS bewusst weggelassen:** Angular-Dev-Server proxyt `/api/*` über `proxy.conf.json` auf
  `http://localhost:3000` (gleicher Origin aus Browsersicht), und in Produktion werden Frontend+Backend
  ebenfalls unter einer Origin ausgeliefert (siehe Schritt 15) – ein CORS-Modul wäre aktuell unbenutzter
  Code.
- Zentrales Error-Handling über `HttpError`-Klasse (`server/middleware/errorHandler.mjs`): Fehler mit
  Status < 500 geben ihre Nachricht ans Frontend weiter (z. B. später "ungültiger Link"), alles ≥ 500
  wird geloggt und dem Client nur als generischer "Interner Serverfehler" angezeigt (keine
  Stacktrace-Leaks).
- Eigener minimaler Request-Logger (`method path status dauer_ms`) statt einer zusätzlichen Dependency
  wie `morgan` – für diesen Umfang ausreichend.
- `package.json`: `express` als Dependency ergänzt (`^5.2.1`), `proxy`-Script zeigt jetzt auf
  `server/index.mjs` (vorher referenzierte es die nicht existierende `server/proxy.mjs`).
- Verifiziert: Server lokal gestartet, `GET /api/health` → `200 {"status":"ok"}`,
  `GET /api/irgendwas` → `404` mit einheitlichem Fehlerformat. `npm run proxy` startet jetzt korrekt.

### Schritt 3: Metadaten-Endpoint (`/api/info`)
Status: ✅ Erledigt

- [x] Endpoint, der eine URL entgegennimmt, Plattform erkennt (YouTube/Facebook/Instagram/TikTok) und via
      `yt-dlp -j` Metadaten liefert (Titel, Thumbnail, Dauer, verfügbare Formate/Qualitäten).
- [x] **URL-Validierung/Whitelist** gegen Domains der vier Plattformen (Schutz vor SSRF/Missbrauch als
      offener Proxy).
- [x] Fehlerfälle abbilden: privates/gelöschtes Video, geo-blockiertes Video, ungültige URL, Timeout.

Ergebnis:
- `server/services/platform.service.mjs`: `detectPlatform(url)` – parst die URL robust (wirft `HttpError
  400` bei kaputten Links), prüft Protokoll (nur http/https) und matcht den Hostnamen exakt oder als
  Subdomain gegen eine Whitelist (`youtube.com`, `youtu.be`, `facebook.com`, `fb.watch`,
  `instagram.com`, `tiktok.com`). Das ist die einzige Verteidigungslinie gegen Missbrauch des Servers als
  offenen SSRF-Proxy – bewusst als eigene, leicht testbare Funktion statt Inline-Logik in der Route.
- `server/services/ytdlp.service.mjs`: ruft bewusst `execPromise([...,'--dump-json'], {}, abortSignal)`
  direkt auf statt `getVideoInfo()` zu nutzen, weil letzteres keinen Abort-Mechanismus durchreicht – so
  gibt es einen echten Hard-Timeout (20s) plus `--socket-timeout 15` auf yt-dlp-Ebene, statt dass ein
  hängender Prozess den Server-Prozess blockiert. `--no-playlist` verhindert, dass ein Link mit
  `&list=...` versehentlich eine ganze Playlist abfragt.
- Fehler von yt-dlp werden über `mapYtDlpError()` in verständliche deutsche Meldungen übersetzt
  (privat/Login nötig → 422, unbekannte Plattform-URL → 422, Video entfernt/nicht verfügbar → 422,
  Timeout → 504) statt rohe yt-dlp-Stacktraces ans Frontend durchzureichen.
- Response liefert `videoQualities` als deduplizierte, absteigend sortierte Liste der tatsächlich in den
  yt-dlp-Formaten vorhandenen Auflösungen (Fallback `"best"`, wenn keine Höhen ermittelbar sind – kommt
  z. B. bei manchen Instagram/TikTok-Antworten vor) sowie statisch `mp3`/`wav` als Audio-Optionen, da
  Audio-Extraktion in Schritt 4 unabhängig von der Video-Auflösung per ffmpeg aus jedem verfügbaren
  Format möglich ist.
- **Stolperfalle beim ESM-Import gefunden und gefixt:** `yt-dlp-wrap` ist ein CommonJS-Paket ohne
  `exports`-Feld; Node's ESM-Interop liefert beim `import`-Default nicht die Klasse selbst, sondern ein
  Objekt `{ default: YTDlpWrap, ... }`. Import entsprechend als
  `const YTDlpWrap = YTDlpWrapModule.default ?? YTDlpWrapModule;` gelöst.
- Live gegen echte Plattform getestet (kein Mock): `GET /api/info?url=<echtes YouTube-Video>` liefert in
  ~4s Titel, Thumbnail, Dauer und 8 Qualitätsstufen (144p–2160p). Nicht existierendes Video → `422`
  "nicht mehr verfügbar". Ungültige/nicht erlaubte URLs → `400` mit klarer Meldung. Facebook/Instagram/
  TikTok wurden aus Zeitgründen nicht einzeln live durchgetestet, sollten aber über denselben Codepfad
  laufen – bei Bedarf in einem späteren Schritt gezielt nachprüfen, insbesondere TikToks
  Anti-Scraping-Verhalten (siehe Risiko-Notiz aus Schritt 1).

### Schritt 4: Download-/Konvertierungs-Endpoint (`/api/download`)
Status: ✅ Erledigt

- [x] Endpoint mit Parametern `url`, `format` (`mp4`/`mp3`/`wav`/ggf. `m4a`), `quality`.
- [x] Streaming-Pipeline: `yt-dlp` → (bei Audio) `ffmpeg`-Pipe → direkt als Response-Stream an den Client
      (kein Zwischenspeichern großer Dateien auf Disk, sauberes Cleanup bei Abbruch).
- [x] Korrekte Response-Header (`Content-Disposition`, `Content-Type`) inkl. sinnvollem Dateinamen.
- [x] Fortschritts-Mechanismus festlegen (z. B. SSE für Prozent-Anzeige, oder bewusst nur Spinner, wenn
      Content-Length unbekannt ist).

Ergebnis:
- **Wichtige Plan-Korrektur gegenüber Schritt 1 (durch echtes Testen entdeckt, nicht angenommen):** Für
  MP4 lässt sich Video+Audio-Merge **nicht** verlustfrei rein als Pipe zu stdout streamen. Live getestet:
  `yt-dlp -f "bv+ba" --merge-output-format mp4 -o -` schreibt intern klaglos ein **MPEG-TS**-Container
  in die Pipe (MP4 braucht einen seekable Output für den `moov`-Atom; das gibt es bei stdout nicht),
  ffprobe erkannte den Videotrack danach nur noch als `bin_data` – die Datei wäre trotz `.mp4`-Endung in
  vielen Playern kaputt/nicht abspielbar. Lösung: Für **Video** wird jetzt in eine echte temporäre Datei
  gemerged (seekable → korrekter `moov`-Atom, verifiziert via `ffprobe` → `h264`/`aac`), die Datei wird
  danach per `fs.createReadStream` an den Client gestreamt und **garantiert** aufgeräumt (bei Erfolg,
  Fehler, und Client-Abbruch über `res.on('close')`). Für **Audio (MP3/WAV)** funktioniert die reine
  Pipe-zu-Pipe-Lösung nachweislich korrekt (kein Container-Problem bei Elementarstreams) – dort läuft
  alles ohne Zwischenspeicherung auf Disk, exakt wie ursprünglich geplant.
  → `server/services/ytdlp.service.mjs`: `downloadMergedVideo()` (Video, temp file + Cleanup durch
  Aufrufer) und `streamBestAudio()` (Audio, reiner Stream); `server/services/convert.service.mjs`:
  `convertAudioStream()` spawnt ffmpeg direkt (nicht über yt-dlp) und piped rein durch.
- **Format-Selector bewusst auf Kompatibilität optimiert statt "beste Datei":** `buildVideoFormatSelector()`
  bevorzugt explizit `avc1`(H.264)+`mp4a`(AAC) mit Fallback-Kette. Grund: Ohne diese Einschränkung wählte
  yt-dlp bei diesem Testvideo teils AV1+Opus, was beim TS-Merge zu einem für ffprobe unlesbaren
  Videotrack führte (`bin_data`) – H.264/AAC ist universell abspielbar, AV1/Opus in MPEG-TS nicht
  zuverlässig.
- **Konkretes, reproduziertes Betriebsrisiko aus Schritt 1 bestätigt:** Bei wiederholten Downloads
  desselben Videos in kurzer Folge antwortete YouTube vereinzelt mit `HTTP 403 Forbidden` auf die
  signierten CDN-URLs (Anti-Bot-Schutz), unabhängig vom gewählten Format/Auflösung – keine Auswirkung
  unseres Codes, sondern plattformseitig. Dafür jetzt eine eigene, klare Fehlermeldung in
  `mapYtDlpError()` ("kurzfristig blockiert, bitte erneut versuchen") statt der generischen Fallback-
  Meldung. Automatische Retries bewusst nicht eingebaut – das ist ein Kandidat für Schritt 5
  (Robustheit), nicht für diesen Schritt.
- **Fortschritts-Entscheidung:** Kein SSE/WebSocket in v1 – `Content-Length` ist beim Video-Download
  wegen des Merge-Schritts vorab nicht bekannt (und bei Audio wegen Live-Transkodierung auch nicht), das
  Frontend zeigt daher in Schritt 9 einen indeterminierten Spinner statt eines Prozent-Balkens. Das ist
  eine bewusste Vereinfachung für v1, kein technisches Muss – bei Bedarf könnte man yt-dlps
  `progress`-Events später per SSE durchreichen.
- **Sicherheits-/Robustheits-Basics, die schon hier mit rein mussten (nicht erst Schritt 5), weil sie
  direkt mit dem Spawnen langlaufender Prozesse zusammenhängen:** Abort bei Client-Disconnect
  (`res.on('close')` → `AbortController`), Hard-Timeout (`config.downloadTimeoutMs`, 10 Minuten,
  env-konfigurierbar), und ein `errorHandler`, der nach bereits gesendeten Headern/Bytes nur noch die
  Verbindung kappt statt zu versuchen, eine JSON-Fehlermeldung nachzuschieben (nicht mehr möglich,
  sobald gestreamt wird).
- Live gegen ein echtes YouTube-Video getestet (mehrere Wiederholungen): MP4 480p/360p → valide Datei,
  `ffprobe` bestätigt `h264`+`aac`; MP3 → valide ID3/MPEG-Layer-III-Datei; WAV → valides RIFF/PCM.
  Fehlerfälle getestet: nicht erlaubte Domain → 400, ungültiges Format → 400, YouTube-403 → 422 mit
  spezifischer Meldung. Keine verwaisten Temp-Dateien nach den Testläufen zurückgeblieben.

### Schritt 5: Backend-Robustheit & Sicherheit
Status: ✅ Erledigt

- [x] Rate-Limiting pro IP (z. B. `express-rate-limit`), um Missbrauch/Kosten einzugrenzen.
- [x] Timeouts & Prozess-Kill für hängende `yt-dlp`/`ffmpeg`-Prozesse.
- [x] Aufräumen von Temp-Dateien/Prozessen bei Client-Abbruch.
- [x] Zentrale, konsistente Fehlerformate für's Frontend.

Ergebnis:
- **Rate-Limiting** (`server/middleware/rateLimit.mjs`, `express-rate-limit`): zwei getrennte Limiter –
  `/api/info` großzügig (Default 30 Anfragen/10 Min, günstige Metadaten-Abfrage), `/api/download` deutlich
  enger (Default 10/10 Min, da echte CPU/Bandbreite durch yt-dlp+ffmpeg verbraucht wird). Beide über
  `config.rateLimit.*` per Env-Variable justierbar. Response-Format ist identisch zum restlichen
  Fehlerschema (`{ error: { code: 'RATE_LIMITED', message } }`).
- **`trust proxy` bewusst standardmäßig aus** (`config.trustProxy`, nur per `TRUST_PROXY=true` aktivierbar):
  Ohne echten Reverse-Proxy davor würde `X-Forwarded-For` blind vertraut werden und jeder Client könnte
  seine IP fälschen, um das Rate-Limiting zu umgehen. Wird in Phase 4 (Deployment) auf `true` gesetzt,
  sobald wirklich ein Proxy davor steht.
- **Strukturierte Fehlercodes eingeführt:** `HttpError` trägt jetzt neben der (deutschen, für Menschen
  lesbaren) `message` auch einen stabilen `code` (z. B. `INVALID_URL`, `UNSUPPORTED_PLATFORM`,
  `AUTH_REQUIRED`, `BLOCKED_BY_PLATFORM`, `VIDEO_UNAVAILABLE`, `RATE_LIMITED`, `CANCELLED`,
  `CONVERSION_FAILED`, `TIMEOUT`, `INTERNAL_ERROR`, `NOT_FOUND`). Grund: Das Frontend (Schritt 7–9) soll
  später z. B. bei `BLOCKED_BY_PLATFORM`/`RATE_LIMITED` einen "Erneut versuchen"-Button zeigen können,
  ohne deutsche Fehlertexte parsen zu müssen. `mapYtDlpError()` liefert jetzt `{ code, message }` statt
  nur eines Strings.
- **Prozess-Kill verifiziert, nicht nur angenommen:** Live getestet – Audio-Download gestartet, nach
  0,5s per `ps aux` bestätigt, dass `yt-dlp` und das separat gespawnte `ffmpeg` tatsächlich laufen, dann
  Client-Verbindung abgebrochen (`curl --max-time 1`). Nach dem Abbruch: **keine** verwaisten Prozesse
  mehr in `ps aux`. Für den Audio-Pfad musste das eigene `ffmpeg` (nicht Teil von yt-dlp, separat
  gespawnt) zusätzlich explizit per `ffmpeg.kill()` an den Abbruch gekoppelt werden – `yt-dlp-wrap`
  killt zwar zuverlässig seinen eigenen Prozessbaum bei `AbortSignal`, aber eben nicht Prozesse, die wir
  selbst nebenher gestartet haben.
- **Aufräumen verwaister Temp-Dateien** (`server/services/cleanup.service.mjs`): Fängt den Fall ab, dass
  der Server-Prozess selbst hart abstürzt/gekillt wird, während ein Video-Merge in eine Temp-Datei
  schreibt (dann greift das Cleanup-in-`finally` aus Schritt 4 nicht mehr). Läuft beim Start und danach
  alle 15 Minuten, löscht `amapin-*.mp4`-Dateien im System-Temp-Verzeichnis, die älter als 30 Minuten
  sind (deutlich länger als der Download-Timeout, also garantiert kein aktiver Download mehr). Live
  getestet: eine künstlich auf 40 Minuten "gealterte" Testdatei wurde beim Serverstart entfernt, eine
  frische blieb unangetastet.
- Vollständiger Regressionstest nach dem Refactor (Fehlercodes, Rate-Limiter, Kill-Logik) durchgeführt:
  `/api/info`, MP4-, MP3-Download weiterhin `200` mit validen Dateien; alle vier Fehlerfälle
  (`MISSING_URL`, `INVALID_URL`, `UNSUPPORTED_PLATFORM`, `INVALID_FORMAT`) liefern die erwarteten Codes;
  beide Rate-Limiter greifen nach Erreichen ihres Limits mit `429`.

---

## Phase 2 – Frontend

### Schritt 6: Design-System & App-Shell
Status: ✅ Erledigt

- [x] Placeholder-Angular-Scaffold (`app.html`/`app.scss`) durch echte App-Shell ersetzen (Header, Content,
      Footer).
- [x] Angular-Material-Theme definieren (Farben, Typografie, Light/Dark Mode).
- [x] Responsive Grundraster (Mobile-first, Breakpoints für Tablet/Desktop) festlegen.

Ergebnis:
- **Theming-API für die tatsächlich installierte Angular-Material-Version (22.0.4) verifiziert, nicht
  angenommen:** Vor dem Schreiben von SCSS die echten Sass-Quellen in `node_modules/@angular/material`
  durchsucht, um die exakte `mat.theme(...)`-Signatur, die verfügbaren M3-Palettennamen
  (`$azure-palette`, `$orange-palette`, …) und die emittierten CSS-Variablennamen (`--mat-sys-primary`,
  `--mat-sys-on-surface`, `--mat-sys-body-large`, …) zu bestätigen. `@angular/material` v22 braucht dafür
  **kein** `@angular/animations` mehr (in dieser Version keine Peer-Dependency, Material ist inzwischen
  CSS-only) – bewusst nicht installiert, um keine unnötige Abhängigkeit einzuführen.
  → `src/styles.scss`: `@include mat.theme(...)` mit `primary: azure`, `tertiary: orange`,
  `theme-type: color-scheme`, Schriftstapel ohne Web-Font-Nachladen (System-Fonts, `'Inter'` nur als
  optionale Progressive Enhancement falls lokal installiert – kein Netzwerk-Request, gut für
  Ladezeit/Lighthouse in Schritt 16).
- **Light/Dark Mode nativ über CSS `light-dark()` statt eigener Duplikation:** `theme-type: color-scheme`
  lässt Material für jede Farbe automatisch `light-dark(hell, dunkel)` emittieren; `color-scheme: light
  dark` auf `html` reicht, damit der Browser die OS-Einstellung befolgt. Der Toggle-Button in
  `src/app/app.ts` überschreibt das nur pro Nutzer via `document.documentElement.style.colorScheme`,
  persistiert in `localStorage`, und folgt live der OS-Änderung weiter, solange der Nutzer noch nicht
  manuell umgeschaltet hat (eigener `matchMedia`-Change-Listener). Kein Font-Icon-Set eingebunden
  (`mat-icon`+Ligature hätte einen Google-Fonts-Netzwerk-Request gebraucht) – Sonne/Mond als
  handgeschriebene Inline-SVGs, konsistent mit dem Rest der App.
- **Layout bewusst mit reservierten Ad-Slots gebaut** (Nutzerwunsch: "lass Platz für Google Ads"):
  Banner oben/unten (volle Breite, 50px Mobile → 90px ab Tablet) und eine Sidebar (300px, `display:
  none` unterhalb der Desktop-Breakpoint) sind im Shell-Layout (`app.html`/`app.scss`) als leere,
  `aria-hidden` Platzhalter-Boxen mit gestricheltem Rahmen angelegt. Das ist bewusst nur die
  **Layout-Reservierung** – die echte AdSense-Integration inkl. Consent-Gating kommt erst in Schritt 10;
  die Platzhalter machen aber schon jetzt sichtbar/testbar, dass für Ads links Platz bleibt, ohne dass
  spätere Layout-Umbauten nötig werden.
- **Responsive Breakpoints als Sass-Mixins** (`src/styles/_breakpoints.scss`, `tablet-up`/`desktop-up`
  bei 600px/1024px) statt Inline-Media-Queries verstreut über Komponenten – ein zentraler Ort für
  spätere Anpassungen.
- **Live im Browser getestet** (nicht nur Build-Erfolg): Screenshots bei Mobile (375px)/Tablet
  (768px)/Desktop verglichen – Sidebar-Ad-Slot korrekt erst ab Desktop sichtbar, Banner-Höhe wächst
  korrekt am Tablet-Breakpoint. Theme-Toggle geklickt: Light↔Dark schaltet sofort um, Wahl bleibt nach
  Seiten-Reload erhalten (`localStorage` verifiziert). Keine Konsolenfehler.
- **Zwei reale Bugs beim Testen gefunden und behoben, nicht nur beim Schreiben angenommen korrekt:**
  (1) `app.spec.ts` prüfte noch den alten Scaffold-Text ("Hello, amapin") – angepasst auf den neuen
  Markenname. (2) `ng test` schlug fehl, weil die Vitest/jsdom-Testumgebung weder `localStorage` noch
  `window.matchMedia` bereitstellt – `App` griff darauf ungeschützt zu und krachte schon beim
  Konstruieren. Statt die Testumgebung zu patchen (wäre Schritt-14-Scope), wurde die Komponente selbst
  defensiv gemacht (`try/catch` um `localStorage`, Feature-Check vor `matchMedia`) – das ist ohnehin
  robusteres Verhalten für echte Nutzer (Safari-Privatmodus, Browser-Erweiterungen, die Storage
  blockieren, o. Ä.), nicht nur ein Test-Workaround. `ng test` und `ng build` laufen jetzt beide grün.
- Neue/geänderte Dateien: `src/styles.scss`, `src/styles/_breakpoints.scss`, `src/app/app.html`,
  `src/app/app.scss`, `src/app/app.ts`, `src/app/app.spec.ts`, `src/app/app.routes.ts`,
  `src/app/pages/home/home.{ts,html,scss}` (Platzhalter-Seite für Schritt 7), `.claude/launch.json`
  (Dev-Server-Konfig für die Vorschau).

### Schritt 7: URL-Eingabe-Komponente
Status: ✅ Erledigt

- [x] Eingabefeld mit Paste-Button, Live-Validierung, Plattform-Icon-Erkennung (YouTube/Facebook/
      Instagram/TikTok).
- [x] Lade-/Fehlerzustände (ungültiger Link, nicht unterstützte Plattform, Server nicht erreichbar).
- [x] Barrierefreiheit: Labels, Fehlermeldungen für Screenreader, Tastaturbedienung.

Ergebnis:
- **Geteilter State statt Prop-Drilling:** `VideoLookupService` (`src/app/core/video-lookup.service.ts`,
  `providedIn: 'root'`) hält `status`/`videoInfo`/`errorMessage`/`errorCode` als Signals. Grund: Schritt 8
  (Vorschau/Format-Auswahl) und Schritt 9 (Download-Flow) brauchen exakt dieselben Daten, ohne dass sie
  durch `HomePage` durchgereicht werden müssen. `src/app/core/models/video-info.model.ts` spiegelt 1:1
  die `/api/info`-Response aus Schritt 3.
- **Zweistufige Validierung, bewusst nicht nur eine:** Client-seitig erkennt `detectPlatform()`
  (`src/app/core/platform.ts`, spiegelt absichtlich die Whitelist-Logik aus
  `server/services/platform.service.mjs`) offensichtlich falsche/nicht unterstützte Links **sofort ohne
  Netzwerk-Request** und zeigt das passende Plattform-Icon während des Tippens. Der Server bleibt aber
  die eigentliche Autorität für alles, was die Client-Vorprüfung passiert (Video privat/entfernt/
  blockiert etc. kann der Client gar nicht wissen).
- **Drei getrennte Fehlerzustände, alle live gegen das echte Backend getestet** (nicht nur angenommen):
  1) Format-Fehler (nicht unterstützte Domain) → sofortige Inline-Meldung, Button bleibt deaktiviert.
  2) Echter Backend-Fehler (existierende Plattform, aber gelöschtes/ungültiges Video) → Server-Antwort
     "Dieses Video ist nicht mehr verfügbar." erscheint unverändert im UI.
  3) Backend komplett gestoppt → zunächst fälschlich generische Meldung angezeigt, weil Angulars
     Dev-Proxy bei nicht erreichbarem Backend selbst mit einem eigenen `500` (ohne unseren JSON-Body)
     antwortet, nicht mit einer Connection-Refused auf Browser-Ebene. `resolveErrorMessage()` daraufhin
     korrigiert: Backend-Message hat Vorrang, wenn vorhanden; erst wenn *kein* strukturierter Body da ist,
     greift für `0/500/502/503/504` die "Server nicht erreichbar"-Meldung. Erneut getestet: korrekt.
- **Echter Layout-Bug beim Live-Testen gefunden, nicht nur vermutet:** Die Format-Fehlermeldung war im
  Template ein direktes Kind von `.url-form` (Flex-Row ab Tablet-Breakpoint) und wurde dadurch selbst zum
  dritten Flex-Item zwischen Eingabefeld und Button – das Feld kollabierte auf ~10px Breite (per
  `preview_inspect` exakt vermessen, nicht nur optisch vermutet). Fix: eigener `.url-form__row`-Wrapper
  nur für Feld+Button, Fehlermeldung liegt als Block-Element darunter.
- **Barrierefreiheit:** `mat-label` verknüpft mit dem Input, Format-Fehler über
  `aria-describedby`/`aria-invalid` am Input verlinkt, beide Fehlertypen als `role="alert"` (eigene
  `<p>`-Elemente statt `<mat-error>`, um nicht von Angular Materials interner, an klassische Validators
  gekoppelter Sichtbarkeitslogik abhängig zu sein – mit reinem `@if` habe ich volle Kontrolle).
  Formular ist ein echtes `<form>` mit `(ngSubmit)`, Enter-Taste löst Submit aus, Fokus-Reihenfolge per
  Tab getestet.
- **Clipboard-Paste defensiv:** `navigator.clipboard.readText()` in try/catch – schlägt in
  unsicherem Kontext oder bei verweigerter Berechtigung leise fehl, Nutzer kann weiterhin normal
  einfügen (Cmd/Ctrl+V funktioniert immer, da es ein normales `<input>` ist).
- `provideHttpClient()` in `app.config.ts` ergänzt. Neue Dateien: `src/app/core/platform.ts`,
  `src/app/core/models/video-info.model.ts`, `src/app/core/video-lookup.service.ts`,
  `src/app/shared/platform-icon/*`, `src/app/features/url-input/*`; `home.html`/`home.ts` verdrahtet.
- Vollständig live getestet (echtes YouTube-Video über Angular-Dev-Server → Proxy → Node-Backend →
  yt-dlp, inkl. Mobile/Tablet/Desktop-Screenshots), `ng test` und `ng build` laufen grün.

### Schritt 8: Vorschau- & Format-Auswahl-Komponente
Status: ✅ Erledigt

- [x] Vorschau-Karte mit Thumbnail, Titel, Dauer, Plattform-Badge nach erfolgreichem `/api/info`-Call.
- [x] Format-/Qualitätsauswahl (MP4-Qualitäten, MP3, WAV) – **dynamisch abhängig davon**, was die
      Plattform/das konkrete Video tatsächlich hergibt (aus Schritt 3).
  - [x] Geschätzte Dateigröße anzeigen, wenn verfügbar.

Ergebnis:
- **Rückwirkende Backend-Erweiterung war nötig:** `/api/info` (Schritt 3) lieferte noch keine
  Größenangaben – ohne die gäbe es für "wenn verfügbar" nichts anzuzeigen. `ytdlp.service.mjs` erweitert:
  pro Video-Qualität wird die Summe aus dem `filesize`/`filesize_approx` des gewählten Video-Formats und
  einer Referenz-Audiospur berechnet; für MP3/WAV wird die Größe aus der Video-Dauer und den tatsächlichen
  Encoding-Parametern geschätzt (WAV exakt aus Samplerate/Kanälen der Quelle, da `convert.service.mjs`
  kein `-ar`/`-ac` setzt und ffmpeg die Quelle 1:1 übernimmt; MP3 nur grob, weil `-qscale:a 2` VBR ist,
  daher immer mit "≈" gekennzeichnet, nie als exakter Wert).
- **Echten Datenbug beim Verifizieren mit echten yt-dlp-Daten gefunden, nicht nur angenommen:** Erste
  Implementierung lieferte für 1080p/720p/480p/360p/240p durchgehend `estimatedBytes: null`. Ursache
  (per direktem JSON-Dump von yt-dlp bestätigt): YouTube listet pro Auflösung zuerst ein *kombiniertes*
  HLS-Format (Video+Audio in einem Stream, z. B. itag 92) **ohne** Größenangabe, und erst danach das
  eigentliche video-only DASH-Format mit echter `filesize`. Die Höhen-Auswahl filterte nicht nach
  "video-only" und blieb am ersten (größenlosen) Treffer hängen. Fix: nur Formate mit `acodec: 'none'`
  als Kandidaten zulassen – exakt das, was der Download-Selektor aus Schritt 4 (`bv*`) ohnehin auswählt,
  die Schätzung passt jetzt wirklich zur später gelieferten Datei.
- **Geteilter State erneut genutzt, nicht neu erfunden:** `DownloadSelectionService`
  (`src/app/core/download-selection.service.ts`, Signals für `format`/`height`) ist bewusst ein eigener
  Service statt Teil von `VideoLookupService` (Lookup-Ergebnis und Nutzerauswahl sind fachlich getrennte
  Zuständigkeiten) – wird in Schritt 9 vom Download-Button gelesen, ohne Prop-Drilling durch `HomePage`.
- **Auswahl setzt sich automatisch zurück** (`effect()` auf `lookup.videoInfo()`) auf MP4 + beste
  verfügbare Qualität, sobald ein neuer Lookup erfolgreich war – verhindert, dass eine Auswahl vom
  vorherigen Video (z. B. 1080p) an einem neuen Video hängen bleibt, das diese Qualität gar nicht hat.
  Live mit einem zweiten, komplett anderen Video getestet (nur 240p verfügbar) – Reset funktioniert.
- **Format-Umschalter** (`mat-button-toggle-group`: Video/MP3/WAV) blendet je nach Auswahl entweder den
  Qualitäts-Dropdown (mit Größe pro Option) oder einen einzelnen Größenhinweis ein.
- Live getestet (echtes YouTube-Video, nicht gemockt): Thumbnail, Dauer-Badge, Plattform-Badge, Titel
  (zweizeilig abgeschnitten bei langen Titeln), alle 8 Qualitätsstufen mit korrekten MB-Angaben, MP3
  (≈ 4.9 MB) und WAV (≈ 17.9 MB) – Zahlen händisch gegen die Bytes aus der API-Antwort gegengerechnet.
  Mobile-Screenshot geprüft. `ng test`/`ng build` grün.
- **Beobachtung für Schritt 16 vorgemerkt, kein Blocker jetzt:** Production-Bundle liegt mit 598 kB
  (129 kB gzip) erstmals über dem 500-kB-Warn-Budget aus `angular.json` (reine Warnung, kein Fehler,
  Fehler-Schwelle liegt bei 1 MB). Ursache: mehrere neue Material-Module (Button-Toggle, Select,
  Progress-Spinner). Bewusst jetzt nicht optimiert (z. B. Lazy-Loading), da Schritt 16 explizit für
  Performance-Audit/Bundle-Größe vorgesehen ist und die App fachlich noch wächst.

### Schritt 9: Download-Flow & Verlauf
Status: ✅ Erledigt

- [x] Download-Button triggert `/api/download`, Fortschrittsanzeige (Progress/Spinner), Erfolg/Fehler
      als Toast/Snackbar.
- [x] Lokaler Download-Verlauf (z. B. `localStorage`) mit "erneut herunterladen"-Option.

Ergebnis:
- **Bewusste Architektur-Entscheidung zum eigentlichen Download-Mechanismus:** `DownloadService`
  (`src/app/core/download.service.ts`) nutzt `fetch()` + `response.blob()` + einen programmatisch
  geklickten `<a download>`-Link statt einfach `window.location`/einen rohen Link auf `/api/download` zu
  setzen. Grund: Nur so lässt sich der Fehlerfall (4xx/5xx mit unserem JSON-Body) noch normal auslesen
  und als Snackbar anzeigen – bei einer reinen Link-Navigation hätte ein Fehler die Seite mit rohem JSON
  überschrieben oder wäre gar nicht sichtbar gewesen. **Bewusster Trade-off, nicht übersehen:** Die
  komplette Datei wird dafür einmal als Blob im Speicher gepuffert, bevor der Download startet – bei sehr
  großen 4K-Dateien (mehrere hundert MB) ist das spürbar, aber für v1 akzeptiert. Eine
  Streaming-zu-Disk-Lösung (File System Access API) wäre möglich, hat aber inkonsistente Browser-
  Unterstützung (u. a. nicht in Firefox/Safari) und würde einen zusätzlichen Speicherort-Dialog
  einführen, der dem gewohnten "ein Klick lädt in den Standard-Downloads-Ordner"-Verhalten widerspricht –
  für später vorgemerkt, falls große Downloads in der Praxis zum Problem werden.
  - **Passend zu Schritt 4 dokumentiert:** Kein Fortschrittsbalken in Prozent (Backend kennt die
    Zielgröße vorab nicht, siehe Schritt-4-Notiz) – nur ein indeterminierter Spinner im Button während
    des Downloads.
- **Fehlerbehandlung dreifach getestet, live:** (1) Erfolgreicher Download eines echten YouTube-Videos
  ("Me at the zoo", 240p) – Snackbar "Download gestartet.", Datei-Download über die Browser-eigene
  `<a download>`-Mechanik ausgelöst (`GET /api/download` → `200` im Network-Log bestätigt). (2) Backend
  gestoppt → Snackbar "Download fehlgeschlagen. Bitte versuche es erneut." mit "OK"-Aktion, Button danach
  wieder aktiv (kein hängender Lade-Zustand). (3) Erneuter Download über den Verlauf ("erneut
  herunterladen") – funktioniert ohne erneuten `/api/info`-Call, da alle nötigen Parameter im
  History-Eintrag gespeichert sind.
- **`DownloadHistoryService`** (`localStorage`, max. 10 Einträge, Dedup nach `sourceUrl+format+height` –
  ein Re-Download ersetzt den alten Eintrag statt ihn zu duplizieren, live verifiziert: nach dem
  "erneut herunterladen"-Klick blieb genau ein Eintrag in der Liste). `DownloadHistory`-Komponente zeigt
  Plattform-Icon, Titel, Format/Qualität, relative Zeitangabe (dependency-frei, kein zusätzliches
  Datums-Package) und einen Re-Download-Button pro Zeile, plus "Verlauf löschen".
- `MatSnackBar` funktioniert ohne `@angular/animations` (bestätigt die Schritt-6-Erkenntnis: Angular
  Material 22 braucht dafür kein Animations-Modul mehr).
- `ng test`/`ng build` weiterhin grün; Bundle-Budget-Warnung aus Schritt 8 unverändert im Blick (jetzt
  624 kB / 136 kB gzip, weiterhin für Schritt 16 vorgemerkt, kein Blocker).

---

## Phase 3 – Monetarisierung & Compliance

### Schritt 10: Google Ads – Platzierung & Komponente
Status: ✅ Erledigt

- [x] Wiederverwendbare `AdSlot`-Komponente mit fester Höhe/Aspect-Ratio (verhindert Layout-Shift/CLS).
- [x] Reservierte, responsive Slots planen: Banner oben, In-Content zwischen Eingabe und Ergebnis,
      Sidebar (nur Desktop), Footer-Banner (nur wenn Platz da ist, nicht aufdringlich).
- [x] Lazy-Loading der Ad-Slots (erst wenn sichtbar / nach Consent).

Ergebnis:
- **Vorgriff auf Schritt 11 bewusst minimal gehalten:** `AdSlot` muss laut Plan schon "nach Consent"
  laden, das eigentliche Consent-Banner kommt aber erst in Schritt 11. Deshalb jetzt nur ein schlanker
  `AdConsentService` (`src/app/core/ad-consent.service.ts`, Signal + `localStorage`, `granted()`
  standardmäßig `false`) angelegt, den `AdSlot` als Gate nutzt. Die volle Google-Consent-Mode-v2-
  Verdrahtung (`gtag('consent', ...)`) ist explizit **nicht** Teil dieses Schritts – das steht so in
  Schritt 11 und wird dort ergänzt, ohne dass an `AdSlot` noch etwas geändert werden muss.
- **Kein Fake-Publisher, um "es sieht fertig aus" zu simulieren:** `ads.config.ts` enthält
  `ADSENSE_CLIENT_ID = ''` und leere Ad-Unit-IDs pro Variante – es gibt noch kein echtes AdSense-Konto.
  `AdSlot` lädt das Google-Skript und pusht `adsbygoogle` **nur**, wenn Client-ID, Ad-Unit-ID, Sichtbarkeit
  UND Consent gleichzeitig erfüllt sind; live getestet, dass selbst mit manuell gesetztem
  `localStorage`-Consent kein Script nachgeladen wird, solange die Client-ID leer ist – der sichere
  Default funktioniert nachweislich, nicht nur angenommen.
- **Vier Slots wie im Plan gefordert**, als eine einzige Komponente mit `variant`-Input statt vier
  Varianten-Komponenten: `top`/`bottom` (volle Shell-Breite, ersetzen die Schritt-6-Platzhalter in
  `app.html`), `sidebar` (nur ab Desktop, wie zuvor), neu **`in-content`** (schmale 40rem-Spalte,
  zwischen `<app-url-input>` und `<app-video-preview>` in `home.html` – bewusst auf dieselbe Breite wie
  die restliche Inhaltsspalte begrenzt statt Shell-Breite, damit es sich optisch einfügt statt breiter zu
  wirken als der Rest der Seite).
- **Layout-Zuständigkeit an einer Stelle gebündelt statt über zwei Dateien verteilt:** Erste Version hatte
  Außenmaße teils in `app.scss` (Elternstyles auf den Tag-Namen `app-ad-slot`) und teils in der Komponente
  selbst – beim Bau der Sidebar-Variante wäre das in einen echten Bug gelaufen (Eltern-Styling hätte
  `width:100%` erzwungen, während die Komponente `flex: 0 0 300px` wollte). Vor dem Testen bemerkt und
  korrigiert: Jede Variante steuert ihre eigene Außengröße jetzt komplett selbst über ein
  `data-variant`-Attribut am eigenen Host (`host: { '[attr.data-variant]': 'variant()' }`), `app.scss`
  enthält dazu gar keine Ad-Slot-Styles mehr.
- **Barrierefreiheit:** Platzhalter-Text ist `aria-hidden`, sobald aber eine echte Anzeige lädt, wird das
  Verstecken bewusst aufgehoben (Drittanbieter-Inhalte dürfen nicht pauschal vor Screenreadern versteckt
  werden). Sidebar-Variante bekommt zusätzlich `role="complementary"`/`aria-label="Werbung"` als eigene
  Landmark.
- **Echten jsdom-Testumgebungsbug gefunden und nach demselben Muster wie Schritt 6 behoben:**
  `IntersectionObserver` existiert in der Vitest/jsdom-Testumgebung nicht (genau wie zuvor `matchMedia`/
  `localStorage`), `ng test` schlug direkt beim Erzeugen der Komponente fehl. Fix: Feature-Check vor der
  Nutzung, mit Fallback "sofort als sichtbar behandeln" statt nie zu laden – robuster als nur die
  Testumgebung zu patchen, hilft auch in echten, sehr alten Browsern ohne `IntersectionObserver`.
- Live getestet (Desktop/Mobile-Screenshots): alle vier Slots reservieren korrekt Platz, Sidebar
  verschwindet unterhalb der Desktop-Breakpoint, In-Content-Slot ist schmal wie die restliche Spalte,
  keine Konsolenfehler. `ng test`/`ng build` grün (Bundle-Budget-Warnung unverändert, weiterhin für
  Schritt 16 vorgemerkt).

### Schritt 11: Cookie-Consent & Google Consent Mode
Status: ✅ Erledigt

- [x] Consent-Banner (Ads erst nach Zustimmung laden), Zustimmung in `localStorage`/Cookie merken.
- [x] Google Consent Mode v2 korrekt verdrahten (notwendig für EWR/Deutschland).

Ergebnis:
- **War bereits vollständig implementiert, aber nicht als solches dokumentiert:** Der Code für diesen
  Schritt existierte schon (offenbar im selben Zug wie Schritt 10 mitgebaut), `PLAN.md` war dabei aber
  nicht aktualisiert worden (Status noch `🔄 Aktuell`, Checkboxen leer, kein Ergebnis-Text). Statt das
  einfach zu übernehmen, wurde der komplette Consent-Flow jetzt live im Browser verifiziert, bevor der
  Schritt als erledigt markiert wird (siehe unten) – kein Blindvertrauen auf vorhandenen Code.
- **`AdConsentService`** (`src/app/core/ad-consent.service.ts`): Signal-basierter Status
  (`undecided`/`granted`/`denied`), persistiert in `localStorage` (`amapin-ads-consent`, defensiv per
  `try/catch` wie der Theme-Toggle aus Schritt 6). `granted()` ist exakt das Gate, das `AdSlot` aus
  Schritt 10 bereits konsumiert – keine Änderung an `AdSlot` nötig. `reopenBanner()` erlaubt das
  nachträgliche Ändern der Wahl.
- **Google Consent Mode v2** korrekt zweigeteilt:
  - `src/index.html`: Inline-Skript ganz am Anfang von `<head>` (muss vor jedem Google-Tag laufen, daher
    nicht im Angular-Bundle) setzt `gtag('consent', 'default', {...})` mit `ad_storage`/`ad_user_data`/
    `ad_personalization` global auf `denied` plus `wait_for_update: 500`. Direkt danach liest dasselbe
    Skript synchron aus `localStorage`, ob bereits zugestimmt wurde, und ruft in dem Fall sofort
    `gtag('consent', 'update', ...)` mit `granted` auf – noch bevor Angular überhaupt bootet.
  - `src/app/core/google-consent.ts` (`updateGoogleAdConsent()`): zur Laufzeit aufgerufen, wenn der
    Nutzer im Banner klickt.
  - Kein `analytics_storage` gesetzt – bewusst, da die App kein Google Analytics einsetzt, nur AdSense.
  - Kein `region`-Parameter gesetzt – bewusste, konservativere Entscheidung: Default ist weltweit
    `denied`, das deckt EWR/Deutschland vollständig ab (eher strenger als nötig für Nicht-EWR-Nutzer,
    aber rechtlich unbedenklich; eine Region-Einschränkung wäre nur nötig, um außerhalb der EWR laxere
    Defaults zu fahren, was hier nicht gewünscht ist).
- **`ConsentBanner`** (`src/app/features/consent-banner/`): Fixed-position-Banner, zwei gleichwertige
  Buttons "Ablehnen"/"Alle akzeptieren" nebeneinander (keiner in einem Untermenü versteckt – das ist in
  Deutschland/EU rechtlich relevant, siehe Rechtsprechung zu Cookie-Bannern). Footer-Link
  "Cookie-Einstellungen" (`app.html`) ruft `reopenBanner()`, um die Wahl jederzeit zu ändern. Bewusst
  binäres Grant/Deny statt granularer Kategorien: Es gibt nur eine einzige optionale Kategorie (Werbung/
  AdSense), technisch notwendige Cookies brauchen laut Gesetz ohnehin keine Zustimmung – eine
  Kategorie-Matrix wäre hier Overengineering.
- **Live im Browser verifiziert (nicht nur Code gelesen):**
  1. Erster Besuch → Banner erscheint automatisch, Screenshot bestätigt sauberes Layout (Desktop + Mobile
     375px, kein horizontales Scrollen, Buttons gut große Touch-Targets).
  2. "Ablehnen" geklickt → Banner schließt, `localStorage` → `"denied"`, `dataLayer` enthält
     `consent update` mit allen drei Werten `denied`.
  3. "Cookie-Einstellungen" im Footer geklickt → Banner öffnet sich erneut korrekt.
  4. "Alle akzeptieren" geklickt → Banner schließt, `localStorage` → `"granted"`, `dataLayer` enthält
     `consent update` mit allen drei Werten `granted`.
  5. Seite neu geladen (Zustimmung bereits gespeichert) → Banner bleibt **zu** (kein erneutes Fragen),
     `dataLayer`-Reihenfolge bestätigt exakt das erwartete Verhalten: zuerst `default: denied` (Inline-
     Skript), sofort danach `update: granted` (derselbe Inline-Skript-Block, aus `localStorage`) – beides
     vor dem ersten Angular-Log.
  6. Keine Konsolenfehler in keinem der obigen Schritte.
- **Für Schritt 12 vorgemerkt:** Der Banner verlinkt bereits auf `/datenschutz`
  (`src/app/pages/privacy/`), die Seite selbst ist aber noch ein Platzhalter ("wird in Schritt 12
  ausgefüllt") – das ist die nächste, bereits erwartete Abhängigkeit.

### Schritt 12: Rechtstexte
Status: 🔄 Aktuell (blockiert auf eine fehlende Angabe, siehe unten)

- [~] Impressum-Seite. – **Inhaltlich fertig, aber unvollständig:** Anschrift fehlt noch (Pflichtangabe
      nach § 5 DDG). Sobald nachgereicht, nur noch in `impressum.html`/`privacy.html` einsetzen und
      Checkbox/Status hier auf erledigt setzen.
- [x] Datenschutzerklärung (inkl. Hinweis auf Google Ads/Cookies).
- [x] Nutzungsbedingungen mit Disclaimer zur rechtmäßigen Nutzung (Urheberrecht liegt beim Nutzer).

Ergebnis (Zwischenstand):
- **Bewusst nicht geraten, was rechtlich bindend ist:** Für das Impressum sind Name/Anschrift/Kontakt
  Pflichtangaben, die ich nicht annehmen oder platzhalterhaft erfinden darf (siehe Plan-Regel 6). Beim
  Nutzer nachgefragt: Betreiber ist eine **Privatperson** (Rami Almofleh, E-Mail
  `rami.almofleh@web.de`). Die **ladungsfähige Anschrift steht noch aus** – zweimal nachgefragt, bisher
  nicht erhalten. Damit das nicht als "fertig" durchrutscht, ist der Platzhalter im UI selbst bewusst
  unübersehbar (roter, fettgedruckter Text `[Anschrift folgt – vor Veröffentlichung zwingend ergänzen]`
  in `impressum.html` und `privacy.html`) statt in einem Kommentar versteckt, den man leicht übersieht.
  **Vor jedem echten Deployment zwingend nachtragen.**
- **Gemeinsames Layout statt dreifacher Duplikation:** Alle drei Rechtsseiten (Impressum, Datenschutz,
  Nutzungsbedingungen) nutzen identisches Layout (Überschriften, Absätze, Listen, `<address>`) – dafür
  eine globale `.legal-page`-Klasse in `src/styles.scss` ergänzt statt sie in drei einzelnen
  Komponenten-SCSS-Dateien zu duplizieren. Keine der drei Seiten-Komponenten hat dadurch noch eine
  eigene `.scss`-Datei (auch `privacy.scss` entfernt, war nur noch die alte Duplizierung).
- **Neue Seiten/Routen:** `src/app/pages/impressum/` (neu), `src/app/pages/terms/` (neu,
  `/nutzungsbedingungen`), `src/app/pages/privacy/privacy.html` (Platzhalter-Text durch echten Inhalt
  ersetzt). `app.routes.ts` um beide neuen Pfade ergänzt.
- **Datenschutzerklärung inhaltlich an den tatsächlichen Code verifiziert, nicht angenommen:** Vor dem
  Schreiben nachgeschaut, was wirklich passiert – `server/middleware/requestLogger.mjs` loggt bewusst
  **keine** IP-Adressen (nur Methode/Pfad/Status/Dauer), IP-Adressen fließen nur kurzzeitig ins
  In-Memory-Rate-Limiting (Schritt 5, 10-Minuten-Fenster) ein; alle drei tatsächlich verwendeten
  `localStorage`-Keys (`amapin-theme`, `amapin-ads-consent`, `amapin-download-history`) sind einzeln mit
  Zweck benannt, keine erfundenen/generischen "Cookies"-Floskeln. Abschnitt zu Google AdSense verweist
  konsistent auf den bereits gebauten Consent-Mechanismus aus Schritt 11 (Standard „denied“, Widerruf
  jederzeit über „Cookie-Einstellungen“). Abschnitt „Hosting“ bewusst noch als Platzhalter markiert, da
  Schritt 15 (Deployment) den tatsächlichen Anbieter erst festlegt – hier nichts vorweggenommen, was noch
  nicht feststeht.
- **Nutzungsbedingungen mit dem im Plan geforderten Disclaimer:** Abschnitt 4 stellt unmissverständlich
  klar, dass Amapin selbst keine Nutzungsrechte an den abgerufenen Inhalten einräumt und die
  Verantwortung für eine rechtmäßige Nutzung (Urheberrecht, Plattform-AGB) beim Nutzer liegt – als
  hervorgehobener `<strong>`-Absatz, nicht im Fließtext versteckt.
- **Footer erweitert** (`app.html`/`app.scss`): jetzt vier Einträge (Impressum, Datenschutz,
  Nutzungsbedingungen, Cookie-Einstellungen) statt zwei. Dabei einen echten Layout-Bug vor dem
  Live-Test bemerkt und behoben: `.shell__footer-links` hatte kein `flex-wrap`, vier Einträge auf
  schmalen Viewports hätten also horizontal überlaufen können – `flex-wrap: wrap` ergänzt.
- **Live getestet (Desktop + Mobile 375px):** Alle drei neuen/aktualisierten Seiten über die
  Footer-Links angesteuert und den gerenderten Inhalt per Screenshot geprüft (Impressum-Platzhalter gut
  sichtbar rot, Datenschutz- und Nutzungsbedingungen-Inhalt korrekt formatiert inkl. `<strong>`-Hervorhebung).
  Footer auf Mobile bricht sauber in zwei Zeilen um, kein horizontales Scrollen. `ng build` (nur die
  bereits aus Schritt 8 bekannte Bundle-Budget-Warnung, kein Fehler) und `ng test` liefen grün.
- **Offen, bevor dieser Schritt komplett auf ✅ gesetzt werden kann:** Anschrift für das Impressum vom
  Nutzer nachreichen lassen, dann in `impressum.html` und `privacy.html` die
  `[Anschrift folgt – …]`-Platzhalter ersetzen.

---

## Phase 4 – Qualität, Performance, Deployment

### Schritt 13: Responsivität-Feinschliff & Barrierefreiheit
Status: Offen

- [ ] Durchgängiger Test auf Mobile/Tablet/Desktop (echte Breakpoints, Touch-Targets, keine
      horizontalen Scrollbalken).
- [ ] a11y-Check (Kontraste, aria-Attribute, Tab-Reihenfolge).
- Ergebnis:

### Schritt 14: Tests
Status: Offen

- [ ] Frontend Unit-Tests (Vitest) für zentrale Komponenten/Services.
- [ ] Backend-Tests für `yt-dlp`-Service, URL-Validierung, Fehlerfälle.
- [ ] Mindestens ein End-to-End-Smoke-Test (Happy Path: Link einfügen → Format wählen → Download).
- Ergebnis:

### Schritt 15: Deployment-Vorbereitung
Status: Offen

- [ ] Docker-Image mit Node + `ffmpeg` + `yt-dlp`-Binary.
- [ ] Hosting-Entscheidung dokumentieren (kein reines Static-Hosting möglich, siehe Architektur-Notiz).
- [ ] Env-Variablen/Konfiguration für Produktion (z. B. AdSense-Client-ID, Rate-Limits).
- Ergebnis:

### Schritt 16: Launch-Feinschliff
Status: Offen

- [ ] SEO-Meta-Tags, OpenGraph, Favicon/App-Icons.
- [ ] Lighthouse-/Performance-Audit, insbesondere wegen Ads (CLS/LCP).
- [ ] Fehler-Monitoring/Logging für Produktion.
- Ergebnis:

---

## Änderungsprotokoll
- _(Hier kurze Einträge ergänzen, wenn der Plan während der Umsetzung angepasst wird.)_
- **Schritt 4:** Die in der Architektur-Notiz/Schritt 1 angenommene "kein Zwischenspeichern auf Disk"-
  Regel gilt jetzt nur noch für Audio (MP3/WAV). Für MP4 ist ein kurzlebiges Temp-File technisch
  notwendig, da ein valider MP4-Merge einen seekable Output braucht – per Live-Test verifiziert, Details
  siehe Ergebnis von Schritt 4.


server {
server_name yt-dow.almofleh.com;

    location ^~ /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
        default_type "text/plain";
        try_files $uri =404;
    }

    root /home/rami/apps/yt-dow/dist/amapin/browser;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ /index.html;
    }

    listen [::]:443 ssl; # managed by Certbot
    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/yt-dow.almofleh.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/yt-dow.almofleh.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot

}
server {
if ($host = yt-dow.almofleh.com) {
return 301 https://$host$request_uri;
} # managed by Certbot


    listen 80;
    listen [::]:80;
    server_name yt-dow.almofleh.com;
    return 404; # managed by Certbot


}
