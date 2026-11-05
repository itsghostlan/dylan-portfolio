import {
  type CSSProperties,
  type KeyboardEventHandler,
  type PointerEventHandler,
  useEffect,
  useRef,
  useState,
} from "react"
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  PackageCheck,
  Sparkles,
  Tag,
  UserRound,
  X,
} from "lucide-react"

type PageId = "home" | "about" | "projects" | "work" | "contact"

const pages: { id: PageId; label: string; track: string }[] = [
  { id: "home", label: "Home", track: "00" },
  { id: "about", label: "About", track: "01" },
  { id: "projects", label: "Projects", track: "02" },
  { id: "work", label: "Work", track: "03" },
  { id: "contact", label: "Contact", track: "04" },
]

type Project = {
  slug: string
  number: string
  title: string
  type: string
  year: string
  featured: boolean
  images: string[]
  role?: string
  client?: string
  tags?: string[]
  deliverables?: string[]
}

type WorkItem = {
  slug: string
  title: string
  year: string
  media: string[]
  order?: number | null
}

type SiteSettings = {
  siteTitle: string
  homeEyebrow: string
  heroHeading: string
  heroAccent: string
  heroDescription: string
  aboutHeading: string
  aboutBio: string
  aboutExperience: string
  skills: string[]
  contactHeading: string
  email: string
  socials: { label: string; url: string }[]
  footerNote: string
  copyrightYear: string
}

type Post = {
  slug: string
  title: string
  date: string
  excerpt: string
  body: string
  published: boolean
}

