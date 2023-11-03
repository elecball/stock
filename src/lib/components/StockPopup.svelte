<script lang="ts">
  import type { Stock } from "$lib/interfaces";

  export let showPopup = false;
  export let stock: Stock | null = null;

  function closePopup() {
    showPopup = false;
  }
</script>

{#if showPopup}
<div class="popup">
  <div class="popup-content">
    <h2>{stock?.name}</h2>
    <p>{stock?.description}</p>
    <div class="popup-buttons">
      <button class="buy-button">매수</button>
      <button class="sell-button">매도</button>
    </div>
    <button class="close-button" on:click={closePopup}>닫기</button>
  </div>
</div>
{/if}

<style>
  .popup {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .popup-content {
    background: #FFFFFF10;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
    text-align: center;
    backdrop-filter: blur(10px);

    & > h2 {
      color: var(--text);
    }

    & > p {
      color: var(--text);
    }
  }

  .popup-content *{
    color: var(--inverted);
  }

  .popup-buttons {
    margin-top: 20px;
  }

  .buy-button,
  .sell-button {
    background-color: #4CAF50;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    margin: 5px;
  }

  .sell-button {
    background-color: #f44336;
  }

  .close-button {
    background-color: var(--secondary);
    color: var(--text);
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
</style>
