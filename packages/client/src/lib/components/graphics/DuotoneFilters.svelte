<!--
  Duotone filters for .content figure.content-image.duotone img (see app.css).
  feColorMatrix collapses each pixel to its Rec. 709 luminance, then
  feComponentTransfer remaps that grey ramp onto two theme tones: shadows to the
  first tableValues entry, highlights to the second. Night maps black to grey;
  day maps dark-grey to grey. Values are theme greys / 255: grey 140 -> 0.549,
  dark 30 -> 0.118. Keep in sync with the :root vars in app.css.

  Rendered once wherever duotone content images appear; CSS references the
  filters by id (`filter: url(#duotone-night)`), which resolves document-wide.
-->
<svg aria-hidden="true" focusable="false" style="position: absolute; width: 0; height: 0">
  <filter id="duotone-night" color-interpolation-filters="sRGB">
    <feColorMatrix
      type="matrix"
      values="0.2126 0.7152 0.0722 0 0
              0.2126 0.7152 0.0722 0 0
              0.2126 0.7152 0.0722 0 0
              0      0      0      1 0"
    />
    <feComponentTransfer>
      <feFuncR type="table" tableValues="0 0.549" />
      <feFuncG type="table" tableValues="0 0.549" />
      <feFuncB type="table" tableValues="0 0.549" />
    </feComponentTransfer>
  </filter>
  <filter id="duotone-day" color-interpolation-filters="sRGB">
    <feColorMatrix
      type="matrix"
      values="0.2126 0.7152 0.0722 0 0
              0.2126 0.7152 0.0722 0 0
              0.2126 0.7152 0.0722 0 0
              0      0      0      1 0"
    />
    <feComponentTransfer>
      <feFuncR type="table" tableValues="0.118 0.549" />
      <feFuncG type="table" tableValues="0.118 0.549" />
      <feFuncB type="table" tableValues="0.118 0.549" />
    </feComponentTransfer>
  </filter>
</svg>