const defaultSettings: SiteSettings = {
  siteTitle: "itsghostlan",
  homeEyebrow: "Welcome · itsghostlan",
  heroHeading: "Ideas with",
  heroAccent: "good rhythm.",
  heroDescription:
    "An independent creative practice building identities, images, and digital worlds for people shaping culture.",
  aboutHeading: "Design should feel inevitable, never obvious.",
  aboutBio:
    "I’m itsghostlan, an independent designer working across identity, digital, and art direction. My practice is built on curiosity, clarity, and a healthy respect for the strange.",
  aboutExperience:
    "Previously at Studio North. Currently collaborating with founders, artists, and teams who care about making things with a point of view.",
  skills: ["Strategy", "Art direction", "Digital design", "Identity"],
  contactHeading: "Let’s make something worth replaying.",
  email: "hello@norareyes.design",
  socials: [
    { label: "Instagram", url: "#instagram" },
    { label: "LinkedIn", url: "#linkedin" },
    { label: "Are.na", url: "#are.na" },
  ],
  footerNote: "Independent since 2021",
  copyrightYear: "2025",
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function contentOrEmpty(value: string): string {
  return value.trim() || "No content yet."
}

function isVideoFile(source: string): boolean {
  const pathname = source.split(/[?#]/, 1)[0].toLowerCase()
  return /\.(mp4|webm|mov|m4v|ogv)$/.test(pathname)
}

function MediaPreview({
  source,
  alt,
  className,
}: {
  source: string
  alt: string
  className?: string
}) {
  return isVideoFile(source) ? (
    <video
      className={className}
      src={source}
      aria-label={alt}
      controls
      playsInline
      preload="metadata"
    />
  ) : (
    <img className={className} src={source} alt={alt} />
  )
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function parseSiteSettings(value: unknown): SiteSettings | null {
  if (!isRecord(value)) return null
  const skills = Array.isArray(value.skills) ? value.skills : []
  const socials = Array.isArray(value.socials) ? value.socials : []
  return {
    siteTitle: asString(value.siteTitle),
    homeEyebrow: asString(value.homeEyebrow),
    heroHeading: asString(value.heroHeading),
    heroAccent: asString(value.heroAccent),
    heroDescription: asString(value.heroDescription),
    aboutHeading: asString(value.aboutHeading),
    aboutBio: asString(value.aboutBio),
    aboutExperience: asString(value.aboutExperience),
    skills: skills.filter((skill): skill is string => typeof skill === "string"),
    contactHeading: asString(value.contactHeading),
    email: asString(value.email),
    socials: socials.filter(isRecord).map((social) => ({
      label: asString(social.label),
      url: asString(social.url),
    })),
    footerNote: asString(value.footerNote),
    copyrightYear: asString(value.copyrightYear),
  }
}

function parseProject(value: unknown): Project | null {
  if (!isRecord(value)) return null
  const images = Array.isArray(value.images) ? value.images : []
  const tags = Array.isArray(value.tags) ? value.tags : []
  const deliverables = Array.isArray(value.deliverables)
    ? value.deliverables
    : []
  return {
    slug: asString(value.slug),
    number: asString(value.number),
    title: asString(value.title),
    type: asString(value.type),
    year: asString(value.year),
    featured: value.featured === true,
    images: images.filter((image): image is string => typeof image === "string"),
    role: asString(value.role),
    client: asString(value.client),
    tags: tags.filter((tag): tag is string => typeof tag === "string"),
    deliverables: deliverables.filter(
      (deliverable): deliverable is string => typeof deliverable === "string",
    ),
  }
}

function parseWorkItem(value: unknown): WorkItem | null {
  if (!isRecord(value)) return null
  const media = Array.isArray(value.media) ? value.media : []
  return {
    slug: asString(value.slug),
    title: asString(value.title),
    year: asString(value.year),
    media: media.filter((file): file is string => typeof file === "string"),
    order:
      typeof value.order === "number" || value.order === null
        ? value.order
        : undefined,
  }
}

function parsePost(value: unknown): Post | null {
  if (!isRecord(value)) return null
  return {
    slug: asString(value.slug),
    title: asString(value.title),
    date: asString(value.date),
    excerpt: asString(value.excerpt),
    body: asString(value.body),
    published: value.published === true,
  }
}

const needleAngles: Record<PageId, number> = {
  home: 14,
  about: 22,
  projects: 30,
  work: 38,
  contact: 46,
}

function ArrowIcon() {
  return <ArrowRight aria-hidden="true" />
}

type VinylProps = {
  spin: number
  page: PageId
  dragRotation: number
  isDragging: boolean
  activePageIndex: number
  onPointerDown: PointerEventHandler<HTMLDivElement>
  onPointerMove: PointerEventHandler<HTMLDivElement>
  onPointerUp: PointerEventHandler<HTMLDivElement>
  onKeyDown: KeyboardEventHandler<HTMLDivElement>
  onWheelNavigate: (deltaY: number) => void
}

function Vinyl({
  spin,
  page,
  dragRotation,
  isDragging,
  activePageIndex,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onKeyDown,
  onWheelNavigate,
}: VinylProps) {
  const stageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      event.stopPropagation()
      onWheelNavigate(event.deltaY)
    }

    stage.addEventListener("wheel", handleWheel, { passive: false })
    return () => stage.removeEventListener("wheel", handleWheel)
  }, [onWheelNavigate])

  return (
    <div
      ref={stageRef}
      className={`vinyl-stage ${isDragging ? "is-dragging" : ""}`}
      role="slider"
      tabIndex={0}
      aria-label="Drag vertically to choose a page"
      aria-valuemin={0}
      aria-valuemax={pages.length - 1}
      aria-valuenow={activePageIndex}
      aria-valuetext={pages[activePageIndex].label}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
    >
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div
        className="vinyl"
        style={{ transform: `rotate(${spin * 165 + dragRotation}deg)` }}
      >
        <div className="grooves" />
        <div className="vinyl-shine" />
        <div className="label">
          <span>PORTFOLIO</span>
          <strong>itsghostlan</strong>
          <span>PLAY LOUD</span>
        </div>
        <div className="spindle" />
      </div>
      <div className="needle">
        <div className="needle-pivot" />
        <div
          className="needle-arm"
          style={{ transform: `rotate(${needleAngles[page]}deg)` }}
        />
        <div
          className="needle-head"
          style={{ transform: `rotate(${needleAngles[page]}deg)` }}
        />
      </div>
    </div>
  )
}

function ScrollProgressButton() {
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const updateProgress = () => {
      const scrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight
      const nextProgress =
        scrollableHeight > 0 ? (window.scrollY / scrollableHeight) * 100 : 0
      setProgress(Math.max(0, Math.min(100, nextProgress)))
      setIsVisible(window.scrollY > 180)
    }

    updateProgress()
    window.addEventListener("scroll", updateProgress, { passive: true })
    window.addEventListener("resize", updateProgress)
    return () => {
      window.removeEventListener("scroll", updateProgress)
      window.removeEventListener("resize", updateProgress)
    }
  }, [])

  return (
    <button
      className={`scroll-progress ${isVisible ? "is-visible" : ""}`}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label={`Back to top, ${Math.round(progress)}% down the page`}
    >
      <span className="scroll-progress-label">Back to top</span>
      <span className="scroll-progress-ring" aria-hidden="true">
        <svg viewBox="0 0 56 56">
          <circle className="scroll-progress-track" cx="28" cy="28" r="24" />
          <circle
            className="scroll-progress-value"
            cx="28"
            cy="28"
            r="24"
            pathLength="100"
            style={{ strokeDashoffset: 100 - progress }}
          />
        </svg>
        <ArrowUp className="scroll-progress-arrow" aria-hidden="true" />
      </span>
    </button>
  )
}

