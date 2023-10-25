<!-- StockPopup.svelte -->
<script lang="ts">
  export let showPopup = false;
  export let stock: Stock | null = null;

  // 주식 항목 타입 정의
  interface Stock {
    name: string;
    description: string;
    currentPrice: number;
    priceChange: number;
  }

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
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .popup-content {
    background-color: #fff;
    padding: 20px;
    border-radius: 10px; /* 더 둥근 모양의 테두리 */
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2); /* 그림자 효과 */
    text-align: center; /* 내용 가운데 정렬 */
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
    background-color: #ccc;
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
</style>
