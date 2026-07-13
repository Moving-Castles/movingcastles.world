<script lang="ts">
  import {onMount} from 'svelte'
  import MediaFrame from './MediaFrame.svelte'

  // The `video` block from the cms contentEditor schema, with the asset
  // reference dereferenced via GROQ `asset->` (see contentEditorProjection).
  interface VideoValue {
    asset?: {url?: string}
    caption?: string
    smallMargin?: boolean
    autoplay?: boolean
    flashWarning?: boolean
    largeView?: boolean
  }

  let {value}: {value: VideoValue} = $props()

  const autoplay = $derived(Boolean(value.autoplay))

  let playerEl: HTMLElement | undefined = $state()
  let videoEl: HTMLVideoElement | undefined = $state()

  // Mirrors of the video element's state (updated from its events), driving
  // the custom control bar.
  let paused = $state(true)
  let muted = $state(false)
  let currentTime = $state(0)
  let duration = $state(0)

  // The served markup carries native controls as the no-JS fallback; once
  // hydrated they are swapped for the site-styled control bar below.
  let enhanced = $state(false)
  onMount(() => {
    enhanced = true
  })

  // Whether the flashing-lights warning overlay has been dismissed.
  let revealed = $state(false)

  const reveal = () => {
    revealed = true
    // play() is allowed here (user gesture); autoplay videos start their
    // muted loop, regular ones start with sound.
    videoEl?.play().catch(() => {})
  }

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0')
    return `${m}:${s}`
  }

  const togglePlay = () => {
    if (!videoEl) return
    if (videoEl.paused) videoEl.play()
    else videoEl.pause()
  }

  const toggleMute = () => {
    if (videoEl) videoEl.muted = !videoEl.muted
  }

  const toggleFullscreen = () => {
    if (!playerEl || !videoEl) return
    if (document.fullscreenElement === playerEl) {
      document.exitFullscreen()
    } else if (playerEl.requestFullscreen) {
      // Fullscreen the wrapper so the custom controls stay visible.
      playerEl.requestFullscreen()
    } else {
      // iOS Safari: no element fullscreen — fall back to the native player.
      ;(
        videoEl as HTMLVideoElement & {webkitEnterFullscreen?: () => void}
      ).webkitEnterFullscreen?.()
    }
  }

  // Seek bar: pointer drags scrub, arrow keys nudge by five seconds.
  const seekTo = (track: HTMLElement, clientX: number) => {
    if (!videoEl || !isFinite(videoEl.duration)) return
    const rect = track.getBoundingClientRect()
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
    videoEl.currentTime = ratio * videoEl.duration
  }

  const onTrackKeydown = (event: KeyboardEvent) => {
    if (!videoEl || !isFinite(videoEl.duration)) return
    if (event.key === 'ArrowRight') {
      videoEl.currentTime = Math.min(videoEl.currentTime + 5, videoEl.duration)
    }
    if (event.key === 'ArrowLeft') {
      videoEl.currentTime = Math.max(videoEl.currentTime - 5, 0)
    }
  }
</script>