function ProjectDetailPage({
  project,
  projects,
  settings,
  onBack,
}: {
  project: Project
  projects: Project[]
  settings: SiteSettings
  onBack: () => void
}) {
  const media = project.images.map((source) => ({
    src: source,
    alt: project.title || "Project image",
  }))
  const displayMedia = media.length > 0 ? media : [{ src: "", alt: "" }]
  const [activeMedia, setActiveMedia] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  const moveMedia = (direction: number) => {
    if (media.length < 2) return
    setActiveMedia(
      (current) => (current + direction + media.length) % media.length,
    )
  }

  useEffect(() => {
    if (!isLightboxOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsLightboxOpen(false)
      if (event.key === "ArrowLeft") moveMedia(-1)
      if (event.key === "ArrowRight") moveMedia(1)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isLightboxOpen])

  return (
    <main className="project-detail-shell">
      <header className="project-detail-nav">
        <button className="project-detail-brand" onClick={onBack}>
          {contentOrEmpty(settings.siteTitle)}
        </button>
        <button className="project-back" onClick={onBack}>
          <ArrowLeft aria-hidden="true" />
          All projects
        </button>
      </header>

      <article className="project-page">
        <header className="project-page-header">
          <div>
            <p className="eyebrow">
              Project {project.number} · {contentOrEmpty(project.type)}
            </p>
            <h1>{contentOrEmpty(project.title)}</h1>
          </div>
          <div className="project-facts">
            <div>
              <span>
                <UserRound aria-hidden="true" />
                Role
              </span>
            <strong>{contentOrEmpty(project.role ?? "")}</strong>
            </div>
            <div>
              <span>
                <Building2 aria-hidden="true" />
                Client
              </span>
            <strong>{contentOrEmpty(project.client ?? "")}</strong>
            </div>
            <div>
              <span>
                <CalendarDays aria-hidden="true" />
                Year
              </span>
              <strong>{contentOrEmpty(project.year)}</strong>
            </div>
          </div>
        </header>

        <section className="project-carousel" aria-label="Project media">
          <div className="project-carousel-stage">
            <button
              className="project-carousel-main"
              onClick={() => setIsLightboxOpen(true)}
              aria-label="Enlarge current image"
            >
              {displayMedia[activeMedia]?.src ? (
                <MediaPreview
                  key={displayMedia[activeMedia].src}
                  source={displayMedia[activeMedia].src}
                  alt={displayMedia[activeMedia].alt}
                />
              ) : (
                <span className="empty-content">No content yet.</span>
              )}
              <span>
                <Maximize2 aria-hidden="true" />
                Click to enlarge
              </span>
            </button>
            <button
              className="carousel-arrow carousel-arrow-left"
              onClick={() => moveMedia(-1)}
              aria-label="Previous image"
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <button
              className="carousel-arrow carousel-arrow-right"
              onClick={() => moveMedia(1)}
              aria-label="Next image"
            >
              <ChevronRight aria-hidden="true" />
            </button>
          </div>
          <div className="project-carousel-footer">
            <div className="carousel-thumbnails">
              {displayMedia.map((item, index) => (
                <button
                  className={activeMedia === index ? "active" : ""}
                  key={item.src}
                  onClick={() => setActiveMedia(index)}
                  aria-label={`View image ${index + 1}`}
                >
                  {item.src ? <img src={item.src} alt="" /> : <span />}
                </button>
              ))}
            </div>
            <span>
              {String(activeMedia + 1).padStart(2, "0")} /{" "}
              {String(media.length).padStart(2, "0")}
            </span>
          </div>
        </section>

        <div className="project-page-footer">
          <div>
            <p className="eyebrow detail-heading">
              <Tag aria-hidden="true" />
              Tags
            </p>
            <div className="detail-tags">
              {project.tags?.length ? (
                project.tags.map((tag) => <span key={tag}>{tag}</span>)
              ) : (
                <span className="empty-content">No content yet.</span>
              )}
            </div>
          </div>
          <div>
            <p className="eyebrow detail-heading">
              <PackageCheck aria-hidden="true" />
              Deliverables
            </p>
            {project.deliverables?.length ? (
              <ul>
                {project.deliverables.map((deliverable) => (
                  <li key={deliverable}>{deliverable}</li>
                ))}
              </ul>
            ) : (
              <p className="empty-content">No content yet.</p>
            )}
          </div>
        </div>
      </article>

      {isLightboxOpen && (
        <div
          className="project-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged project image"
        >
          <button
            className="lightbox-close"
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Close enlarged image"
          >
            <X aria-hidden="true" />
            Close
          </button>
          <button
            onClick={() => moveMedia(-1)}
            aria-label="Previous enlarged image"
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          {displayMedia[activeMedia]?.src ? (
            <MediaPreview
              source={displayMedia[activeMedia].src}
              alt={displayMedia[activeMedia].alt}
            />
          ) : (
            <span className="empty-content">No content yet.</span>
          )}
          <button onClick={() => moveMedia(1)} aria-label="Next enlarged image">
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      )}
      <footer>
        <p>{contentOrEmpty(settings.footerNote)}</p>
        <p className="now-playing">
          <span>Now playing</span>
          {contentOrEmpty(project.title)}
        </p>
        <div className="footer-meta">
          <p>© {contentOrEmpty(settings.copyrightYear)}</p>
          <a
            className="footer-admin"
            href="./admin/"
            aria-label="Edit this website with GitHub"
            title="Edit this website with GitHub"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.56.1.76-.24.76-.54v-2.1c-3.1.68-3.75-1.32-3.75-1.32-.5-1.3-1.24-1.65-1.24-1.65-1.01-.7.08-.69.08-.69 1.12.08 1.71 1.15 1.71 1.15 1 .1.76 2.26 4.1 1.65.1-.72.4-1.21.7-1.49-2.48-.28-5.08-1.24-5.08-5.52 0-1.22.44-2.21 1.15-2.99-.12-.28-.5-1.41.11-2.94 0 0 .94-.3 3.06 1.14a10.64 10.64 0 0 1 5.57 0c2.12-1.44 3.05-1.14 3.05-1.14.61 1.53.23 2.66.11 2.94.72.78 1.15 1.77 1.15 2.99 0 4.29-2.6 5.24-5.09 5.52.4.35.75 1.03.75 2.08v3.08c0 .3.2.65.76.54A11.1 11.1 0 0 0 12 .9Z" />
            </svg>
          </a>
        </div>
      </footer>
      <ScrollProgressButton />
    </main>
  )
}

export default function App() {
  const [page, setPage] = useState<PageId>("home")
  const [spin, setSpin] = useState(0)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [workItems, setWorkItems] = useState<WorkItem[]>([])
  const [settings, setSettings] = useState(defaultSettings)
  const [posts, setPosts] = useState<Post[]>([])
  const [contentError, setContentError] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const [previewPageIndex, setPreviewPageIndex] = useState<number | null>(null)
  const dragStart = useRef<{ y: number; index: number } | null>(null)
  const wheelLocked = useRef(false)
  const isHome = page === "home"
  const activePageIndex = pages.findIndex((item) => item.id === page)
  const displayedPageIndex = previewPageIndex ?? activePageIndex
  const displayedPage = pages[displayedPageIndex].id

  useEffect(() => {
    let cancelled = false
    const loadJson = async (path: string): Promise<unknown> => {
      const response = await fetch(`${import.meta.env.BASE_URL}content/${path}`)
      if (!response.ok) {
        throw new Error(`Could not load content/${path} (${response.status}).`)
      }
      return response.json()
    }

    const loadContent = async () => {
      const [settingsData, projectsData, workData, postsData] = await Promise.all([
        loadJson("site-settings.json"),
        loadJson("projects-index.json"),
        loadJson("work-index.json"),
        loadJson("posts.json"),
      ])
      const loadedSettings = parseSiteSettings(settingsData)
      if (!loadedSettings) {
        throw new Error("content/site-settings.json has an invalid shape.")
      }
      if (
        !isRecord(projectsData) ||
        !Array.isArray(projectsData.projects)
      ) {
        throw new Error("content/projects-index.json must contain a list of valid projects.")
      }
      if (
        !isRecord(workData) ||
        !Array.isArray(workData.work)
      ) {
        throw new Error("content/work-index.json must contain a list of valid work items.")
      }
      if (
        !isRecord(postsData) ||
        !Array.isArray(postsData.posts)
      ) {
        throw new Error("content/posts.json must contain a list of valid posts.")
      }
      const loadedProjects = projectsData.projects.map(parseProject)
      const loadedWork = workData.work.map(parseWorkItem)
      const loadedPosts = postsData.posts.map(parsePost)
      if (
        loadedProjects.some((project) => project === null) ||
        loadedWork.some((item) => item === null) ||
        loadedPosts.some((post) => post === null)
      ) {
        throw new Error("Content entries must be JSON objects.")
      }
      if (cancelled) return
      setSettings(loadedSettings)
      setProjects(loadedProjects.filter((project): project is Project => project !== null))
      setWorkItems(loadedWork.filter((item): item is WorkItem => item !== null))
      setPosts(loadedPosts.filter((post): post is Post => post !== null))
      setContentError(null)
    }

    loadContent().catch((error: unknown) => {
      if (cancelled) return
      const message =
        error instanceof Error ? error.message : "Unknown content loading error."
      console.error("Portfolio content could not be loaded.", error)
      setContentError(message)
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    document.title = contentOrEmpty(settings.siteTitle)
    const syncHash = () => {
      const hash = window.location.hash.slice(1)
      if (hash.startsWith("project-")) {
        const project = projects.find((item) => item.slug === hash.slice(8))
        if (project) {
          setPage("projects")
          setSelectedProject(project)
        }
        return
      }
      const pageFromHash = hash as PageId
      if (pages.some((item) => item.id === pageFromHash)) {
        setPage(pageFromHash)
        setSelectedProject(null)
      }
    }

    syncHash()
    window.addEventListener("hashchange", syncHash)
    return () => window.removeEventListener("hashchange", syncHash)
  }, [projects, settings.siteTitle])

  const navigate = (nextPage: PageId) => {
    if (nextPage === page) {
      if (selectedProject) {
        setSelectedProject(null)
        window.history.pushState(null, "", `#${nextPage}`)
      }
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    setSpin((value) => value + 1)
    setPage(nextPage)
    setSelectedProject(null)
    window.history.replaceState(null, "", `#${nextPage}`)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const openProject = (project: Project) => {
    setPage("projects")
    setSelectedProject(project)
    window.history.pushState(null, "", `#project-${project.slug}`)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const closeProject = () => {
    setSelectedProject(null)
    window.history.pushState(null, "", "#projects")
    window.setTimeout(() => {
      document
        .getElementById("page-content")
        ?.scrollIntoView({ behavior: "smooth" })
    }, 0)
  }

  const clampPageIndex = (index: number) =>
    Math.max(0, Math.min(pages.length - 1, index))

  const handleVinylPointerDown: PointerEventHandler<HTMLDivElement> = (
    event,
  ) => {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragStart.current = { y: event.clientY, index: activePageIndex }
    setPreviewPageIndex(activePageIndex)
    setDragOffset(0)
  }

  const handleVinylPointerMove: PointerEventHandler<HTMLDivElement> = (
    event,
  ) => {
    if (!dragStart.current) return
    const distance = event.clientY - dragStart.current.y
    const targetIndex = clampPageIndex(
      Math.round(dragStart.current.index + distance / 110),
    )
    setDragOffset(distance * 0.85)
    setPreviewPageIndex(targetIndex)
  }

  const handleVinylPointerUp: PointerEventHandler<HTMLDivElement> = (event) => {
    if (!dragStart.current) return
    const distance = event.clientY - dragStart.current.y
    const targetIndex = clampPageIndex(
      Math.round(dragStart.current.index + distance / 110),
    )
    dragStart.current = null
    setDragOffset(0)
    setPreviewPageIndex(null)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (targetIndex !== activePageIndex) navigate(pages[targetIndex].id)
  }

  const handleVinylKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return
    event.preventDefault()
    const direction = event.key === "ArrowDown" ? 1 : -1
    const targetIndex = clampPageIndex(activePageIndex + direction)
    if (targetIndex !== activePageIndex) navigate(pages[targetIndex].id)
  }

  const handleVinylWheel = (deltaY: number) => {
    if (wheelLocked.current || Math.abs(deltaY) < 8) return
    const direction = deltaY > 0 ? 1 : -1
    const targetIndex = clampPageIndex(activePageIndex + direction)
    if (targetIndex === activePageIndex) return
    wheelLocked.current = true
    navigate(pages[targetIndex].id)
    window.setTimeout(() => {
      wheelLocked.current = false
    }, 520)
  }

  if (selectedProject) {
    return (
      <ProjectDetailPage
        project={selectedProject}
        projects={projects}
        settings={settings}
        onBack={closeProject}
      />
    )
  }

  return (
    <main className={`site-shell ${isHome ? "is-home" : "is-inner"}`}>
      {contentError && (
        <p className="content-load-error" role="alert">
          The portfolio is showing its original content because an update could
          not be loaded: {contentError}
        </p>
      )}
      <div className="audio-hero">
        <div className="sound-visualizer" aria-hidden="true">
          {Array.from({ length: 32 }, (_, index) => {
            const baseHeight = 12 + ((index * 17) % 31)
            const pageBoost = displayedPageIndex * 14

            return (
              <span
                key={index}
                style={{
                  height: `${Math.min(92, baseHeight + pageBoost)}%`,
                  animationDelay: `${index * -83}ms`,
                  animationDuration: `${800 + (index % 7) * 55}ms`,
                }}
              />
            )
          })}
        </div>

        <div className="record-area">
          <Vinyl
            spin={spin}
            page={displayedPage}
            dragRotation={dragOffset}
            isDragging={previewPageIndex !== null}
            activePageIndex={displayedPageIndex}
            onPointerDown={handleVinylPointerDown}
            onPointerMove={handleVinylPointerMove}
            onPointerUp={handleVinylPointerUp}
            onKeyDown={handleVinylKeyDown}
            onWheelNavigate={handleVinylWheel}
          />
        </div>

        <nav className="track-nav" aria-label="Primary navigation">
          {pages.map((item, index) => (
            <button
              className={displayedPageIndex === index ? "active" : ""}
              key={item.id}
              onClick={() => navigate(item.id)}
              aria-current={page === item.id ? "page" : undefined}
              style={
                {
                  "--angle": `${(index - displayedPageIndex) * 18}deg`,
                } as CSSProperties
              }
            >
              <span>{item.track}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <a className="scroll-cue" href="#page-content">
          Scroll for page content
          <span aria-hidden="true">↓</span>
        </a>
      </div>

      <section className="content-area" id="page-content">
        <div
          className="content-side-bars content-side-bars-left"
          aria-hidden="true"
        >
          {Array.from({ length: 64 }, (_, index) => (
            <span
              key={index}
              style={
                {
                  "--bar-width": `${28 + ((index * 37) % 72)}%`,
                  animationDelay: `${index * -71}ms`,
                  animationDuration: `${820 + (index % 6) * 90}ms`,
                } as CSSProperties
              }
            />
          ))}
        </div>
        <div
          className="content-side-bars content-side-bars-right"
          aria-hidden="true"
        >
          {Array.from({ length: 64 }, (_, index) => (
            <span
              key={index}
              style={
                {
                  "--bar-width": `${28 + (((index + 3) * 41) % 72)}%`,
                  animationDelay: `${index * -83}ms`,
                  animationDuration: `${860 + (index % 5) * 105}ms`,
                } as CSSProperties
              }
            />
          ))}
        </div>

        <div className={`page-panel page-${page}`} key={page}>
          {page === "home" && (
            <div className="home-copy">
              <div className="home-welcome">
                <div>
                  <p className="eyebrow">{contentOrEmpty(settings.homeEyebrow)}</p>
                  <h1>
                    {contentOrEmpty(settings.heroHeading)}
                    <br />
                    <em>{contentOrEmpty(settings.heroAccent)}</em>
                  </h1>
                  <p className="intro">{contentOrEmpty(settings.heroDescription)}</p>
                </div>
                <figure className="welcome-image">
                  <img
                    src="https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=82&w=1200"
                    alt="A vinyl record playing on a turntable"
                  />
                  <figcaption>Currently playing · selected works</figcaption>
                </figure>
              </div>

              <div className="home-selected">
                <div className="section-heading">
                  <p className="eyebrow">Selected work</p>
                  <span>{String(Math.min(projects.filter((project) => project.featured).length, 3)).padStart(2, "0")} projects</span>
                </div>
                <div className="project-list">
                  {projects.filter((project) => project.featured).length === 0 && (
                    <p className="empty-content">No content yet.</p>
                  )}
                  {projects.filter((project) => project.featured).slice(0, 3).map((project) => (
                    <button
                      className="project"
                      key={project.slug}
                      onClick={() => openProject(project)}
                    >
                      {project.images[0] ? (
                        <MediaPreview
                          className="project-thumb"
                          source={project.images[0]}
                          alt={project.title || "Project image"}
                        />
                      ) : (
                        <span className="project-thumb empty-content">
                          No content yet.
                        </span>
                      )}
                      <div className="project-details">
                        <div className="project-topline">
                          <span>{contentOrEmpty(project.number)}</span>
                          {project.featured && (
                            <span className="featured-tag">
                              <Sparkles aria-hidden="true" />
                              Featured
                            </span>
                          )}
                        </div>
                        <strong>{contentOrEmpty(project.title)}</strong>
                        <small>{contentOrEmpty(project.type)}</small>
                        <small>{contentOrEmpty(project.year)}</small>
                        <ArrowIcon />
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  className="all-work-button"
                  onClick={() => navigate("projects")}
                >
                  View all projects
                  <ArrowIcon />
                </button>
              </div>
              <section className="home-posts" aria-labelledby="studio-notes-title">
                  <div className="section-heading">
                    <p className="eyebrow" id="studio-notes-title">Studio notes</p>
                    <span>{String(posts.filter((post) => post.published).length).padStart(2, "0")} posts</span>
                  </div>
                  {posts.filter((post) => post.published).length === 0 && (
                    <p className="empty-content">No content yet.</p>
                  )}
                  {posts.filter((post) => post.published).map((post) => (
                    <article className="home-post" key={post.slug}>
                      <time dateTime={post.date}>{contentOrEmpty(post.date)}</time>
                      <div>
                        <h3>{contentOrEmpty(post.title)}</h3>
                        <p>{contentOrEmpty(post.excerpt)}</p>
                        {post.body && <details><summary>Read note</summary><p>{post.body}</p></details>}
                      </div>
                    </article>
                  ))}
              </section>
            </div>
          )}

          {page === "about" && (
            <div className="editorial-copy">
              <p className="eyebrow">Side A · About</p>
              <h2>{contentOrEmpty(settings.aboutHeading)}</h2>
              <div className="two-column">
                <p>{contentOrEmpty(settings.aboutBio)}</p>
                <p>{contentOrEmpty(settings.aboutExperience)}</p>
              </div>
              <div className="credits">
                {settings.skills.filter((skill) => skill.trim()).length === 0 && (
                  <span className="empty-content">No content yet.</span>
                )}
                {settings.skills.filter((skill) => skill.trim()).map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            </div>
          )}

          {page === "projects" && (
            <div className="editorial-copy">
              <p className="eyebrow">Archive · All projects</p>
              <h2>Projects in rotation.</h2>
              <div className="project-list">
                {projects.length === 0 && (
                  <p className="empty-content">No content yet.</p>
                )}
                {projects.map((project) => (
                  <button
                    className="project"
                    key={project.slug}
                    onClick={() => openProject(project)}
                  >
                    {project.images[0] ? (
                      <MediaPreview
                        className="project-thumb"
                        source={project.images[0]}
                        alt={project.title || "Project image"}
                      />
                    ) : (
                      <span className="project-thumb empty-content">
                        No content yet.
                      </span>
                    )}
                    <div className="project-details">
                      <div className="project-topline">
                        <span>{contentOrEmpty(project.number)}</span>
                        {project.featured && (
                          <span className="featured-tag">
                            <Sparkles aria-hidden="true" />
                            Featured
                          </span>
                        )}
                      </div>
                      <strong>{contentOrEmpty(project.title)}</strong>
                      <small>{contentOrEmpty(project.type)}</small>
                      <small>{contentOrEmpty(project.year)}</small>
                      <ArrowIcon />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {page === "work" && (
            <div className="editorial-copy">
              <p className="eyebrow">Work · Visual index</p>
              <h2>Everything in view.</h2>
              <div className="work-masonry">
                {workItems.length === 0 && (
                  <p className="empty-content">No content yet.</p>
                )}
                {workItems.map((item) => (
                  <article className="work-card" key={item.slug}>
                    <div className="work-card-media">
                      {item.media.length > 0 ? (
                        item.media.map((source) => (
                          <MediaPreview
                            key={source}
                            source={source}
                            alt={item.title || "Work media"}
                          />
                        ))
                      ) : (
                        <span className="empty-content">No content yet.</span>
                      )}
                    </div>
                    <div>
                      <strong>{contentOrEmpty(item.title)}</strong>
                      <span>{contentOrEmpty(item.year)}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {page === "contact" && (
            <div className="editorial-copy contact-copy">
              <p className="eyebrow">Needle drop · Contact</p>
              <h2>{contentOrEmpty(settings.contactHeading)}</h2>
              {settings.email.trim() ? (
                <a href={`mailto:${settings.email}`}>
                  {settings.email}
                  <ArrowIcon />
                </a>
              ) : (
                <p className="empty-content">No content yet.</p>
              )}
              <div className="socials">
                {settings.socials.every((social) => !social.label.trim() || !social.url.trim()) && (
                  <p className="empty-content">No content yet.</p>
                )}
                {settings.socials.filter((social) => social.label.trim() && social.url.trim()).map((social) => (
                  <a key={social.label} href={social.url}>{social.label}</a>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <footer>
        <p>{contentOrEmpty(settings.footerNote)}</p>
        <p className="now-playing">
          <span>Now playing</span>
          {pages.find((item) => item.id === page)?.label}
        </p>
        <div className="footer-meta">
          <p>© {contentOrEmpty(settings.copyrightYear)}</p>
          <a
            className="footer-admin"
            href="./admin/"
            aria-label="Edit this website with GitHub"
            title="Edit this website with GitHub"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.56.1.76-.24.76-.54v-2.1c-3.1.68-3.75-1.32-3.75-1.32-.5-1.3-1.24-1.65-1.24-1.65-1.01-.7.08-.69.08-.69 1.12.08 1.71 1.15 1.71 1.15 1 .1.76 2.26 4.1 1.65.1-.72.4-1.21.7-1.49-2.48-.28-5.08-1.24-5.08-5.52 0-1.22.44-2.21 1.15-2.99-.12-.28-.5-1.41.11-2.94 0 0 .94-.3 3.06 1.14a10.64 10.64 0 0 1 5.57 0c2.12-1.44 3.05-1.14 3.05-1.14.61 1.53.23 2.66.11 2.94.72.78 1.15 1.77 1.15 2.99 0 4.29-2.6 5.24-5.09 5.52.4.35.75 1.03.75 2.08v3.08c0 .3.2.65.76.54A11.1 11.1 0 0 0 12 .9Z" />
            </svg>
          </a>
        </div>
      </footer>
      <ScrollProgressButton />
    </main>
  )
}
