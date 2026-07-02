// * * * * * * * * * * * * * * * * * * * * * * * * * * *
//
//  media.ts =>
//  progressive enhancement for media rendered by renderBlockText
//
// * * * * * * * * * * * * * * * * * * * * * * * * * * *
//
// The Portable Text renderer emits static markup that works without JS:
// videos carry native controls, and media blocks with `largeView` carry a
// "+" button. This Svelte action (applied to the `.content` container) swaps
// the native video controls for a site-styled control bar, wires up the
// optional flashing-lights warning overlay, and makes the "+" buttons open
// their media block in a viewport-sized lightbox.

const formatTime = (seconds: number) => {
  if (!isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0')
  return `${m}:${s}`
}

const makeButton = (className: string, label: string, text = label.toLowerCase()) => {
  const el = document.createElement('button')
  el.type = 'button'
  el.className = className
  el.setAttribute('aria-label', label)
  el.textContent = text
  return el
}

// * * * custom video controls * * *

const buildControls = (player: HTMLElement, video: HTMLVideoElement) => {
  video.removeAttribute('controls')

  const bar = document.createElement('div')
  bar.className = 'video-controls'

  const play = makeButton('vc-play', 'Play')
  const track = document.createElement('div')
  track.className = 'vc-track'
  track.setAttribute('role', 'slider')
  track.setAttribute('aria-label', 'Seek')
  track.tabIndex = 0
  const fill = document.createElement('div')
  fill.className = 'vc-fill'
  track.appendChild(fill)
  const time = document.createElement('span')
  time.className = 'vc-time'
  const mute = makeButton('vc-mute', 'Mute')
  const full = makeButton('vc-full', 'Fullscreen')

  bar.append(play, track, time, mute, full)
  player.appendChild(bar)

  const sync = () => {
    const {currentTime, duration, paused, muted} = video
    play.textContent = paused ? 'play' : 'pause'
    play.setAttribute('aria-label', paused ? 'Play' : 'Pause')
    mute.textContent = muted ? 'unmute' : 'mute'
    mute.setAttribute('aria-label', muted ? 'Unmute' : 'Mute')
    time.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`
    fill.style.width = duration ? `${(currentTime / duration) * 100}%` : '0%'
    track.setAttribute('aria-valuemin', '0')
    track.setAttribute('aria-valuemax', String(Math.floor(duration) || 0))
    track.setAttribute('aria-valuenow', String(Math.floor(currentTime)))
  }

  play.addEventListener('click', () => {
    if (video.paused) video.play()
    else video.pause()
  })

  mute.addEventListener('click', () => {
    video.muted = !video.muted
  })

  full.addEventListener('click', () => {
    if (document.fullscreenElement === player) {
      document.exitFullscreen()
    } else if (player.requestFullscreen) {
      // Fullscreen the wrapper so the custom controls stay visible.
      player.requestFullscreen()
    } else {
      // iOS Safari: no element fullscreen — fall back to the native player.
      ;(video as HTMLVideoElement & {webkitEnterFullscreen?: () => void}).webkitEnterFullscreen?.()
    }
  })

  const seekTo = (clientX: number) => {
    if (!isFinite(video.duration)) return
    const rect = track.getBoundingClientRect()
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
    video.currentTime = ratio * video.duration
  }

  track.addEventListener('pointerdown', (e) => {
    track.setPointerCapture(e.pointerId)
    seekTo(e.clientX)
  })
  track.addEventListener('pointermove', (e) => {
    if (track.hasPointerCapture(e.pointerId)) seekTo(e.clientX)
  })
  track.addEventListener('keydown', (e) => {
    if (!isFinite(video.duration)) return
    if (e.key === 'ArrowRight') video.currentTime = Math.min(video.currentTime + 5, video.duration)
    if (e.key === 'ArrowLeft') video.currentTime = Math.max(video.currentTime - 5, 0)
  })

  const events = ['play', 'pause', 'ended', 'timeupdate', 'volumechange', 'loadedmetadata', 'durationchange']
  for (const event of events) video.addEventListener(event, sync)
  sync()
}

const setupVideo = (player: HTMLElement) => {
  const video = player.querySelector('video')
  if (!video) return

  const warning = player.querySelector('.video-warning')
  warning?.querySelector('button')?.addEventListener(
    'click',
    () => {
      warning.remove()
      // play() is allowed here (user gesture); autoplay videos start their
      // muted loop, regular ones start with sound.
      video.play().catch(() => {})
    },
    {once: true},
  )

  // Autoplaying videos are ambient loops — no control bar.
  if (!player.hasAttribute('data-autoplay')) buildControls(player, video)
}

// * * * lightbox * * *

// Close handler of the currently open lightbox, so the action's destroy can
// dismiss it if the page is navigated away while open.
let closeActive: (() => void) | null = null

const openLightbox = (frame: HTMLElement, trigger: HTMLElement) => {
  // The frame itself moves into the lightbox (a clone would reset iframe and
  // video state twice over); a hidden placeholder marks its spot for closing.
  const placeholder = document.createElement('span')
  placeholder.hidden = true

  const lightbox = document.createElement('div')
  lightbox.className = 'lightbox'
  lightbox.setAttribute('role', 'dialog')
  lightbox.setAttribute('aria-modal', 'true')
  const close = makeButton('lightbox-close', 'Close large view', '×')

  frame.replaceWith(placeholder)
  lightbox.append(frame, close)
  document.body.appendChild(lightbox)
  document.documentElement.style.overflow = 'hidden'

  const closeLightbox = () => {
    placeholder.replaceWith(frame)
    lightbox.remove()
    document.documentElement.style.overflow = ''
    document.removeEventListener('keydown', onKey)
    closeActive = null
    trigger.focus()
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') closeLightbox()
  }

  close.addEventListener('click', closeLightbox)
  document.addEventListener('keydown', onKey)
  closeActive = closeLightbox
  close.focus()
}

// * * * action * * *

export const enhanceMedia = (node: HTMLElement) => {
  node.querySelectorAll<HTMLElement>('.video-player').forEach(setupVideo)
  node.querySelectorAll<HTMLElement>('.media-expand').forEach((button) => {
    // The button sits inside the frame it expands (.media-frame or
    // .video-player) and is hidden by CSS while in the lightbox.
    const frame = button.parentElement
    if (frame) button.addEventListener('click', () => openLightbox(frame, button))
  })
  return {
    destroy() {
      closeActive?.()
    },
  }
}
