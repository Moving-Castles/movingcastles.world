<script>
  import Logo from "$lib/components/graphics/Logo.svelte"
</script>

<main>
  <div class="lockup-container">
    <Logo />
  </div>
</main>

<style lang="scss">
  main {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100dvh;
    width: 100dvw;
    background-color: grey;

    .lockup-container {
      width: 240px;
      max-width: 90dvw;
    }
  }
</style>