{#if value.asset?.url}
  <figure class:small-vertical-margin={value.smallMargin}>
    <MediaFrame player expandable={value.largeView} bind:element={playerEl}>
      <!-- Autoplay implies muted + loop (browsers block unmuted autoplay) and
           no controls. With a flash warning the autoplay attribute is
           withheld — playback starts only when the warning is dismissed. -->
      <video
        bind:this={videoEl}
        src={value.asset.url}
        autoplay={autoplay && !value.flashWarning}
        muted={autoplay}
        loop={autoplay}
        controls={!autoplay && !enhanced}
        preload={autoplay ? undefined : 'metadata'}
        playsinline
        onplay={() => (paused = false)}
        onpause={() => (paused = true)}
        onended={() => (paused = true)}
        ontimeupdate={() => (currentTime = videoEl?.currentTime ?? 0)}
        onloadedmetadata={() => (duration = videoEl?.duration ?? 0)}
        ondurationchange={() => (duration = videoEl?.duration ?? 0)}
        onvolumechange={() => (muted = videoEl?.muted ?? false)}
      ></video>
      <!-- Autoplaying videos are ambient loops — no control bar. -->
      {#if enhanced && !autoplay}
        <div class="video-controls">
          <button
            type="button"
            class="vc-play"
            aria-label={paused ? 'Play' : 'Pause'}
            onclick={togglePlay}>{paused ? 'play' : 'pause'}</button
          >
          <div
            class="vc-track"
            role="slider"
            aria-label="Seek"
            tabindex="0"
            aria-valuemin={0}
            aria-valuemax={Math.floor(duration) || 0}
            aria-valuenow={Math.floor(currentTime)}
            onpointerdown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId)
              seekTo(e.currentTarget, e.clientX)
            }}
            onpointermove={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId)) seekTo(e.currentTarget, e.clientX)
            }}
            onkeydown={onTrackKeydown}
          >
            <div
              class="vc-fill"
              style="width: {duration ? (currentTime / duration) * 100 : 0}%"
            ></div>
          </div>
          <span class="vc-time">{formatTime(currentTime)} / {formatTime(duration)}</span>
          <button
            type="button"
            class="vc-mute"
            aria-label={muted ? 'Unmute' : 'Mute'}
            onclick={toggleMute}>{muted ? 'unmute' : 'mute'}</button
          >
          <button type="button" class="vc-full" aria-label="Fullscreen" onclick={toggleFullscreen}
            >fullscreen</button
          >
        </div>
      {/if}
      {#if value.flashWarning && !revealed}
        <!-- Overlay for light-sensitive readers. Rendered server-side so the
             video stays covered even if JS never runs (fails safe). -->
        <div class="video-warning">
          <p>This content may include flashing lights</p>
          <button type="button" onclick={reveal}>play video</button>
        </div>
      {/if}
    </MediaFrame>
    {#if value.caption}<figcaption>{value.caption}</figcaption>{/if}
  </figure>
{/if}

<style>
  figure {
    margin: 0;
    margin-top: 2em;
    margin-bottom: 2em;
  }

  figure.small-vertical-margin {
    margin-top: 1em;
    margin-bottom: 0.5em;
  }

  video {
    display: block;
    max-width: 100%;
    height: auto;
    margin-inline: auto;
    max-height: 800px;
  }

  @media (max-width: 600px) {
    video {
      max-height: 600px;
    }
  }

  .video-controls {
    display: flex;
    align-items: center;
    gap: 0.75em;
    padding-block: 0.35rem;
    font-family: var(--font-stack-mono);
    font-size: var(--font-size-small);
    color: var(--foreground);
    user-select: none;
  }

  .video-controls button {
    appearance: none;
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    color: inherit;
    cursor: pointer;
  }

  .video-controls button:hover,
  .video-controls button:focus-visible {
    color: var(--foreground-emphasis);
  }

  /* Seek bar: a dashed base line (matching hr/blockquote rules) with a solid
     fill for elapsed time. The 14px box is the pointer hit area. */
  .vc-track {
    position: relative;
    flex: 1;
    height: 14px;
    cursor: pointer;
    touch-action: none;
  }

  .vc-track::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: calc(50% - 1px);
    border-top: 1px dashed var(--foreground);
  }

  .vc-fill {
    position: absolute;
    left: 0;
    top: calc(50% - 1px);
    height: 2px;
    width: 0;
    background: var(--foreground);
    pointer-events: none;
  }

  .vc-time {
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  /* Light-sensitivity warning: an opaque box covering the video until the
     reader opts in. Its z-index keeps it above the expand button. */
  .video-warning {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 1rem;
    box-sizing: border-box;
    background: var(--background);
    border: 1px dashed var(--foreground);
    color: var(--foreground);
    font-family: var(--font-stack-mono);
    font-size: var(--font-size-small);
    text-align: center;
  }

  .video-warning p {
    margin: 0;
  }

  .video-warning button {
    appearance: none;
    background: none;
    font: inherit;
    color: inherit;
    border: 1px dashed var(--foreground);
    padding: 0.35em 1em;
    cursor: pointer;
  }

  .video-warning button:hover,
  .video-warning button:focus-visible {
    color: var(--foreground-emphasis);
    border-color: var(--foreground-emphasis);
  }

  /* Lightbox: leave room for the control bar below the video while the
     MediaFrame around the player is expanded. */
  :global(.expanded) video {
    max-height: calc(100vh - 6rem - 2.5rem);
    width: auto;
    height: auto;
  }

  /* Element fullscreen (the frame is fullscreened so the custom controls
     stay in view). Declared after the lightbox rule so it wins when both
     apply. */
  :global(:fullscreen) video {
    flex: 1;
    min-height: 0;
    width: 100%;
    max-height: none;
    object-fit: contain;
  }

  figcaption {
    margin-top: 0.5rem;
    margin-bottom: 1rem;
    color: var(--foreground);
    font-family: var(--font-stack-mono);
    font-size: var(--font-size-small);
    line-height: var(--line-height-base);
  }
</style>
