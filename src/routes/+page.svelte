<!-- main.svelte -->
<script lang="ts">
  import { auth, provider, user } from "$lib/auth";
  import { signInWithPopup, signOut } from "firebase/auth";
  import StockPopup from "../components/StockPopup.svelte";

  // 주식 항목 타입 정의
  interface Stock {
    name: string;
    description: string;
    currentPrice: number;
    priceChange: number;
  }

  interface Balance {
    cash: number;
    portfolioValue: number;
  }

  let stockList: Stock[] = [
    {
      name: "애플",
      description: "기술 회사",
      currentPrice: 150.25,
      priceChange: -2.5,
    },
    {
      name: "구글",
      description: "검색 엔진 회사",
      currentPrice: 280.5,
      priceChange: 3.25,
    },
    {
      name: "마이크로소프트",
      description: "소프트웨어 회사",
      currentPrice: 300.75,
      priceChange: 1.2,
    },
    {
      name: "코카콜라",
      description: "식품 회사",
      currentPrice: 55.85,
      priceChange: 0.24,
    },
    // 추가 주식 항목
    // priceChange 백분율로 간주합니다
  ];

  let balance: Balance = {
    cash: 5000, // 현금 잔고
    portfolioValue: 0, // 포트폴리오 가치
  };

  let showPopup = false;
  let selectedStock: Stock | null = null;

  function openPopup(stock: Stock) {
    selectedStock = stock;
    showPopup = true;
  }

  async function login() {
    signInWithPopup(auth, provider).then((cre) => {
      console.log(cre.user);
    });
  }

  async function logout() {
    await signOut(auth);
  }
</script>

<main>
  <h1>주식 시장</h1>
  {#if $user}
    <p>내 잔고: ${balance.cash.toFixed(2)}</p>
    <p>포트폴리오 가치: ${balance.portfolioValue.toFixed(2)}</p>
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
          <span class="stock-price">{stock.currentPrice.toFixed(2)} USD</span>
          {#if stock.priceChange > 0}
            <span class="price up">+{stock.priceChange.toFixed(2)}</span>
          {:else if stock.priceChange < 0}
            <span class="price down">{stock.priceChange.toFixed(2)}</span>
          {:else}
            <span class="price">{stock.priceChange.toFixed(2)}</span>
          {/if}
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
      minmax(300px, 1fr)
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

    & .stock-name, & .stock-price {
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
