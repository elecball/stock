<script lang="ts">
  import { auth, provider, user } from "$lib/auth";
  import { signInWithPopup, signOut } from "firebase/auth";
  import StockPopup from "$lib/components/StockPopup.svelte";
  import type { Stock } from "$lib/interfaces";
  import { onDestroy, onMount } from "svelte";

  let stockList: Stock[] = [
    {
      name: "Google",
      description: "Alphabet Inc.'s technology company",
      currentPrice: 2800.00,
      priceList: [2750.50, 2780.25, 2795.75, 2810.00, 2825.50]
    },
    {
      name: "Apple",
      description: "Apple Inc.",
      currentPrice: 150.50,
      priceList: [148.75, 149.25, 150.00, 151.00, 152.00]
    },
    {
      name: "Amazon",
      description: "Amazon.com, Inc.",
      currentPrice: 3500.75,
      priceList: [3480.50, 3490.25, 3505.00, 3510.50, 3520.25]
    },
  ];
  
  let balance = 5000;
  let showPopup = false;
  let selectedStock: Stock | null = null;

  function openPopup(stock: Stock) {
    selectedStock = stock;
    showPopup = true;
  }

  async function login() {
    await signInWithPopup(auth, provider).then((cre) => {
      console.log(cre.user);
    });
  }

  async function logout() {
    await signOut(auth);
  }

  onMount(() => {
    const websocket = new WebSocket('wss://stock.elecball.workers.dev');
    websocket.addEventListener('message', event => {
      console.log('Message received from server');
      console.log(event.data);
    });

    websocket.onopen = () => {
      websocket.send('MESSAGE');
    }

  });
</script>

<main>
  <h1>주식 시장</h1>
  {#if $user}
    <p>내 잔고: ${balance.toFixed(2)}</p>
    <p>로그인된 사용자: {$user?.displayName}</p>
  {/if}
  <div class="stock-tile">
    {#each stockList as stock, i (stock.name)}
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div class="stock-item" on:click={() => openPopup(stock)}>
        <div>
          <span class="stock-name">{stock.name}</span>
          <span class="stock-desc">{stock.description}</span>
        </div>
        <div>
          <div class="stock-price-wrapper">
            <span class="stock-price">{stock.currentPrice.toFixed(2)} USD</span>
          </div>
          <div class="stock-price-change-wrapper">
            {#if stock.currentPrice > stock.priceList[0]}
              <span class="price up">+{(stock.currentPrice / stock.priceList[0]).toFixed(2)}</span>
            {:else if stock.currentPrice < stock.priceList[0]}
              <span class="price down">{(stock.currentPrice / stock.priceList[0]).toFixed(2)}</span>
            {:else}
              <span class="price">{(stock.currentPrice / stock.priceList[0]).toFixed(2)}</span>
            {/if}
          </div>
        </div>
      </div>
    {/each}
  </div>

  {#if $user}
    <button on:click={logout}>로그아웃</button>
  {:else}
    <button on:click={login}>로그인</button>
  {/if}

  <StockPopup bind:showPopup bind:stock={selectedStock} />
</main>

<style>
  :root {
    font-family: "Pretendard Variable", Pretendard, -apple-system,
      BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI",
      "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic",
      "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
  }

  main {
    text-align: center;
  }

  .stock-tile {
    display: grid; /* 그리드로 설정 */
    grid-template-columns: repeat(
      auto-fill,
      minmax(350px, 1fr)
    ); /* 자동으로 나누기 */
    grid-gap: 10px; /* 셀 사이의 간격 설정 */

    & > .stock-item {
      display: flex;
      border: 1px solid #ccc;
      padding: 10px;
      border-radius: 5px;
      cursor: pointer;
      align-items: center;
      justify-content: space-between;
    }

    & > .stock-item > div:nth-child(1) {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    & > .stock-item > div:nth-child(2) {
      display: flex;
      gap: 15px;
      align-items: center;
    }

    & .stock-price-wrapper{
      width: 125px;
      text-align: right;
    }

    & .stock-price-change-wrapper{
      width: 75px;
      text-align: right;
    }

    & .stock-name,
    & .stock-price {
      font-size: 18px;
    }

    & .stock-desc {
      font-size: 14px;
      color: #464646;
    }
  }

  .price {
    border-radius: 5px;
    background-color: #e8eaed;
    padding: 5px;
    color: #282828;
    font-weight: 500;
  }

  .price.up {
    background-color: #e6f4ea;
    color: #137333;
  }

  .price.down {
    background-color: #fce8e6;
    color: #a50e0e;
  }

  /* 
  .stock-item {
    width: calc(33.33% - 20px);
    margin: 10px;
    border: 1px solid #ccc;
    padding: 10px;
    border-radius: 5px;
    cursor: pointer;
  }

  .stock-info {
    display: flex;
    justify-content: space-between;
  }

  .price {
    font-weight: bold;
  } */
</style>
